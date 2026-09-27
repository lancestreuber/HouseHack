import type { ScoreAnswer, ScoreQuestion } from "../system-one";

// Which housing types could go on a parcel, in two separate layers:
//   1. a legal gate, decided in code from the zoning use table (never by a model);
//   2. a physical site-fit rating, decided by the System One model from lot facts
//      that code has already computed (the model doesn't do arithmetic).
// Zoning rules are a simplified transcription for residential districts only.
// Anything else is "unknown", never guessed.

// The four use-table categories we rank. Multi-unit has two rows because its
// two forms have different legal paths (apartments by right only in RM; housing
// for the elderly by Special Exception) and different physical needs.
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
] as const;

export type TypologyId = (typeof TYPOLOGIES)[number]["id"];

export type GateStatus = "allowed" | "conditional" | "not_permitted" | "unknown";
export type Gate = { status: GateStatus; reason: string };

const RESIDENTIAL_BASES = ["R1D", "R1A", "R2", "R3", "RM"] as const;
type ResidentialBase = (typeof RESIDENTIAL_BASES)[number];

// §911.02 use table, residential columns (read on eCode360, 2026-09-26).
// P = permitted by right, S = special exception, - = not permitted.
// Elderly: "Housing for the Elderly (Limited)" is S in every residential district;
// "(General)" is S only in R3 and RM (§911.04A.35).
const USE_TABLE: Record<TypologyId, Record<ResidentialBase, "P" | "S" | "-">> = {
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

export function gateFor(typology: TypologyId, zoning: ZoningInfo, lotAreaSf: number | null): Gate {
  if (!zoning.base) {
    return {
      status: "unknown",
      reason: zoning.code
        ? `Rules for ${zoning.code} aren't encoded in this tool; check the zoning code.`
        : "Zoning district unknown for this parcel.",
    };
  }

  const use = USE_TABLE[typology][zoning.base];
  if (use === "-") {
    return { status: "not_permitted", reason: `Not permitted ${useReason(typology, zoning.base)}.` };
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

export function siteFitQuestion(typology: TypologyId): ScoreQuestion {
  const { describe } = TYPOLOGIES.find((t) => t.id === typology)!;
  return {
    type: "score",
    instructions: `How well can ${describe} physically fit on the parcel described by \`lot\` and \`hazards\`? Judge physical fit only (size, shape, hazards); legality is checked separately.`,
    criteria: SITE_FIT_LEVELS,
  };
}

/** Below this confidence a rating is shown but flagged for human review. Tuned on real answers (~0.3–0.55 observed). */
export const REVIEW_CONFIDENCE = 0.3;

export type SiteFit = {
  /** 0–1, probability-weighted position on the rubric. */
  fit: number;
  label: string;
  probabilities: number[];
  confidence: number;
  needsReview: boolean;
};

export function toSiteFit(answer: ScoreAnswer): SiteFit {
  return {
    fit: answer.normalized,
    label: answer.label,
    probabilities: answer.probabilities,
    confidence: answer.confidence,
    needsReview: answer.confidence < REVIEW_CONFIDENCE,
  };
}
