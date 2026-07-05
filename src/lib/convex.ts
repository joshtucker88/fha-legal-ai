import { ConvexClient } from "convex/browser";
import { readable } from "svelte/store";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type CorpusSource = Doc<"corpusSources">;
export type AuthorityLayer = CorpusSource["authorityLayer"];
export type SourceStatus = CorpusSource["status"];
export type SourceUseCase = CorpusSource["useCase"];

export type LegalDocument = Doc<"documents">;
export type LegalMessage = Doc<"messages">;
export type Citation = LegalMessage["citations"][number];

export type EvalRun = Doc<"evalRuns">;
export type EvalMetric = EvalRun["metrics"][number];
export type EvalCaseResult = EvalRun["cases"][number];
export type EvalCheck = EvalCaseResult["checks"][number];

export interface NewCorpusSource {
  title: string;
  authorityLayer: AuthorityLayer;
  useCase: SourceUseCase;
  authorityRank: number;
  sourceUrl: string;
  note: string;
}

export interface IngestDocumentInput {
  title: string;
  text: string;
  sourceUrl: string;
  jurisdiction: string;
  authorityLayer: AuthorityLayer;
  authorityRank: number;
  citation: string;
  effectiveDate: string;
}

export interface AnswerResult {
  answer: string;
  citations: Citation[];
  model: string;
  usedContext: boolean;
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexConfigured = Boolean(convexUrl);

const convex = convexUrl ? new ConvexClient(convexUrl) : null;

export const corpusSources = readable<CorpusSource[]>([], (set) => {
  if (!convex) {
    return;
  }

  const unsubscribe = convex.onUpdate(
    api.planner.listSources,
    {},
    (nextSources) => set(nextSources),
    (error) => {
      console.error("Convex corpus source subscription failed", error);
      set([]);
    },
  );

  return () => unsubscribe();
});

export const legalDocuments = readable<LegalDocument[]>([], (set) => {
  if (!convex) {
    return;
  }

  const unsubscribe = convex.onUpdate(
    api.rag.listDocuments,
    {},
    (nextDocuments) => set(nextDocuments),
    (error) => {
      console.error("Convex document subscription failed", error);
      set([]);
    },
  );

  return () => unsubscribe();
});

export const legalMessages = readable<LegalMessage[]>([], (set) => {
  if (!convex) {
    return;
  }

  const unsubscribe = convex.onUpdate(
    api.rag.listMessages,
    {},
    (nextMessages) => set(nextMessages),
    (error) => {
      console.error("Convex message subscription failed", error);
      set([]);
    },
  );

  return () => unsubscribe();
});

export const evalRuns = readable<EvalRun[]>([], (set) => {
  if (!convex) {
    return;
  }

  const unsubscribe = convex.onUpdate(
    api.eval.listEvalRuns,
    {},
    (nextRuns) => set(nextRuns),
    (error) => {
      console.error("Convex eval run subscription failed", error);
      set([]);
    },
  );

  return () => unsubscribe();
});

export async function seedPlanner(): Promise<void> {
  if (!convex) {
    throw new Error("Convex is not configured");
  }

  await convex.mutation(api.planner.seedPlanner, {});
}

export async function createCorpusSource(source: NewCorpusSource): Promise<void> {
  if (!convex) {
    throw new Error("Convex is not configured");
  }

  await convex.mutation(api.planner.createSource, source);
}

export async function updateSourceStatus(
  sourceId: Id<"corpusSources">,
  status: SourceStatus,
): Promise<void> {
  if (!convex) {
    throw new Error("Convex is not configured");
  }

  await convex.mutation(api.planner.updateSourceStatus, { sourceId, status });
}

export async function ingestDocument(
  input: IngestDocumentInput,
): Promise<{ documentId: Id<"documents">; chunkCount: number; deduped: boolean }> {
  if (!convex) {
    throw new Error("Convex is not configured");
  }

  return await convex.action(api.ingest.ingestDocument, input);
}

export async function answerQuestion(
  question: string,
  jurisdictionFilter: string,
): Promise<AnswerResult> {
  if (!convex) {
    throw new Error("Convex is not configured");
  }

  return await convex.action(api.rag.answer, { question, jurisdictionFilter });
}
