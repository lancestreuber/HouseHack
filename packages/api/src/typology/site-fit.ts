import type { ScoreAnswer, ScoreQuestion } from "../system-one";

// Which housing types could go on a parcel, in two separate layers:
//   1. a legal gate, decided in code from the zoning use table (never by a model);
//   2. a physical site-fit rating, decided by the System One model from lot facts
//      that code has already computed (the model doesn't do arithmetic).
// Zoning rules are a simplified transcription for residential districts only.
// Anything else is "unknown", never guessed.

// All 16 housing types the bottom typology panel offers (apps/web's
// legal-feasibility.ts TYPOLOGIES), so Jev rates physical fit for every tile,
// not just the five mainstream ones. Legal permission (the gate below) is
// only actually modeled for those five, though -- see MODELED_LEGAL_TYPOLOGIES.
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

// Legal permission is only actually transcribed from the zoning use table
// for these five (see USE_TABLE). The rest get a physical site-fit rating
// from Jev like everyone else, but their gate is honestly "unknown" here --
// this simplified backend doesn't encode §911.02/§911.04's rules for
// assisted living, personal care, community homes, multi-suite or interim
// housing. The bottom panel's own big tile number, from the full 16-type ×
// 57-district DISTRICT_PATHWAYS table, still shows the real legal reading.
const MODELED_LEGAL_TYPOLOGIES = new Set<TypologyId>(["detached", "attached", "duplex", "apartment", "elderly"]);

export type GateStatus = "allowed" | "conditional" | "not_permitted" | "unknown";
export type Gate = {
  status: GateStatus;
  reason: string;
  /** Districts that *would* permit this typology (by right or Special
   * Exception), so a "not_permitted" gate isn't just a dead end -- it's a
   * fact about the current zoning, not the parcel's physical potential. */
  rezoningTo?: ResidentialBase[];
  /** True when the status/reason above reflects a hazard override (mapped
   * mines blocking multi-unit) rather than zoning alone. The verdict below
   * treats this as a hard blocker, not an ordinary "needs a variance" case. */
  hazardBlocked?: boolean;
};

const RESIDENTIAL_BASES = ["R1D", "R1A", "R2", "R3", "RM"] as const;
export type ResidentialBase = (typeof RESIDENTIAL_BASES)[number];

function basesAllowing(typology: TypologyId): ResidentialBase[] {
  const table = USE_TABLE[typology];
  return table ? RESIDENTIAL_BASES.filter((base) => table[base] !== "-") : [];
}

// 2023-26 Zoning Board relief approval rate by base district ("ALL" cases),
// snapshotted from apps/web's ZBA_OUTCOMES (legal-matrix.generated.ts) --
// this file can't import that frontend-only generated data directly, and
// it's only these 5 bases' aggregate rates that this simpler use table
// needs. An approximation (relief broadly, not the exact rezoning/map-
// amendment rate), same caveat as the bottom typology panel's own version.
const ZBA_APPROVAL_RATE: Partial<Record<ResidentialBase, number>> = {
  R1D: 87 / 101,
  R1A: 74 / 83,
  R2: 46 / 62,
  RM: 30 / 31,
  // R3: no local ZBA case data; falls back to the neutral estimate below.
};
const NEUTRAL_APPROVAL_RATE = 0.7;

/** 0.5 if an adjacent district on the density ladder (RESIDENTIAL_BASES'
 * order) permits this typology, 0.2 if only a non-adjacent one does. This
 * table has no density-suffix variants (unlike DISTRICT_PATHWAYS' full zon_new
 * codes), so there's no "same family" 1.0 case here. */
function rezoningCloseness(typology: TypologyId, base: ResidentialBase): number {
  const currentRank = RESIDENTIAL_BASES.indexOf(base);
  let best = 0;
  for (const allowed of basesAllowing(typology)) {
    const rank = RESIDENTIAL_BASES.indexOf(allowed);
    best = Math.max(best, Math.abs(rank - currentRank) === 1 ? 0.5 : 0.2);
  }
  return best;
}

function rezoningLikelihood(base: ResidentialBase): number {
  return ZBA_APPROVAL_RATE[base] ?? NEUTRAL_APPROVAL_RATE;
}

// §911.02 use table, residential columns (read on eCode360, 2026-09-26).
// P = permitted by right, S = special exception, - = not permitted.
// Elderly: "Housing for the Elderly (Limited)" is S in every residential district;
// "(General)" is S only in R3 and RM (§911.04A.35).
const USE_TABLE: Partial<Record<TypologyId, Record<ResidentialBase, "P" | "S" | "-">>> = {
  detached: { R1D: "P", R1A: "P", R2: "P", R3: "P", RM: "P" },
  attached: { R1D: "S", R1A: "P", R2: "P", R3: "P", RM: "P" },
  duplex: { R1D: "-", R1A: "-", R2: "P", R3: "P", RM: "P" },
  apartment: { R1D: "-", R1A: "-", R2: "-", R3: "-", RM: "P" },
  elderly: { R1D: "S", R1A: "S", R2: "S", R3: "S", RM: "S" },
};

function useReason(typology: TypologyId, base: ResidentialBase): string {
  if (typology !== "elderly") return `in ${base} districts (§911.02)`;
  const form = base === "R3" || base === "RM" ? "Limited or General" : "Limited only";
  return `in ${base} districts as Housing for the Elderly (${form}) (§911.02, §911.04A.35)`;
}

// §903.03 minimum lot size by density suffix, post-May-2025 values.
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

// Multi-unit typologies whose construction over mapped mines the Pittsburgh
// Code's UM-O overlay blocks pending a mine-subsidence investigation,
// independent of what the zoning use table otherwise allows. Detached and
// attached single-unit housing aren't blocked this way. SME feedback
// (2026-09-27, #housing-sme-help) called undermining an "up-front deal
// killer" -- this is that, made a real gate instead of a flag that a
// weighted average can wash out.
const MULTI_UNIT_TYPOLOGIES = new Set<TypologyId>(["duplex", "apartment", "elderly"]);

// Share of the lot treated as "materially undermined", matching the Site
// pillar's own "half or more of the lot" framing (pillars.config.json).
const UNDERMINED_BLOCK_SHARE = 0.49;

function baseGateFor(typology: TypologyId, zoning: ZoningInfo, lotAreaSf: number | null): Gate {
  if (!zoning.base) {
    return {
      status: "unknown",
      reason: zoning.code
        ? `Rules for ${zoning.code} aren't encoded in this tool; check the zoning code.`
        : "Zoning district unknown for this parcel.",
    };
  }

  if (!MODELED_LEGAL_TYPOLOGIES.has(typology)) {
    return {
      status: "unknown",
      reason:
        "Legal permission for this housing type isn't modeled in this simplified backend (it only covers detached, attached, duplex, apartment and elderly housing); see the typology tile's pathway score for the full reading.",
    };
  }

  const use = USE_TABLE[typology]![zoning.base];
  if (use === "-") {
    const rezoningTo = basesAllowing(typology);
    const rezoningNote = rezoningTo.length
      ? ` Would need rezoning to ${rezoningTo.join(", ")} to allow it. Rezoning closeness ${Math.round(rezoningCloseness(typology, zoning.base) * 100)}%, district relief approval rate ${Math.round(rezoningLikelihood(zoning.base) * 100)}%.`
      : "";
    return {
      status: "not_permitted",
      reason: `Not permitted ${useReason(typology, zoning.base)}.${rezoningNote}`,
      rezoningTo,
    };
  }

  const undersized = zoning.minLotSf !== null && lotAreaSf !== null && lotAreaSf < zoning.minLotSf;
  if (undersized) {
    const path =
      typology === "detached"
        ? "one house may be allowed by Administrator Exception if the lot is in separate ownership (§921.04)"
        : "needs a Special Exception from the Zoning Board of Adjustment (§921.04)";
    return {
      status: "conditional",
      reason: `Lot is below the ${zoning.minLotSf?.toLocaleString("en-US")} sq ft district minimum; ${path}.`,
    };
  }

  if (use === "S") {
    return { status: "conditional", reason: `Needs a Special Exception ${useReason(typology, zoning.base)}.` };
  }
  return { status: "allowed", reason: `Permitted by right ${useReason(typology, zoning.base)}.` };
}

export function gateFor(typology: TypologyId, zoning: ZoningInfo, lotAreaSf: number | null, hazards?: HazardShares): Gate {
  const base = baseGateFor(typology, zoning, lotAreaSf);
  const undermined = hazards?.undermined ?? null;
  if (base.status !== "not_permitted" && MULTI_UNIT_TYPOLOGIES.has(typology) && undermined != null && undermined >= UNDERMINED_BLOCK_SHARE) {
    return {
      ...base,
      status: "conditional",
      reason: `${Math.round(undermined * 100)}% of the lot is over mapped mines: multi-unit housing needs a mine-subsidence investigation before it can be permitted here (independent of zoning). ${base.reason}`,
      hazardBlocked: true,
    };
  }
  return base;
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

// Mirrors apps/web/src/lib/pillars/pillars.config.json's pillar ids/labels.
// Duplicated rather than imported: that config is a frontend-only artifact,
// and these five short labels are presentation text, not shared business logic.
const PILLAR_LABELS: Record<string, string> = {
  demand: "Demand",
  site: "Site Feasibility",
  afford: "Affordability & Displacement",
  access: "Access to Opportunity",
  climate: "Climate & Environment",
};

/** The person's pillar weights from the navbar Weights popover, 0-3 (1 =
 * published default). Only present pillars are considered; absent ones are
 * assumed to be at their default. */
export type PillarWeights = Record<string, number>;

/** Plain-language note about which pillars the evaluator is weighing above or
 * below the published default, or null if everyone's at (or near) default --
 * nothing to say. */
function describeWeights(weights: PillarWeights | undefined): string | null {
  if (!weights) return null;
  const parts = Object.entries(weights)
    .filter(([, w]) => Math.abs(w - 1) >= 0.01)
    .map(([id, w]) => {
      const label = PILLAR_LABELS[id] ?? id;
      if (w <= 0) return `${label} (ignored entirely)`;
      const times = (w / 1).toFixed(w % 1 === 0 ? 0 : 2);
      return w > 1 ? `${label} ${times}x normal` : `${label} only ${times}x normal (de-emphasized)`;
    });
  return parts.length ? parts.join("; ") : null;
}

/** Plain-language facts for the model. All arithmetic happens here, not in the model. */
export function buildSiteState(lot: LotFacts, zoning: ZoningInfo, hazards: HazardShares, weights?: PillarWeights) {
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

  const weightsNote = describeWeights(weights);

  return {
    lot: lotText,
    zoning: zoningText,
    hazards: hazardsText,
    ...(weightsNote ? { weights: `The person evaluating this parcel weighs: ${weightsNote}.` } : {}),
  };
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
    instructions: `How well can ${describe} physically fit on the parcel described by \`lot\` and \`hazards\`? Judge physical fit primarily from those two facts; legality is checked separately. If \`weights\` is present, it's the evaluator's stated priorities -- let it nudge a genuinely borderline rating in that direction (e.g. someone weighing Climate heavily should see a mild penalty for tight, low-canopy lots reflected in a marginal case), but never let it override real physical constraints like lot size or hazard exposure.${CALIBRATION_HINT[typology] ?? ""}`,
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

// --- Order-of-magnitude construction cost (informational, not a pro forma) -

// Hard construction cost per sq ft, excluding site work. Practitioner ranges
// from hackathon housing SMEs (#housing-sme-help, 2026-09-27): $150/sf for a
// high-volume production builder, $200-250/sf for typical City single-family
// infill, $325-375/sf from a practitioner who noted no reliable local public
// source exists. The SMEs' own ranges differ by more than 2x, so this is
// shown as a range, not a point estimate -- it's opinion, not a published
// source (see limitations.md).
const COST_PER_SF = { low: 150, high: 375 };

// Site work per unit in the City (water/sewer taps, grading, sidewalks,
// landscaping): SME estimate, same source.
const SITE_COST_PER_UNIT = { low: 25_000, high: 50_000 };

// Typical unit count and size per typology. No public source: planning
// assumptions for an order-of-magnitude estimate, not measured units.
const UNIT_ASSUMPTIONS: Record<TypologyId, { units: number; sqftPerUnit: number }> = {
  detached: { units: 1, sqftPerUnit: 1400 },
  attached: { units: 1, sqftPerUnit: 1200 },
  duplex: { units: 2, sqftPerUnit: 1000 },
  three_unit: { units: 3, sqftPerUnit: 900 },
  apartment: { units: 12, sqftPerUnit: 700 },
  elderly: { units: 10, sqftPerUnit: 600 },
  assisted_living_a: { units: 8, sqftPerUnit: 400 },
  assisted_living_b: { units: 15, sqftPerUnit: 400 },
  assisted_living_c: { units: 24, sqftPerUnit: 400 },
  personal_care_small: { units: 6, sqftPerUnit: 400 },
  personal_care_large: { units: 20, sqftPerUnit: 400 },
  community_home: { units: 6, sqftPerUnit: 500 },
  multi_suite_limited: { units: 6, sqftPerUnit: 500 },
  multi_suite_general: { units: 15, sqftPerUnit: 500 },
  interim_housing: { units: 10, sqftPerUnit: 350 },
};

export type CostEstimate = { low: number; high: number; units: number };

/** Order-of-magnitude hard + site construction cost for this typology.
 * Excludes soft costs, financing, land and demolition -- see limitations.md.
 * Not compared against revenue: no rent/sale comps are joined to parcels
 * (see verdictFor's market-tier proxy for the closest thing this tool has). */
export function estimateCost(typology: TypologyId): CostEstimate {
  const { units, sqftPerUnit } = UNIT_ASSUMPTIONS[typology];
  const totalSqft = units * sqftPerUnit;
  return {
    low: totalSqft * COST_PER_SF.low + units * SITE_COST_PER_UNIT.low,
    high: totalSqft * COST_PER_SF.high + units * SITE_COST_PER_UNIT.high,
    units,
  };
}

// --- Verdict: can this actually be built? -----------------------------------

export type VerdictLevel = "red" | "yellow" | "green" | "unknown";
export type Verdict = { level: VerdictLevel; reasons: string[] };

// Half or more of the lot in a hazard area is treated as material added
// cost/risk (steep slope, landslide-prone, 100-yr floodplain). The FEMA
// regulatory floodway is checked on its own below since it's more severe:
// construction there is federally restricted, not just costlier.
const HAZARD_SEVERE_SHARE = 0.5;

// MVA category (10 = strongest market, A, down to 1 = most distressed, J).
// At or below this tier, treat the market as weak enough that construction
// cost may exceed what the area supports without a subsidy.
const WEAK_MARKET_TIER = 3;

/** A simple, transparent verdict for one typology on one parcel: can this be
 * built? Computed from gates, hazards and physical site fit -- never from
 * the weighted pillar score, so a deal-killer can't be averaged away (SME
 * feedback, 2026-09-27: "undermining and environmental conditions can be
 * up-front deal killers"). The market-tier check is a proxy signal, not a
 * modeled cost-vs-revenue comparison: no rent or sale comps are joined to
 * parcels in this tool (see limitations.md). */
export function verdictFor(
  typology: TypologyId,
  gate: Gate,
  fit: SiteFit | null,
  hazards: HazardShares | undefined,
  marketTier: number | null | undefined,
): Verdict {
  if (gate.status === "unknown") return { level: "unknown", reasons: [gate.reason] };
  if (gate.hazardBlocked) return { level: "red", reasons: [gate.reason] };
  if (gate.status === "not_permitted") return { level: gate.rezoningTo?.length ? "yellow" : "red", reasons: [gate.reason] };

  const reasons: string[] = [];
  if (gate.status === "conditional") reasons.push(gate.reason);

  const floodway = hazards?.floodway ?? 0;
  if (floodway >= HAZARD_SEVERE_SHARE) {
    reasons.push(`${Math.round(floodway * 100)}% of the lot is in the FEMA regulatory floodway.`);
    return { level: "red", reasons };
  }

  if (fit && fit.fit < 0.25) {
    reasons.push(`Site fit: ${fit.label.toLowerCase()}.`);
    return { level: "red", reasons };
  }

  const severeHazard = (["floodplain", "steepSlope", "landslideProne"] as const).find((key) => (hazards?.[key] ?? 0) >= HAZARD_SEVERE_SHARE);
  if (severeHazard) reasons.push(`Half or more of the lot is ${HAZARD_LABELS[severeHazard]}: expect added engineering/geotechnical cost.`);

  if (fit && fit.fit < 0.5) {
    reasons.push(`Site fit: ${fit.label.toLowerCase()}${fit.needsReview ? " (low-confidence rating)" : ""}.`);
  } else if (fit?.needsReview) {
    reasons.push("Site-fit rating has low confidence, needs human review.");
  }

  // Skip for a single detached house: it's the cheapest and least-demanding
  // of the five typologies (see CALIBRATION_HINT), so a weak market alone
  // isn't the same red flag it is for costlier multi-unit construction.
  if (typology !== "detached" && marketTier != null && marketTier <= WEAK_MARKET_TIER) {
    reasons.push(
      "Market Value Analysis category is among the most distressed in the county (proxy signal, not a modeled cost-vs-rent comparison): construction here may need a subsidy to pencil.",
    );
  }

  if (reasons.length > 0) return { level: "yellow", reasons };
  return { level: "green", reasons: ["By right, no hazard flags, no weak-fit or weak-market signal."] };
}
