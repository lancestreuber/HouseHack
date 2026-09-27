// "Does it pencil?": value per unit against cost per unit, the first check
// developers run before zoning or variances. A screen, not a pro forma: land,
// financing and subsidy are not modeled. Numbers and sources live in
// pillars.config.json under `pencil`; the user can edit the main assumptions.

import config from "./pillars.config.json";
import type { IndicatorValues } from "./score";

const P = config.pencil;
type TypologySpec = { units: number; sf_per_unit: number; basis: "sale" | "rent" };
const SPECS = P.typologies as Record<string, TypologySpec>;

export type PencilAssumptions = { costPerSf: number; siteCostPerBuilding: number };
export const DEFAULT_PENCIL: PencilAssumptions = { costPerSf: P.cost_per_sf.mid, siteCostPerBuilding: P.site_cost_per_building };
export const COST_PRESETS = P.cost_per_sf;

export type PencilStatus = "pencils" | "tight" | "subsidy" | "no" | "unknown";
export type PencilResult = {
  status: PencilStatus;
  basis: "sale" | "rent";
  valuePerUnit: number | null;
  costPerUnit: number;
  /** Cost per unit at the low (production-builder) cost per sf, for the "tight" band. */
  lowCostPerUnit: number;
  /** Value ÷ cost (with margin), at the user's cost per sf. */
  coverage: number | null;
  gapPerUnit: number | null;
};

export const PENCIL_TYPOLOGIES = Object.keys(SPECS);

// Hard + site + soft costs per unit, before the margin.
function costPerUnit(spec: TypologySpec, costPerSf: number, siteCostPerBuilding: number, values: IndicatorValues) {
  const steep = values.site_steep_slope_share;
  const steepAdder = steep != null && (100 - steep) / 100 >= 0.5 ? P.steep_site_adder : 0;
  const hard = spec.sf_per_unit * costPerSf;
  return hard * (1 + P.soft_cost_pct) + (siteCostPerBuilding + steepAdder) / spec.units;
}

// Value per unit: the tract's median sale price for houses; capitalized block-group rent for rentals.
function valuePerUnit(spec: TypologySpec, raw: IndicatorValues): number | null {
  if (spec.basis === "sale") return raw.demand_median_sale_price ?? null;
  const rentRatio = raw.afford_rent_vs_ami;
  return rentRatio == null ? null : rentRatio * P.rent_per_ami_ratio * P.rent_multiplier;
}

/** `norm` for the hazard check, `raw` for dollar values (both from the parcel shard). */
export function pencilCheck(typology: string, norm: IndicatorValues, raw: IndicatorValues, a: PencilAssumptions = DEFAULT_PENCIL): PencilResult | null {
  const spec = SPECS[typology];
  if (!spec) return null;
  const cost = costPerUnit(spec, a.costPerSf, a.siteCostPerBuilding, norm);
  const lowCost = costPerUnit(spec, P.cost_per_sf.low, a.siteCostPerBuilding, norm);
  const value = valuePerUnit(spec, raw);
  const need = cost * (1 + P.margin_pct);
  const base = { basis: spec.basis, valuePerUnit: value, costPerUnit: cost, lowCostPerUnit: lowCost };
  if (value == null) return { ...base, status: "unknown", coverage: null, gapPerUnit: null };
  const coverage = value / need;
  const gapPerUnit = Math.max(0, need - value);
  const status: PencilStatus =
    value >= need ? "pencils" : value >= lowCost * (1 + P.margin_pct) ? "tight" : coverage >= P.subsidy_floor ? "subsidy" : "no";
  return { ...base, status, coverage, gapPerUnit };
}

const usd = (n: number) => `$${Math.round(n / 1000).toLocaleString()}k`;

/** One line for the verdict's reasons. */
export function pencilReasonText(r: PencilResult): string {
  const needed = r.costPerUnit * (1 + P.margin_pct);
  const value =
    r.valuePerUnit == null
      ? ""
      : `${r.basis === "sale" ? "nearby sales" : "nearby rents"} ≈ ${usd(r.valuePerUnit)}/unit vs. ${usd(needed)}/unit needed (cost + ${Math.round(P.margin_pct * 100)}% margin)`;
  switch (r.status) {
    case "pencils":
      return `Pencils at market: ${value}`;
    case "tight":
      return `Pencils only at production-builder costs: ${value}`;
    case "subsidy":
      return `Needs subsidy, about ${usd(r.gapPerUnit ?? 0)}/unit gap: ${value}`;
    case "no":
      return `Doesn't pencil: ${value}; value covers ${Math.round((r.coverage ?? 0) * 100)}% of cost`;
    default:
      return r.basis === "sale" ? "Too few nearby sales to check whether it pencils" : "No rent data to check whether it pencils";
  }
}
