import { matchColor, NO_DATA_COLOR, RAMPS } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

// FEMA NRI qualitative ratings, lowest to highest.
const RATINGS = ["Very Low", "Relatively Low", "Relatively Moderate", "Relatively High", "Very High"];
const RATING_COLORS = Object.fromEntries(RATINGS.map((r, i) => [r, RAMPS.purple[i]]));

const METRICS: OverlayMetric[] = [
  { id: "inland_flood", label: "Inland flooding", property: "inland_flood" },
  { id: "heat_wave", label: "Heat wave", property: "heat_wave" },
  { id: "cold_wave", label: "Cold wave", property: "cold_wave" },
  { id: "winter_weather", label: "Winter weather", property: "winter_weather" },
  { id: "strong_wind", label: "Strong wind", property: "strong_wind" },
  { id: "landslide", label: "Landslide", property: "landslide" },
  { id: "ice_storm", label: "Ice storm", property: "ice_storm" },
  { id: "tornado", label: "Tornado", property: "tornado" },
];

export const weatherRiskOverlay: OverlayDefinition = {
  id: "weather-risk",
  label: "Weather risk",
  group: "heat",
  description: "FEMA National Risk Index rating for a weather hazard, by census tract.",
  source: { kind: "static", url: "/data/overlays/weather-risk.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[0]) => [
    {
      id: "weather-risk-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": matchColor(metric.property, RATING_COLORS, NO_DATA_COLOR) as never,
        "fill-opacity": 0.55,
      },
    },
    {
      id: "weather-risk-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["weather-risk-fill"],
  tooltip: (p, metric = METRICS[0]) => {
    const score = p[`${metric.property}_score`];
    return [
      `${metric.label}: ${p[metric.property] ?? "no rating"}`,
      score == null ? "" : `Risk score: ${Number(score).toFixed(1)} / 100 (national)`,
      `Tract ${p.geoid}`,
    ].filter(Boolean);
  },
  legend: () => [
    ...RATINGS.map((r) => ({ color: RATING_COLORS[r], label: r, shape: "fill" as const })),
    { color: NO_DATA_COLOR, label: "No rating / not applicable", shape: "fill" as const },
  ],
  meta: {
    source: "FEMA National Risk Index",
    sourceUrl:
      "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0",
    asOf: "NRI December 2025",
    geography: "Census tract rating, not this parcel",
    evidence: "observed",
    caveats: [
      "NRI risk includes the dollar value of exposed buildings, so dense or valuable tracts rate higher.",
      "Use the city flood, landslide and undermined layers for parcel-precise hazards.",
    ],
  },
  indicators: METRICS.map((m) => ({
    id: `weather-${m.id}`,
    label: m.label,
    property: m.property,
    normalize: (v) => {
      const i = RATINGS.indexOf(String(v));
      return i < 0 ? null : i / (RATINGS.length - 1);
    },
  })),
};
