import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const authorityLayer = v.union(
  v.literal("primaryLaw"),
  v.literal("agencyGuidance"),
  v.literal("enforcementData"),
  v.literal("caseLaw"),
  v.literal("secondaryMaterial"),
  v.literal("evaluation"),
);

const sourceUseCase = v.union(
  v.literal("rag"),
  v.literal("fineTune"),
  v.literal("evaluation"),
  v.literal("context"),
);

const sourceStatus = v.union(
  v.literal("todo"),
  v.literal("collecting"),
  v.literal("ready"),
  v.literal("reviewed"),
);

const corpusSourceDoc = v.object({
  _id: v.id("corpusSources"),
  _creationTime: v.number(),
  title: v.string(),
  authorityLayer,
  useCase: sourceUseCase,
  status: sourceStatus,
  authorityRank: v.number(),
  sourceUrl: v.string(),
  note: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listSources = query({
  args: {},
  returns: v.array(corpusSourceDoc),
  handler: async (ctx) => {
    return await ctx.db
      .query("corpusSources")
      .withIndex("by_authority")
      .order("asc")
      .take(100);
  },
});

export const createSource = mutation({
  args: {
    title: v.string(),
    authorityLayer,
    useCase: sourceUseCase,
    authorityRank: v.number(),
    sourceUrl: v.string(),
    note: v.string(),
  },
  returns: v.id("corpusSources"),
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("corpusSources", {
      ...args,
      status: "todo",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSourceStatus = mutation({
  args: {
    sourceId: v.id("corpusSources"),
    status: sourceStatus,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sourceId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const seedPlanner = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("corpusSources").take(1);

    if (existing.length > 0) {
      return null;
    }

    const now = Date.now();
    const seeds = [
      {
        title: "Fair Housing Act statute, 42 U.S.C. §§ 3601-3619",
        authorityLayer: "primaryLaw" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 1,
        sourceUrl: "https://www.justice.gov/crt/fair-housing-act-1",
        note: "Core federal authority. Chunk by section and keep citation metadata intact.",
      },
      {
        title: "HUD/DOJ reasonable accommodation joint statement",
        authorityLayer: "agencyGuidance" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 2,
        sourceUrl:
          "https://www.hud.gov/program_offices/fair_housing_equal_opp/reasonable_accommodations_and_modifications",
        note: "Critical for disability accommodations, interactive process, necessity, and denial analysis.",
      },
      {
        title: "HUD assistance animal notice and ESA guidance",
        authorityLayer: "agencyGuidance" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 3,
        sourceUrl:
          "https://www.hud.gov/program_offices/fair_housing_equal_opp/assistance_animals",
        note: "Use for emotional support animal documentation standards, direct-threat limits, and pet-rule exceptions.",
      },
      {
        title: "24 C.F.R. Part 100 fair housing regulations",
        authorityLayer: "primaryLaw" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 4,
        sourceUrl: "https://www.ecfr.gov/current/title-24/subtitle-B/chapter-I/subchapter-A/part-100",
        note: "Regulatory text for discrimination, reasonable accommodations, advertising, and enforcement context.",
      },
      {
        title: "HUD FHEO Title VIII filed case data",
        authorityLayer: "enforcementData" as const,
        useCase: "context" as const,
        status: "todo" as const,
        authorityRank: 5,
        sourceUrl: "https://catalog.data.gov/dataset/fheo-filed-cases",
        note: "Use for claim patterns, protected-class tags, procedural posture, and evaluation sampling.",
      },
      {
        title: "Illinois Human Rights Act fair housing materials",
        authorityLayer: "primaryLaw" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 6,
        sourceUrl: "https://dhr.illinois.gov/",
        note: "State-law layer for Illinois housing discrimination and administrative complaint routes.",
      },
      {
        title: "Chicago fair housing and human rights ordinance materials",
        authorityLayer: "primaryLaw" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 7,
        sourceUrl: "https://www.chicago.gov/city/en/depts/cchr.html",
        note: "Local-law layer for Chicago claims, remedies, protected classes, and filing forum choices.",
      },
      {
        title: "Illinois Assistance Animal Integrity Act",
        authorityLayer: "primaryLaw" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 8,
        sourceUrl:
          "https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/ccico/pdfs/assistance-animal-integrity-act.pdf",
        note: "Important for evaluating Illinois assistance-animal documentation and housing provider obligations.",
      },
      {
        title: "NAHASDA and HUD Office of Native American Programs context",
        authorityLayer: "agencyGuidance" as const,
        useCase: "context" as const,
        status: "todo" as const,
        authorityRank: 9,
        sourceUrl: "https://www.hud.gov/program_offices/public_indian_housing/ih",
        note: "Use as context for tribal housing distinctions, even when the housing dispute is off-reservation.",
      },
      {
        title: "Reasonable accommodation and assistance animal case law set",
        authorityLayer: "caseLaw" as const,
        useCase: "rag" as const,
        status: "todo" as const,
        authorityRank: 10,
        sourceUrl: "https://scholar.google.com/",
        note: "Collect controlling Seventh Circuit and Illinois district opinions first, then persuasive federal cases.",
      },
      {
        title: "Attorney-reviewed issue-spotting Q&A set",
        authorityLayer: "secondaryMaterial" as const,
        useCase: "fineTune" as const,
        status: "todo" as const,
        authorityRank: 11,
        sourceUrl: "",
        note: "Target 5,000-20,000 citation-grounded examples for answer style, intake, triage, and memo structure.",
      },
      {
        title: "Gold evaluation set for legal safety and citations",
        authorityLayer: "evaluation" as const,
        useCase: "evaluation" as const,
        status: "todo" as const,
        authorityRank: 12,
        sourceUrl: "",
        note: "Build 300-1,000 expert-reviewed prompts covering citation accuracy, jurisdiction control, and refusal behavior.",
      },
    ];

    for (const source of seeds) {
      await ctx.db.insert("corpusSources", {
        ...source,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});
