import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { authorityLayerValidator } from "./schema";
import { chunkText } from "./lib/chunk";
import { embedTexts } from "./lib/openai";

interface IngestResult {
  documentId: Id<"documents">;
  chunkCount: number;
}

/**
 * Look up an already-ingested document by its source URL. Used by the auto-fetch
 * pipeline (convex/autoFetch.ts) to dedupe sources without re-fetching/re-embedding.
 */
export const documentByUrl = internalQuery({
  args: { sourceUrl: v.string() },
  returns: v.union(v.id("documents"), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_source_url", (q) => q.eq("sourceUrl", args.sourceUrl))
      .first();
    return doc?._id ?? null;
  },
});

const chunkInputValidator = v.object({
  text: v.string(),
  sectionPath: v.string(),
  chunkIndex: v.number(),
  embedding: v.array(v.float64()),
});

export const storeDocumentWithChunks = internalMutation({
  args: {
    title: v.string(),
    sourceUrl: v.string(),
    jurisdiction: v.string(),
    authorityLayer: authorityLayerValidator,
    authorityRank: v.number(),
    citation: v.string(),
    effectiveDate: v.string(),
    chunks: v.array(chunkInputValidator),
  },
  returns: v.object({
    documentId: v.id("documents"),
    chunkCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      sourceUrl: args.sourceUrl,
      jurisdiction: args.jurisdiction,
      authorityLayer: args.authorityLayer,
      authorityRank: args.authorityRank,
      citation: args.citation,
      effectiveDate: args.effectiveDate,
      chunkCount: args.chunks.length,
      createdAt: now,
    });

    for (const chunk of args.chunks) {
      await ctx.db.insert("chunks", {
        documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        sectionPath: chunk.sectionPath,
        title: args.title,
        citation: args.citation,
        sourceUrl: args.sourceUrl,
        jurisdiction: args.jurisdiction,
        authorityLayer: args.authorityLayer,
        authorityRank: args.authorityRank,
        embedding: chunk.embedding,
      });
    }

    return { documentId, chunkCount: args.chunks.length };
  },
});

export const ingestDocument = action({
  args: {
    title: v.string(),
    text: v.string(),
    sourceUrl: v.string(),
    jurisdiction: v.string(),
    authorityLayer: authorityLayerValidator,
    authorityRank: v.number(),
    citation: v.string(),
    effectiveDate: v.string(),
  },
  returns: v.object({
    documentId: v.id("documents"),
    chunkCount: v.number(),
  }),
  handler: async (ctx, args): Promise<IngestResult> => {
    const pieces = chunkText(args.text);
    if (pieces.length === 0) {
      throw new Error("Document text produced no chunks. Provide non-empty legal text.");
    }

    const embeddings = await embedTexts(pieces.map((piece) => piece.text));
    if (embeddings.length !== pieces.length) {
      throw new Error("Embedding count did not match chunk count.");
    }

    const chunks = pieces.map((piece, index) => {
      const embedding = embeddings[index];
      if (!embedding) {
        throw new Error(`Missing embedding for chunk ${index}.`);
      }
      return {
        text: piece.text,
        sectionPath: piece.sectionPath,
        chunkIndex: piece.chunkIndex,
        embedding,
      };
    });

    return await ctx.runMutation(internal.ingest.storeDocumentWithChunks, {
      title: args.title,
      sourceUrl: args.sourceUrl,
      jurisdiction: args.jurisdiction,
      authorityLayer: args.authorityLayer,
      authorityRank: args.authorityRank,
      citation: args.citation,
      effectiveDate: args.effectiveDate,
      chunks,
    });
  },
});
