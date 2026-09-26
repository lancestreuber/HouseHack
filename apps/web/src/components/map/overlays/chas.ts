import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

const BREAKS: Record<string, number[]> = {
  renter_lowinc_costburdened_pct: [30, 45, 60, 75, 90],
  renter_le30_severe_pct: [20, 40, 60, 80, 95],
  owner_lowinc_costburdened_pct: [20, 30, 40, 55, 70],
};

const METRICS: OverlayMetric[] = [
  {
    id: "renter_lowinc_costburdened_pct",
    label: "Low-income renters paying 30%+ (≤80% AMI)",
    property: "renter_lowinc_costburdened_pct",
  },
  {
    id: "renter_le30_severe_pct",
    label: "Extremely low-income renters paying 50%+ (≤30% AMI)",
    property: "renter_le30_severe_pct",
  },
  {
    id: "owner_lowinc_costburdened_pct",
    label: "Low-income owners paying 30%+ (≤80% AMI)",
    property: "owner_lowinc_costburdened_pct",
  },
];

const n = (v: unknown) => (v == null ? "?" : Number(v).toLocaleString());

export const chasOverlay: OverlayDefinition = {
  id: "chas-cost-burden",
  label: "Housing cost burden (CHAS)",
  group: "heat",
  description: "HUD CHAS 2018–2022: share of lower-income households paying too much for housing, by tract.",
  source: { kind: "static", url: "/data/overlays/chas-cost-burden.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[0]) => [
    {
      id: "chas-cost-burden-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": stepFill(metric.property, BREAKS[metric.id], RAMPS.warm) as never, "fill-opacity": 0.6 },
    },
    {
      id: "chas-cost-burden-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["chas-cost-burden-fill"],
  tooltip: (p, metric = METRICS[0]) => {
    const v = p[metric.property];
    return [
      `${metric.label}: ${v == null ? "no households in this group" : `${v}%`}`,
      `${n(p.renter_le30)} renter households earn ≤30% AMI; ${n(p.renter_le30_cb50)} pay over half their income on housing`,
      `${n(p.renter_lowinc_costburdened)} of ${n(p.renter_lowinc_le80)} low-income renters are cost-burdened`,
      `Tract ${p.geoid}`,
    ];
  },
  legend: (metric = METRICS[0]) => [
    ...stepLegend(BREAKS[metric.id], RAMPS.warm, (lo, hi) => (hi ? `${lo}–${hi}%` : `${lo}%+`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${BREAKS[metric.id][0]}%` } : item,
    ),
    { color: "rgba(120,120,120,0.35)", label: "No households in this group", shape: "fill" as const },
  ],
  meta: {
    source: "HUD Comprehensive Housing Affordability Strategy (CHAS) 2018–2022, Table 8",
    sourceUrl: "https://www.huduser.gov/portal/datasets/cp.html",
    asOf: "CHAS 2018–2022 (released Dec 2025)",
    geography: "Census tract share, not this parcel",
    evidence: "observed",
    caveats: [
      "Five-year ACS-based tabulation with large tract margins of error.",
      "Income bands use HUD Area Median Family Income (HAMFI), which differs slightly from HUD income limits.",
      "Counts are rounded by HUD.",
    ],
  },
};
