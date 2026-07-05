/**
 * Curated Q&A dataset for OpenAI chat fine-tuning export (see convex/finetune.ts).
 *
 * ⚠️ ATTORNEY REVIEW REQUIRED ⚠️
 * These example answers are drafted to match the seeded corpus (see seedData.ts) and the
 * production system prompt (SYSTEM_PROMPT in rag.ts), but they are NOT legal advice and
 * have NOT been verified by a licensed attorney. They must be reviewed and corrected by a
 * qualified fair housing attorney BEFORE being used to fine-tune any model that ships to
 * users. Treat this file as a reviewable draft, not a gold set.
 *
 * Each example is exported as a single OpenAI fine-tuning line:
 *   {"messages":[{"role":"system",...},{"role":"user",...},{"role":"assistant",...}]}
 * The system message is injected at export time from the shared SYSTEM_PROMPT so training
 * data reflects the assistant's real instructions. Every assistant answer cites its
 * authority explicitly and ends with the standard legal-information disclaimer.
 */

const DISCLAIMER =
  "This is legal information, not legal advice. Consult a licensed fair housing attorney about your specific situation.";

export interface FinetuneExample {
  /** Short id for tracking/review; not exported into the JSONL. */
  id: string;
  question: string;
  answer: string;
}

export const finetuneExamples: FinetuneExample[] = [
  {
    id: "ft-federal-protected-classes",
    question:
      "What classes are protected under the federal Fair Housing Act in the sale or rental of housing?",
    answer: `Under the federal Fair Housing Act, it is unlawful to discriminate in the sale or rental of a dwelling because of race, color, religion, sex, familial status, or national origin, and, for the disability-related provisions, handicap (disability) (42 U.S.C. § 3604). These protections cover refusing to sell or rent, discriminating in the terms or conditions of a transaction, and making discriminatory statements or advertisements.\n\nNote that the federal Act does not list some classes that certain state and local laws add (for example, source of income). ${DISCLAIMER}`,
  },
  {
    id: "ft-reasonable-accommodation",
    question:
      "Does the federal Fair Housing Act require landlords to make reasonable accommodations for tenants with disabilities?",
    answer: `Yes. The federal Fair Housing Act makes it unlawful to refuse to make reasonable accommodations in rules, policies, practices, or services when such accommodations may be necessary to afford a person with a disability an equal opportunity to use and enjoy a dwelling (42 U.S.C. § 3604(f)(3)(B); 24 C.F.R. § 100.204). For example, a "no pets" policy must yield to allow a blind tenant to keep a guide dog, and a first-come-first-served parking policy may need an exception to reserve an accessible space for a mobility-impaired tenant (24 C.F.R. § 100.204(b)).\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-direct-threat",
    question:
      "Can a housing provider refuse an accommodation or deny housing if a person is a direct threat?",
    answer: `The federal Fair Housing Act does not require a dwelling to be made available to an individual whose tenancy would constitute a direct threat to the health or safety of others, or would result in substantial physical damage to the property of others (42 U.S.C. § 3604(f)(9)). This "direct threat" determination must be based on an individualized assessment of the specific person's conduct, not on generalized assumptions about a disability.\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-reasonable-modification",
    question:
      "What is the difference between a reasonable accommodation and a reasonable modification under the FHA?",
    answer: `Under the federal Fair Housing Act, a reasonable accommodation is a change to a rule, policy, practice, or service, while a reasonable modification is a physical change to the premises (42 U.S.C. § 3604(f)(3)). A provider may not refuse to permit, at the disabled person's expense, reasonable modifications of the premises when necessary for full enjoyment; in a rental, the landlord may, where reasonable, condition permission on the tenant agreeing to restore the interior to its prior condition (reasonable wear and tear excepted) (42 U.S.C. § 3604(f)(3)(A)).\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-interference-3617",
    question:
      "Does the Fair Housing Act prohibit intimidating or retaliating against someone for exercising fair housing rights?",
    answer: `Yes. It is unlawful under the federal Fair Housing Act to coerce, intimidate, threaten, or interfere with any person in the exercise or enjoyment of, or on account of their having exercised or enjoyed (or aided or encouraged another in exercising), any right granted or protected by the Act's core anti-discrimination provisions (42 U.S.C. § 3617).\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-illinois-source-of-income",
    question:
      "What protected classes does Illinois housing law cover beyond the federal Fair Housing Act?",
    answer: `The Illinois Human Rights Act (775 ILCS 5, Article 3) protects a broader set of classes than the federal Fair Housing Act. In addition to the federal classes, Illinois housing protections extend to ancestry, age, marital status, order of protection status, disability, military status, sexual orientation (including gender-related identity), pregnancy, unfavorable military discharge, immigration status, and source of income (which can include housing choice vouchers). Because Illinois reaches classes and conduct federal law does not, an Illinois housing matter should be analyzed under both the state Act and the federal Fair Housing Act.\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-chicago-source-of-income",
    question:
      "Does Chicago prohibit housing discrimination based on a tenant's source of income, like a housing voucher?",
    answer: `Yes. The Chicago Fair Housing Ordinance (Municipal Code of Chicago, ch. 5-8) prohibits discrimination in the sale, rental, financing, or provision of real estate services on the basis of protected classes that include source of income, which covers lawful sources such as housing choice vouchers. Chicago's protections are broader than both federal and Illinois law and are enforced by the Chicago Commission on Human Relations. A Chicago dispute should be analyzed under the municipal ordinance in addition to the Illinois Human Rights Act and the federal Fair Housing Act.\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-seventh-circuit-post-acquisition",
    question:
      "In the Seventh Circuit, can the Fair Housing Act reach discrimination that happens after someone already lives in their home?",
    answer: `Yes. In Bloch v. Frischholz, 587 F.3d 771 (7th Cir. 2009) (en banc), the Seventh Circuit held that the Fair Housing Act can reach post-acquisition discrimination, not only conduct at the point of sale or rental. The court held that Section 3617 (interference, coercion, or intimidation) reaches post-acquisition conduct and does not require a separate violation of Sections 3603-3606, and it allowed a Section 3604 constructive-eviction theory to proceed. As controlling Seventh Circuit authority, this governs FHA claims arising in Illinois, Indiana, and Wisconsin.\n\n${DISCLAIMER}`,
  },
  {
    id: "ft-refusal-out-of-scope",
    question:
      "What is the maximum security deposit a landlord can charge under the Fair Housing Act?",
    answer: `The federal Fair Housing Act is an anti-discrimination statute; it does not set a maximum security deposit amount. Security-deposit caps, if any, come from state or local landlord-tenant law rather than the Fair Housing Act, and that material is not part of this corpus. For a deposit-limit question, consult your state or local landlord-tenant statutes, a licensed attorney, or a local fair housing organization.\n\n${DISCLAIMER}`,
  },
];
