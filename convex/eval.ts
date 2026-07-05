import { v } from "convex/values";
import type { Infer } from "convex/values";
import { internalAction, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  citationValidator,
  evalCaseResultValidator,
  evalCheckValidator,
} from "./schema";
import { evalCases, type EvalCase } from "./evalData";

type CitationRecord = Infer<typeof citationValidator>;
type Check = Infer<typeof evalCheckValidator>;
type CaseResult = Infer<typeof evalCaseResultValidator>;

const metricValidator = v.object({
  name: v.string(),
  applicable: v.number(),
  passed: v.number(),
});

const runReturnValidator = v.object({
  runId: v.id("evalRuns"),
  model: v.string(),
  totalCases: v.number(),
  passed: v.number(),
  passRate: v.number(),
  metrics: v.array(metricValidator),
  cases: v.array(evalCaseResultValidator),
});

const DISCLAIMER_MARKER = "legal information, not legal advice";

// Phrases that signal the assistant declined to answer from the corpus. These are
// chosen to NOT appear in a normal grounded answer. Note the generic closing
// disclaimer ("Consult a licensed fair housing attorney...") is excluded, since it
// appears on every answer; the refusal recommendation uses "fair housing organization".
const REFUSAL_SIGNALS = [
  "does not contain",
  "do not contain",
  "not contain",
  "cannot answer",
  "can't answer",
  "unable to answer",
  "not addressed",
  "not covered",
  "outside the scope",
  "no documents in the corpus",
  "fair housing organization",
  "does not provide",
  "context does not",
  "not included in the context",
  "not have information",
  "does not include information",
  "no information about",
  "not found in the",
];

function includesAll(haystack: string, needles: string[]): string[] {
  const lower = haystack.toLowerCase();
  return needles.filter((n) => !lower.includes(n.toLowerCase()));
}

function includesAny(haystack: string, needles: string[]): string[] {
  const lower = haystack.toLowerCase();
  return needles.filter((n) => lower.includes(n.toLowerCase()));
}

function detectRefusal(answer: string, usedContext: boolean): boolean {
  if (!usedContext) return true;
  const lower = answer.toLowerCase();
  return REFUSAL_SIGNALS.some((signal) => lower.includes(signal));
}

/** Every [n] the model cited must map to a real context passage (1..citationCount). */
function ungroundedCitationRefs(answer: string, citationCount: number): number[] {
  const refs = new Set<number>();
  const re = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(answer)) !== null) {
    refs.add(Number(match[1]));
  }
  return [...refs].filter((n) => n < 1 || n > citationCount);
}

function citationHaystack(citations: CitationRecord[]): string {
  return citations.map((c) => `${c.title} ${c.citation}`).join(" \n ");
}

function scoreCase(
  testCase: EvalCase,
  result: {
    answer: string;
    citations: CitationRecord[];
    usedContext: boolean;
  },
): CaseResult {
  const checks: Check[] = [];
  const { answer, citations, usedContext } = result;

  // Every substantive answer must carry the safety disclaimer.
  checks.push({
    name: "disclaimer",
    passed: answer.toLowerCase().includes(DISCLAIMER_MARKER),
    detail: "answer ends with the legal-information disclaimer",
  });

  if (testCase.expectRefusal) {
    const refused = detectRefusal(answer, usedContext);
    checks.push({
      name: "refusal",
      passed: refused,
      detail: refused
        ? "assistant declined / flagged missing support"
        : "expected a refusal but assistant answered substantively",
    });
  }

  if (testCase.expectCitationsInclude && testCase.expectCitationsInclude.length > 0) {
    const missing = includesAll(
      citationHaystack(citations),
      testCase.expectCitationsInclude,
    );
    checks.push({
      name: "retrieval",
      passed: missing.length === 0,
      detail:
        missing.length === 0
          ? `retrieved expected authority: ${testCase.expectCitationsInclude.join(", ")}`
          : `missing expected authority: ${missing.join(", ")}`,
    });
  }

  if (testCase.expectedJurisdiction) {
    const leaked = citations
      .map((c) => c.jurisdiction)
      .filter((j) => j !== testCase.expectedJurisdiction);
    checks.push({
      name: "jurisdiction",
      passed: leaked.length === 0,
      detail:
        leaked.length === 0
          ? `all ${citations.length} citation(s) in ${testCase.expectedJurisdiction}`
          : `jurisdiction leakage: ${[...new Set(leaked)].join(", ")}`,
    });
  }

  if (testCase.expectAnswerIncludes && testCase.expectAnswerIncludes.length > 0) {
    const missing = includesAll(answer, testCase.expectAnswerIncludes);
    checks.push({
      name: "keywords",
      passed: missing.length === 0,
      detail:
        missing.length === 0
          ? "answer covers expected concepts"
          : `answer missing: ${missing.join(", ")}`,
    });
  }

  if (testCase.forbidAnswerIncludes && testCase.forbidAnswerIncludes.length > 0) {
    const present = includesAny(answer, testCase.forbidAnswerIncludes);
    checks.push({
      name: "forbidden",
      passed: present.length === 0,
      detail:
        present.length === 0
          ? "no forbidden cross-jurisdiction / hallucinated content"
          : `contains forbidden content: ${present.join(", ")}`,
    });
  }

  const ungrounded = ungroundedCitationRefs(answer, citations.length);
  checks.push({
    name: "citationGrounding",
    passed: ungrounded.length === 0,
    detail:
      ungrounded.length === 0
        ? "all [n] references map to a real context passage"
        : `ungrounded references: ${ungrounded.map((n) => `[${n}]`).join(", ")}`,
  });

  return {
    id: testCase.id,
    category: testCase.category,
    question: testCase.question,
    jurisdictionFilter: testCase.jurisdictionFilter ?? "all",
    passed: checks.every((c) => c.passed),
    usedContext,
    checks,
    citations: citations.map((c) => c.citation || c.title),
    answerPreview: answer.slice(0, 400),
  };
}

export const saveEvalRun = internalMutation({
  args: {
    model: v.string(),
    totalCases: v.number(),
    passed: v.number(),
    passRate: v.number(),
    metrics: v.array(metricValidator),
    cases: v.array(evalCaseResultValidator),
  },
  returns: v.id("evalRuns"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("evalRuns", {
      createdAt: Date.now(),
      model: args.model,
      totalCases: args.totalCases,
      passed: args.passed,
      passRate: args.passRate,
      metrics: args.metrics,
      cases: args.cases,
    });
  },
});

/**
 * Run the graded evaluation set against the live corpus via rag.answer, score each
 * case deterministically, persist the run, and return a report. Run with:
 *   npx convex run eval:runEval
 * Requires the corpus to be seeded and OPENAI_API_KEY configured on the deployment.
 */
export const runEval = internalAction({
  args: {},
  returns: runReturnValidator,
  handler: async (ctx): Promise<Infer<typeof runReturnValidator>> => {
    const results: CaseResult[] = [];
    let model = "";

    for (const testCase of evalCases) {
      const response = await ctx.runAction(api.rag.answer, {
        question: testCase.question,
        jurisdictionFilter: testCase.jurisdictionFilter,
        record: false,
      });
      model = response.model;
      results.push(
        scoreCase(testCase, {
          answer: response.answer,
          citations: response.citations,
          usedContext: response.usedContext,
        }),
      );
    }

    // Aggregate pass rate per scored dimension across the cases where it applied.
    const metricNames = new Set<string>();
    for (const r of results) {
      for (const check of r.checks) metricNames.add(check.name);
    }
    const metrics = [...metricNames].sort().map((name) => {
      const applicableChecks = results.flatMap((r) =>
        r.checks.filter((c) => c.name === name),
      );
      return {
        name,
        applicable: applicableChecks.length,
        passed: applicableChecks.filter((c) => c.passed).length,
      };
    });

    const passed = results.filter((r) => r.passed).length;
    const passRate = results.length > 0 ? passed / results.length : 0;

    const runId = await ctx.runMutation(internal.eval.saveEvalRun, {
      model,
      totalCases: results.length,
      passed,
      passRate,
      metrics,
      cases: results,
    });

    return {
      runId,
      model,
      totalCases: results.length,
      passed,
      passRate,
      metrics,
      cases: results,
    };
  },
});

const evalRunValidator = v.object({
  _id: v.id("evalRuns"),
  _creationTime: v.number(),
  createdAt: v.number(),
  model: v.string(),
  totalCases: v.number(),
  passed: v.number(),
  passRate: v.number(),
  metrics: v.array(metricValidator),
  cases: v.array(evalCaseResultValidator),
});

export const listEvalRuns = query({
  args: {},
  returns: v.array(evalRunValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("evalRuns")
      .withIndex("by_created")
      .order("desc")
      .take(25);
  },
});
