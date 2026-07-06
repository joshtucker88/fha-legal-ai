"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { authorityLayerValidator } from "./schema";
import { extractReadableText } from "./lib/html";
import { fetchSources } from "./fetchSources";

/** Minimum extracted characters before we consider a fetch worth ingesting. */
const MIN_TEXT_LENGTH = 200;

/** A user agent so well-behaved public sources (e.g. Cornell LII) don't reject us. */
const USER_AGENT =
  "x-cockpit-fha-assistant/0.1 (+auto-fetch ingest; contact: legal-research)";

const sourceSpecValidator = v.object({
  url: v.string(),
  title: v.string(),
  citation: v.string(),
  jurisdiction: v.string(),
  authorityLayer: authorityLayerValidator,
  authorityRank: v.number(),
  effectiveDate: v.optional(v.string()),
});

const sourceResultValidator = v.object({
  url: v.string(),
  title: v.string(),
  status: v.union(
    v.literal("ingested"),
    v.literal("skipped"),
    v.literal("error"),
  ),
  chunkCount: v.number(),
  detail: v.string(),
});

const summaryValidator = v.object({
  ingested: v.number(),
  skipped: v.number(),
  errors: v.number(),
  totalChunks: v.number(),
  results: v.array(sourceResultValidator),
});

type SourceSpec = {
  url: string;
  title: string;
  citation: string;
  jurisdiction: string;
  authorityLayer: (typeof fetchSources)[number]["authorityLayer"];
  authorityRank: number;
  effectiveDate?: string;
};

type SourceResult = {
  url: string;
  title: string;
  status: "ingested" | "skipped" | "error";
  chunkCount: number;
  detail: string;
};

/**
 * Fetch a single source URL, extract readable text, and ingest it through the existing
 * chunk -> embed -> store pipeline (api.ingest.ingestDocument). Idempotent: a document
 * already ingested from the same URL is skipped. Never throws; failures are returned as
 * an "error" result so one bad URL cannot sink a whole batch.
 */
async function ingestSource(
  ctx: ActionCtx,
  spec: SourceSpec,
): Promise<SourceResult> {
  const base: Pick<SourceResult, "url" | "title"> = {
    url: spec.url,
    title: spec.title,
  };

  try {
    const existing = await ctx.runQuery(internal.ingest.documentByUrl, {
      sourceUrl: spec.url,
    });
    if (existing) {
      return {
        ...base,
        status: "skipped",
        chunkCount: 0,
        detail: "already ingested (matched by source URL)",
      };
    }

    const response = await fetch(spec.url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
    });
    if (!response.ok) {
      return {
        ...base,
        status: "error",
        chunkCount: 0,
        detail: `fetch failed: HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const text = extractReadableText(html);
    if (text.length < MIN_TEXT_LENGTH) {
      return {
        ...base,
        status: "error",
        chunkCount: 0,
        detail: `extracted only ${text.length} chars (min ${MIN_TEXT_LENGTH}); page may be JS-rendered or blocked`,
      };
    }

    const result = await ctx.runAction(api.ingest.ingestDocument, {
      title: spec.title,
      text,
      sourceUrl: spec.url,
      jurisdiction: spec.jurisdiction,
      authorityLayer: spec.authorityLayer,
      authorityRank: spec.authorityRank,
      citation: spec.citation,
      effectiveDate: spec.effectiveDate ?? "",
    });

    // The store mutation guards against duplicate URLs atomically; if a concurrent
    // run inserted this URL after our upfront check, treat it as skipped, not ingested.
    if (result.deduped) {
      return {
        ...base,
        status: "skipped",
        chunkCount: 0,
        detail: "already ingested (deduped by source URL at insert time)",
      };
    }

    return {
      ...base,
      status: "ingested",
      chunkCount: result.chunkCount,
      detail: `ingested ${result.chunkCount} chunk(s) from ${text.length} chars`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ...base, status: "error", chunkCount: 0, detail: message };
  }
}

function summarize(results: SourceResult[]): {
  ingested: number;
  skipped: number;
  errors: number;
  totalChunks: number;
  results: SourceResult[];
} {
  return {
    ingested: results.filter((r) => r.status === "ingested").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    totalChunks: results.reduce((sum, r) => sum + r.chunkCount, 0),
    results,
  };
}

/**
 * Auto-fetch the curated default source list (convex/fetchSources.ts) and ingest each.
 * Safe to re-run: previously-ingested URLs are skipped. Requires OPENAI_API_KEY on the
 * deployment (embeddings). Run with: npx convex run autoFetch:fetchCorpus
 */
export const fetchCorpus = internalAction({
  args: {},
  returns: summaryValidator,
  handler: async (ctx) => {
    const results: SourceResult[] = [];
    for (const spec of fetchSources) {
      results.push(await ingestSource(ctx, spec));
    }
    return summarize(results);
  },
});

/**
 * Auto-fetch an arbitrary batch of source specs supplied by the caller. Each source is
 * fetched, extracted, and ingested independently; a failure on one source is reported in
 * its result rather than aborting the batch.
 */
export const fetchAndIngest = internalAction({
  args: { sources: v.array(sourceSpecValidator) },
  returns: summaryValidator,
  handler: async (ctx, args) => {
    const results: SourceResult[] = [];
    for (const spec of args.sources) {
      results.push(await ingestSource(ctx, spec));
    }
    return summarize(results);
  },
});
