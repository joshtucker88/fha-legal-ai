import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const authorityLayerValidator = v.union(
  v.literal("primaryLaw"),
  v.literal("agencyGuidance"),
  v.literal("enforcementData"),
  v.literal("caseLaw"),
  v.literal("secondaryMaterial"),
  v.literal("evaluation"),
);

export const citationValidator = v.object({
  title: v.string(),
  citation: v.string(),
  url: v.string(),
  jurisdiction: v.string(),
  authorityLayer: authorityLayerValidator,
  authorityRank: v.number(),
  sectionPath: v.string(),
  score: v.number(),
});

export const EMBEDDING_DIMENSIONS = 1536;

export default defineSchema({
  corpusSources: defineTable({
    title: v.string(),
    authorityLayer: authorityLayerValidator,
    useCase: v.union(
      v.literal("rag"),
      v.literal("fineTune"),
      v.literal("evaluation"),
      v.literal("context"),
    ),
    status: v.union(
      v.literal("todo"),
      v.literal("collecting"),
      v.literal("ready"),
      v.literal("reviewed"),
    ),
    authorityRank: v.number(),
    sourceUrl: v.string(),
    note: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_layer", ["authorityLayer"])
    .index("by_status", ["status"])
    .index("by_authority", ["authorityRank"]),

  documents: defineTable({
    title: v.string(),
    sourceUrl: v.string(),
    jurisdiction: v.string(),
    authorityLayer: authorityLayerValidator,
    authorityRank: v.number(),
    citation: v.string(),
    effectiveDate: v.string(),
    chunkCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_authority", ["authorityRank"])
    .index("by_created", ["createdAt"])
    // Dedupe auto-fetched documents by their source URL so re-running the
    // auto-fetch pipeline is idempotent (see convex/autoFetch.ts).
    .index("by_source_url", ["sourceUrl"]),

  chunks: defineTable({
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
    embedding: v.array(v.float64()),
  })
    .index("by_document", ["documentId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: EMBEDDING_DIMENSIONS,
      filterFields: ["jurisdiction", "authorityLayer"],
    }),

  messages: defineTable({
    question: v.string(),
    answer: v.string(),
    jurisdictionFilter: v.string(),
    citations: v.array(citationValidator),
    model: v.string(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
});
