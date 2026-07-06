/**
 * Graded evaluation set for the FHA RAG assistant.
 *
 * Each case exercises one of the assistant's core competencies: retrieving the
 * right authority, keeping jurisdictions separate, grounding every citation, and
 * refusing when the corpus does not support an answer. Cases are intentionally
 * tied to the seeded corpus (see seedData.ts); expand this set as the corpus grows.
 *
 * This is a machine-graded smoke/regression set, NOT an attorney-reviewed gold set.
 * Substring expectations are deliberately lenient so grading stays deterministic
 * across model revisions.
 */

export interface EvalCase {
  id: string;
  category: string;
  question: string;
  /** Passed through to rag.answer. Omit for "all jurisdictions". */
  jurisdictionFilter?: string;
  /** Every retrieved citation must belong to this jurisdiction (no leakage). */
  expectedJurisdiction?: string;
  /** Each string must appear (case-insensitive) in some citation's title or citation. */
  expectCitationsInclude?: string[];
  /** Each string must appear (case-insensitive) in the answer text. */
  expectAnswerIncludes?: string[];
  /** None of these may appear in the answer (guards against cross-jurisdiction leakage / hallucination). */
  forbidAnswerIncludes?: string[];
  /** When true, the assistant should decline to answer from the corpus rather than fabricate. */
  expectRefusal?: boolean;
}

export const evalCases: EvalCase[] = [
  {
    id: "federal-core-prohibitions",
    category: "federal-retrieval",
    question:
      "What are the core prohibitions of the federal Fair Housing Act in the sale or rental of housing?",
    jurisdictionFilter: "US_federal",
    expectedJurisdiction: "US_federal",
    expectCitationsInclude: ["3604"],
    expectAnswerIncludes: ["race", "discriminat"],
  },
  {
    id: "federal-reasonable-accommodation",
    category: "federal-retrieval",
    question:
      "Does the Fair Housing Act require housing providers to make reasonable accommodations for people with disabilities?",
    jurisdictionFilter: "US_federal",
    expectedJurisdiction: "US_federal",
    expectCitationsInclude: ["100.204"],
    expectAnswerIncludes: ["reasonable accommodation", "disab"],
  },
  {
    id: "federal-direct-threat",
    category: "federal-retrieval",
    question:
      "Can a housing provider deny a reasonable accommodation if the person poses a direct threat to others?",
    jurisdictionFilter: "US_federal",
    expectedJurisdiction: "US_federal",
    expectAnswerIncludes: ["direct threat"],
  },
  {
    id: "illinois-protected-classes",
    category: "jurisdiction-control",
    question:
      "What protected classes does Illinois housing law cover beyond the federal Fair Housing Act?",
    jurisdictionFilter: "Illinois",
    expectedJurisdiction: "Illinois",
    expectCitationsInclude: ["775 ILCS"],
    expectAnswerIncludes: ["source of income"],
  },
  {
    id: "chicago-source-of-income",
    category: "jurisdiction-control",
    question:
      "Does Chicago prohibit housing discrimination based on a tenant's source of income, such as a housing voucher?",
    jurisdictionFilter: "Chicago",
    expectedJurisdiction: "Chicago",
    expectCitationsInclude: ["5-8"],
    expectAnswerIncludes: ["source of income"],
  },
  {
    id: "seventh-circuit-post-acquisition",
    category: "case-law-retrieval",
    question:
      "In the Seventh Circuit, can the Fair Housing Act reach discrimination that happens after a resident already lives in their home?",
    jurisdictionFilter: "Seventh_Circuit",
    expectedJurisdiction: "Seventh_Circuit",
    expectCitationsInclude: ["Bloch"],
    expectAnswerIncludes: ["post-acquisition"],
  },
  {
    id: "jurisdiction-isolation-federal-soi",
    category: "jurisdiction-isolation",
    question:
      "Under federal fair housing law only, is source of income a protected class?",
    jurisdictionFilter: "US_federal",
    expectedJurisdiction: "US_federal",
    // Correct behavior: federal FHA does not list source of income, so the answer
    // should address it while staying federal and NOT importing the Illinois/Chicago
    // rule that the filter deliberately excludes.
    expectAnswerIncludes: ["source of income"],
    forbidAnswerIncludes: [
      "illinois human rights act",
      "chicago fair housing ordinance",
    ],
  },
  {
    id: "out-of-scope-airline-service-animal",
    category: "refusal",
    question:
      "What are the rules for bringing a service animal on a commercial airline flight?",
    expectRefusal: true,
  },
  {
    // Security-deposit caps are outside the FHA (and absent from the corpus). No
    // jurisdiction filter: scoping to US_federal made this read like an in-scope
    // federal question and pulled FHA chunks, biasing the model away from refusing.
    // The correct behavior is to state the FHA does not regulate deposit amounts.
    id: "out-of-scope-security-deposit-cap",
    category: "refusal",
    question:
      "What is the maximum security deposit a landlord can charge under the Fair Housing Act?",
    expectRefusal: true,
  },
];
