# Pittsburgh zoning rules for Groundwork PGH

*Researched 2026-09-26 by the zoning/policy lane. This is a **simplified interpretation** for scoring purposes. It is not legal advice. Every report should say "verify with the Zoning Administrator".*

## 0. Read this first (the 8 facts that matter most)

1. **Minimum lot area per unit no longer exists. It was repealed in 2025.** Council Bill 2025-1579 passed 8-0 on May 5/6, 2025 and was signed May 7, 2025. It removed "minimum lot size per unit" in every residential district. It cut minimum lot size to **VL 6,000 / L 3,000 / M 2,400 / H 1,200 / VH 0 sq ft** (from 8,000 / 5,000 / 3,200 / 1,800 / 1,200). It also capped RM-VH height at 180 ft. Density in R2/R3/RM is now limited by the **use** (two-unit, three-unit, multi-unit) plus height, setbacks and site review, not by lot area. ([EngagePgh](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size), [PC draft text](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf), [Post-Gazette](https://www.post-gazette.com/news/politics-local/2025/05/06/pittsburgh-housing-zoning-lots-gainey/stories/202505060064))
2. **ADUs are not legal anywhere today.** The Garfield ADU overlay (Ord. 32-2018, Sept 2018) was a 24-month pilot and lapsed around 2020. The text of 912.08 still exists, but no overlay is mapped. ([aduzoning.org, verified 2026-09-20](https://www.aduzoning.org/adu-rules/pittsburgh-pa/), [NEXTpittsburgh](https://nextpittsburgh.com/city-design/garfield-experimenting-with-accessory-dwelling-units/))
3. **The "2026 reform" is pending, not law.** Council Bill **2025-1545** covers citywide ADUs, repealing parking minimums, and a voluntary Affordable Housing Bonus. The Planning Commission recommended it on 2026-06-02. **Council's public hearing was 2026-09-23. No vote as of 2026-09-26.** ([City hearing page](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026))
4. **Parking minimums are still in force today**, at 1 space per unit for detached, two-, three- and multi-unit housing (§914.02). Bill 2025-1545 would replace them with maximums only.
5. **The mandatory inclusionary overlay (IZ-O, §907.04)** covers Lawrenceville, Bloomfield, Polish Hill and part of Oakland. Projects of 20 or more units must make at least 10% of units affordable (rentals at 50% of area median income (AMI), for-sale units for buyers up to 80% AMI) for 35 years.
6. **Slopes of 25% or more fall under the Steep Slope Overlay (SS-O, §906.08).** All uses need a Planning Commission decision, which takes about 2–4 months. Landslide-prone (§906.04) and undermined (§906.05) areas need geotechnical or mine-data studies. The floodplain overlay (§906.02) requires the lowest floor at base flood elevation (BFE) + 1.5 ft.
7. **Process clocks.** Variances and special exceptions go to the Zoning Board of Adjustment (ZBA): a $400 fee, 21 days' notice, a hearing within 45 days, and a decision within 45 days, so about 3–5 months in practice. Conditional uses go to the Planning Commission and then City Council, about 4–8 months. By-right permits have sped up: the median single-family permit fell from 11 days (Jan 2026) to 5 days (Jun 2026).
8. **Another pending bill: 2026-0834**, Mayor O'Connor's Executive Order 2026-01 Phase 1 (council hearing **2026-10-13**). It would regulate height in feet rather than stories, raise UNC to 60 ft everywhere, simplify the residential compatibility rules, and rezone one GT-D block to GT-C. Include it in the reform toggle as a minor item.

**Source note:** Municode no longer hosts Pittsburgh's code, and ecode360 (the new official host: [Ch. 903](https://ecode360.com/45474194), [Ch. 915](https://ecode360.com/45478225), [Ch. 906](https://ecode360.com/45474902)) blocks automated readers. Code values below were therefore read from official city PDFs of the code tables (attached to amendments), the [elaws mirror](http://www.pittsburgh-pa.elaws.us/code/cid13525/911.02/) and the [Zoneomics mirror](https://www.zoneomics.com/code/pittsburgh-PA/chapter_3), which is current through about Ord. 4-2024. Confidence is marked per row.

---

## 1. District → typology table

### 1a. Current use permissions (§911.02 Use Table, residential rows)

Primary source: the full current §911.02 table attached to Council Bill 2024-0701, PDF p.5 ([PDF](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf)). It was cross-checked against [elaws 911.02](http://www.pittsburgh-pa.elaws.us/code/cid13525/911.02/) and the [RIV ordinance master doc, pp.73–74](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/riverfront-zoning_docs-amp-presentations/riv-master-document.pdf).

Legend: **P** = permitted by right. **A** = Administrator Exception (Zoning Administrator, $100, near-by-right). **S** = Special Exception (ZBA). **C** = Conditional Use (Planning Commission + Council). **–** = not permitted (a use variance is the only route).

How our typologies map to code uses:

| Our typology | Code use |
|---|---|
| ADU | 912.08 accessory use (not a use-table row) |
| Duplex | Two-Unit Residential |
| Triplex | Three-Unit Residential |
| Townhomes | Single-Unit Attached Residential |
| Small MF 4–19 | Multi-Unit Residential |
| Mid-rise 20+ | Multi-Unit Residential + height |

| District (`zon_new`) | Family | 1-unit detached | Townhome (1-unit attached) | Duplex | Triplex | Multi-unit (4–19 and 20+) | ADU today | Confidence |
|---|---|---|---|---|---|---|---|---|
| R1D-* | single-family | P | **S? (uncertain)** ¹ | – | – | – | – | high (attached: low) |
| R1A-* | single-family | P | P | – | – | – | – | high |
| R2-* | two-family | P | P | P | – | – | – ² | high |
| R3-* | multi (small) | P | P | P | P | – | – ² | high |
| RM-* | multi | P | P | P | P | P | – ² | high |
| H (Hillside) | special | A ³ | S ³ | – | – | – | – | high |
| P (Parks) | non-res/special | P ⁴ | – | – | – | – | – | medium |
| NDO | mixed-use | P | P | P | P | P | – | high |
| LNC | mixed-use | P | P | P | P | P | – | high |
| NDI | mixed-use | P | P | P | P | P | – | high |
| UNC | mixed-use | P | P | P | P | P | – | high |
| UI | mixed-use (industrial) | – | – | – | – | **S** ⁵ | – | high |
| HC | non-residential | – | – | – | – | – | – | high |
| GI | non-residential | – | – | – | – | – | – | high |
| UC-MU | mixed-use | – | P | P | P | P | – | high |
| UC-E | mixed-use | – | – | – | – | **A** ⁵ | – | high |
| R-MU | mixed-use | P | P | P | P | P | – | high |
| EMI | special (institutional) | P | – | – | – | A ⁵ | – | medium |
| GT-A…GT-E | mixed-use (downtown) | – | – | P | P | P | – | high (one GT column covers all subdistricts) |
| RIV-RM | mixed-use | – | P | P | P | P | – | high |
| RIV-MU | mixed-use | – | P | P | P | P | – | high |
| RIV-NS | mixed-use | – | – | – | – | P | – | high |
| RIV-IMU | mixed-use | – | – | P | P | P | – | high |
| RIV-GI | non-residential | – | – | – | – | – | – | high |
| SP-* | special | per SP district text (Ch. 909) ⁶ | | | | | – | low |
| CP / RP / AP | special (planned unit development) | per approved PUD plan (Ch. 908) ⁷ | | | | | – | low |
| OS (if present) | non-residential | – | – | – | – | – | – | low ⁸ |

Notes:
1. **R1D townhomes.** The 2024 table attachment shows "P/S" with standard A.69A. The older elaws and RIV copies show the cell blank. Whether that change was enacted is unconfirmed. **Model it as special-exception with low confidence and tell users to verify.**
2. **Second units today.** In R2, R3 and RM a second unit can be added as a *two-unit conversion* (by right), even though an "ADU" use does not exist yet.
3. **H district (§911.04.A.69(a)).** A house must sit on contiguous buildable land sloped under 30%. A soils report may be required. Attached units need a special exception, with at most 4 units per cluster. **Any construction in H triggers Site Plan Review** (§922.04.A.4). Dimensional rules ([elaws 905.02](http://www.pittsburgh-pa.elaws.us/code/cid13525/905.02/)): minimum lot 3,200 sf, no setbacks, 40 ft height, **at most 50% of the lot may be disturbed**.
4. **Parks (P).** Single-unit detached is listed as P, but P parcels are parkland. Treat as not a development candidate (block in scoring).
5. **Use standard A.85.**
   - UI: residential "may be limited to floors above the ground floor".
   - EMI: Chapter 916 compatibility rules apply, plus an impact finding.
   - UC-E: residential only if 100% of units are affordable, or residential is under 50% of floor area.
   - (Sources: RIV doc p.210; Bill 2025-1545 text p.98.)
6. **SP districts.** SP districts (Ch. 909) each list their own uses. For example, SP-4 allows multi-unit residential. The EO Phase 1 bill removes stale SP text: SP-6 is now P and SP-7 is now UC-MU.
7. **CP.** CP is not a column in §911.02. We believe CP/RP/AP are Planned Unit Development districts whose uses are fixed by an approved plan. **Unverified.**
8. **OS.** "OS" is not a current §911.02 column. It may be a legacy code in the layer. Treat as open space.

### 1b. Dimensional standards (what the scoring engine needs)

**Residential density subdistricts (§903.03, as amended by 2025-1579, in effect)**

| Suffix | Min lot size (sf) | Min lot area per unit | Max height: R1D/R1A/R2/R3 | Max height: RM | Front / rear / exterior-side setback (R1D–R3) | Front / rear / exterior-side setback (RM) | Interior side (R1D/R2/R3; RM) |
|---|---|---|---|---|---|---|---|
| VL | **6,000** (was 8,000) | **none** (was 8,000) | 40 ft (3 st) | 40 ft (3 st) | 30 / 30 / 30 | 30 / 30 / 30 | 5; 30 |
| L | **3,000** (was 5,000) | **none** (was 3,000) | 40 ft | 40 ft | 30 / 30 / 30 | 25 / 25 / 30 | 5; 25 |
| M | **2,400** (was 3,200) | **none** (was 1,800) | 40 ft | **55 ft (4 st)** | 30 / 30 / 30 | 25 / 25 / 25 | 5; 10 |
| H | **1,200** (was 1,800) | **none** (was 750) | 40 ft | **85 ft (9 st)** | 15 / 15 / 15 | 25 / 25 / 25 | 5; 10 |
| VH | **0** (was 1,200 per the draft text; EngagePgh says 1,800) | **none** (was 400) | 40 ft | **180 ft** (new cap) | 5 / 15 / 5 | 25 / 25 / 25 | 5; 10 |

Sources: [PC draft legislation 2024-12-10](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf) and [EngagePgh adopted values](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size). Confidence: **high** for lot sizes, **medium** for setbacks (they come from the draft text; pypdf loses strike-through formatting).

Other rules in the same section:
- Party-wall (attached) units have a 0 ft interior side setback.
- Contextual setbacks and heights (§925.06–.07) may override these numbers.
- Chapter 916 residential compatibility rules add limits for H/VH development near residential.

**Mixed-use and other districts.** Sources: Ch. 904 as restated in the [Bill 2025-1545 text, corrected 2026-07-24](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-hearings-or-other/2025-1545-to-be-amended-by-substitute-from-june-2-2026-corrected-july-24-2026_final.pdf); the [EO Phase 1 briefing, 2026-07-14](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/pc-july-14-2026/eo-phase-1-zoning-amendment-package-briefing-presentation-2026-07-14-updated-v2.pdf); and [elaws 905.01/905.02](http://www.pittsburgh-pa.elaws.us/code/cid13525/905.02/).

| District | Min lot | Max FAR | Max height (ft) | Notes | Confidence |
|---|---|---|---|---|---|
| NDO | 0 | 3:1 | 45 (3 st) | 90% lot coverage | high |
| LNC | 0 | 2:1 | 45 (3 st) | 90% lot coverage | high |
| NDI | 0 | 2:1 | 45 (3 st) | | high |
| UNC | 0 | 3:1 (4:1 near transit) | 45; 60 within 1,500 ft of a Major Transit Facility; special exception up to 85 | **EO Phase 1 (pending) makes it 60 everywhere** | high |
| UI | 0 | 3:1 (4:1 near transit) | 60 | Special exception for more height; FAR up to 10:1 by special exception if at least 75% multi-unit | high |
| HC | 0 | 2:1 (3:1 near transit) | 75 | No residential | high |
| GI | 0 | 3:1 | 75 | No residential | high |
| UC-MU, R-MU | 0 | none | Height map (varies by parcel) | Minimum height 24 ft; step-backs at 65 and 85 ft | medium (no single number) |
| GT-A / GT-B | 0 | 13 | Set by FAR; no fixed cap found | [2022-0819 GT amendment](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/19630_2022-0819_gt_zoning_amendments.pdf) | medium |
| GT-C | 0 | 7.5 (residential up to 10 with PC approval) | Inclined plane, 180–450 | Downtown | medium |
| GT-D | 0 | 7.5 | Inclined plane | 60% urban open space | medium |
| GT-E | 0 | 6 (residential up to 7.5) | Inclined plane, 100–400 | | medium |
| H | 3,200 | none | 40 | At most 50% of lot disturbed; Site Plan Review | high |
| P | 3,200 | 1:1 | n/a | Parkland | high |
| RIV-* | n/a | n/a | **not researched**; RIV uses its own frontage/height rules (Ch. 905 RIV) | Project Development Plan (§922.10) required; 50% parking reduction | low |
| EMI | n/a | per Institutional Master Plan | per IMP | | low |

**Performance-point height bonus.** Bill 2025-1545 (pending) grants +15 ft per affordable-housing point in RM, NDO, LNC, NDI, UNC, HC and UI.

---

## 2. TypeScript shape + `ZONING_RULES` (paste into `packages/scoring/src/zoning.ts`)

```ts
// packages/scoring/src/zoning.ts
// Simplified interpretation of Pittsburgh Zoning Code Title Nine (as of 2026-09-26).
// NOT legal advice. Every consumer UI must show "verify with the Zoning Administrator".

export type Typology =
  | "adu"
  | "duplex"
  | "triplex"
  | "townhome"
  | "smallMultifamily" // 4–19 units
  | "midRise"; // 20+ units

export type UseStatus =
  | "by-right" // P
  | "administrator-exception" // A: Zoning Administrator, $100, near by-right
  | "special-exception" // S: ZBA hearing
  | "conditional" // C: Planning Commission + City Council
  | "not-permitted" // blank: only a use variance (ZBA, hardship standard, rarely granted)
  | "per-plan"; // SP / PUD districts: governed by district-specific plan

export type DistrictFamily =
  | "single-family"
  | "two-family"
  | "multi"
  | "mixed-use"
  | "special"
  | "non-residential";

export type Confidence = "high" | "medium" | "low";

export interface TypologyRule {
  status: UseStatus;
  note?: string;
}

export interface DistrictRule {
  code: string; // base code, e.g. "R2", "LNC", "GT-C", "RIV-MU"
  name: string;
  family: DistrictFamily;
  minLotSqft: number | null; // min lot size; null = unknown / plan-based
  minLotAreaPerUnitSqft: 0 | null; // repealed citywide by Bill 2025-1579 (May 2025); kept for clarity
  maxHeightFt: number | null; // null = height map / FAR-governed / unknown
  maxFar: number | null;
  typologies: Record<Typology, TypologyRule>;
  triggers: {
    sitePlanReviewAlways?: boolean; // e.g. H district
    projectDevelopmentPlan?: boolean; // GT / RIV / Public Realm (§922.10)
    parkingReductionPct?: number; // §914.04 current exempt areas (non-reform)
  };
  confidence: Confidence;
  sourceUrl: string;
  notes?: string;
}

export interface ReformOverride {
  id: "hna-2025-1545" | "eo-phase1-2026-0834";
  label: string;
  status: "pending" | "adopted";
  asOf: string; // ISO date
  sourceUrl: string;
}

// --- density subdistrict dimensional standards (§903.03, as amended by Bill 2025-1579) ---
export type DensitySuffix = "VL" | "L" | "M" | "H" | "VH";
export const DENSITY: Record<
  DensitySuffix,
  { minLotSqft: number; heightFt: number; rmHeightFt: number }
> = {
  VL: { minLotSqft: 6000, heightFt: 40, rmHeightFt: 40 },
  L: { minLotSqft: 3000, heightFt: 40, rmHeightFt: 40 },
  M: { minLotSqft: 2400, heightFt: 40, rmHeightFt: 55 },
  H: { minLotSqft: 1200, heightFt: 40, rmHeightFt: 85 },
  VH: { minLotSqft: 0, heightFt: 40, rmHeightFt: 180 },
};

const SRC = {
  useTable:
    "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf",
  minLot: "https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size",
  ch904:
    "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-hearings-or-other/2025-1545-to-be-amended-by-substitute-from-june-2-2026-corrected-july-24-2026_final.pdf",
  h: "http://www.pittsburgh-pa.elaws.us/code/cid13525/905.02/",
  p: "http://www.pittsburgh-pa.elaws.us/code/cid13525/905.01/",
  gt: "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/19630_2022-0819_gt_zoning_amendments.pdf",
  riv: "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/riverfront-zoning_docs-amp-presentations/riv-master-document.pdf",
} as const;

// helpers
const P: TypologyRule = { status: "by-right" };
const NP: TypologyRule = { status: "not-permitted" };
const ADU_TODAY: TypologyRule = {
  status: "not-permitted",
  note: "No ADU use in the code today (Garfield overlay lapsed ~2020). Pending Bill 2025-1545 would allow up to 2 by right.",
};
const PLAN: TypologyRule = { status: "per-plan", note: "Uses set by district-specific plan; verify with DCP." };

/** multi-unit covers both smallMultifamily and midRise; midRise also needs height (see feasibility). */
function row(
  duplex: TypologyRule,
  triplex: TypologyRule,
  townhome: TypologyRule,
  multi: TypologyRule,
  adu: TypologyRule = ADU_TODAY,
): Record<Typology, TypologyRule> {
  return { adu, duplex, triplex, townhome, smallMultifamily: multi, midRise: multi };
}

type Base = Omit<DistrictRule, "code" | "minLotSqft" | "maxHeightFt"> & {
  minLotSqft?: number | null;
  maxHeightFt?: number | null;
};

// Base districts. Residential ones get dimensional values from DENSITY via lookupZoning().
export const ZONING_RULES: Record<string, Base> = {
  R1D: {
    name: "Single-Unit Detached Residential",
    family: "single-family",
    minLotAreaPerUnitSqft: 0,
    maxFar: null,
    typologies: row(NP, NP, { status: "special-exception", note: "UNCERTAIN: 2024 table shows P/S (A.69A); older copies blank. Verify." }, NP),
    triggers: {},
    confidence: "high",
    sourceUrl: SRC.useTable,
  },
  R1A: {
    name: "Single-Unit Attached Residential",
    family: "single-family",
    minLotAreaPerUnitSqft: 0,
    maxFar: null,
    typologies: row(NP, NP, P, NP),
    triggers: {},
    confidence: "high",
    sourceUrl: SRC.useTable,
  },
  R2: {
    name: "Two-Unit Residential",
    family: "two-family",
    minLotAreaPerUnitSqft: 0,
    maxFar: null,
    typologies: row(P, NP, P, NP, { status: "not-permitted", note: "No ADU use today, but a 2nd unit is possible as a by-right two-unit conversion." }),
    triggers: {},
    confidence: "high",
    sourceUrl: SRC.useTable,
  },
  R3: {
    name: "Three-Unit Residential",
    family: "multi",
    minLotAreaPerUnitSqft: 0,
    maxFar: null,
    typologies: row(P, P, P, NP, { status: "not-permitted", note: "No ADU use today; 2nd/3rd unit possible as by-right two/three-unit." }),
    triggers: {},
    confidence: "high",
    sourceUrl: SRC.useTable,
  },
  RM: {
    name: "Multi-Unit Residential",
    family: "multi",
    minLotAreaPerUnitSqft: 0,
    maxFar: null,
    typologies: row(P, P, P, { status: "by-right", note: "4+ units triggers Site Plan Review (§922.04)." }),
    triggers: {},
    confidence: "high",
    sourceUrl: SRC.useTable,
  },
  H: {
    name: "Hillside",
    family: "special",
    minLotSqft: 3200,
    maxHeightFt: 40,
    minLotAreaPerUnitSqft: 0,
    maxFar: null,
    typologies: row(NP, NP, { status: "special-exception", note: "Max 4 units per cluster (A.69(a))." }, NP),
    triggers: { sitePlanReviewAlways: true },
    confidence: "high",
    sourceUrl: SRC.h,
    notes: "Single-unit detached = Administrator Exception; buildable area must be <30% slope; max 50% of lot disturbed.",
  },
  P: {
    name: "Parks",
    family: "non-residential",
    minLotSqft: 3200,
    maxHeightFt: null,
    minLotAreaPerUnitSqft: 0,
    maxFar: 1,
    typologies: row(NP, NP, NP, NP),
    triggers: {},
    confidence: "medium",
    sourceUrl: SRC.p,
    notes: "Use table lists single-unit detached as P, but parcels are parkland; treat as non-candidate.",
  },
  NDO: { name: "Neighborhood Office", family: "mixed-use", minLotSqft: 0, maxHeightFt: 45, minLotAreaPerUnitSqft: 0, maxFar: 3, typologies: row(P, P, P, P), triggers: {}, confidence: "high", sourceUrl: SRC.ch904 },
  LNC: { name: "Local Neighborhood Commercial", family: "mixed-use", minLotSqft: 0, maxHeightFt: 45, minLotAreaPerUnitSqft: 0, maxFar: 2, typologies: row(P, P, P, P), triggers: {}, confidence: "high", sourceUrl: SRC.ch904 },
  NDI: { name: "Neighborhood Industrial", family: "mixed-use", minLotSqft: 0, maxHeightFt: 45, minLotAreaPerUnitSqft: 0, maxFar: 2, typologies: row(P, P, P, P), triggers: {}, confidence: "high", sourceUrl: SRC.ch904 },
  UNC: {
    name: "Urban Neighborhood Commercial", family: "mixed-use", minLotSqft: 0, maxHeightFt: 45, minLotAreaPerUnitSqft: 0, maxFar: 3,
    typologies: row(P, P, P, P), triggers: {}, confidence: "high", sourceUrl: SRC.ch904,
    notes: "60 ft within 1,500 ft of a Major Transit Facility (busway/LRT); EO Phase 1 (pending) → 60 ft everywhere.",
  },
  UI: {
    name: "Urban Industrial", family: "mixed-use", minLotSqft: 0, maxHeightFt: 60, minLotAreaPerUnitSqft: 0, maxFar: 3,
    typologies: row(NP, NP, NP, { status: "special-exception", note: "Multi-unit only; may be limited to upper floors (A.85(a))." }),
    triggers: {}, confidence: "high", sourceUrl: SRC.useTable,
  },
  HC: { name: "Highway Commercial", family: "non-residential", minLotSqft: 0, maxHeightFt: 75, minLotAreaPerUnitSqft: 0, maxFar: 2, typologies: row(NP, NP, NP, NP), triggers: {}, confidence: "high", sourceUrl: SRC.useTable },
  GI: { name: "General Industrial", family: "non-residential", minLotSqft: 0, maxHeightFt: 75, minLotAreaPerUnitSqft: 0, maxFar: 3, typologies: row(NP, NP, NP, NP), triggers: {}, confidence: "high", sourceUrl: SRC.useTable },
  "UC-MU": { name: "Urban Center Mixed Use", family: "mixed-use", minLotSqft: 0, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(P, P, P, P), triggers: { parkingReductionPct: 50 }, confidence: "high", sourceUrl: SRC.useTable, notes: "Height set by height map; min height 24 ft." },
  "UC-E": { name: "Urban Center Employment", family: "mixed-use", minLotSqft: 0, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(NP, NP, NP, { status: "administrator-exception", note: "Only if 100% affordable or residential <50% of GFA (A.85(c))." }), triggers: { parkingReductionPct: 100 }, confidence: "high", sourceUrl: SRC.useTable },
  "R-MU": { name: "Residential Mixed Use", family: "mixed-use", minLotSqft: 0, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(P, P, P, P), triggers: { parkingReductionPct: 50 }, confidence: "high", sourceUrl: SRC.useTable, notes: "Height set by height map." },
  EMI: { name: "Educational/Medical Institution", family: "special", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: null, maxFar: null, typologies: row(NP, NP, NP, { status: "administrator-exception", note: "A.85(b): Ch. 916 compatibility + impact finding; governed by Institutional Master Plan." }), triggers: {}, confidence: "medium", sourceUrl: SRC.useTable },
  GT: {
    name: "Golden Triangle (Downtown)", family: "mixed-use", minLotSqft: 0, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: 7.5,
    typologies: row(P, P, NP, P), triggers: { projectDevelopmentPlan: true, parkingReductionPct: 100 },
    confidence: "high", sourceUrl: SRC.gt, notes: "FAR: GT-A/B 13, GT-C/D 7.5, GT-E 6; heights by inclined planes.",
  },
  "RIV-RM": { name: "Riverfront Residential Mixed", family: "mixed-use", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(P, P, P, P), triggers: { projectDevelopmentPlan: true, parkingReductionPct: 50 }, confidence: "high", sourceUrl: SRC.riv, notes: "Heights not researched." },
  "RIV-MU": { name: "Riverfront Mixed Use", family: "mixed-use", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(P, P, P, P), triggers: { projectDevelopmentPlan: true, parkingReductionPct: 50 }, confidence: "high", sourceUrl: SRC.riv },
  "RIV-NS": { name: "Riverfront North Shore", family: "mixed-use", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(NP, NP, NP, P), triggers: { projectDevelopmentPlan: true, parkingReductionPct: 50 }, confidence: "high", sourceUrl: SRC.riv },
  "RIV-IMU": { name: "Riverfront Industrial Mixed Use", family: "mixed-use", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(P, P, NP, P), triggers: { projectDevelopmentPlan: true, parkingReductionPct: 50 }, confidence: "high", sourceUrl: SRC.riv },
  "RIV-GI": { name: "Riverfront General Industrial", family: "non-residential", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: 0, maxFar: null, typologies: row(NP, NP, NP, NP), triggers: { projectDevelopmentPlan: true }, confidence: "high", sourceUrl: SRC.riv },
  SP: { name: "Specially Planned", family: "special", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: null, maxFar: null, typologies: { adu: ADU_TODAY, duplex: PLAN, triplex: PLAN, townhome: PLAN, smallMultifamily: PLAN, midRise: PLAN }, triggers: { projectDevelopmentPlan: true }, confidence: "low", sourceUrl: "https://ecode360.com/45474194", notes: "Ch. 909; each SP-n lists its own uses." },
  PUD: { name: "Planned Unit Development (CP/RP/AP)", family: "special", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: null, maxFar: null, typologies: { adu: ADU_TODAY, duplex: PLAN, triplex: PLAN, townhome: PLAN, smallMultifamily: PLAN, midRise: PLAN }, triggers: {}, confidence: "low", sourceUrl: "https://ecode360.com/45474194", notes: "Assumed Ch. 908 PUD; UNVERIFIED." },
  OS: { name: "Open Space (legacy?)", family: "non-residential", minLotSqft: null, maxHeightFt: null, minLotAreaPerUnitSqft: null, maxFar: null, typologies: row(NP, NP, NP, NP), triggers: {}, confidence: "low", sourceUrl: SRC.useTable },
};

const RESIDENTIAL = new Set(["R1D", "R1A", "R2", "R3", "RM"]);

/** Parse a zon_new value like "R1D-L", "RM-VH", "GT-C", "RIV-MU", "SP-4", "CP", "LNC". */
export function lookupZoning(zonNew: string): DistrictRule | null {
  const z = zonNew.trim().toUpperCase();
  const m = z.match(/^(R1D|R1A|R2|R3|RM)-(VL|L|M|H|VH)$/);
  if (m) {
    const [, base, suffix] = m as unknown as [string, string, DensitySuffix];
    const d = DENSITY[suffix];
    return {
      ...ZONING_RULES[base]!,
      code: z,
      minLotSqft: d.minLotSqft,
      maxHeightFt: base === "RM" ? d.rmHeightFt : d.heightFt,
      sourceUrl: ZONING_RULES[base]!.sourceUrl,
    } as DistrictRule;
  }
  let key: string | null = null;
  if (ZONING_RULES[z]) key = z;
  else if (/^GT-[A-E]$/.test(z)) key = "GT";
  else if (/^SP-/.test(z)) key = "SP";
  else if (/^(CP|RP|AP)$/.test(z)) key = "PUD";
  if (!key) return null; // unknown → UI shows "unmapped district, verify"
  const b = ZONING_RULES[key]!;
  const gtFar: Record<string, number> = { "GT-A": 13, "GT-B": 13, "GT-C": 7.5, "GT-D": 7.5, "GT-E": 6 };
  return {
    ...b,
    code: z,
    minLotSqft: b.minLotSqft ?? null,
    maxHeightFt: b.maxHeightFt ?? null,
    maxFar: key === "GT" ? gtFar[z] ?? b.maxFar : b.maxFar,
  } as DistrictRule;
}

// ---------------- Reform scenario (pending Bill 2025-1545) ----------------
export const REFORMS: ReformOverride[] = [
  {
    id: "hna-2025-1545",
    label: "Citywide ADUs, no parking minimums, Affordable Housing Bonus (Council Bill 2025-1545)",
    status: "pending", // PC recommended 2026-06-02; Council hearing 2026-09-23; no vote as of 2026-09-26
    asOf: "2026-09-26",
    sourceUrl:
      "https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026",
  },
  {
    id: "eo-phase1-2026-0834",
    label: "Executive Order 2026-01 Phase 1: heights in feet, UNC 60 ft, residential compatibility (Council Bill 2026-0834)",
    status: "pending", // Council hearing 2026-10-13
    asOf: "2026-09-26",
    sourceUrl:
      "https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-October-13th-2026",
  },
];

/** Apply the pending reform package to a district rule (pure). */
export function applyReform(rule: DistrictRule, opts: { primaryUseResidential: boolean }): DistrictRule {
  const allowsAnyResidence = Object.entries(rule.typologies).some(
    ([t, r]) => t !== "adu" && r.status !== "not-permitted",
  ) || rule.code.startsWith("R1D") || rule.code === "H" || rule.code === "EMI";
  const adu: TypologyRule = allowsAnyResidence && rule.family !== "non-residential"
    ? opts.primaryUseResidential
      ? { status: "by-right", note: "Up to 2 ADUs/lot, ≤1,000 sf, ≤30 ft, no owner-occupancy, no parking (§912.08 as amended by Bill 2025-1545, pending)." }
      : { status: "by-right", note: "ADU is accessory: requires a principal dwelling first (vacant lot → build house + ADU)." }
    : rule.typologies.adu;
  let maxHeightFt = rule.maxHeightFt;
  if (rule.code === "UNC") maxHeightFt = 60; // EO Phase 1 (Bill 2026-0834)
  return {
    ...rule,
    maxHeightFt,
    typologies: { ...rule.typologies, adu },
    triggers: { ...rule.triggers, parkingReductionPct: 100 }, // all minimums repealed; maximums only
  };
}

/** Mid-rise (20+) practical feasibility beyond use permission. Heuristic, label as assumption. */
export function midRiseHeightOk(rule: DistrictRule): "pass" | "warn" | "block" {
  if (rule.maxHeightFt === null) return "pass"; // height-map / FAR districts (UC-MU, R-MU, GT, RIV): verify
  if (rule.maxHeightFt >= 55) return "pass";
  if (rule.maxHeightFt >= 40) return "warn"; // 3-story walk-up: 20+ units only on large lots
  return "block";
}
```

---

## 3. Environmental overlays → feasibility

Sources: Zoneomics mirror of [Ch. 906/907](https://www.zoneomics.com/code/pittsburgh-PA/chapter_3), [Ch. 914/915](https://www.zoneomics.com/code/pittsburgh-PA/chapter_6) and [Ch. 922/923](https://www.zoneomics.com/code/pittsburgh-PA/chapter_8) (current through about Ord. 4-2024); the official ecode360 pages are [Ch. 906](https://ecode360.com/45474902) and [Ch. 915](https://ecode360.com/45478225).

| Layer (our data) | Code | What it requires | Scoring effect | Time/cost add | Confidence |
|---|---|---|---|---|---|
| **Slope ≥25%** (`PGHWebSlope25`) | §906.08 **SS-O Steep Slope Overlay**; §915.02 | **All uses need Planning Commission review and approval.** 21 days' notice. Hearing within 60 days of a complete application; decision within 45 days of the hearing. 50-ft setback from the ridgeline or overlay base; minimize impervious surface; approval lapses after 1 yr. Under §915.02, cut or fill steeper than 25% needs a **geotechnical report** plus terracing at least every 10 ft; retaining walls at most 10 ft; re-vegetate exposed slopes over 15%. | **warn** if <50% of the parcel is ≥25% slope; **block (for scoring) if ≥75%**. Always "needs geotech". | +2–4 months, PC fee $1,350, geotech study roughly $3–10k (our assumption) | high (code); medium (overlay mapping: the SS-O may not match the 25% slope layer exactly) |
| **H district** | §905.02, §922.04.A.4 | Buildable area under 30% slope; at most 50% of lot disturbed; **Site Plan Review for any construction** | warn | +1–2 months | high |
| **Landslide-prone** (`PGHWebLandslideProne`) | §906.04 **LS-O** | Subsurface investigation by a registered professional or geotech **before the certificate of occupancy**; Hillside Development Standards (Subdivision Regs); the Chief of Building Inspection approves construction and land-operations plans before a building permit | warn (block if also ≥25% slope and ≥50% of the parcel) | +1–2 months, geotech cost | high |
| **Undermined** (`PGHWebUndermined`) | §906.05 **UM-O** | Submit PA DEP mine data. A single-unit house is OK **only with more than 100 ft of overburden and no subsidence history nearby**. Anything else needs a site investigation, and special construction needs the Building Chief's approval. | warn for 1–2 units; warn+ for multi-unit. Recommend mine-subsidence insurance (PA MSI program, our addition) | +1–2 months | high |
| **FEMA flood** (`PGHWebFEMA2014` + NFHL) | §906.02 **FP-O** (zones A, AE, AE-floodway) | Lowest floor at **BFE + 1.5 ft** (Regulatory Flood Elevation). Nonresidential may floodproof instead. Substantial improvement means work worth 50% or more of the structure's value. Manufactured homes are prohibited in the floodway. Some activities need a Special Permit (PC, then Council, then a 30-day DCED review). Flood insurance is effectively mandatory with a federally backed mortgage. | **block in the floodway**; **warn in A/AE**; pass in X (0.2%) with an insurance note | +cost of elevation; +1–3 months if a Special Permit is needed | high. [City flood handout (2018)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/2199_flood_plain_handout.pdf) |
| **IZ-O** (Lawrenceville, Bloomfield, Polish Hill, part of Oakland) | §907.04 | For **20+ units**: at least 10% affordable (rentals at 50% AMI; for-sale priced at 70% AMI for buyers up to 80% AMI), **35-year term** | Mid-rise: warn (feasibility cost), but earns an affordability "equity" credit | financial, not time | high. [PublicSource](https://www.publicsource.org/inclusionary-zoning-affordable-housing-pittsburgh-lawrenceville-bloomfield-polish-hill-gainey/), [EngagePgh IZ](https://engage.pittsburghpa.gov/izodx). **Check whether the pipeline has an IZ-O polygon layer**; if not, fall back to the four neighborhood names (Oakland is only partly covered, so flag Oakland as "partial"). |
| **Riverfront (RIV-*)** | Ch. 905 RIV; §922.10 | Project Development Plan (PC approval); stormwater permit trigger drops to 5,000 sf of disturbance | warn (process) | +2–3 months | medium |
| **Stormwater** (any site) | Title 13, Ch. 1301–1304 (not Ch. 1003) | Stormwater management plan and permit if **≥10,000 sf disturbed or ≥5,000 sf of new impervious surface**. DCP does conceptual review and PLI technical review. [City page, 8/20/2026](https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/Permits/Commercial-Permits/Commercial-Stormwater-Permit) | warn if lot ≥10,000 sf, or for small MF / mid-rise | +1–2 months, engineering cost | high |
| **Sewage planning module** | PA DEP Act 537 via PWSA → ALCOSAN → DCP → Law → **City Council** → DEP | Required based on net new sewage flow (practically for multi-unit) | warn for mid-rise | **+3–6 months (runs in parallel)**. [PWSA](https://www.pgh2o.com/developers-contractors-vendors/permits/development-permits/dep-sewage-facilities-planning-module) | medium |

Rule of thumb for the UI copy: *"Slope, landslide and mine issues rarely make a lot illegal to build on. They add studies, review time and foundation cost. A floodway is the one hazard that effectively blocks new housing."*

---

## 4. Reform scenario overrides (as of 2026-09-26)

**Label for the toggle:** *"Pending legislation, not yet in effect: Council Bill 2025-1545 (public hearing held Sept 23, 2026; awaiting Council vote and Mayor's signature)"*. For the whole package it takes 5 Council votes plus the Mayor's signature. Mayor O'Connor has opposed citywide affordability *mandates*, and the voluntary version is the one before Council ([PublicSource](https://www.publicsource.org/affordable-housing-bonus-program-wins-city-planning-approval/)). Whether he signs is our speculation.

### 4a. What flips (source: [Bill 2025-1545 text, June 2 2026 substitute, corrected 2026-07-24](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-hearings-or-other/2025-1545-to-be-amended-by-substitute-from-june-2-2026-corrected-july-24-2026_final.pdf))

| Item | Today | Under 2025-1545 | Districts affected | Scoring flip |
|---|---|---|---|---|
| **ADU** (§912.08 rewritten: "ADU Overlay District" becomes "Accessory Dwelling Unit") | Not permitted anywhere | **By right** as an accessory use on any lot whose **primary use is Residential**, Community Center or Religious Assembly. At most **2 per residential lot**; **1,000 sf** each (was 800); **30 ft** height, including a garage below it. **No owner occupancy, no deed restriction, no minimum lease.** Exempt from Ch. 916 compatibility rules. Garage conversions in setbacks need no Administrator Exception. More than 10 ADUs on a Community Center or Religious Assembly lot needs Site Plan Review. | Every district where a dwelling can legally exist: R1D, R1A, R2, R3, RM (all suffixes), H, NDO, LNC, NDI, UNC, UC-MU, R-MU, GT, RIV-RM/MU/IMU/NS, EMI. **Not** HC, GI, RIV-GI, P. | `adu: not-permitted → by-right`. On a vacant lot, show it as "by right with a new house" |
| **Parking** (Ch. 914 fully replaced) | **Minimums:** single-unit detached 1/unit; attached 0; two-, three- and multi-unit 1/unit (§914.02). Reductions: 100% in GT/Downtown, UC-E and Lower Hill SP-11; 50% in RIV, UC-MU and R-MU; ZBA special exception for relief (§914.11) | **No minimums anywhere.** Maximums only, stricter within the PRT Frequent Service Walkshed: multi-unit max 2/unit (1/unit in the walkshed); detached 4; attached 4 (2 in the walkshed); two- and three-unit 2. Surface lots over 25 spaces must be structured. Surface parking banned in GT, RIV-NS, UC-E and UC-MU. Bike parking required for all multi-unit projects. TDM rules scale with project size. | All | The parking factor becomes "pass" everywhere. It removes a common special-exception trigger for small lots |
| **Affordable Housing Bonus (AHBP)** (voluntary; replaces the Oct 2025 mandatory proposal) | Only the mandatory IZ-O in 4 neighborhoods | Voluntary: set aside 10–20% of units (rentals at 50% AMI, for-sale at 80% AMI) for **20 years**, or pay **$25/sf** in lieu. Earns performance points, each worth **+15 ft height**: 2–4 points in RM, NDO, LNC, NDI, UNC, UI (HC also listed); **6 points in RIV, UPR, R-MU, UC-E, UC-MU** for 20% at 50% AMI. Extra incentives: expedited ZBA/PC review, enhanced LERTA tax abatement. Does not apply in the IZ-O (still mandatory, 35 years) or GT. | Multi-unit districts | Mid-rise `maxHeightFt += 30` (2 points) to `+60` (4 points), shown only as a "with affordable units" variant. The June 2026 draft removed the 20-unit minimum |
| **Min lot size and lot area per unit** | Already reformed (2025-1579, in effect) | No change | | Keep in the **baseline** |
| **EO Phase 1** (Bill 2026-0834, Council hearing 2026-10-13) | UNC 45 ft (60 ft near transit) | UNC 60 ft everywhere. Heights in feet not stories; FAR removed in Euclidean mixed-use districts; residential compatibility setbacks set to 10 ft (abutting or across an alley/Way) or 5 ft (across a street) | UNC, all mixed-use districts, one GT-D block becomes GT-C | Small: UNC mid-rise warn → pass. [EO briefing PDF](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/pc-july-14-2026/eo-phase-1-zoning-amendment-package-briefing-presentation-2026-07-14-updated-v2.pdf), [hearing page](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-October-13th-2026) |

What does **not** flip: the use table rows for duplex, triplex, townhome and multi-unit. Bill 2025-1545 amends only nonresidential rows (community center, commercial parking, indoor recreation, religious assembly, vocational school). **R1D stays single-family-only apart from ADUs.** Missing middle in R1D still needs a rezoning or a use variance. That is worth saying plainly in the demo.

**Demo copy hint.** In R1D and R1A (most of the city's residential land), the reform turns "one house" into "one house + up to 2 ADUs", which is up to 3 homes on a lot, by right.

### 4b. Timeline of 2025-1545
| Date | Event | Source |
|---|---|---|
| 2024-12-10 | Planning Commission hearing on the original package (mandatory citywide IZ + ADUs + parking + lot size) | [EngagePgh ADUs](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/accessory-dwelling-units-adus) |
| 2025-01-28 | PC positive recommendation "with multiple conditions" | [EngagePgh HNA](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment) |
| 2025-05-05/07 | Lot-size piece split out as 2025-1579; **adopted and signed** | [EngagePgh](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size), [Legistar](https://pittsburgh.legistar.com/LegislationDetail.aspx?ID=7248895&GUID=DC74390E-DCCC-41E1-92E2-9923E1E1B5FB) |
| 2025-09-10 | Council public hearing | [City page](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/PC-Agendas/City-Council-Public-Hearing-September-10-2025-at-200-PM) |
| 2025-10 | Council committee debate (Oct 8); amended by substitute **5-4**: mandatory IZ becomes voluntary AHBP; sent back to PC | [Pro-Housing Pittsburgh](https://www.prohousingpgh.org/blog/affordable-housing-bonus-program), [CitizenPortal](https://citizenportal.ai/articles/6753162/Pennsylvania/Allegheny-County/Pittsburgh/Pittsburgh-council-meeting-dominated-by-debate-over-housing-package-inclusionary-zoning) |
| 2026-06-02 | PC unanimous positive recommendation; affordability term cut from 35 to 20 years | [PublicSource](https://www.publicsource.org/affordable-housing-bonus-program-wins-city-planning-approval/), [WESA](https://www.wesanews.org/development-transportation/2026-06-03/pittsburgh-planning-commission-vountary-inclusionary-zoning) |
| 2026-07-24 | Corrected substitute text published | [PDF](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-hearings-or-other/2025-1545-to-be-amended-by-substitute-from-june-2-2026-corrected-july-24-2026_final.pdf) |
| **2026-09-23** | **Council public hearing** | [City page](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026) |
| TBD | Council vote, then Mayor's signature. **No vote found as of 2026-09-26** | [WESA 2026-08-31](https://www.wesanews.org/politics-government/2026-08-31/pittsburgh-city-council-agenda-summer-recess) |

State context: PA **HB 2186** (state ADU enabling bill) passed the House 139-62 in June 2026; the Senate has not acted ([Altoona Mirror, Sept 2026](https://www.altoonamirror.com/news/local-news/2026/09/pittsburgh-targets-housing-woes)). It is not needed for the city reform.

---

## 5. Development Ease Score (DES) rubric proposal

Score from 0 to 100, **per typology** (the site score is the best typology's score, or the selected one's). Each factor gets pass = 1.0, warn = 0.5 or block = 0. `DES = Σ weight × factor`.

**Hard gates:**
- If `zoningFit` is block (not permitted, or P/HC/GI), cap the DES at 20.
- If the parcel is in a floodway, cap at 15.
- If the site is ≥75% steep slope, cap at 30.

These caps apply to that typology only.

| # | Factor | Weight | Pass | Warn | Block | Citation / data source |
|---|---|---|---|---|---|---|
| 1 | **Zoning fit** (use status for the typology) | 30 | by-right (P) or administrator-exception (A) | special-exception (S) or conditional (C); per-plan (SP/PUD) | not permitted (a use variance is needed) | §911.02 ([table](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf)), `zon_new` |
| 2 | **Lot size** vs. district minimum and typology need | 15 | lot ≥ district min **and** ≥ typology heuristic: ADU any; duplex/triplex ≥ min lot; townhome ≥1,200 sf per unit; small MF ≥4,000 sf; mid-rise ≥10,000 sf | within 80–100% of the need (dimensional variance or lot consolidation) | <50% | §903.03 as amended by 2025-1579; lot area from assessments (`LOTAREA`). Typology heuristics are **our assumption** |
| 3 | **Height / capacity** (mid-rise and small MF only; others auto-pass) | 5 | max height ≥55 ft or height-map district | 40–45 ft | — | §903.03, Ch. 904; `midRiseHeightOk()` |
| 4 | **Steep slope** (share of parcel ≥25%) | 12 | <10% | 10–75% (SS-O PC review + geotech) | ≥75% | §906.08, §915.02; `PGHWebSlope25` |
| 5 | **Landslide-prone** | 8 | not in layer | in layer | in layer **and** slope ≥50% | §906.04; `PGHWebLandslideProne` |
| 6 | **Undermined** | 5 | not in layer | in layer | — | §906.05; `PGHWebUndermined` |
| 7 | **Flood** | 10 | zone X / none | 0.2% chance, or A/AE (BFE + 1.5 ft; insurance) | floodway | §906.02; FEMA NFHL / `PGHWebFEMA2014` |
| 8 | **Parking** (baseline only; auto-pass under reform) | 5 | 1–3 units; or parking-exempt district (GT, UC-E, RIV/UC-MU/R-MU at 50%); or lot can plausibly fit 1 space per unit (lot ≥ units × 300 sf beyond the building, a heuristic) | multi-unit on a small lot: needs a §914.11 ZBA special exception | — | §914.02/.04/.11 |
| 9 | **Process triggers** (time) | 5 | none | any one of: Site Plan Review (4+ units, or H district), Project Development Plan (GT/RIV/SP), IZ-O (20+ units), stormwater permit (≥10,000 sf), RCO meeting (new building ≥2,400 sf needing a hearing) | 3 or more triggers | §922.04, §922.10, §907.04; stormwater Title 13 |
| 10 | **Acquisition path** | 5 | privately owned (market) **or** city-owned/Land Bank with no liens | city-owned (needs Council-approved sale) or tax-delinquent (Land Bank ~9 months) | publicly owned park, institution or authority land | WPRDC city-owned parcels; [Finance property sales](https://pittsburghpa.gov/finance/property-sales); [Land Bank](https://pghlandbank.org/) |
| | **Total** | **100** | | | | |

Market / infrastructure proxy: nearby permit activity (count of PLI permits within 400 m in the last 24 months). Show it as **context, not in DES** (it measures demand, not ease). Or give it a 5-pt weight taken from #3 if the team prefers. Label it an assumption.

### 5a. Process friction estimate (show next to DES as "Typical time to permit")

| Path | Typical time (our estimate) | Hard clocks in code | Fees | Source |
|---|---|---|---|---|
| **By right** (1–3 units, no overlays) | **1–3 months** from complete drawings to a building permit. Zoning approval (Record of Zoning Approval, ROZA) plus PLI plan review | none | Zoning review $1 per $1,000 of cost (min $50); PLI building permit fees | Median single-family permit **5 days (Jun 2026), down from 11 (Jan 2026)**; Building & Development Application median 11 days (Jul 2026), down from ~27 (Jul 2025) ([PublicSource 2026-09-23](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/)); [OneStopPGH Insights](https://experience.arcgis.com/experience/89d500285ecd4804ae9945d93d424569) |
| **+ Site Plan Review** (4+ units, H district, NDO/LNC/UNC lots ≥2,400 sf) | +1–3 months | Zoning Administrator decides; if referred to PC, PC has 60 days then the Administrator has 21 days | included | §922.04 |
| **Administrator Exception** | +2–6 weeks | — | $100 | [DCP fee schedule, updated 2026-07-08](https://www.pittsburghpa.gov/Business-Development/City-Planning/Zoning/Planning-Applications-and-Processes/Fee-Schedule) |
| **Special exception / variance (ZBA)** | **3–5 months** | 21-day notice; hearing within 45 days of a complete application; decision within 45 days of the hearing (or of the record closing); RCO meeting at least 30 days before the hearing if the new building is ≥2,400 sf; 30-day appeal window. A missed deadline counts as a **denial** | **$400** + zoning review | [ZBA process guide (Dec 2024)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf); [RCO meeting rules](https://www.pittsburghpa.gov/Business-Development/City-Planning/Planning-Programs/Registered-Community-Organizations/Development-Activities-Meeting) |
| **Use variance** (e.g., duplex in R1D) | 4–6 months and **low odds** (hardship standard) | as above | $400 | same; hardship standard under the PA Municipalities Planning Code |
| **Conditional use / rezoning** | **4–8 months** | PC: hearing within 45 days, recommendation within 45 days; Council: hearing within 45 days, decision within 45 days | $1,350 (PC) | §922.06 (Zoneomics mirror) |
| **Steep Slope Overlay (PC)** | +2–4 months | hearing within 60 days of a complete application; decision within 45 days | $1,350 | §906.08 |
| **Project Development Plan** (GT/RIV) | +2–4 months | PC | $1,350 | §922.10 |
| **Sewage planning module** (multi-unit) | +3–6 months, in parallel | PWSA → ALCOSAN → Council → DEP | — | [PWSA](https://www.pgh2o.com/developers-contractors-vendors/permits/development-permits/dep-sewage-facilities-planning-module) |
| **Buying a city-owned lot** | 6–18 months | Council approves the sale | $25 application; 10% deposit (min $200) | [Finance property sales, updated 2026-09-17](https://pittsburghpa.gov/finance/property-sales); older side-yard handout says title clearing takes up to 18 months |
| **Land Bank (tax-delinquent)** | ~9 months (was ~2 yrs before the Nov 2025 three-taxing-body agreement) | — | ~$3k processing | [WESA 2025-11-20](https://www.wesanews.org/development-transportation/2025-11-20/pittsburgh-taxing-land-bank-blighted-properties) |

Context quote: in Jan 2026 Mayor O'Connor said permits "can take 8 to 9 months", and developers blame repeated review cycles, unclear requirements and fragmented departments ([WESA 2026-01-07](https://www.wesanews.org/politics-government/2026-01-07/pittsburgh-permitting-reform-oconnor); [City announcement, 2026-03-09](https://www.pittsburghpa.gov/News-articles/Homepage/Mayor-O%E2%80%99Connor-Announces-Plans-for-City-Permitting-Process-Reform)). The March 2026 reforms: an "EZ/fast lane" for simple permits, consolidated pre-application meetings, an AI completeness check, virtual inspections, and City-run RCO scheduling.

Suggested machine-readable friction constants (weeks, [low, high]):

```ts
export const FRICTION_WEEKS = {
  "by-right": [4, 12],
  "administrator-exception": [6, 16],
  "special-exception": [12, 22],
  "use-variance": [16, 26], // + low approval odds
  conditional: [18, 34],
  "per-plan": [12, 30],
  add: { sitePlanReview: [4, 12], steepSlopePC: [8, 16], projectDevelopmentPlan: [8, 16], sewageModule: [12, 26], cityLotPurchase: [26, 78] },
} as const; // our estimates from statutory clocks above; label as ASSUMPTION in UI
```

Infrastructure barriers to mention in "What this tool can't tell you":
- PWSA development permit and pre-development meeting are required beyond a single-family tap (application $40; 1-in. service $570; utility letters take up to 30 business days) ([PWSA permits](https://www.pgh2o.com/developers-contractors-vendors/permits)). PWSA eliminated tapping fees in 2022 to help affordable housing ([PWSA 2022](https://www.pgh2o.com/news-events/news/press-release/2022-01-13-pwsas-new-permitting-fees-support-neighborhood-economic)).
- ALCOSAN sewer capacity (via the sewage planning module).
- Stormwater rules (Title 13; a unified code rewrite is in progress: [EngagePgh](https://engage.pittsburghpa.gov/stormwater-code)).
- Allegheny County Health Department plumbing permits are separate from PLI ([ACHD](https://www.alleghenycounty.us/Services/Health-Department/Plumbing-Program/Project-Plans-and-Permitting)).
- Historic district review (Historic Review Commission, $1,350) is **not** in our data.

---

## 6. "Next steps" templates (by status)

Contacts (verify before shipping):
- **DCP Zoning & Development Review:** zoning@pittsburghpa.gov. 412-255-2241 comes from search results, not the official page. DCP main line 412-255-2621, cityplanning@pittsburghpa.gov. [Key contacts](https://www.pittsburghpa.gov/Business-Development/City-Planning/About-DCP/Key-Contacts)
- **ZBA:** zoningboard@pittsburghpa.gov. [ZBA agendas](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-October-8-2026)
- **Planning Commission:** planningcommission@pittsburghpa.gov
- **OneStopPGH** (all zoning and building applications): https://onestoppgh.pittsburghpa.gov/ ([contacts](https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/OneStopPGH/OneStopPGH-Contacts))
- **Fee schedule:** https://www.pittsburghpa.gov/Business-Development/City-Planning/Zoning/Planning-Applications-and-Processes/Fee-Schedule
- **City-owned property sales** (Finance / Real Estate): https://pittsburghpa.gov/finance/property-sales; portal https://public-pgh.epropertyplus.com/landmgmtpub/app/base/landing; 412-255-2300
- **Pittsburgh Land Bank:** https://pghlandbank.org/ ([how to buy](https://pghlandbank.org/how-to-buy-vacant-blighted-or-tax-delinquent-property-in-pittsburgh/))
- **PWSA Developer Services:** permitinfo@pgh2o.com, 412-255-2423 option 4
- **Stormwater permits:** stormwaterpermits@pittsburghpa.gov
- **Zoning map:** https://www.arcgis.com/apps/instant/basic/index.html?appid=1fd0e7b1add245558f236db7ad1290dd
- **Pending reform tracker:** https://engage.pittsburghpa.gov/pittsburghs-zoning-code-amendment-hub

Templates (`{…}` = fill from facts):

- **by-right**: "A {typology} appears to be **allowed by right** in {district} ({districtName}). You shouldn't need a hearing. Next: (1) confirm with DCP Zoning (zoning@pittsburghpa.gov) that the lot meets setbacks and the {minLot} sf minimum lot size; (2) apply for zoning approval and a building permit on OneStopPGH. {if units≥4: 'Projects with 4 or more units also go through Site Plan Review (about 1–3 extra months).'} Typical time: {friction}."
- **administrator-exception**: "{typology} is allowed in {district} with an **Administrator Exception**. The Zoning Administrator decides without a public hearing ($100). Apply on OneStopPGH and talk to DCP Zoning first about the standards in {standardRef}."
- **special-exception**: "{typology} needs a **Special Exception** from the Zoning Board of Adjustment. It is allowed if you meet the listed criteria, and it requires a public hearing. Expect about 3–5 months: 21 days of posted and mailed notice, a hearing within 45 days, and a decision within 45 days. Filing fee $400. If the new building is 2,400 sf or larger, you'll also hold a Registered Community Organization meeting at least 30 days before the hearing. Start with a pre-application meeting with DCP ($250)."
- **conditional**: "{typology} is a **Conditional Use**. The Planning Commission holds a hearing and makes a recommendation, then City Council decides. Expect about 4–8 months. Contact planningcommission@pittsburghpa.gov."
- **not-permitted**: "{typology} is **not permitted** in {district}. Your options: (a) a **use variance** from the ZBA, which requires proving unnecessary hardship and is rarely granted (about 4–6 months, $400); (b) ask your Council member or DCP about a **zoning map amendment** (rezoning, 6+ months); (c) choose a typology that's allowed here: {allowedTypologies}. {if reform flips it: 'If Council passes pending Bill 2025-1545, {typology} would become allowed by right.'}"
- **per-plan (SP / PUD)**: "This parcel is in {district}, a special district with its own approved plan. Uses and heights are set parcel by parcel. Contact DCP Zoning before assuming anything."
- **pending-reform**: "This status assumes **pending** Council Bill 2025-1545 passes. As of {asOf}, it had a public hearing on Sept 23, 2026 but no Council vote. Track it at the EngagePgh zoning amendment hub."
- **overlay add-ons**: "Steep slope (25%+): Planning Commission review under the Steep Slope Overlay plus a geotechnical report (+2–4 months)." / "Landslide-prone: subsurface investigation before occupancy." / "Undermined: submit PA DEP mine data; houses need more than 100 ft of cover or a site study. Consider mine-subsidence insurance." / "Flood zone {zone}: lowest floor at least 1.5 ft above base flood elevation; flood insurance likely required. Floodway: new housing effectively not feasible." / "IZ overlay: 20 or more units must include at least 10% affordable units for 35 years."
- **city-owned lot**: "This lot is **owned by the City**. Apply to buy it through the City's eProperty portal ($25 application; City Council must approve the sale; plan on 6–18 months). {if Land Bank: 'It's held or eligible through the Pittsburgh Land Bank. See pghlandbank.org for its residential program and info sessions.'}"
- **always append**: "This is a simplified reading of the Pittsburgh Zoning Code (Title Nine) as of {asOf}. It is not a zoning determination. Confirm with the Zoning Administrator (zoning@pittsburghpa.gov) before buying or designing."

---

## 7. Known gaps / uncertainty log
- **R1D single-unit attached (townhomes):** P/S vs. not permitted is unresolved. Coded as special-exception, low confidence.
- **RIV-*, UC-MU and R-MU heights:** set by height maps or RIV-specific rules that we did not extract. `maxHeightFt = null` means "verify".
- **CP / SP / OS codes:** CP is assumed to be a PUD district (unverified). SP uses are per district. OS is possibly a legacy code.
- **Setbacks** come from the Dec 2024 draft text, since strike-through formatting was lost in PDF extraction.
- **SS-O mapping:** the code's SS-O overlay may not exactly match the city's 25% slope layer. We treat the ≥25% slope layer as a proxy.
- **Code text** comes from mirrors (elaws, Zoneomics, current through about Ord. 4-2024) plus official city PDFs. ecode360, the official host, blocked automated reads.
- **Bill 2025-1545** could be amended further before the vote. Re-check [Legistar](https://pittsburgh.legistar.com/) and the [EngagePgh hub](https://engage.pittsburghpa.gov/pittsburghs-zoning-code-amendment-hub) before the demo.
- **Friction durations** are our estimates built from statutory clocks. They are not measured outcomes, except the PLI permit medians from PublicSource.
