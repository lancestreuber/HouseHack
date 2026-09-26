import { NO_DATA_COLOR, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

const PCT_BREAKS = [20, 40, 60, 80, 90];

const EQUITY_METRICS: OverlayMetric[] = [
  { id: "svi_overall", label: "Social vulnerability (overall)", property: "svi_overall" },
  { id: "svi_socioeconomic", label: "SVI: socioeconomic status", property: "svi_socioeconomic" },
  { id: "svi_household", label: "SVI: household characteristics", property: "svi_household" },
  { id: "svi_minority", label: "SVI: racial & ethnic minority status", property: "svi_minority" },
  { id: "svi_housing_transport", label: "SVI: housing type & transportation", property: "svi_housing_transport" },
  { id: "coi_rank", label: "Child Opportunity Index (metro rank)", property: "coi_rank" },
  { id: "coi_education", label: "COI: education domain", property: "coi_education" },
  { id: "coi_health_env", label: "COI: health & environment domain", property: "coi_health_env" },
  { id: "coi_social_econ", label: "COI: social & economic domain", property: "coi_social_econ" },
];

const isCoi = (m: OverlayMetric) => m.id.startsWith("coi");

export const equityOverlay: OverlayDefinition = {
  id: "equity",
  label: "Social vulnerability & child opportunity",
  group: "heat",
  description: "CDC Social Vulnerability Index 2022 and Child Opportunity Index 3.0, by census tract.",
  source: { kind: "static", url: "/data/overlays/equity-svi-coi.geojson" },
  metrics: EQUITY_METRICS,
  layers: (sourceId, metric = EQUITY_METRICS[0]) => [
    {
      id: "equity-fill",
      type: "fill",
      source: sourceId,
      paint: {
        // SVI: higher = more vulnerable (warm). COI: higher = more neighborhood resources (neutral).
        "fill-color": stepFill(metric.property, PCT_BREAKS, isCoi(metric) ? RAMPS.neutral : RAMPS.warm) as never,
        "fill-opacity": 0.6,
      },
    },
    {
      id: "equity-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["equity-fill"],
  tooltip: (p, metric = EQUITY_METRICS[0]) =>
    [
      `${metric.label}: ${p[metric.property] == null ? "no data" : `${p[metric.property]} of 100`}`,
      p.svi_overall != null ? `Social vulnerability: ${p.svi_overall}th national percentile` : "",
      p.coi_level ? `Child Opportunity Index: ${p.coi_level} (metro-normed)` : "",
      `Tract ${p.geoid}`,
    ].filter(Boolean),
  legend: (metric = EQUITY_METRICS[0]) => [
    ...stepLegend(PCT_BREAKS, isCoi(metric) ? RAMPS.neutral : RAMPS.warm, (lo, hi) => (hi ? `${lo}–${hi}` : `${lo}+`)).map(
      (item, i) =>
        i === 0
          ? { ...item, label: isCoi(metric) ? "Under 20 (fewest neighborhood resources)" : "Under 20 (least vulnerable)" }
          : item,
    ),
    { color: NO_DATA_COLOR, label: "No data", shape: "fill" as const },
  ],
  meta: {
    source: "CDC/ATSDR Social Vulnerability Index 2022 (public domain); Child Opportunity Index 3.0, diversitydatakids.org",
    sourceUrl: "https://www.atsdr.cdc.gov/place-health/php/svi/index.html",
    asOf: "SVI 2022; COI 2021 data year",
    geography: "Census tract rank, not this parcel",
    evidence: "observed",
    caveats: [
      "SVI ranks are national percentiles; COI ranks are within the metro.",
      "COI shows gaps in neighborhood investment, not whether a place is a 'good place to live'.",
      "COI comes from an unofficial ArcGIS mirror of the official release.",
    ],
  },
};

const MOBILITY_METRICS: OverlayMetric[] = [
  { id: "mobility_p25", label: "All children", property: "mobility_p25" },
  { id: "mobility_black_p25", label: "Black children", property: "mobility_black_p25" },
  { id: "mobility_white_p25", label: "White children", property: "mobility_white_p25" },
];
const MOBILITY_BREAKS = [35, 40, 45, 50, 55];

export const opportunityAtlasOverlay: OverlayDefinition = {
  id: "opportunity-atlas",
  label: "Economic mobility (Opportunity Atlas)",
  group: "heat",
  description:
    "Average adult income rank of children who grew up here in low-income families (25th percentile parents).",
  source: { kind: "static", url: "/data/overlays/opportunity-atlas.geojson" },
  metrics: MOBILITY_METRICS,
  layers: (sourceId, metric = MOBILITY_METRICS[0]) => [
    {
      id: "opportunity-atlas-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill(metric.property, MOBILITY_BREAKS, RAMPS.neutral) as never,
        // Fade noisy estimates (standard error over 5 percentile points).
        "fill-opacity": ["case", ["==", ["get", "mobility_unreliable"], true], 0.2, 0.6] as never,
      },
    },
    {
      id: "opportunity-atlas-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["opportunity-atlas-fill"],
  tooltip: (p, metric = MOBILITY_METRICS[0]) =>
    [
      `${metric.label}: ${p[metric.property] == null ? "no estimate" : `${p[metric.property]}th national income percentile as adults`}`,
      p.mobility_p25_se != null ? `± ${p.mobility_p25_se} (standard error, all children)` : "",
      p.mobility_unreliable ? "⚠ Low reliability" : "",
      `Tract ${p.geoid} (2010)`,
    ].filter(Boolean),
  legend: () => [
    ...stepLegend(MOBILITY_BREAKS, RAMPS.neutral, (lo, hi) => (hi ? `${lo}–${hi}th pct` : `${lo}th+ pct`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${MOBILITY_BREAKS[0]}th pct` } : item,
    ),
    { color: NO_DATA_COLOR, label: "No estimate", shape: "fill" as const },
  ],
  meta: {
    source: "Opportunity Insights / U.S. Census Bureau, The Opportunity Atlas",
    sourceUrl: "https://opportunityinsights.org/data/",
    asOf: "Children born 1978–83, measured as adults",
    geography: "Census tract (2010 boundaries)",
    evidence: "observed",
    caveats: [
      "Historical cohort outcomes, not current neighborhood conditions.",
      "Faded tracts have a standard error over 5 percentile points.",
    ],
  },
};

const HOLC_COLORS: Record<string, string> = { A: "#76a865", B: "#7cb5bd", C: "#ffff00", D: "#d9838d" };
const HOLC_LABELS: Record<string, string> = {
  A: "A: 'Best'",
  B: "B: 'Still desirable'",
  C: "C: 'Definitely declining'",
  D: "D: 'Hazardous' (redlined)",
};

export const holcOverlay: OverlayDefinition = {
  id: "holc-1937",
  label: "1937 redlining map (HOLC)",
  group: "policy",
  drawBelowOutlines: true,
  description: "1937 federal mortgage-risk grades (historic; racially discriminatory).",
  source: { kind: "static", url: "/data/overlays/holc-1937.geojson" },
  layers: (sourceId) => [
    {
      id: "holc-1937-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": ["match", ["get", "grade"], "A", "#76a865", "B", "#7cb5bd", "C", "#ffff00", "#d9838d"] as never,
        "fill-opacity": 0.25,
      },
    },
    {
      id: "holc-1937-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["match", ["get", "grade"], "A", "#76a865", "B", "#7cb5bd", "C", "#ffff00", "#d9838d"] as never,
        "line-width": 1.2,
      },
    },
  ],
  tooltipLayerIds: ["holc-1937-fill"],
  tooltip: (p) => [`1937 HOLC grade ${p.grade}${p.name ? `: ${p.name}` : ""}`, p.id ? `Area ${p.id}` : ""].filter(Boolean),
  legend: () => Object.entries(HOLC_COLORS).map(([k, color]) => ({ color, label: HOLC_LABELS[k], shape: "fill" as const })),
  meta: {
    source: "Mapping Inequality, Nelson et al., University of Richmond Digital Scholarship Lab (CC BY-SA), via WPRDC",
    sourceUrl: "https://dsl.richmond.edu/panorama/redlining/",
    asOf: "1937",
    geography: "Historic appraisal areas (1937 city and some inner suburbs)",
    evidence: "observed",
    caveats: [
      "Historic and racially discriminatory grades, shown for context on how today's patterns formed.",
      "Not a description of these places today.",
    ],
  },
};
