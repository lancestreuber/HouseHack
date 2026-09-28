import type { IndicatorValues } from "@/lib/pillars/score";

// Who a housing type on this parcel helps, and who it may harm: fixed rules over
// the parcel's own indicators, never the model. Each item names a group and the
// numbers behind it, so the Alerts pane and the scenario report say the same
// thing and the chat can cite it. Missing data yields no item: unknown is not bad.
// Scores (`norm`) are 0-100 with 100 = a good place to build (or greater need,
// for the housing-need indicators), as in pillars.config.json.

export type ImpactEffect = "helps" | "harms";

export type ImpactItem = {
  /** Stable per typology, e.g. "car_free"; the chat fact id is `${effect}.${typology}.${key}`. */
  key: string;
  effect: ImpactEffect;
  group: string;
  /** What the parcel's data says, without the group. */
  detail: string;
  /** "Helps <group>: <detail>" or "May harm <group>: <detail>". */
  text: string;
  indicators: string[];
};

const RENTAL = new Set(["two_unit", "three_unit", "multi_unit", "multi_suite_limited", "multi_suite_general"]);
const FAMILY = new Set(["single_detached", "single_attached", "two_unit", "three_unit"]);
const SENIOR = new Set([
  "elderly_limited",
  "elderly_general",
  "assisted_living_a",
  "assisted_living_b",
  "assisted_living_c",
  "personal_care_small",
  "personal_care_large",
]);
const SUPPORTIVE = new Set(["community_home", "interim_housing"]);
// Types whose residents are less likely to own a car.
const CAR_LIGHT = new Set([...RENTAL, ...SENIOR, ...SUPPORTIVE]);
const OCCUPIED_USE = new Set([3, 5, 6]);

const GOOD = 60;
// Air scores are ranked within the county; only the worst tenth is flagged, since most City parcels rank high on traffic.
const AIR_WORST = 10;
const POOR = 30;

const m = (v: number) => `${Math.round(v).toLocaleString("en-US")} m`;
const pct = (v: number) => `${v.toFixed(1)}%`;
const frac = (v: number) => `${(v * 100).toFixed(1)}%`;
const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
};

function avg(norm: IndicatorValues, ids: string[]): { score: number; ids: string[] } | null {
  const have = ids.filter((id) => norm[id] != null);
  if (have.length < Math.min(2, ids.length)) return null;
  return { score: have.reduce((s, id) => s + (norm[id] as number), 0) / have.length, ids: have };
}

function distances(raw: IndicatorValues, parts: [string, string][]): string {
  return parts
    .filter(([id]) => raw[id] != null)
    .map(([id, label]) => `${label} ${m(raw[id] as number)}`)
    .join(", ");
}

export function typologyImpact(typologyId: string, data: { norm: IndicatorValues; raw: IndicatorValues }): ImpactItem[] {
  const { norm, raw } = data;
  const out: ImpactItem[] = [];
  const add = (effect: ImpactEffect, key: string, group: string, detail: string, indicators: string[]) =>
    out.push({ key, effect, group, detail, text: `${effect === "helps" ? "Helps" : "May harm"} ${group}: ${detail}`, indicators });

  // Who the type is for, by definition.
  if (typologyId === "interim_housing") add("helps", "short_term", "people who need short-term housing", "adds transitional or emergency housing.", []);
  if (typologyId === "community_home") add("helps", "supportive", "people who need a supportive group home", "adds a small group-living home with support.", []);

  // Low-income renters: more rental homes where cost burden is high.
  if (RENTAL.has(typologyId)) {
    const burden = norm.afford_lowinc_renter_burden;
    const eli = norm.afford_eli_renter_share;
    if ((burden ?? 0) >= GOOD || (eli ?? 0) >= GOOD) {
      const bits = [
        raw.afford_lowinc_renter_burden != null && `${pct(raw.afford_lowinc_renter_burden)} of low-income renters here pay 30%+ of income on housing`,
        raw.afford_eli_renter_share != null && `${frac(raw.afford_eli_renter_share)} of renters earn 30% of area median income or less`,
      ].filter(Boolean);
      add(
        "helps",
        "lowinc_renters",
        "low-income renters",
        `${bits.join("; ")}. More rental homes add supply where need is high, most of all if some are income-restricted.`,
        ["afford_lowinc_renter_burden", "afford_eli_renter_share"].filter((id) => raw[id] != null),
      );
    }
  }

  // Households without a car.
  if (CAR_LIGHT.has(typologyId) && norm.access_transit != null) {
    const trips = raw.access_transit != null ? `${Math.round(raw.access_transit).toLocaleString("en-US")} weekday transit trips within 800 m` : null;
    const jobs = raw.access_jobs_transit != null ? `${Math.round(raw.access_jobs_transit).toLocaleString("en-US")} jobs within 30 minutes by transit` : null;
    const detail = [trips, jobs].filter(Boolean).join(", ");
    if (norm.access_transit >= GOOD && detail)
      add("helps", "car_free", "households without a car", `${detail}.`, ["access_transit", "access_jobs_transit"].filter((id) => raw[id] != null));
    else if (norm.access_transit <= 25 && trips) add("harms", "car_free", "residents without a car", `only ${trips}, so daily trips are hard without driving.`, ["access_transit"]);
  }

  // Older adults: care and services within reach.
  if (SENIOR.has(typologyId)) {
    const parts: [string, string][] = [["access_health", "health care"], ["access_pharmacy", "pharmacy"], ["access_senior_center", "senior center"]];
    const a = avg(norm, parts.map(([id]) => id));
    const close = a && a.score >= GOOD;
    add("helps", "older_adults", "older adults", `adds homes built for older adults or people who need daily care${close ? `, with care and services close by (${distances(raw, parts)})` : ""}.`, close ? a.ids : []);
    if (a && a.score <= POOR) add("harms", "older_adults", "older residents", `care and services are far (${distances(raw, parts)}), so residents who don't drive could be isolated.`, a.ids);
  }

  // Families with children.
  if (FAMILY.has(typologyId)) {
    const parts: [string, string][] = [["access_school", "school"], ["access_child_care", "child care"], ["access_park", "park"]];
    const a = avg(norm, parts.map(([id]) => id));
    if (a && a.score >= GOOD) add("helps", "families", "families with children", `school, child care and a park are close (${distances(raw, parts)}).`, a.ids);
    else if (a && a.score <= POOR) add("harms", "families", "families with children", `school, child care and parks are far (${distances(raw, parts)}).`, a.ids);
  }

  // Less driving, for denser types.
  if (RENTAL.has(typologyId) && (norm.climate_household_vmt ?? 0) >= 70 && raw.climate_household_vmt != null) {
    add(
      "helps",
      "less_driving",
      "the climate (less driving)",
      `modeled household driving here is ${Math.round(raw.climate_household_vmt).toLocaleString("en-US")} mi/yr, lower than most of the county.`,
      ["climate_household_vmt"],
    );
  }

  // People in the building on the lot today.
  if (raw.site_parcel_use != null && OCCUPIED_USE.has(raw.site_parcel_use)) {
    add(
      "harms",
      "current_occupants",
      "current occupants",
      "the lot has an existing occupied building, so building here means replacing or adding to it, and the people who live or work there may have to move.",
      ["site_parcel_use"],
    );
  }

  // Nearby renters facing displacement pressure (same cutoffs as the Affordability flags).
  if (!SUPPORTIVE.has(typologyId)) {
    const signs = [
      (norm.afford_rent_growth_5yr ?? 100) <= 20 && raw.afford_rent_growth_5yr != null && ["afford_rent_growth_5yr", `rents rose ${pct(raw.afford_rent_growth_5yr)} in 5 years`],
      (norm.afford_price_growth ?? 100) < 10 && raw.afford_price_growth != null && ["afford_price_growth", `home prices rose ${frac(raw.afford_price_growth)} since 2020–21`],
      (norm.afford_displacement_ratio ?? 100) < 10 && ["afford_displacement_ratio", "sale prices outpaced local incomes (top 10% of the county)"],
    ].filter((s): s is [string, string] => Boolean(s));
    if (signs.length) {
      add(
        "harms",
        "nearby_renters",
        "nearby renters",
        `${signs.map((s) => s[1]).join("; ")}. Market-rate homes alone won't protect existing renters here; income-restricted units and tenant protections matter most.`,
        signs.map((s) => s[0]),
      );
    }
  }

  // Future residents' health: air pollution.
  const air = (
    [
      ["climate_pm25", "fine particle pollution"],
      ["climate_traffic_combustion", "traffic pollution"],
      ["climate_air_toxics", "industrial air toxics"],
    ] as const
  ).filter(([id]) => (norm[id] ?? 100) <= AIR_WORST && raw[id] != null);
  if (air.length) {
    const sensitive = SENIOR.has(typologyId) ? " Older adults are among the most sensitive." : FAMILY.has(typologyId) ? " Children are among the most sensitive." : "";
    add(
      "harms",
      "air",
      "future residents' health",
      `${air.map(([id, label]) => `${label} is at the ${ordinal(Math.round(raw[id] as number))} percentile in PA`).join(", ")}.${sensitive}`,
      air.map(([id]) => id),
    );
  }

  // Heat, for residents most at risk from it.
  if (SENIOR.has(typologyId) || SUPPORTIVE.has(typologyId)) {
    const hot = (norm.climate_surface_heat ?? 100) <= 20 && raw.climate_surface_heat != null;
    const bare = (norm.climate_tree_canopy ?? 100) <= 20 && raw.climate_tree_canopy != null;
    if (hot || bare) {
      const bits = [
        hot && `summer surfaces run ${raw.climate_surface_heat! >= 0 ? "+" : ""}${raw.climate_surface_heat!.toFixed(1)} °C vs the county median`,
        bare && `tree canopy is ${pct(raw.climate_tree_canopy!)}`,
      ].filter(Boolean);
      add("harms", "heat", "heat-vulnerable residents", `${bits.join(", ")}.`, [hot && "climate_surface_heat", bare && "climate_tree_canopy"].filter((x): x is string => Boolean(x)));
    }
  }

  // Future residents: flooding.
  const floodway = raw.site_floodway_share ?? 0;
  const floodplain = raw.site_sfha_share ?? 0;
  if (floodway >= 0.1 || floodplain >= 0.25) {
    const share = floodway >= 0.1 ? `${Math.round(floodway * 100)}% of the lot is in the FEMA floodway` : `${Math.round(floodplain * 100)}% of the lot is in the 100-year floodplain`;
    add("harms", "flood", "future residents (flooding)", `${share}.`, [floodway >= 0.1 ? "site_floodway_share" : "site_sfha_share"]);
  }

  return out;
}
