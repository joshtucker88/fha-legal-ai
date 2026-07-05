import type { Infer } from "convex/values";
import { authorityLayerValidator } from "./schema";

export type AuthorityLayer = Infer<typeof authorityLayerValidator>;

export interface SeedPassage {
  title: string;
  citation: string;
  sourceUrl: string;
  jurisdiction: string;
  authorityLayer: AuthorityLayer;
  authorityRank: number;
  effectiveDate: string;
  text: string;
}

/**
 * A small, curated corpus of authoritative Fair Housing Act sources used to verify the
 * ingest -> embed -> retrieve -> cited-answer pipeline end to end.
 *
 * The statutory (42 U.S.C.) and regulatory (24 C.F.R.) passages are verbatim public-domain
 * United States Government works. The HUD/DOJ Joint Statement entry is an accurate,
 * clearly-labeled summary of a public HUD/DOJ guidance document (the underlying pages block
 * automated fetching); it is included so the corpus spans more than one authority layer.
 */
export const seedPassages: SeedPassage[] = [
  {
    title: "Fair Housing Act - Definitions",
    citation: "42 U.S.C. § 3602",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/42/3602",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1988-09-13",
    text: `42 U.S.C. § 3602 — Definitions

As used in this subchapter—

(a) "Secretary" means the Secretary of Housing and Urban Development.

(b) "Dwelling" means any building, structure, or portion thereof which is occupied as, or designed or intended for occupancy as, a residence by one or more families, and any vacant land which is offered for sale or lease for the construction or location thereon of any such building, structure, or portion thereof.

(c) "Family" includes a single individual.

(d) "Person" includes one or more individuals, corporations, partnerships, associations, labor organizations, legal representatives, mutual companies, joint-stock companies, trusts, unincorporated organizations, trustees, trustees in cases under title 11, receivers, and fiduciaries.

(e) "To rent" includes to lease, to sublease, to let and otherwise to grant for a consideration the right to occupy premises not owned by the occupant.

(f) "Discriminatory housing practice" means an act that is unlawful under section 3604, 3605, 3606, or 3617 of this title.

(g) "State" means any of the several States, the District of Columbia, the Commonwealth of Puerto Rico, or any of the territories and possessions of the United States.

(h) "Handicap" means, with respect to a person—
(1) a physical or mental impairment which substantially limits one or more of such person's major life activities,
(2) a record of having such an impairment, or
(3) being regarded as having such an impairment,
but such term does not include current, illegal use of or addiction to a controlled substance (as defined in section 802 of title 21).

(k) "Familial status" means one or more individuals (who have not attained the age of 18 years) being domiciled with—
(1) a parent or another person having legal custody of such individual or individuals; or
(2) the designee of such parent or other person having such custody, with the written permission of such parent or other person.
The protections afforded against discrimination on the basis of familial status shall apply to any person who is pregnant or is in the process of securing legal custody of any individual who has not attained the age of 18 years.`,
  },
  {
    title:
      "Fair Housing Act - Discrimination in the sale or rental of housing and other prohibited practices",
    citation: "42 U.S.C. § 3604",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/42/3604",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1989-03-12",
    text: `42 U.S.C. § 3604 — Discrimination in the sale or rental of housing and other prohibited practices

As made applicable by section 3603 of this title and except as exempted by sections 3603(b) and 3607 of this title, it shall be unlawful—

(a) To refuse to sell or rent after the making of a bona fide offer, or to refuse to negotiate for the sale or rental of, or otherwise make unavailable or deny, a dwelling to any person because of race, color, religion, sex, familial status, or national origin.

(b) To discriminate against any person in the terms, conditions, or privileges of sale or rental of a dwelling, or in the provision of services or facilities in connection therewith, because of race, color, religion, sex, familial status, or national origin.

(c) To make, print, or publish, or cause to be made, printed, or published any notice, statement, or advertisement, with respect to the sale or rental of a dwelling that indicates any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, or national origin, or an intention to make any such preference, limitation, or discrimination.

(d) To represent to any person because of race, color, religion, sex, handicap, familial status, or national origin that any dwelling is not available for inspection, sale, or rental when such dwelling is in fact so available.

(e) For profit, to induce or attempt to induce any person to sell or rent any dwelling by representations regarding the entry or prospective entry into the neighborhood of a person or persons of a particular race, color, religion, sex, handicap, familial status, or national origin.

(f)(1) To discriminate in the sale or rental, or to otherwise make unavailable or deny, a dwelling to any buyer or renter because of a handicap of— (A) that buyer or renter; (B) a person residing in or intending to reside in that dwelling after it is so sold, rented, or made available; or (C) any person associated with that buyer or renter.

(f)(2) To discriminate against any person in the terms, conditions, or privileges of sale or rental of a dwelling, or in the provision of services or facilities in connection with such dwelling, because of a handicap of— (A) that person; or (B) a person residing in or intending to reside in that dwelling after it is so sold, rented, or made available; or (C) any person associated with that person.

(f)(3) For purposes of this subsection, discrimination includes—
(A) a refusal to permit, at the expense of the handicapped person, reasonable modifications of existing premises occupied or to be occupied by such person if such modifications may be necessary to afford such person full enjoyment of the premises except that, in the case of a rental, the landlord may where it is reasonable to do so condition permission for a modification on the renter agreeing to restore the interior of the premises to the condition that existed before the modification, reasonable wear and tear excepted;
(B) a refusal to make reasonable accommodations in rules, policies, practices, or services, when such accommodations may be necessary to afford such person equal opportunity to use and enjoy a dwelling; or
(C) in connection with the design and construction of covered multifamily dwellings for first occupancy after March 13, 1991, a failure to design and construct those dwellings in such a manner that the public use and common use portions are readily accessible to and usable by handicapped persons; all the doors designed to allow passage into and within all premises are sufficiently wide to allow passage by handicapped persons in wheelchairs; and all premises contain features of adaptive design, including an accessible route into and through the dwelling, light switches, electrical outlets, thermostats, and other environmental controls in accessible locations, reinforcements in bathroom walls to allow later installation of grab bars, and usable kitchens and bathrooms such that an individual in a wheelchair can maneuver about the space.

(f)(9) Nothing in this subsection requires that a dwelling be made available to an individual whose tenancy would constitute a direct threat to the health or safety of other individuals or whose tenancy would result in substantial physical damage to the property of others.`,
  },
  {
    title:
      "Fair Housing Act - Discrimination in residential real estate-related transactions",
    citation: "42 U.S.C. § 3605",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/42/3605",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1989-03-12",
    text: `42 U.S.C. § 3605 — Discrimination in residential real estate-related transactions

(a) In general. It shall be unlawful for any person or other entity whose business includes engaging in residential real estate-related transactions to discriminate against any person in making available such a transaction, or in the terms or conditions of such a transaction, because of race, color, religion, sex, handicap, familial status, or national origin.

(b) "Residential real estate-related transaction" defined. As used in this section, the term "residential real estate-related transaction" means any of the following:
(1) The making or purchasing of loans or providing other financial assistance— (A) for purchasing, constructing, improving, repairing, or maintaining a dwelling; or (B) secured by residential real estate.
(2) The selling, brokering, or appraising of residential real property.

(c) Appraisal exemption. Nothing in this subchapter prohibits a person engaged in the business of furnishing appraisals of real property to take into consideration factors other than race, color, religion, national origin, sex, handicap, or familial status.`,
  },
  {
    title: "Fair Housing Act - Interference, coercion, or intimidation",
    citation: "42 U.S.C. § 3617",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/42/3617",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 1,
    effectiveDate: "1989-03-12",
    text: `42 U.S.C. § 3617 — Interference, coercion, or intimidation

It shall be unlawful to coerce, intimidate, threaten, or interfere with any person in the exercise or enjoyment of, or on account of his having exercised or enjoyed, or on account of his having aided or encouraged any other person in the exercise or enjoyment of, any right granted or protected by section 3603, 3604, 3605, or 3606 of this title.`,
  },
  {
    title: "Fair Housing regulations - Reasonable accommodations",
    citation: "24 C.F.R. § 100.204",
    sourceUrl: "https://www.law.cornell.edu/cfr/text/24/100.204",
    jurisdiction: "US_federal",
    authorityLayer: "primaryLaw",
    authorityRank: 2,
    effectiveDate: "1989-03-12",
    text: `24 C.F.R. § 100.204 — Reasonable accommodations.

(a) It shall be unlawful for any person to refuse to make reasonable accommodations in rules, policies, practices, or services, when such accommodations may be necessary to afford a handicapped person equal opportunity to use and enjoy a dwelling unit, including public and common use areas.

(b) The application of this section may be illustrated by the following examples:

Example (1): A blind applicant for rental housing wants to live in a dwelling unit with a seeing eye dog. The building has a no pets policy. It is a violation of § 100.204 for the owner or manager of the apartment complex to refuse to permit the applicant to live in the apartment with a seeing eye dog because, without the seeing eye dog, the blind person will not have an equal opportunity to use and enjoy a dwelling.

Example (2): Progress Gardens is a 300 unit apartment complex with 450 parking spaces which are available to tenants and guests of Progress Gardens on a first come first served basis. John applies for housing in Progress Gardens. John is mobility impaired and is unable to walk more than a short distance and therefore requests that a parking space near his unit be reserved for him so he will not have to walk very far to get to his apartment. It is a violation of § 100.204 for the owner or manager of Progress Gardens to refuse to make this accommodation. Without a reserved space, John might be unable to live in Progress Gardens at all or, when he has to park in a space far from his unit, might have great difficulty getting from his car to his apartment unit. The accommodation therefore is necessary to afford John an equal opportunity to use and enjoy a dwelling. The accommodation is reasonable because it is feasible and practical under the circumstances.`,
  },
  {
    title:
      "HUD/DOJ Joint Statement on Reasonable Accommodations under the Fair Housing Act (summary)",
    citation:
      "Joint Statement of HUD and DOJ, Reasonable Accommodations Under the Fair Housing Act (May 17, 2004)",
    sourceUrl:
      "https://www.justice.gov/crt/us-department-housing-and-urban-development",
    jurisdiction: "US_federal",
    authorityLayer: "agencyGuidance",
    authorityRank: 4,
    effectiveDate: "2004-05-17",
    text: `Summary of the HUD/DOJ Joint Statement on Reasonable Accommodations Under the Fair Housing Act (May 17, 2004). This entry is an agency-guidance summary, not verbatim statutory text.

A "reasonable accommodation" is a change, exception, or adjustment to a rule, policy, practice, or service that may be necessary for a person with a disability to have an equal opportunity to use and enjoy a dwelling, including public and common use spaces. Because rules, policies, practices, and services may have a different effect on persons with disabilities than on other persons, treating persons with disabilities exactly the same as others may deny them an equal opportunity to use and enjoy a dwelling.

There must be an identifiable relationship, or nexus, between the requested accommodation and the individual's disability. A provider may not ordinarily inquire about the nature or severity of a disability, but when a disability or the disability-related need for the accommodation is not obvious or known, a provider may request reliable information that is necessary to verify that the person has a disability that qualifies under the Act and that the accommodation is needed.

A housing provider must provide the accommodation unless doing so would impose an undue financial and administrative burden or would fundamentally alter the nature of the provider's operations. This determination is made on a case-by-case basis considering factors such as cost, the provider's financial resources, the benefits to the requester, and the availability of alternative accommodations that would effectively meet the disability-related needs. A provider who refuses a requested accommodation as unreasonable should engage in an interactive process to discuss whether an alternative accommodation would effectively address the requester's disability-related needs.

A request for accommodation may be denied if the specific individual poses a direct threat to the health or safety of others, or would cause substantial physical damage to the property of others, that cannot be reduced or eliminated by another reasonable accommodation. A provider may not require persons with disabilities to pay extra fees or deposits as a condition of receiving a reasonable accommodation.`,
  },
  {
    title:
      "Illinois Human Rights Act - Housing / real estate transactions (summary)",
    citation: "775 ILCS 5, Article 3 (Illinois Human Rights Act)",
    sourceUrl:
      "https://www.ilga.gov/legislation/ilcs/ilcs5.asp?ActID=2266&ChapterID=64",
    jurisdiction: "Illinois",
    authorityLayer: "primaryLaw",
    authorityRank: 5,
    effectiveDate: "2023-01-01",
    text: `Summary of the Illinois Human Rights Act (775 ILCS 5), Article 3 (real estate transactions). This entry is a state-law summary, not verbatim statutory text; replace with the official Illinois Compiled Statutes text when available.

The Illinois Human Rights Act makes it a civil rights violation to discriminate in "real estate transactions" - including the sale, rental, leasing, financing, and provision of brokerage or appraisal services for housing - on the basis of a protected class. It applies to owners, lessors, real estate brokers and salespersons, and financial institutions.

Illinois protects a broader set of classes than the federal Fair Housing Act. In addition to race, color, religion, sex, national origin, and familial status, the Act's housing protections extend to ancestry, age, marital status, order of protection status, disability (physical or mental), military status, sexual orientation (defined to include actual or perceived gender-related identity), pregnancy, unfavorable discharge from military service, immigration status, and source of income (which can include housing choice vouchers). As with the federal Act, it is unlawful to refuse to make reasonable accommodations in rules, policies, practices, or services when necessary to afford a person with a disability equal opportunity to use and enjoy a dwelling.

Enforcement runs through the Illinois Department of Human Rights (IDHR), which investigates charges, and the Illinois Human Rights Commission, which adjudicates them; complainants may in some circumstances proceed in circuit court. Because Illinois law reaches classes and conduct the federal Act does not, a housing matter in Illinois should be analyzed under both bodies of law rather than federal law alone.`,
  },
  {
    title: "Chicago Fair Housing Ordinance (summary)",
    citation: "Municipal Code of Chicago, ch. 5-8 (Fair Housing)",
    sourceUrl:
      "https://www.chicago.gov/city/en/depts/cchr.html",
    jurisdiction: "Chicago",
    authorityLayer: "primaryLaw",
    authorityRank: 6,
    effectiveDate: "2023-01-01",
    text: `Summary of the Chicago Fair Housing Ordinance (Municipal Code of Chicago, ch. 5-8), enforced with the Chicago Human Rights Ordinance. This entry is a local-law summary, not verbatim ordinance text; replace with the official Municipal Code text when available.

The Chicago Fair Housing Ordinance makes it unlawful to discriminate in the sale, rental, financing, or provision of real estate services on the basis of a protected class, and reaches conduct within the City of Chicago. Chicago's protected classes are broader than both federal and Illinois law and include, among others, race, color, sex, gender identity, age, religion, disability, national origin, ancestry, sexual orientation, marital status, parental status, military discharge status, source of income, and (in the housing context) criminal-record and related protections adopted by ordinance.

The ordinance requires reasonable accommodations for persons with disabilities and prohibits retaliation, coercion, and intimidation against persons exercising fair housing rights. It is enforced by the Chicago Commission on Human Relations (CCHR), which accepts and adjudicates complaints and may award damages, fines, and injunctive relief. Because the City's protections exceed federal and state law, a Chicago housing dispute should be analyzed under the municipal ordinance in addition to the Illinois Human Rights Act and the federal Fair Housing Act, and the choice of forum (CCHR, IDHR, HUD, or court) can affect available remedies.`,
  },
  {
    title:
      "Bloch v. Frischholz (7th Cir. 2009, en banc) - post-acquisition FHA discrimination (summary)",
    citation: "Bloch v. Frischholz, 587 F.3d 771 (7th Cir. 2009) (en banc)",
    sourceUrl: "https://www.law.cornell.edu/",
    jurisdiction: "Seventh_Circuit",
    authorityLayer: "caseLaw",
    authorityRank: 3,
    effectiveDate: "2009-11-13",
    text: `Summary of Bloch v. Frischholz, 587 F.3d 771 (7th Cir. 2009) (en banc). This entry is a case-law holding summary, not the verbatim opinion; replace with the official reporter text when available.

The en banc Seventh Circuit held that the Fair Housing Act can reach discrimination that occurs after a person has acquired housing (so-called "post-acquisition" discrimination), not only conduct at the point of sale or rental. A Jewish condominium owner alleged that the association selectively enforced a corridor rule to force removal of a mezuzah from her doorpost, effectively targeting observant Jewish residents.

On the Section 3604 claims, the court explained that "otherwise make unavailable or deny" a dwelling can, in narrow circumstances, encompass conduct that constructively evicts an owner or makes a dwelling unavailable because of a protected characteristic. Most significantly, the court held that Section 3617 - which makes it unlawful to coerce, intimidate, threaten, or interfere with a person's exercise or enjoyment of FHA-protected rights - reaches post-acquisition conduct and does not require a separate violation of Sections 3603-3606 to be actionable. The court reversed summary judgment against the owners on the Section 3617 claim (and allowed the Section 3604 constructive-eviction theory to proceed), permitting the discrimination claims to go forward.

As controlling Seventh Circuit authority, this decision governs FHA claims arising in Illinois, Indiana, and Wisconsin and is important for reasonable-accommodation, selective-enforcement, and harassment theories involving conduct after a resident has moved in.`,
  },
];
