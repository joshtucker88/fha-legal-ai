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

export const evalCheckValidator = v.object({
  name: v.string(),
  passed: v.boolean(),
  detail: v.string(),
});

export const evalCaseResultValidator = v.object({
  id: v.string(),
  category: v.string(),
  question: v.string(),
  jurisdictionFilter: v.string(),
  passed: v.boolean(),
  usedContext: v.boolean(),
  checks: v.array(evalCheckValidator),
  citations: v.array(v.string()),
  answerPreview: v.string(),
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
    .index("by_created", ["createdAt"]),

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

  evalRuns: defineTable({
    createdAt: v.number(),
    model: v.string(),
    totalCases: v.number(),
    passed: v.number(),
    passRate: v.number(),
    // Aggregate pass rate per scored dimension across the cases it applied to.
    metrics: v.array(
      v.object({
        name: v.string(),
        applicable: v.number(),
        passed: v.number(),
      }),
    ),
    cases: v.array(evalCaseResultValidator),
  }).index("by_created", ["createdAt"]),
});
