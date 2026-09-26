import { matchColor, NO_DATA_COLOR, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

// MVA market types, strongest (A) to most distressed (J). An ordinal ramp, labeled
// by market strength rather than "good/bad".
const MVA_TYPES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const MVA_RAMP = ["#0c2a3a", "#134e66", "#1a6480", "#1f7a8c", "#2f91a2", "#3fa9b8", "#67bec7", "#8fd3d6", "#b8e5e6", "#e0f7f5"];
const MVA_COLORS = Object.fromEntries(MVA_TYPES.map((t, i) => [t, MVA_RAMP[i]]));

const DRR_CLASSES = [
  "Below Countywide Ave",
  "0.0 - 0.5",
  "0.5 - 1.0",
  "1.0 - 1.5",
  "1.5 - 2.0",
  "2.0 - 2.5",
  "2.5 - 3.0",
  "3.0 or Above",
];
const DRR_RAMP = ["#2d1b4e", "#3b0f70", "#6a1a7a", "#8c2981", "#b73779", "#de4968", "#fe9f6d", "#fcfdbf"];
const DRR_COLORS = Object.fromEntries(DRR_CLASSES.map((c, i) => [c, DRR_RAMP[i]]));

const usd = (v: number) => `$${Math.round(v).toLocaleString()}`;

const MVA_METRICS: OverlayMetric[] = [
  { id: "mva", label: "Market type (MVA 2021)", property: "mva" },
  { id: "drr_class", label: "Displacement risk ratio (2019/20)", property: "drr_class" },
  { id: "median_sale_1719", label: "Median sale price 2017–19", property: "median_sale_1719" },
  { id: "price_change_1419_pct", label: "Sale price change 2014→2019", property: "price_change_1419_pct" },
];
const SALE_BREAKS = [50000, 100000, 150000, 250000, 400000];
const CHANGE_BREAKS = [0, 15, 30, 60, 100];

function mvaFill(metric: OverlayMetric) {
  if (metric.id === "mva") return matchColor("mva", MVA_COLORS, NO_DATA_COLOR);
  if (metric.id === "drr_class") return matchColor("drr_class", DRR_COLORS, NO_DATA_COLOR);
  if (metric.id === "median_sale_1719") return stepFill("median_sale_1719", SALE_BREAKS, RAMPS.neutral);
  return stepFill("price_change_1419_pct", CHANGE_BREAKS, RAMPS.warm);
}

export const marketMvaOverlay: OverlayDefinition = {
  id: "market-mva",
  label: "Market type & displacement risk",
  group: "heat",
  description: "Market Value Analysis 2021 market types and the Displacement Risk Ratio, by block group.",
  source: { kind: "static", url: "/data/overlays/market-mva.geojson" },
  metrics: MVA_METRICS,
  layers: (sourceId, metric = MVA_METRICS[0]) => [
    {
      id: "market-mva-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": mvaFill(metric) as never, "fill-opacity": 0.6 },
    },
    {
      id: "market-mva-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.3, "line-opacity": 0.4 },
    },
  ],
  tooltipLayerIds: ["market-mva-fill"],
  tooltip: (p) =>
    [
      `Market type: ${p.mva === "NC" || p.mva == null ? "not classified" : `${p.mva} (A = strongest … J = most distressed)`}`,
      `Displacement risk ratio 2019/20: ${p.drr_class ?? "insufficient data"}`,
      p.median_sale_1719 != null ? `Median sale price 2017–19: ${usd(Number(p.median_sale_1719))}` : "",
      p.owner_occupied_pct != null ? `Owner-occupied: ${p.owner_occupied_pct}%` : "",
      p.vacant_lot_pct != null ? `Vacant land: ${p.vacant_lot_pct}%` : "",
      `Block group ${p.geoid} (2010)`,
    ].filter(Boolean),
  legend: (metric = MVA_METRICS[0]) => {
    if (metric.id === "mva")
      return [
        ...MVA_TYPES.map((t, i) => ({
          color: MVA_COLORS[t],
          label: i === 0 ? "A: strongest market" : i === MVA_TYPES.length - 1 ? "J: most distressed" : t,
          shape: "fill" as const,
        })),
        { color: NO_DATA_COLOR, label: "Not classified", shape: "fill" as const },
      ];
    if (metric.id === "drr_class")
      return [
        ...DRR_CLASSES.map((c) => ({ color: DRR_COLORS[c], label: c, shape: "fill" as const })),
        { color: NO_DATA_COLOR, label: "Insufficient data", shape: "fill" as const },
      ];
    const isSale = metric.id === "median_sale_1719";
    const breaks = isSale ? SALE_BREAKS : CHANGE_BREAKS;
    const fmt = isSale ? usd : (v: number) => `${v}%`;
    return [
      ...stepLegend(breaks, isSale ? RAMPS.neutral : RAMPS.warm, (lo, hi) => (hi ? `${fmt(lo)}–${fmt(hi)}` : `${fmt(lo)}+`)),
      { color: NO_DATA_COLOR, label: "No data", shape: "fill" as const },
    ];
  },
  meta: {
    source: "Reinvestment Fund Market Value Analysis 2021 and Displacement Risk Ratio, for URA / Allegheny County (WPRDC, CC0)",
    sourceUrl: "https://data.wprdc.org/dataset/market-value-analysis-2021",
    asOf: "MVA 2021 (2017–19 sales); DRR through 2019/20",
    geography: "Census block group (2010 boundaries)",
    evidence: "observed",
    caveats: [
      "Pre-pandemic data; the market has moved since.",
      "The DRR measures price growth relative to what long-time residents can afford; its exact formula is not fully documented.",
    ],
  },
};

const ZIP_METRICS: OverlayMetric[] = [
  { id: "median_sale_price", label: "Median sale price (2024–26)", property: "median_sale_price" },
  { id: "zori_rent", label: "Typical asking rent (Zillow)", property: "zori_rent" },
  { id: "zori_yoy_pct", label: "Rent change, 1 year", property: "zori_yoy_pct" },
  { id: "zori_5yr_pct", label: "Rent change, 5 years", property: "zori_5yr_pct" },
];
const ZIP_STYLES: Record<string, { breaks: number[]; colors: string[]; fmt: (v: number) => string }> = {
  median_sale_price: { breaks: [75000, 150000, 225000, 325000, 450000], colors: RAMPS.neutral, fmt: usd },
  zori_rent: { breaks: [1000, 1200, 1400, 1600, 1900], colors: RAMPS.neutral, fmt: usd },
  zori_yoy_pct: { breaks: [0, 2, 4, 6, 8], colors: RAMPS.warm, fmt: (v) => `${v}%` },
  zori_5yr_pct: { breaks: [10, 20, 30, 40, 50], colors: RAMPS.warm, fmt: (v) => `${v}%` },
};

export const marketZipOverlay: OverlayDefinition = {
  id: "market-zip",
  label: "Prices & rents by ZIP",
  group: "heat",
  description: "Recent median sale prices (county records) and Zillow asking rents, by ZIP code.",
  source: { kind: "static", url: "/data/overlays/market-zip.geojson" },
  metrics: ZIP_METRICS,
  layers: (sourceId, metric = ZIP_METRICS[0]) => {
    const s = ZIP_STYLES[metric.id];
    return [
      {
        id: "market-zip-fill",
        type: "fill",
        source: sourceId,
        paint: { "fill-color": stepFill(metric.property, s.breaks, s.colors) as never, "fill-opacity": 0.55 },
      },
      {
        id: "market-zip-outline",
        type: "line",
        source: sourceId,
        paint: { "line-color": "#000000", "line-width": 0.6, "line-opacity": 0.6 },
      },
    ];
  },
  tooltipLayerIds: ["market-zip-fill"],
  tooltip: (p) =>
    [
      `ZIP ${p.zip}`,
      p.median_sale_price != null
        ? `Median valid sale price since 2024: ${usd(Number(p.median_sale_price))} (${p.valid_sales} sales)`
        : `Too few valid sales since 2024 (${p.valid_sales})`,
      p.zori_rent != null ? `Typical asking rent: ${usd(Number(p.zori_rent))}/mo (${p.zori_month})` : "No Zillow rent index",
      p.zori_yoy_pct != null ? `Rent change: ${p.zori_yoy_pct}% (1 yr), ${p.zori_5yr_pct ?? "?"}% (5 yr)` : "",
    ].filter(Boolean),
  legend: (metric = ZIP_METRICS[0]) => {
    const s = ZIP_STYLES[metric.id];
    return [
      ...stepLegend(s.breaks, s.colors, (lo, hi) => (hi ? `${s.fmt(lo)}–${s.fmt(hi)}` : `${s.fmt(lo)}+`)),
      { color: NO_DATA_COLOR, label: "No data", shape: "fill" as const },
    ];
  },
  meta: {
    source: "Allegheny County property sales (WPRDC, CC0); Zillow Observed Rent Index (Zillow Research)",
    sourceUrl: "https://www.zillow.com/research/data/",
    asOf: "Valid sales Jan 2024 onward; ZORI through Aug 2026",
    geography: "ZIP code (ZCTA); not neighborhoods",
    evidence: "observed",
    caveats: [
      "County sales need 1–2 months to be validated, so the latest months are missing.",
      "ZORI tracks listed asking rents, not what existing tenants pay.",
    ],
  },
};
