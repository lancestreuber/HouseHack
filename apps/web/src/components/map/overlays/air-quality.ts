import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

// EJScreen's own percentile bins.
const BREAKS = [50, 70, 80, 90, 95];
const COLORS = RAMPS.warm;

const METRICS: OverlayMetric[] = [
  { id: "pm25", label: "PM2.5", property: "pm25_pct" },
  { id: "no2", label: "NO₂", property: "no2_pct" },
  { id: "dslpm", label: "Diesel particulate", property: "dslpm_pct" },
  { id: "ozone", label: "Ozone", property: "ozone_pct" },
  { id: "ptraf", label: "Traffic proximity", property: "ptraf_pct" },
  { id: "rsei_air", label: "Industrial toxics (RSEI)", property: "rsei_air_pct" },
];

const RAW_UNITS: Record<string, string> = {
  pm25: "µg/m³",
  no2: "ppb",
  ozone: "ppb",
  dslpm: "µg/m³",
  ptraf: "daily traffic / distance",
  rsei_air: "RSEI score",
};

const pctFill = (metric: OverlayMetric) => stepFill(metric.property, BREAKS, COLORS);

export const airQualityOverlay: OverlayDefinition = {
  id: "air-quality",
  label: "Air quality",
  group: "heat",
  description: "Air pollution burden by census block group, as a Pennsylvania percentile.",
  source: { kind: "static", url: "/data/overlays/air-quality.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[0]) => [
    {
      id: "air-quality-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": pctFill(metric) as never, "fill-opacity": 0.55 },
    },
    {
      id: "air-quality-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.3, "line-opacity": 0.4 },
    },
  ],
  tooltipLayerIds: ["air-quality-fill"],
  tooltip: (p, metric = METRICS[0]) => {
    const pct = p[metric.property];
    const raw = p[metric.id];
    return [
      `${metric.label}: ${pct == null ? "no data" : `${pct}th percentile in PA`}`,
      raw == null ? "" : `Value: ${Number(raw).toFixed(2)} ${RAW_UNITS[metric.id] ?? ""}`,
      `Block group ${p.geoid}`,
    ].filter(Boolean);
  },
  legend: () => stepLegend(BREAKS, COLORS, (lo, hi) => (hi ? `${lo}–${hi}th pct` : `${lo}th+ pct`)),
  meta: {
    source: "EPA EJScreen v2.32, via the Public Environmental Data Partners mirror (EPA took EJScreen offline in 2025)",
    sourceUrl:
      "https://services2.arcgis.com/w4yiQqB14ZaAGzJq/arcgis/rest/services/EJScreenStatePercentilesBlockGroup/FeatureServer/0",
    asOf: "EJScreen v2.32; indicator years vary",
    geography: "Census block group average, not this parcel",
    evidence: "observed",
    caveats: ["Modeled estimates, not local monitor readings.", "Which pollutant matters most is a value judgment."],
  },
  indicators: METRICS.map((m) => ({
    id: `air-${m.id}`,
    label: m.label,
    property: m.property,
    normalize: (v) => (v == null || v === "" ? null : Number(v) / 100),
  })),
};
