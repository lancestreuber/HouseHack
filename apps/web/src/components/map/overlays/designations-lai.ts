import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

const DESIGNATION_COLORS: Record<string, string> = { qct: "#22d3ee", dda: "#a78bfa", oz: "#fbbf24" };
const DESIGNATION_LABELS: Record<string, string> = {
  qct: "Qualified Census Tract 2026 (LIHTC basis boost)",
  dda: "Difficult Development Area 2026 (LIHTC basis boost)",
  oz: "Opportunity Zone (2018 designation)",
};

export const designationAreasOverlay: OverlayDefinition = {
  id: "designation-areas",
  label: "Subsidy designation areas",
  group: "policy",
  drawBelowOutlines: true,
  description: "HUD Qualified Census Tracts, Difficult Development Areas and federal Opportunity Zones.",
  source: { kind: "static", url: "/data/overlays/designation-areas.geojson" },
  layers: (sourceId) => [
    {
      id: "designation-areas-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": ["match", ["get", "designation"], "qct", "#22d3ee", "dda", "#a78bfa", "#fbbf24"] as never,
        "fill-opacity": 0.12,
      },
    },
    {
      id: "designation-areas-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["match", ["get", "designation"], "qct", "#22d3ee", "dda", "#a78bfa", "#fbbf24"] as never,
        "line-width": 1.5,
        "line-dasharray": [3, 2],
      },
    },
  ],
  tooltipLayerIds: ["designation-areas-fill"],
  tooltip: (p) => [DESIGNATION_LABELS[String(p.designation)], p.id ? `ID: ${p.id}` : ""].filter(Boolean),
  legend: () =>
    Object.entries(DESIGNATION_COLORS).map(([k, color]) => ({ color, label: DESIGNATION_LABELS[k], shape: "dashed-line" as const })),
  meta: {
    source: "HUD: Qualified Census Tracts 2026, Difficult Development Areas 2026, Opportunity Zones",
    sourceUrl: "https://www.huduser.gov/portal/datasets/qct.html",
    asOf: "QCT/DDA 2026 (edited Sep 2025); Opportunity Zones designated 2018",
    geography: "Tracts (QCT, OZ) and ZIP areas (DDA)",
    evidence: "policy",
    caveats: [
      "LIHTC projects in a QCT or DDA can receive up to a 30% eligible-basis boost.",
      "Opportunity Zones use 2010 tracts; newer designations are not reflected.",
    ],
  },
};

const LAI_METRICS: OverlayMetric[] = [
  { id: "autos_per_hh", label: "Cars per household", property: "autos_per_hh" },
  { id: "pct_transit_j2w", label: "Commuters using transit", property: "pct_transit_j2w" },
  { id: "avg_h_cost", label: "Average monthly housing cost", property: "avg_h_cost" },
];
const LAI_STYLES: Record<string, { breaks: number[]; format: (v: number) => string; colors: string[] }> = {
  autos_per_hh: { breaks: [0.75, 1, 1.3, 1.6, 1.9], format: (v) => v.toFixed(2), colors: RAMPS.warm },
  pct_transit_j2w: { breaks: [2, 5, 10, 20, 30], format: (v) => `${v}%`, colors: RAMPS.neutral },
  avg_h_cost: { breaks: [700, 850, 1000, 1250, 1600], format: (v) => `$${Math.round(v).toLocaleString()}`, colors: RAMPS.neutral },
};

export const locationAffordabilityOverlay: OverlayDefinition = {
  id: "location-affordability",
  label: "Car dependence & housing cost (LAI)",
  group: "heat",
  description: "HUD/DOT Location Affordability Index v3: car ownership, transit commuting and housing cost by tract.",
  source: { kind: "static", url: "/data/overlays/location-affordability.geojson" },
  metrics: LAI_METRICS,
  layers: (sourceId, metric = LAI_METRICS[0]) => {
    const style = LAI_STYLES[metric.id];
    return [
      {
        id: "location-affordability-fill",
        type: "fill",
        source: sourceId,
        paint: { "fill-color": stepFill(metric.property, style.breaks, style.colors) as never, "fill-opacity": 0.6 },
      },
      {
        id: "location-affordability-outline",
        type: "line",
        source: sourceId,
        paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
      },
    ];
  },
  tooltipLayerIds: ["location-affordability-fill"],
  tooltip: (p, metric = LAI_METRICS[0]) => {
    const style = LAI_STYLES[metric.id];
    const v = p[metric.property];
    return [
      `${metric.label}: ${v == null ? "no data" : style.format(Number(v))}`,
      p.pct_transit_j2w != null && metric.id !== "pct_transit_j2w" ? `Transit commuters: ${p.pct_transit_j2w}%` : "",
      `Tract ${p.geoid} (2010 tract)`,
    ].filter(Boolean);
  },
  legend: (metric = LAI_METRICS[0]) => {
    const style = LAI_STYLES[metric.id];
    return [
      ...stepLegend(style.breaks, style.colors, (lo, hi) =>
        hi ? `${style.format(lo)}–${style.format(hi)}` : `${style.format(lo)}+`,
      ).map((item, i) => (i === 0 ? { ...item, label: `Under ${style.format(style.breaks[0])}` } : item)),
      { color: "rgba(120,120,120,0.35)", label: "No data", shape: "fill" as const },
    ];
  },
  meta: {
    source: "HUD / DOT Location Affordability Index v3",
    sourceUrl: "https://www.hudexchange.info/programs/location-affordability-index/",
    asOf: "LAI v3 (built on 2012–2016 ACS inputs; HUD's latest release)",
    geography: "Census tract (2010 boundaries)",
    evidence: "observed",
    caveats: [
      "Old inputs (2012–2016): relative differences between tracts are the useful part.",
      "Household vehicle-miles (VMT) is empty in HUD's published service, so it isn't shown.",
    ],
  },
};
