import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  authorityLayerValidator,
  citationValidator,
} from "./schema";
import type { Infer } from "convex/values";
import { chatModel, chatComplete, embedTexts } from "./lib/openai";

declare const process: { env: Record<string, string | undefined> };

const RETRIEVE_LIMIT = 12;
const CONTEXT_LIMIT = 8;

// Minimum cosine similarity for a retrieved chunk to count as relevant context.
// Vector search always returns its top matches even for out-of-scope questions;
// without a floor, `usedContext` would be true for irrelevant results and the
// assistant would be prompted to answer from unrelated passages. Tunable per
// deployment via the RAG_MIN_SCORE environment variable.
const DEFAULT_MIN_SCORE = 0.2;

function relevanceThreshold(): number {
  const raw = Number(process.env.RAG_MIN_SCORE);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_MIN_SCORE;
}

type CitationRecord = Infer<typeof citationValidator>;

interface AnswerResult {
  answer: string;
  citations: CitationRecord[];
  model: string;
  usedContext: boolean;
}

// Exported so the fine-tuning exporter (convex/finetune.ts) can reuse the exact
// production system prompt, keeping exported training examples aligned with live behavior.
export const SYSTEM_PROMPT = `You are a Fair Housing Act (FHA) legal research assistant for U.S. practice. You are NOT a lawyer and you do NOT give legal advice.

Follow these rules strictly:
1. Answer ONLY using the numbered CONTEXT passages provided. If the context does not contain the answer, say so plainly and recommend the user consult a licensed attorney or a fair housing organization. Do not fill gaps with outside knowledge.
2. NEVER invent statutes, regulations, case names, or citations. Cite only sources present in the context, referencing them by their [n] number.
3. Prefer higher-authority sources: federal statutes and regulations outrank agency guidance, which outranks case law commentary, which outranks secondary material. The context is ordered by authority; note when a lower-authority source is the only support.
4. Keep jurisdictions separate. Do not apply Illinois or Chicago rules to a federal question (or vice versa) unless the context supports it.
5. Do not state deadlines, promise outcomes, or present yourself as counsel.
6. End every substantive answer with a one-line disclaimer: "This is legal information, not legal advice. Consult a licensed fair housing attorney about your specific situation."`;

const chunkResultValidator = v.object({
  _id: v.id("chunks"),
  documentId: v.id("documents"),
  chunkIndex: v.number(),
  text: v.string(),
  sectionPath: v.string(),
  title: v.string(),
  citation: v.string(),
  sourceUrl: v.string(),
  jurisdiction: v.string(),
  authorityLayer: authorityLayerValidator,
  authorityRank: v.number(),
});

export const getChunksByIds = internalQuery({
  args: { ids: v.array(v.id("chunks")) },
  returns: v.array(chunkResultValidator),
  handler: async (ctx, args) => {
    const results = [];
    for (const id of args.ids) {
      const chunk = await ctx.db.get(id);
      if (chunk) {
        results.push({
          _id: chunk._id,
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          sectionPath: chunk.sectionPath,
          title: chunk.title,
          citation: chunk.citation,
          sourceUrl: chunk.sourceUrl,
          jurisdiction: chunk.jurisdiction,
          authorityLayer: chunk.authorityLayer,
          authorityRank: chunk.authorityRank,
        });
      }
    }
    return results;
  },
});

export const recordMessage = internalMutation({
  args: {
    question: v.string(),
    answer: v.string(),
    jurisdictionFilter: v.string(),
    citations: v.array(citationValidator),
    model: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      question: args.question,
      answer: args.answer,
      jurisdictionFilter: args.jurisdictionFilter,
      citations: args.citations,
      model: args.model,
      createdAt: Date.now(),
    });
  },
});

export const answer = action({
  args: {
    question: v.string(),
    jurisdictionFilter: v.optional(v.string()),
    // Defaults to true. The evaluation harness sets this false so scored runs
    // don't accumulate rows in the messages table.
    record: v.optional(v.boolean()),
  },
  returns: v.object({
    answer: v.string(),
    citations: v.array(citationValidator),
    model: v.string(),
    usedContext: v.boolean(),
  }),
  handler: async (ctx, args): Promise<AnswerResult> => {
    const question = args.question.trim();
    if (!question) {
      throw new Error("Question is required.");
    }

    const record = args.record !== false;
    const jurisdiction = (args.jurisdictionFilter ?? "").trim();
    const useFilter = jurisdiction.length > 0 && jurisdiction.toLowerCase() !== "all";

    const [questionEmbedding] = await embedTexts([question]);
    if (!questionEmbedding) {
      throw new Error("Failed to embed the question.");
    }

    const matches = await ctx.vectorSearch("chunks", "by_embedding", {
      vector: questionEmbedding,
      limit: RETRIEVE_LIMIT,
      filter: useFilter
        ? (q) => q.eq("jurisdiction", jurisdiction)
        : undefined,
    });

    const model = chatModel();

    // Drop matches below the relevance floor so out-of-scope questions don't get
    // answered from unrelated passages. matches.length === 0 means an empty corpus
    // (or an over-narrow filter); relevant.length === 0 means the corpus has content
    // but nothing on-topic — a different, refusal-style response.
    const threshold = relevanceThreshold();
    const relevant = matches.filter((match) => (match._score ?? 0) >= threshold);

    if (relevant.length === 0) {
      const noContextAnswer =
        matches.length === 0
          ? "No documents in the corpus match this question yet. Ingest authoritative Fair Housing Act sources (statutes, regulations, HUD/DOJ guidance, case law) and try again.\n\nThis is legal information, not legal advice. Consult a licensed fair housing attorney about your specific situation."
          : "The corpus does not contain sources relevant to this question, so I cannot answer it from the available authorities. Consider consulting a licensed attorney or a fair housing organization.\n\nThis is legal information, not legal advice. Consult a licensed fair housing attorney about your specific situation.";
      if (record) {
        await ctx.runMutation(internal.rag.recordMessage, {
          question,
          answer: noContextAnswer,
          jurisdictionFilter: jurisdiction,
          citations: [],
          model,
        });
      }
      return { answer: noContextAnswer, citations: [], model, usedContext: false };
    }

    const scoreById = new Map(relevant.map((match) => [match._id, match._score]));
    const chunks = await ctx.runQuery(internal.rag.getChunksByIds, {
      ids: relevant.map((match) => match._id),
    });

    // Retrieved by relevance; re-order by legal authority (lower rank = higher authority),
    // breaking ties by similarity score, then keep the top passages for context.
    const ranked = chunks
      .map((chunk) => ({ chunk, score: scoreById.get(chunk._id) ?? 0 }))
      .sort((a, b) => {
        if (a.chunk.authorityRank !== b.chunk.authorityRank) {
          return a.chunk.authorityRank - b.chunk.authorityRank;
        }
        return b.score - a.score;
      })
      .slice(0, CONTEXT_LIMIT);

    const contextBlock = ranked
      .map((entry, index) => {
        const c = entry.chunk;
        return `[${index + 1}] ${c.title} (${c.citation || "no citation"}; ${c.jurisdiction}; authority rank ${c.authorityRank}; section ${c.sectionPath})\n${c.text}`;
      })
      .join("\n\n---\n\n");

    const userPrompt = `QUESTION:\n${question}\n\nCONTEXT (ordered by legal authority):\n${contextBlock}\n\nAnswer the question using only the context above. Cite sources by their [n] number.`;

    const generated = await chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    const citations = ranked.map((entry) => {
      const c = entry.chunk;
      return {
        title: c.title,
        citation: c.citation,
        url: c.sourceUrl,
        jurisdiction: c.jurisdiction,
        authorityLayer: c.authorityLayer,
        authorityRank: c.authorityRank,
        sectionPath: c.sectionPath,
        score: entry.score,
      };
    });

    if (record) {
      await ctx.runMutation(internal.rag.recordMessage, {
        question,
        answer: generated,
        jurisdictionFilter: jurisdiction,
        citations,
        model,
      });
    }

    return { answer: generated, citations, model, usedContext: true };
  },
});

const documentValidator = v.object({
  _id: v.id("documents"),
  _creationTime: v.number(),
  title: v.string(),
  sourceUrl: v.string(),
  jurisdiction: v.string(),
  authorityLayer: authorityLayerValidator,
  authorityRank: v.number(),
  citation: v.string(),
  effectiveDate: v.string(),
  chunkCount: v.number(),
  createdAt: v.number(),
});

export const listDocuments = query({
  args: {},
  returns: v.array(documentValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_authority")
      .order("asc")
      .take(100);
  },
});

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  question: v.string(),
  answer: v.string(),
  jurisdictionFilter: v.string(),
  citations: v.array(citationValidator),
  model: v.string(),
  createdAt: v.number(),
});

export const listMessages = query({
  args: {},
  returns: v.array(messageValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_created")
      .order("desc")
      .take(25);
  },
});
