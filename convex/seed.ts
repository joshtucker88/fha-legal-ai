import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { chunkText } from "./lib/chunk";
import { embedTexts } from "./lib/openai";
import { seedPassages } from "./seedData";

/**
 * Existing document source URLs, used to dedupe seeding by URL. This matches the
 * auto-fetch pipeline's idempotency key (documents.by_source_url) so re-seeding after
 * editing a passage's title (but not its URL) does not create a duplicate document.
 */
export const existingSourceUrls = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    return documents.map((doc) => doc.sourceUrl);
  },
});

/**
 * Delete every ingested document and chunk. Used to reset the corpus before re-seeding
 * when seed content or metadata (e.g. jurisdiction) changes, since seedCorpus is otherwise
 * idempotent by title and will not update existing documents.
 */
export const clearCorpus = internalMutation({
  args: {},
  returns: v.object({
    deletedDocuments: v.number(),
    deletedChunks: v.number(),
  }),
  handler: async (ctx) => {
    const chunks = await ctx.db.query("chunks").collect();
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }
    const documents = await ctx.db.query("documents").collect();
    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }
    return { deletedDocuments: documents.length, deletedChunks: chunks.length };
  },
});

/**
 * Idempotently ingest the curated FHA seed corpus. Safe to re-run: any passage whose
 * source URL is already present is skipped (aligned with the auto-fetch pipeline).
 * Requires OPENAI_API_KEY to be set on the deployment.
 */
export const seedCorpus = internalAction({
  args: {
    reset: v.optional(v.boolean()),
  },
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    totalChunks: v.number(),
    documents: v.array(
      v.object({ title: v.string(), chunkCount: v.number() }),
    ),
  }),
  handler: async (ctx, args) => {
    if (args.reset) {
      await ctx.runMutation(internal.seed.clearCorpus, {});
    }

    const present = new Set(
      await ctx.runQuery(internal.seed.existingSourceUrls, {}),
    );

    let inserted = 0;
    let skipped = 0;
    let totalChunks = 0;
    const documents: Array<{ title: string; chunkCount: number }> = [];

    for (const passage of seedPassages) {
      if (passage.sourceUrl.length > 0 && present.has(passage.sourceUrl)) {
        skipped += 1;
        continue;
      }

      const pieces = chunkText(passage.text);
      if (pieces.length === 0) {
        throw new Error(`Seed passage "${passage.title}" produced no chunks.`);
      }

      const embeddings = await embedTexts(pieces.map((piece) => piece.text));
      if (embeddings.length !== pieces.length) {
        throw new Error(
          `Embedding count (${embeddings.length}) did not match chunk count (${pieces.length}) for "${passage.title}".`,
        );
      }

      const chunks = pieces.map((piece, index) => {
        const embedding = embeddings[index];
        if (!embedding) {
          throw new Error(
            `Missing embedding for chunk ${index} of "${passage.title}".`,
          );
        }
        return {
          text: piece.text,
          sectionPath: piece.sectionPath,
          chunkIndex: piece.chunkIndex,
          embedding,
        };
      });

      const result = await ctx.runMutation(
        internal.ingest.storeDocumentWithChunks,
        {
          title: passage.title,
          sourceUrl: passage.sourceUrl,
          jurisdiction: passage.jurisdiction,
          authorityLayer: passage.authorityLayer,
          authorityRank: passage.authorityRank,
          citation: passage.citation,
          effectiveDate: passage.effectiveDate,
          chunks,
        },
      );

      // The store mutation is the authoritative URL guard; if it deduped, don't
      // double-count as inserted. Track the URL so duplicate URLs within seedData
      // are skipped in the same run.
      if (passage.sourceUrl.length > 0) {
        present.add(passage.sourceUrl);
      }
      if (result.deduped) {
        skipped += 1;
        continue;
      }

      inserted += 1;
      totalChunks += result.chunkCount;
      documents.push({ title: passage.title, chunkCount: result.chunkCount });
    }

    return { inserted, skipped, totalChunks, documents };
  },
});
