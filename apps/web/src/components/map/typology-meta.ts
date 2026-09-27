import type { IndicatorValues } from "@/lib/pillars/score";
import { typologyVerdict, type Verdict } from "@/lib/pillars/verdict";

import { DISTRICT_PATHWAYS, ZBA_OUTCOMES } from "./overlays/legal-matrix.generated";

// Density-ordered residential bases (same ordering used in the site-fit use
// table): only used to judge how big a stretch a rezoning would be, never
// to decide permission itself -- that's DISTRICT_PATHWAYS' job.
const BASE_ORDER = ["R1D", "R1A", "R2", "R3", "RM"];
const baseOf = (zone: string) => zone.split("-")[0] ?? zone;
const PERMITTING_PATHWAYS = new Set(["by_right", "za", "conditional_use", "zbe_special_exception"]);

/** 1 = another district in the same zoning family (e.g. just a density-suffix
 * change) permits this typology; 0.5 = a one-step-away district on the
 * density ladder does; 0.2 = only a distant/unrelated district does;
 * 0 = no district anywhere permits it (not a realistic rezoning ask). */
export function rezoningCloseness(zone: string, typologyId: string): number {
  const currentBase = baseOf(zone);
  const currentRank = BASE_ORDER.indexOf(currentBase);
  let best = 0;
  for (const [otherZone, pathways] of Object.entries(DISTRICT_PATHWAYS)) {
    if (!PERMITTING_PATHWAYS.has(pathways[typologyId] ?? "")) continue;
    const otherBase = baseOf(otherZone);
    if (otherBase === currentBase) return 1;
    const otherRank = BASE_ORDER.indexOf(otherBase);
    const closeness = currentRank === -1 || otherRank === -1 ? 0.2 : Math.abs(otherRank - currentRank) === 1 ? 0.5 : 0.2;
    best = Math.max(best, closeness);
  }
  return best;
}

/** Approval rate for Zoning Board relief (any type) in this district,
 * 2023-26 -- an approximation of "how this district treats requests to build
 * something the code doesn't otherwise allow here", not the exact rezoning
 * (map-amendment) approval rate specifically. Falls back to a neutral
 * estimate where there's no local ZBA data at all. */
export function rezoningLikelihood(zone: string): number {
  const outcomes = ZBA_OUTCOMES[baseOf(zone)]?.ALL;
  if (!outcomes || outcomes.n === 0) return 0.7;
  return outcomes.approved / outcomes.n;
}

// This panel's 16 legal-feasibility typologies are far more granular than
// Jev's 5 site-fit categories; only map where there's a genuinely close
// correspondence, so we're never implying false precision for the rest
// (three_unit, community_home, interim_housing, etc. just show no fit line).
export const SITE_FIT_TYPOLOGY: Record<string, string> = {
  single_detached: "detached",
  single_attached: "attached",
  two_unit: "duplex",
  multi_unit: "apartment",
  elderly_limited: "elderly",
  elderly_general: "elderly",
};

// Short, plain-English names for the dropdown/tile face -- TYPOLOGIES'
// own labels (legal-feasibility.ts) are the full, precise zoning-code
// descriptions ("Multi-unit apartments (4+)"), which reads fine inside the
// dropdown's option list but is too long to be *the* name on a narrow tile.
export const SHORT_LABEL: Record<string, string> = {
  single_detached: "House",
  single_attached: "Rowhouse",
  two_unit: "Duplex",
  three_unit: "Triplex",
  multi_unit: "Apartments",
  elderly_limited: "Elderly housing (limited)",
  elderly_general: "Elderly housing (general)",
  assisted_living_a: "Assisted living (small)",
  assisted_living_b: "Assisted living (mid)",
  assisted_living_c: "Assisted living (large)",
  personal_care_small: "Personal care (small)",
  personal_care_large: "Personal care (large)",
  community_home: "Community home",
  multi_suite_limited: "Multi-suite (limited)",
  multi_suite_general: "Multi-suite (general)",
  interim_housing: "Interim housing",
};

/** The pillars config's legal level id for one housing type in this district, so
 * the overall score's zoning factor can follow that type instead of the easiest
 * of the five. `parcelLegalCode` is the parcel's precomputed site_legal_pathway,
 * which carries the district-border and hillside cases. */
export function legalLevelFor(zoning: string, typologyId: string, parcelLegalCode: number | null | undefined): string {
  const pathway = DISTRICT_PATHWAYS[zoning]?.[typologyId] ?? "unknown";
  if (pathway === "za" && parcelLegalCode === 9) return "za_hillside";
  if (pathway === "not_permitted" && parcelLegalCode === 4) return "not_permitted_border";
  return pathway;
}

export type FitsById = Record<string, { fit: number; label: string; confidence: number; needsReview: boolean } | null>;

/** The red / yellow / green verdict for one typology on one parcel. */
export function verdictFor(zoning: string, typologyId: string, values: IndicatorValues, fitsById?: FitsById, lotWidthFt?: number | null): Verdict {
  const siteFitId = SITE_FIT_TYPOLOGY[typologyId];
  return typologyVerdict({
    typology: typologyId,
    pathway: DISTRICT_PATHWAYS[zoning]?.[typologyId],
    rezoningCloseness: rezoningCloseness(zoning, typologyId),
    values,
    fit: siteFitId ? fitsById?.[siteFitId] : undefined,
    zoning,
    lotWidthFt,
  });
}
