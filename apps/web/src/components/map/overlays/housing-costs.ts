import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

type MetricStyle = {
  breaks: number[];
  colors: string[];
  format: (v: number) => string;
  // Metrics with a direct ACS MOE carry `<property>_moe` and `<property>_unreliable`.
  hasMoe?: boolean;
};

const usd = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${v}%`;

// Breaks set from the Allegheny County block-group distribution (roughly p10–p90).
// Income, rent and value use a neutral ramp so "low" doesn't read as "bad".
const STYLES: Record<string, MetricStyle> = {
  median_hh_income: { breaks: [40000, 60000, 80000, 100000, 140000], colors: RAMPS.neutral, format: usd, hasMoe: true },
  median_gross_rent: { breaks: [800, 1000, 1150, 1350, 1700], colors: RAMPS.neutral, format: usd, hasMoe: true },
  median_home_value: { breaks: [90000, 150000, 210000, 300000, 450000], colors: RAMPS.neutral, format: usd, hasMoe: true },
  rent_burden_pct: { breaks: [20, 35, 45, 55, 70], colors: RAMPS.warm, format: pct },
  vacancy_pct: { breaks: [3, 6, 10, 15, 25], colors: RAMPS.warm, format: pct },
  other_vacant_pct: { breaks: [1, 3, 6, 10, 16], colors: RAMPS.warm, format: pct },
};

const METRICS: OverlayMetric[] = [
  { id: "median_hh_income", label: "Median household income", property: "median_hh_income" },
  { id: "median_gross_rent", label: "Median gross rent", property: "median_gross_rent" },
  { id: "median_home_value", label: "Median home value", property: "median_home_value" },
  { id: "rent_burden_pct", label: "Renters paying 30%+ of income", property: "rent_burden_pct" },
  { id: "vacancy_pct", label: "Vacant housing units", property: "vacancy_pct" },
  { id: "other_vacant_pct", label: "\"Other\" vacant (not for rent/sale/seasonal)", property: "other_vacant_pct" },
];

export const housingCostsOverlay: OverlayDefinition = {
  id: "housing-costs",
  label: "Income & housing cost",
  group: "heat",
  description: "ACS 2024 5-year income, rent, home value, rent burden and vacancy by census block group.",
  source: { kind: "static", url: "/data/overlays/housing-costs.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[0]) => {
    const style = STYLES[metric.id];
    return [
      {
        id: "housing-costs-fill",
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": stepFill(metric.property, style.breaks, style.colors) as never,
          // Fade estimates whose margin of error exceeds 40% of the value.
          "fill-opacity": ["case", ["==", ["get", `${metric.property}_unreliable`], true], 0.2, 0.6] as never,
        },
      },
      {
        id: "housing-costs-outline",
        type: "line",
        source: sourceId,
        paint: { "line-color": "#000000", "line-width": 0.3, "line-opacity": 0.4 },
      },
    ];
  },
  tooltipLayerIds: ["housing-costs-fill"],
  tooltip: (p, metric = METRICS[0]) => {
    const style = STYLES[metric.id];
    const value = p[metric.property];
    const moe = p[`${metric.property}_moe`];
    return [
      `${metric.label}: ${value == null ? "no estimate (suppressed or too few households)" : style.format(Number(value))}`,
      style.hasMoe && moe != null && value != null ? `± ${style.format(Number(moe))} (90% margin of error)` : "",
      p[`${metric.property}_unreliable`] === true && value != null ? "⚠ Low reliability: large margin of error" : "",
      `Block group ${p.geoid}`,
    ].filter(Boolean);
  },
  legend: (metric = METRICS[0]) => {
    const style = STYLES[metric.id];
    return [
      ...stepLegend(style.breaks, style.colors, (lo, hi) =>
        hi ? `${style.format(lo)}–${style.format(hi)}` : `${style.format(lo)}+`,
      ),
      { color: "rgba(120,120,120,0.35)", label: "No estimate", shape: "fill" as const },
    ];
  },
  meta: {
    source: "U.S. Census Bureau, ACS 2024 5-year (2020–2024), via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/05000US42003-allegheny-county-pa/",
    asOf: "ACS 2024 5-year release",
    geography: "Census block group estimate, not this parcel",
    evidence: "observed",
    caveats: [
      "Five-year average, not current conditions.",
      "Faded areas have a margin of error over 40% of the estimate.",
      "The ACS vacancy rate includes normal turnover; \"other\" vacant is the closest proxy for abandonment.",
    ],
  },
};

const USPS_METRICS: OverlayMetric[] = [
  { id: "res_vacancy_pct", label: "Vacant residential addresses", property: "res_vacancy_pct" },
  { id: "no_stat_pct", label: "No-stat addresses (often demolished or abandoned)", property: "no_stat_pct" },
];
const USPS_BREAKS = [1, 2.5, 5, 10, 15];

export const uspsVacancyOverlay: OverlayDefinition = {
  id: "usps-vacancy",
  label: "Vacant addresses (USPS)",
  group: "heat",
  description: "Share of residential addresses USPS reports vacant, 2023 Q4, by census tract.",
  source: { kind: "static", url: "/data/overlays/usps-vacancy.geojson" },
  metrics: USPS_METRICS,
  layers: (sourceId, metric = USPS_METRICS[0]) => [
    {
      id: "usps-vacancy-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": stepFill(metric.property, USPS_BREAKS, RAMPS.warm) as never, "fill-opacity": 0.6 },
    },
    {
      id: "usps-vacancy-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["usps-vacancy-fill"],
  tooltip: (p, metric = USPS_METRICS[0]) => [
    `${metric.label}: ${p[metric.property] == null ? "no data" : `${p[metric.property]}%`}`,
    p.res_addresses == null ? "" : `Active residential addresses: ${Number(p.res_addresses).toLocaleString()}`,
    `Tract ${p.geoid}`,
  ].filter(Boolean),
  legend: () => [
    ...stepLegend(USPS_BREAKS, RAMPS.warm, (lo, hi) => (hi ? `${lo}–${hi}%` : `${lo}%+`)),
    { color: "rgba(120,120,120,0.35)", label: "No data", shape: "fill" as const },
  ],
  meta: {
    source: "HUD/USPS vacant address data (WPRDC, CC0)",
    sourceUrl: "https://data.wprdc.org/datastore/dump/70dd02d2-137d-43c9-b158-f7b1ec6c6d42",
    asOf: "2023 Q4",
    geography: "Census tract share, not this parcel",
    evidence: "observed",
    caveats: [
      "Vacant means the carrier reports mail uncollected for 90+ days.",
      "Students and seasonal residents can inflate it.",
    ],
  },
};
