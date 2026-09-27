import type { ScoreAnswer, ScoreQuestion } from "../system-one";

// Jev's physical site-fit rating: a decision model judges how well a housing
// type fits a lot from facts code has already computed (the model doesn't do
// arithmetic). Legal permission is a separate concern, decided entirely
// client-side from the full 16-type x 57-district DISTRICT_PATHWAYS table
// (apps/web/src/components/map/typology-meta.ts's verdictFor), not here --
// this file used to carry its own simplified 5-district legal gate, but that
// was redundant with (and less complete than) the client's own reading, so it
// was retired in favor of one consolidated verdict/dealkiller system.

// All 16 housing types the bottom typology panel offers (apps/web's
// legal-feasibility.ts TYPOLOGIES), so Jev rates physical fit for every tile,
// not just the five mainstream ones.
export const TYPOLOGIES = [
  {
    id: "detached",
    category: "Single-unit detached",
    label: "House",
    describe: "a single detached house",
  },
  {
    id: "attached",
    category: "Single-unit attached",
    label: "Townhouse",
    describe: "a short row of attached single-family townhouses",
  },
  {
    id: "duplex",
    category: "Two-unit",
    label: "Duplex",
    describe: "a two-unit building",
  },
  {
    id: "three_unit",
    category: "Three-unit",
    label: "Triplex",
    describe: "a three-unit building",
  },
  {
    id: "apartment",
    category: "Multi-unit",
    label: "Apartment",
    describe: "a 3–4 story apartment building with about 12 units",
  },
  {
    id: "elderly",
    category: "Multi-unit",
    label: "Elderly housing",
    describe: "a small apartment building for seniors, about 8–12 units, with an elevator and step-free entry",
  },
  {
    id: "assisted_living_a",
    category: "Assisted living",
    label: "Assisted living (small)",
    describe: "a small assisted-living facility with fewer than 9 residents",
  },
  {
    id: "assisted_living_b",
    category: "Assisted living",
    label: "Assisted living (mid)",
    describe: "a mid-size assisted-living facility with 9 to 17 residents",
  },
  {
    id: "assisted_living_c",
    category: "Assisted living",
    label: "Assisted living (large)",
    describe: "a large assisted-living facility with 18 or more residents",
  },
  {
    id: "personal_care_small",
    category: "Personal care",
    label: "Personal care (small)",
    describe: "a small personal-care residence",
  },
  {
    id: "personal_care_large",
    category: "Personal care",
    label: "Personal care (large)",
    describe: "a large personal-care residence",
  },
  {
    id: "community_home",
    category: "Community home",
    label: "Community home",
    describe: "a community home for a small group of unrelated residents living together as a household",
  },
  {
    id: "multi_suite_limited",
    category: "Multi-suite residential",
    label: "Multi-suite (limited)",
    describe: "a small multi-suite residential building (independent-living suites sharing common areas)",
  },
  {
    id: "multi_suite_general",
    category: "Multi-suite residential",
    label: "Multi-suite (general)",
    describe: "a larger multi-suite residential building (independent-living suites sharing common areas)",
  },
  {
    id: "interim_housing",
    category: "Interim housing",
    label: "Interim housing",
    describe: "interim/transitional housing with shared common areas and on-site support services",
  },
] as const;

export type TypologyId = (typeof TYPOLOGIES)[number]["id"];

const RESIDENTIAL_BASES = ["R1D", "R1A", "R2", "R3", "RM"] as const;
export type ResidentialBase = (typeof RESIDENTIAL_BASES)[number];

// §903.03 minimum lot size by density suffix, post-May-2025 values. Kept here
// (not just in the client) because buildSiteState needs it for Jev's prompt.
const MIN_LOT_SF: Record<string, number | null> = { VL: 6000, L: 3000, M: 2400, H: 1200, VH: null };

export type ZoningInfo = {
  code: string | null;
  base: ResidentialBase | null;
  minLotSf: number | null;
};

export function parseZoning(code: string | null | undefined): ZoningInfo {
  const trimmed = code?.trim().toUpperCase() || null;
  if (!trimmed) return { code: null, base: null, minLotSf: null };
  const [base, density] = trimmed.split("-");
  const isResidential = (RESIDENTIAL_BASES as readonly string[]).includes(base ?? "");
  return {
    code: trimmed,
    base: isResidential ? (base as ResidentialBase) : null,
    minLotSf: isResidential && density ? (MIN_LOT_SF[density] ?? null) : null,
  };
}

export type LotFacts = {
  areaSf: number | null;
  widthFt: number | null;
  depthFt: number | null;
};

export type HazardShares = Partial<
  Record<"floodway" | "floodplain" | "steepSlope" | "landslideProne" | "undermined", number | null>
>;

const HAZARD_LABELS: Record<keyof HazardShares, string> = {
  floodway: "in the FEMA regulatory floodway",
  floodplain: "in the 100-year floodplain",
  steepSlope: "at 25%+ slope",
  landslideProne: "in a landslide-prone area",
  undermined: "over mapped mines",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** Plain-language facts for the model. All arithmetic happens here, not in the model. */
export function buildSiteState(lot: LotFacts, zoning: ZoningInfo, hazards: HazardShares) {
  const shape =
    lot.widthFt !== null && lot.depthFt !== null
      ? ` Roughly ${fmt(lot.widthFt)} ft wide by ${fmt(lot.depthFt)} ft deep (bounding rectangle).`
      : "";
  const lotText = lot.areaSf !== null ? `Lot area ${fmt(lot.areaSf)} sq ft.${shape}` : "Lot size unknown.";

  const minimum =
    zoning.minLotSf !== null && lot.areaSf !== null
      ? ` District minimum lot size ${fmt(zoning.minLotSf)} sq ft; this lot is ${lot.areaSf >= zoning.minLotSf ? "at or above" : "below"} it.`
      : "";
  const zoningText = zoning.code ? `Zoned ${zoning.code}.${minimum}` : "Zoning unknown.";

  const hazardParts = (Object.keys(HAZARD_LABELS) as (keyof HazardShares)[])
    .map((key) => {
      const share = hazards[key];
      return share != null && share >= 0.01 ? `${Math.round(share * 100)}% of the lot is ${HAZARD_LABELS[key]}` : null;
    })
    .filter((part): part is string => part !== null);
  const hazardsText = hazardParts.length
    ? `${hazardParts.join("; ")}.`
    : "No mapped floodway, floodplain, steep slope, landslide-prone area or undermining on this lot.";

  return { lot: lotText, zoning: zoningText, hazards: hazardsText };
}

export const SITE_FIT_LEVELS = [
  "Cannot fit",
  "Fits only with major compromises",
  "Fits with minor compromises",
  "Comfortable fit",
] as const;

// Extra calibration nudge, appended only for typologies whose ratings ran
// harsher than warranted. "detached" is the least space/design-demanding of
// the five (no shared walls, no elevator/step-free requirements, smallest
// realistic footprint) -- most ordinary lots fit one, so it should take a
// real disqualifier (genuinely tiny, oddly-shaped, or hazard-heavy) to rate
// it below "Comfortable fit", not just "isn't a large lot".
const CALIBRATION_HINT: Partial<Record<TypologyId, string>> = {
  detached: " This is the least demanding of the five typologies; don't rate it down just for being an ordinary-sized lot -- reserve low ratings for lots that are genuinely small, oddly shaped, or hazard-heavy.",
};

export function siteFitQuestion(typology: TypologyId): ScoreQuestion {
  const { describe } = TYPOLOGIES.find((t) => t.id === typology)!;
  return {
    type: "score",
    instructions: `How well can ${describe} physically fit on the parcel described by \`lot\` and \`hazards\`? Judge physical fit only from those two facts; legality is checked separately.${CALIBRATION_HINT[typology] ?? ""}`,
    criteria: SITE_FIT_LEVELS,
  };
}

/** Below this confidence a rating is shown but flagged for human review. Tuned on real answers (~0.3–0.55 observed). */
export const REVIEW_CONFIDENCE = 0.3;

// "detached" ratings are the ones that should least often need a human
// second-guess (see CALIBRATION_HINT); a lower bar means fewer of its
// borderline-but-reasonable calls get an unnecessary "needs review" flag.
const REVIEW_CONFIDENCE_OVERRIDE: Partial<Record<TypologyId, number>> = {
  detached: 0.2,
};

export type SiteFit = {
  /** 0–1, probability-weighted position on the rubric. */
  fit: number;
  label: string;
  probabilities: number[];
  confidence: number;
  needsReview: boolean;
};

export function toSiteFit(answer: ScoreAnswer, typology: TypologyId): SiteFit {
  const threshold = REVIEW_CONFIDENCE_OVERRIDE[typology] ?? REVIEW_CONFIDENCE;
  return {
    fit: answer.normalized,
    label: answer.label,
    probabilities: answer.probabilities,
    confidence: answer.confidence,
    needsReview: answer.confidence < threshold,
  };
}
