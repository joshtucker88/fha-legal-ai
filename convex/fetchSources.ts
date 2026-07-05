import type { Infer } from "convex/values";
import { authorityLayerValidator } from "./schema";

export type AuthorityLayer = Infer<typeof authorityLayerValidator>;

/**
 * A source spec describes one authoritative document to auto-fetch, extract, chunk,
 * embed, and ingest. It mirrors the metadata the `documents`/`chunks` tables and the
 * ingest pipeline expect (see convex/ingest.ts), minus the body text (which is fetched
 * from `url` at ingest time rather than hand-pasted).
 */
export interface FetchSource {
  url: string;
  title: string;
  citation: string;
  jurisdiction: string;
  authorityLayer: AuthorityLayer;
  authorityRank: number;
  effectiveDate: string;
}

/**
 * Curated default list of authoritative FHA sources to auto-fetch.
 *
 * These are deliberately statutory/regulatory sections NOT already hand-seeded in
 * seedData.ts, so `npm run fetch` is additive to `npm run seed`. All are public-domain
 * United States Government works served by Cornell LII, which permits automated fetching.
 * URLs are used as the idempotency key (documents.by_source_url), so re-running is safe.
 */
export const fetchSources: FetchSource[] = [
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3603",
    title: "Fair Housing Act - Effective dates of certain prohibitions",
    citation: "42 U.S.C. § 3603",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3606",
    title:
      "Fair Housing Act - Discrimination in the provision of brokerage services",
    citation: "42 U.S.C. § 3606",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3607",
    title: "Fair Housing Act - Religious organization and private club exemptions",
    citation: "42 U.S.C. § 3607",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3631",
    title: "Fair Housing Act - Criminal interference with fair housing rights",
    citation: "42 U.S.C. § 3631",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/cfr/text/24/100.201",
    title: "Fair Housing regulations - Definitions (disability / handicap)",
    citation: "24 C.F.R. § 100.201",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 2,
    effectiveDate: "1989-03-12",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3608",
    title: "Fair Housing Act - Administration (HUD authority and cooperation)",
    citation: "42 U.S.C. § 3608",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3610",
    title:
      "Fair Housing Act - Administrative enforcement; preliminary matters (complaints)",
    citation: "42 U.S.C. § 3610",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3613",
    title: "Fair Housing Act - Enforcement by private persons",
    citation: "42 U.S.C. § 3613",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/uscode/text/42/3614",
    title: "Fair Housing Act - Enforcement by the Attorney General",
    citation: "42 U.S.C. § 3614",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
  },
  {
    url: "https://www.law.cornell.edu/cfr/text/24/100.202",
    title:
      "Fair Housing regulations - General prohibitions against discrimination because of disability",
    citation: "24 C.F.R. § 100.202",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 2,
    effectiveDate: "1989-03-12",
  },
  {
    url: "https://www.law.cornell.edu/cfr/text/24/100.203",
    title: "Fair Housing regulations - Reasonable modifications of existing premises",
    citation: "24 C.F.R. § 100.203",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 2,
    effectiveDate: "1989-03-12",
  },
  {
    url: "https://www.law.cornell.edu/cfr/text/24/100.400",
    title: "Fair Housing regulations - Prohibited interference, coercion or intimidation",
    citation: "24 C.F.R. § 100.400",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 2,
    effectiveDate: "1989-03-12",
  },
];
