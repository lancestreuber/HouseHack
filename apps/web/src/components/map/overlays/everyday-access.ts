import { NO_DATA_COLOR, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

const FOOD_COLOR = "#4ade80";
const FOOD_VEHICLE_COLOR = "#facc15";
const flagged = ["any", ["==", ["get", "lila_half_10"], true], ["==", ["get", "lila_vehicle"], true]];
const foodColor = ["case", ["==", ["get", "lila_vehicle"], true], FOOD_VEHICLE_COLOR, FOOD_COLOR];

export const foodAccessOverlay: OverlayDefinition = {
  id: "food-access",
  label: "Low food access (USDA)",
  group: "places",
  drawBelowOutlines: true,
  description: "USDA low-income, low-access tracts: far from a supermarket, or many households without a car.",
  source: { kind: "static", url: "/data/overlays/food-access.geojson" },
  layers: (sourceId) => [
    {
      id: "food-access-fill",
      type: "fill",
      source: sourceId,
      filter: flagged as never,
      paint: { "fill-color": foodColor as never, "fill-opacity": 0.14 },
    },
    {
      id: "food-access-outline",
      type: "line",
      source: sourceId,
      filter: flagged as never,
      paint: { "line-color": foodColor as never, "line-width": 1.5, "line-dasharray": [3, 2] },
    },
  ],
  tooltipLayerIds: ["food-access-fill"],
  tooltip: (p) =>
    [
      p.lila_half_10 ? "USDA low-income / low-access tract (over ½ mile from a supermarket)" : "",
      p.lila_vehicle ? "Low access and many households without a vehicle" : "",
      p.poverty_rate != null ? `Poverty rate: ${p.poverty_rate}%` : "",
      p.households_no_vehicle != null ? `Households without a vehicle: ${Number(p.households_no_vehicle).toLocaleString()}` : "",
      `Tract ${p.geoid}`,
    ].filter(Boolean),
  legend: () => [
    { color: FOOD_COLOR, label: "Low income + over ½ mile to a supermarket", shape: "dashed-line" },
    { color: FOOD_VEHICLE_COLOR, label: "Low access + low vehicle availability", shape: "dashed-line" },
  ],
  meta: {
    source: "USDA ERS Food Access Research Atlas 2025",
    sourceUrl: "https://www.ers.usda.gov/data-products/food-access-research-atlas",
    asOf: "2025 edition (store and ACS inputs roughly 2019–2021)",
    geography: "Census tract (2020)",
    evidence: "observed",
    caveats: [
      "Straight-line distance to a supermarket, not walking distance; hills and rivers make real trips longer.",
      "Only flagged tracts are drawn. Pair with the grocery store points.",
    ],
  },
};

const INTERNET_METRICS: OverlayMetric[] = [
  { id: "no_internet_pct", label: "Households with no internet", property: "no_internet_pct" },
  { id: "broadband_pct", label: "Households with broadband", property: "broadband_pct" },
];
const INTERNET_BREAKS: Record<string, number[]> = {
  no_internet_pct: [2, 4, 7, 11, 16],
  broadband_pct: [70, 78, 84, 89, 93],
};

export const homeInternetOverlay: OverlayDefinition = {
  id: "home-internet",
  label: "Home internet (ACS)",
  group: "heat",
  description: "Share of households with no internet subscription, or with broadband, by census tract.",
  source: { kind: "static", url: "/data/overlays/home-internet.geojson" },
  metrics: INTERNET_METRICS,
  layers: (sourceId, metric = INTERNET_METRICS[0]) => [
    {
      id: "home-internet-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill(
          metric.property,
          INTERNET_BREAKS[metric.id],
          metric.id === "broadband_pct" ? RAMPS.neutral : RAMPS.warm,
        ) as never,
        "fill-opacity": 0.6,
      },
    },
    {
      id: "home-internet-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["home-internet-fill"],
  tooltip: (p) =>
    [
      p.no_internet_pct == null
        ? "No households"
        : `No internet at home: ${p.no_internet_pct}%${p.no_internet_moe_pct != null ? ` (± ${p.no_internet_moe_pct})` : ""}`,
      p.broadband_pct != null ? `Broadband subscription: ${p.broadband_pct}%` : "",
      p.households ? `${Number(p.households).toLocaleString()} households · tract ${p.geoid}` : `Tract ${p.geoid}`,
    ].filter(Boolean),
  legend: (metric = INTERNET_METRICS[0]) => [
    ...stepLegend(INTERNET_BREAKS[metric.id], metric.id === "broadband_pct" ? RAMPS.neutral : RAMPS.warm, (lo, hi) =>
      hi ? `${lo}–${hi}%` : `${lo}%+`,
    ).map((item, i) => (i === 0 ? { ...item, label: `Under ${INTERNET_BREAKS[metric.id][0]}%` } : item)),
    { color: NO_DATA_COLOR, label: "No households", shape: "fill" as const },
  ],
  meta: {
    source: "U.S. Census Bureau ACS 2024 5-year, table B28002 (via Census Reporter)",
    sourceUrl: "https://censusreporter.org/tables/B28002/",
    asOf: "ACS 2020–2024",
    geography: "Census tract estimate, not this parcel",
    evidence: "observed",
    caveats: [
      "Job searches, school, telehealth and housing applications (including subsidized waitlists) are mostly online.",
      "Tract margins of error are large; the tooltip shows ± in percentage points.",
    ],
  },
};

const WALK_BREAKS = [5.76, 10.51, 15.26];
const WALK_COLORS = [RAMPS.neutral[0], RAMPS.neutral[2], RAMPS.neutral[3], RAMPS.neutral[4]];
const WALK_LABELS = ["Least walkable (1–5.75)", "Below average (5.76–10.5)", "Above average (10.51–15.25)", "Most walkable (15.26–20)"];

export const walkabilityOverlay: OverlayDefinition = {
  id: "walkability",
  label: "Walkability (EPA)",
  group: "heat",
  description: "EPA National Walkability Index (1–20) by block group: intersection density, land-use mix and transit proximity.",
  source: { kind: "static", url: "/data/overlays/walkability.geojson" },
  layers: (sourceId) => [
    {
      id: "walkability-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": stepFill("walk_index", WALK_BREAKS, WALK_COLORS) as never, "fill-opacity": 0.6 },
    },
    {
      id: "walkability-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["walkability-fill"],
  tooltip: (p) =>
    [
      p.walk_index == null ? "No score" : `Walkability index: ${p.walk_index} of 20`,
      p.intersections_sqmi != null ? `Street intersections: ${p.intersections_sqmi} per sq mi` : "",
      p.transit_distance_m != null ? `Nearest transit stop: ~${p.transit_distance_m} m` : "No transit stop within ¾ mile",
      p.zero_car_pct != null ? `Households without a car: ${p.zero_car_pct}%` : "",
      `Block group ${p.geoid}`,
    ].filter(Boolean),
  legend: () => [
    ...WALK_COLORS.map((color, i) => ({ color, label: WALK_LABELS[i], shape: "fill" as const })),
    { color: NO_DATA_COLOR, label: "No score", shape: "fill" as const },
  ],
  meta: {
    source: "U.S. EPA National Walkability Index (Smart Location Database)",
    sourceUrl: "https://www.epa.gov/smartgrowth/smart-location-mapping",
    asOf: "Inputs circa 2018–2019",
    geography: "Census block group (2020)",
    evidence: "observed",
    caveats: [
      "Ignores Pittsburgh's hills, public steps and sidewalk gaps.",
      "Transit distance is from EPA's 2018-era GTFS, not current Port Authority service.",
    ],
  },
};
