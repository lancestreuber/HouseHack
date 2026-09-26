import { NO_DATA_COLOR, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

type MetricStyle = { breaks: number[]; format: (v: number) => string; source: "lodes" | "umn" };

const n = (v: number) => Math.round(v).toLocaleString();

// Roughly log-spaced breaks from the county distribution (p10–p90 and beyond).
const STYLES: Record<string, MetricStyle> = {
  jobs: { breaks: [50, 200, 500, 1500, 5000], format: n, source: "lodes" },
  jobs_per_sq_mi: { breaks: [100, 500, 2000, 5000, 20000], format: n, source: "lodes" },
  retail_food_jobs: { breaks: [10, 50, 150, 400, 1000], format: n, source: "lodes" },
  health_jobs: { breaks: [10, 50, 200, 800, 3000], format: n, source: "lodes" },
  low_wage_share_pct: { breaks: [10, 15, 20, 30, 40], format: (v) => `${v}%`, source: "lodes" },
  transit_jobs_30: { breaks: [1000, 5000, 20000, 60000, 150000], format: n, source: "umn" },
  transit_jobs_45: { breaks: [5000, 25000, 75000, 150000, 250000], format: n, source: "umn" },
  jobs_per_resident_worker: { breaks: [0.1, 0.25, 0.5, 1, 2.5], format: (v) => `${v}`, source: "lodes" },
  in_commuter_share_pct: { breaks: [15, 22, 30, 38, 47], format: (v) => `${v}%`, source: "lodes" },
};

// Job change 2019–2023 diverges around zero: losses warm, gains teal.
const CHANGE_BREAKS = [-30, -10, 10, 30];
const CHANGE_COLORS = [RAMPS.warm[2], RAMPS.warm[1], "#3a3a4a", RAMPS.neutral[2], RAMPS.neutral[4]];
const CHANGE_LABELS = ["Lost over 30%", "Lost 10–30%", "Within ±10%", "Grew 10–30%", "Grew over 30%"];
const changeFill = [
  "case",
  ["==", ["get", "jobs_change_pct"], null],
  NO_DATA_COLOR,
  ["step", ["get", "jobs_change_pct"], CHANGE_COLORS[0], ...CHANGE_BREAKS.flatMap((b, i) => [b, CHANGE_COLORS[i + 1]])],
];
const isChange = (m: OverlayMetric) => m.id === "jobs_change_pct";

const METRICS: OverlayMetric[] = [
  { id: "transit_jobs_30", label: "Jobs reachable by transit in 30 min", property: "transit_jobs_30" },
  { id: "transit_jobs_45", label: "Jobs reachable by transit in 45 min", property: "transit_jobs_45" },
  { id: "jobs", label: "Jobs located here", property: "jobs" },
  { id: "jobs_per_sq_mi", label: "Job density (per sq mi)", property: "jobs_per_sq_mi" },
  { id: "retail_food_jobs", label: "Retail + food service jobs", property: "retail_food_jobs" },
  { id: "health_jobs", label: "Health care jobs", property: "health_jobs" },
  { id: "low_wage_share_pct", label: "Low-wage share of jobs (≤$1,250/mo)", property: "low_wage_share_pct" },
  { id: "jobs_change_pct", label: "Job change 2019–2023", property: "jobs_change_pct" },
  { id: "jobs_per_resident_worker", label: "Jobs per working resident", property: "jobs_per_resident_worker" },
  { id: "in_commuter_share_pct", label: "Jobs held by out-of-county commuters", property: "in_commuter_share_pct" },
];

export const jobsOverlay: OverlayDefinition = {
  id: "jobs",
  label: "Jobs & transit access",
  group: "heat",
  description: "Where jobs are (LODES 2023) and how many are reachable by transit (UMN 2024), by block group.",
  source: { kind: "static", url: "/data/overlays/jobs.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[0]) => [
    {
      id: "jobs-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": (isChange(metric) ? changeFill : stepFill(metric.property, STYLES[metric.id].breaks, RAMPS.neutral)) as never,
        "fill-opacity": 0.6,
      },
    },
    {
      id: "jobs-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.3, "line-opacity": 0.4 },
    },
  ],
  tooltipLayerIds: ["jobs-fill"],
  tooltip: (p, metric = METRICS[0]) => {
    const style = STYLES[metric.id];
    const v = p[metric.property];
    if (isChange(metric)) {
      return [
        v == null
          ? `Job change 2019–2023: too few jobs in 2019 to compare`
          : `Job change 2019–2023: ${Number(v) > 0 ? "+" : ""}${v}% (${n(Number(p.jobs_2019))} → ${n(Number(p.jobs))})`,
        "Source: LEHD LODES 2019 and 2023",
        `Block group ${p.geoid}`,
      ];
    }
    return [
      `${metric.label}: ${v == null ? "no data" : style.format(Number(v))}`,
      metric.id === "jobs_per_resident_worker" && p.resident_workers != null
        ? `${n(Number(p.jobs))} jobs here · ${n(Number(p.resident_workers))} employed residents`
        : `Jobs located in this block group: ${n(Number(p.jobs))}`,
      style.source === "umn" ? "Source: UMN Access Across America 2024 (weekday 7–9am)" : "Source: LEHD LODES 2023",
      `Block group ${p.geoid}`,
    ].filter(Boolean);
  },
  legend: (metric = METRICS[0]) => {
    if (isChange(metric)) {
      return [
        ...CHANGE_COLORS.map((color, i) => ({ color, label: CHANGE_LABELS[i], shape: "fill" as const })),
        { color: NO_DATA_COLOR, label: `Fewer than 50 jobs in 2019`, shape: "fill" as const },
      ];
    }
    const style = STYLES[metric.id];
    return [
      ...stepLegend(style.breaks, RAMPS.neutral, (lo, hi) =>
        hi ? `${style.format(lo)}–${style.format(hi)}` : `${style.format(lo)}+`,
      ).map((item, i) => (i === 0 ? { ...item, label: `Under ${style.format(style.breaks[0])}` } : item)),
      { color: "rgba(120,120,120,0.35)", label: "No data", shape: "fill" as const },
    ];
  },
  meta: {
    source:
      "U.S. Census Bureau LEHD LODES8 WAC 2023 (public domain); UMN Accessibility Observatory, Access Across America: Transit 2024 (CC BY-NC 4.0)",
    sourceUrl: "https://lehd.ces.census.gov/data/",
    asOf: "Jobs 2023; transit access 2024",
    geography: "Census block group total, not this parcel",
    evidence: "observed",
    caveats: [
      "Jobs are counted at the employer's reporting location; some multi-site employers report at headquarters.",
      "Transit access is a modeled weekday-morning average.",
      "UMN data is licensed for non-commercial use only.",
      "Job change compares 2019 and 2023 LODES; a single employer moving can swing a block group.",
    ],
  },
};
