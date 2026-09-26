import { NO_DATA_COLOR, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

export const shortageAreasOverlay: OverlayDefinition = {
  id: "health-shortage-areas",
  label: "Health professional shortage areas",
  group: "policy",
  drawBelowOutlines: true,
  description: "HRSA-designated primary-care and dental shortage areas (low-income populations).",
  source: { kind: "static", url: "/data/overlays/health-shortage-areas.geojson" },
  layers: (sourceId) => [
    {
      id: "health-shortage-areas-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": ["match", ["get", "discipline"], "dental", "#fbbf24", "#f472b6"] as never,
        "fill-opacity": ["match", ["get", "status"], "Designated", 0.18, 0.06] as never,
      },
    },
    {
      id: "health-shortage-areas-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["match", ["get", "discipline"], "dental", "#fbbf24", "#f472b6"] as never,
        "line-width": 1.5,
        "line-dasharray": [3, 2],
      },
    },
  ],
  tooltipLayerIds: ["health-shortage-areas-fill"],
  tooltip: (p) =>
    [
      `${p.discipline === "dental" ? "Dental" : "Primary-care"} shortage area: ${String(p.name ?? "").trim()}`,
      p.population_type ? String(p.population_type) : "",
      p.score != null ? `Shortage score: ${p.score} (higher = greater need)` : "",
      p.status && p.status !== "Designated" ? `Status: ${p.status}` : "",
      p.underserved ? `Estimated underserved: ${Number(p.underserved).toLocaleString()}` : "",
    ].filter(Boolean),
  legend: () => [
    { color: "#f472b6", label: "Primary-care shortage area", shape: "dashed-line" },
    { color: "#fbbf24", label: "Dental shortage area", shape: "dashed-line" },
  ],
  meta: {
    source: "HRSA Health Professional Shortage Areas (federal designations)",
    sourceUrl: "https://data.hrsa.gov/topics/health-workforce/shortage-areas",
    asOf: "Updated daily; pulled Sep 2026",
    geography: "Designated service areas (county bounding box; a few extend past the county)",
    evidence: "policy",
    caveats: ["Faint fill = proposed for withdrawal.", "No mental-health shortage areas are currently designated here."],
  },
};

const OUTCOME_METRICS: OverlayMetric[] = [
  { id: "access2", label: "Adults without health insurance (18–64)", property: "access2" },
  { id: "casthma", label: "Current asthma", property: "casthma" },
  { id: "diabetes", label: "Diabetes", property: "diabetes" },
  { id: "mhlth", label: "Frequent mental distress", property: "mhlth" },
  { id: "depression", label: "Depression", property: "depression" },
  { id: "bphigh", label: "High blood pressure", property: "bphigh" },
  { id: "copd", label: "COPD", property: "copd" },
  { id: "checkup", label: "Routine checkup in past year", property: "checkup" },
  { id: "disability", label: "Any disability", property: "disability" },
];
// Per-measure breaks around the county distribution.
const OUTCOME_BREAKS: Record<string, number[]> = {
  access2: [4, 5, 6.5, 8, 10],
  casthma: [9.5, 10, 10.5, 11.5, 12.5],
  diabetes: [8, 10, 12, 14, 16],
  mhlth: [13, 14.5, 16, 17.5, 19],
  depression: [22, 24, 26, 28, 30],
  bphigh: [28, 32, 36, 40, 44],
  copd: [5, 6, 7, 8.5, 10],
  checkup: [74, 76, 78, 80, 82],
  disability: [20, 25, 30, 35, 40],
};

export const healthOutcomesOverlay: OverlayDefinition = {
  id: "health-outcomes",
  label: "Neighborhood health (CDC PLACES)",
  group: "heat",
  description: "Model-based estimates of adult health outcomes and access by census tract.",
  source: { kind: "static", url: "/data/overlays/health-outcomes.geojson" },
  metrics: OUTCOME_METRICS,
  layers: (sourceId, metric = OUTCOME_METRICS[0]) => [
    {
      id: "health-outcomes-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill(
          metric.property,
          OUTCOME_BREAKS[metric.id],
          metric.id === "checkup" ? RAMPS.neutral : RAMPS.warm,
        ) as never,
        "fill-opacity": 0.6,
      },
    },
    {
      id: "health-outcomes-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["health-outcomes-fill"],
  tooltip: (p, metric = OUTCOME_METRICS[0]) => [
    `${metric.label}: ${p[metric.property] == null ? "no estimate" : `${p[metric.property]}% of adults`}`,
    p[`${metric.property}_ci`] ? `95% interval: ${p[`${metric.property}_ci`]}` : "",
    `Tract ${p.geoid}`,
  ].filter(Boolean),
  legend: (metric = OUTCOME_METRICS[0]) => [
    ...stepLegend(OUTCOME_BREAKS[metric.id], metric.id === "checkup" ? RAMPS.neutral : RAMPS.warm, (lo, hi) =>
      hi ? `${lo}–${hi}%` : `${lo}%+`,
    ).map((item, i) => (i === 0 ? { ...item, label: `Under ${OUTCOME_BREAKS[metric.id][0]}%` } : item)),
    { color: NO_DATA_COLOR, label: "No estimate", shape: "fill" as const },
  ],
  meta: {
    source: "CDC PLACES, census tract estimates (2024 release)",
    sourceUrl: "https://www.cdc.gov/places/",
    asOf: "PLACES 2024 release (mostly 2022 BRFSS)",
    geography: "Census tract estimate (2020 boundaries), not this parcel",
    evidence: "observed",
    caveats: [
      "Model-based estimates, not local surveys.",
      "No local estimate of housing insecurity, utility shutoffs or food insecurity exists for Pennsylvania (PA didn't field that survey module).",
    ],
  },
};

const LE_BREAKS = [70, 74, 77, 80, 83];

export const lifeExpectancyOverlay: OverlayDefinition = {
  id: "life-expectancy",
  label: "Life expectancy (2010–15)",
  group: "heat",
  description: "Life expectancy at birth by census tract, CDC/NCHS USALEEP 2010–2015.",
  source: { kind: "static", url: "/data/overlays/life-expectancy.geojson" },
  layers: (sourceId) => [
    {
      id: "life-expectancy-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill("life_expectancy", LE_BREAKS, RAMPS.neutral) as never,
        "fill-opacity": ["case", ["==", ["get", "unreliable"], true], 0.2, 0.6] as never,
      },
    },
    {
      id: "life-expectancy-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["life-expectancy-fill"],
  tooltip: (p) =>
    [
      p.life_expectancy == null ? "No estimate" : `Life expectancy at birth: ${p.life_expectancy} years`,
      p.life_expectancy_se != null ? `± ${p.life_expectancy_se} (standard error)` : "",
      p.unreliable && p.life_expectancy != null ? "⚠ Wide uncertainty (small population)" : "",
      `Tract ${p.geoid} (2010)`,
    ].filter(Boolean),
  legend: () => [
    ...stepLegend(LE_BREAKS, RAMPS.neutral, (lo, hi) => (hi ? `${lo}–${hi} yrs` : `${lo}+ yrs`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${LE_BREAKS[0]} yrs` } : item,
    ),
    { color: NO_DATA_COLOR, label: "No estimate", shape: "fill" as const },
  ],
  meta: {
    source: "CDC / NCHS U.S. Small-Area Life Expectancy Estimates Project (USALEEP)",
    sourceUrl: "https://www.cdc.gov/nchs/nvss/usaleep/usaleep.html",
    asOf: "Deaths 2010–2015",
    geography: "Census tract (2010 boundaries)",
    evidence: "observed",
    caveats: ["Faded tracts have a standard error over 2 years.", "Older data; conditions may have changed."],
  },
};
