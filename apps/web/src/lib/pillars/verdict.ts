// "Can this housing type be built here?" as red / yellow / green, from
// pass/fail checks only (zoning pathway, site hazards, availability, lot size,
// physical fit). Never derived from the weighted pillar score, so a good
// neighborhood can't average away a floodway. Thresholds and wording live in
// pillars.config.json under `verdict`.

import config from "./pillars.config.json";
import type { IndicatorValues } from "./score";

export type VerdictLevel = "red" | "yellow" | "green" | "unknown";
export type VerdictReason = { level: VerdictLevel; text: string };
export type Verdict = { level: VerdictLevel; label: string; reasons: VerdictReason[] };
export type SiteFit = { fit: number; label: string; needsReview: boolean };

export type VerdictInput = {
  typology: string;
  /** DISTRICT_PATHWAYS[zoning][typology]; undefined when the district isn't in the matrix. */
  pathway: string | undefined;
  /** 0–1: how close a district that permits this typology is (typology panel's rezoningCloseness). */
  rezoningCloseness?: number;
  /** Normalized indicator values (0–100, 100 = no hazard), as in the parcel shards. */
  values: IndicatorValues;
  /** Physical site-fit rating, when one exists for this typology. */
  fit?: SiteFit | null;
};

const V = config.verdict;
const RANK: Record<VerdictLevel, number> = { green: 0, unknown: 1, yellow: 2, red: 3 };

export const VERDICT_LABEL = V.levels as Record<VerdictLevel, string>;
export const VERDICT_COLOR: Record<VerdictLevel, string> = {
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e",
  unknown: "#737373",
};

// Share of the lot (0–1) from a linear "share" indicator normalized 1 → 0, 0 → 100.
function share(values: IndicatorValues, id: string): number | null {
  const v = values[id];
  return v == null ? null : (100 - v) / 100;
}

function legalReason(pathway: string | undefined, closeness: number | undefined): VerdictReason {
  switch (pathway) {
    case "by_right":
      return { level: "green", text: "Allowed by right" };
    case "za":
      return { level: "green", text: "Allowed with Zoning Administrator approval (no hearing)" };
    case "zbe_special_exception":
      return { level: "yellow", text: "Needs a Zoning Board special exception (public hearing)" };
    case "conditional_use":
      return { level: "yellow", text: "Needs conditional use: Planning Commission and City Council" };
    case "not_permitted":
      return (closeness ?? 0) >= V.rezoning_yellow_closeness
        ? { level: "yellow", text: "Not permitted today, but a nearby-density district allows it: needs a rezoning or use variance" }
        : { level: "red", text: "Not permitted: needs a rezoning or use variance, and no similar district allows it" };
    case "per_plan":
      return { level: "unknown", text: "Planned district: depends on the site's approved plan" };
    case "not_city_jurisdiction":
      return { level: "unknown", text: "Outside City zoning (Mount Oliver Borough)" };
    default:
      return { level: "unknown", text: "Zoning district not in our use table: verify with the Zoning Administrator" };
  }
}

function availabilityReason(code: number | null | undefined): VerdictReason | null {
  const level = config.availability.levels.find((l) => l.code === code);
  if (!level) return null;
  if (level.multiplier <= 0.1) return { level: "red", text: level.label };
  if (level.id === "condo_unit") return { level: "yellow", text: "Condo unit: building here means redeveloping the whole building lot" };
  if (level.id === "large_occupied" || level.id === "institution") return { level: "yellow", text: `${level.label}: rarely released for new housing` };
  return null;
}

function hazardReasons(values: IndicatorValues, typology: string): VerdictReason[] {
  const s = V.share;
  const out: VerdictReason[] = [];
  const floodway = share(values, "site_floodway_share");
  if (floodway != null && floodway >= s.floodway_red) out.push({ level: "red", text: "Half or more of the lot is in the FEMA floodway: effectively no-build" });
  else if (floodway != null && floodway > 0) out.push({ level: "yellow", text: "Part of the lot is in the FEMA floodway: build only outside it" });

  const floodplain = share(values, "site_sfha_share");
  if (floodplain != null && floodplain >= s.floodplain_yellow)
    out.push({ level: "yellow", text: "Mostly in the 100-year floodplain: floodplain overlay rules and flood-proofing cost" });

  const steep = share(values, "site_steep_slope_share");
  if (steep != null && steep >= s.steep_yellow) out.push({ level: "yellow", text: "Mostly 25%+ slope: added site cost and steep-slope overlay review" });

  const landslide = share(values, "site_landslide_prone_share");
  if (landslide != null && landslide >= s.landslide_yellow) out.push({ level: "yellow", text: "Landslide-prone: geotechnical study required" });

  const recentSlide = share(values, "site_recent_landslide_share");
  if (recentSlide != null && recentSlide > 0) out.push({ level: "yellow", text: "Near a recent landslide" });

  const undermined = share(values, "site_undermined_share");
  if (undermined != null && undermined >= s.undermined_yellow) {
    // Yellow, not red: the mine layer has no depth of cover, and the code requires
    // an investigation rather than banning building (about 30% of City parcels).
    out.push(
      V.single_house_typologies.includes(typology)
        ? { level: "yellow", text: "Over mapped mines: a single house needs 100+ ft of cover and no subsidence history (§906.05)" }
        : { level: "yellow", text: "Over mapped mines: prohibited until a mine investigation clears it (§906.05); can kill a deal up front" },
    );
  }

  const lot = values.site_lot_area;
  if (lot != null && lot < 100 && values.site_parcel_use !== 3) out.push({ level: "red", text: "Sliver lot under 600 sq ft" });
  return out;
}

function fitReason(fit: SiteFit | null | undefined): VerdictReason | null {
  if (!fit) return null;
  if (fit.label === "Cannot fit") return { level: "red", text: "Doesn't physically fit on this lot (model rating from lot size and shape)" };
  if (fit.fit < V.fit_yellow_below) return { level: "yellow", text: `Tight fit: ${fit.label.toLowerCase()} (model rating)` };
  return null;
}

// The worst reason decides: red > yellow > unknown > green. "Unknown" outranks
// green so missing zoning never reads as buildable, but a known yellow or red
// still shows through it.
export function typologyVerdict(input: VerdictInput): Verdict {
  const reasons = [
    legalReason(input.pathway, input.rezoningCloseness),
    availabilityReason(input.values.site_parcel_use),
    ...hazardReasons(input.values, input.typology),
    fitReason(input.fit),
  ].filter((r): r is VerdictReason => r != null);
  reasons.sort((a, b) => RANK[b.level] - RANK[a.level]);
  const level = reasons.reduce<VerdictLevel>((worst, r) => (RANK[r.level] > RANK[worst] ? r.level : worst), "green");
  return { level, label: VERDICT_LABEL[level], reasons };
}

export const VERDICT_NOT_CHECKED = V.not_checked;
