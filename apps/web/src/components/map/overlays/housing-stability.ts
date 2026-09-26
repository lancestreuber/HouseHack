import { NO_DATA_COLOR, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

const EVICTION_METRICS: OverlayMetric[] = [
  { id: "filings_per_100_renters", label: "Filings per 100 renter households", property: "filings_per_100_renters" },
  { id: "filings_2025", label: "Eviction filings (count)", property: "filings_2025" },
];
const EVICTION_BREAKS: Record<string, number[]> = {
  filings_per_100_renters: [1, 3, 6, 10, 15],
  filings_2025: [10, 50, 150, 300, 500],
};

export const evictionsOverlay: OverlayDefinition = {
  id: "evictions",
  label: "Eviction filings 2025",
  group: "heat",
  description: "Landlord-tenant eviction filings in 2025 by ZIP code (Eviction Lab tracking).",
  source: { kind: "static", url: "/data/overlays/evictions-zip.geojson" },
  metrics: EVICTION_METRICS,
  layers: (sourceId, metric = EVICTION_METRICS[0]) => [
    {
      id: "evictions-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": stepFill(metric.property, EVICTION_BREAKS[metric.id], RAMPS.warm) as never, "fill-opacity": 0.6 },
    },
    {
      id: "evictions-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.6, "line-opacity": 0.6 },
    },
  ],
  tooltipLayerIds: ["evictions-fill"],
  tooltip: (p) =>
    [
      `ZIP ${p.zip}: ${Number(p.filings_2025).toLocaleString()} eviction filings in 2025`,
      p.filings_per_100_renters != null
        ? `${p.filings_per_100_renters} per 100 renter households (${Number(p.renter_households).toLocaleString()} renter households)`
        : "Too few renter households for a rate",
      p.prepandemic_baseline != null ? `Pre-pandemic typical year: ${Number(p.prepandemic_baseline).toLocaleString()}` : "",
    ].filter(Boolean),
  legend: (metric = EVICTION_METRICS[0]) => [
    ...stepLegend(EVICTION_BREAKS[metric.id], RAMPS.warm, (lo, hi) => (hi ? `${lo}–${hi}` : `${lo}+`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${EVICTION_BREAKS[metric.id][0]}` } : item,
    ),
    { color: NO_DATA_COLOR, label: "Under 200 renter households", shape: "fill" as const },
  ],
  meta: {
    source: "Princeton Eviction Lab, Eviction Tracking System (Pittsburgh); renter households from ACS 2024 5-year",
    sourceUrl: "https://evictionlab.org/eviction-tracking/pittsburgh-pa/",
    asOf: "Filings Jan–Dec 2025",
    geography: "ZIP code (ZCTA), not this parcel",
    evidence: "observed",
    caveats: [
      "Filings, not completed evictions.",
      "Cases with a missing or bad ZIP (153 in 2025) aren't on the map, so ZIP counts are undercounts.",
      "PO-box ZIPs have no area and aren't drawn; a few ZIPs extend past the county line.",
    ],
  },
};

const LEAD_METRICS: OverlayMetric[] = [
  { id: "ebll_2015_20_pct", label: "Elevated blood lead, 2015–2020", property: "ebll_2015_20_pct" },
  { id: "ebll_2021_24_pct", label: "Elevated blood lead, 2021–2024 (see caveat)", property: "ebll_2021_24_pct" },
];
const LEAD_BREAKS: Record<string, number[]> = {
  ebll_2015_20_pct: [1, 2.5, 5, 8, 12],
  ebll_2021_24_pct: [5, 10, 15, 25, 35],
};
const unstableProp = (m: OverlayMetric) => (m.id === "ebll_2015_20_pct" ? "ebll_2015_20_unstable" : "ebll_2021_24_unstable");

export const childBloodLeadOverlay: OverlayDefinition = {
  id: "child-blood-lead",
  label: "Children's elevated blood lead",
  group: "heat",
  description: "Share of tested children under 6 with a confirmed elevated blood lead level, by census tract (ACHD).",
  source: { kind: "static", url: "/data/overlays/child-blood-lead.geojson" },
  metrics: LEAD_METRICS,
  layers: (sourceId, metric = LEAD_METRICS[0]) => [
    {
      id: "child-blood-lead-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill(metric.property, LEAD_BREAKS[metric.id], RAMPS.warm) as never,
        "fill-opacity": ["case", ["==", ["get", unstableProp(metric)], true], 0.35, 0.65] as never,
      },
    },
    {
      id: "child-blood-lead-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["child-blood-lead-fill"],
  tooltip: (p, metric = LEAD_METRICS[0]) =>
    [
      p[metric.property] == null
        ? `${metric.label}: suppressed (fewer than 50 children tested)`
        : `${metric.label}: ${p[metric.property]}% of tested children`,
      p[unstableProp(metric)] ? "⚠ Unstable: fewer than 10 elevated results" : "",
      metric.id === "ebll_2015_20_pct" && p.ebll_2021_24_pct != null ? `2021–2024 figure: ${p.ebll_2021_24_pct}% (see caveat)` : "",
      `Tract ${p.geoid} (2010)`,
    ].filter(Boolean),
  legend: (metric = LEAD_METRICS[0]) => [
    ...stepLegend(LEAD_BREAKS[metric.id], RAMPS.warm, (lo, hi) => (hi ? `${lo}–${hi}%` : `${lo}%+`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${LEAD_BREAKS[metric.id][0]}%` } : item,
    ),
    { color: NO_DATA_COLOR, label: "Suppressed (under 50 tested)", shape: "fill" as const },
  ],
  meta: {
    source: "Allegheny County Health Department, Elevated Blood Lead Level Rates (WPRDC, CC0)",
    sourceUrl: "https://data.wprdc.org/dataset/allegheny-county-elevated-blood-lead-level-rates",
    asOf: "Pooled 2015–2020 and 2021–2024 (updated May 2026)",
    geography: "Census tract (2010 boundaries)",
    evidence: "observed",
    caveats: [
      "Share of children tested, not all children; testing has been mandatory for under-6s since 2018.",
      "2015–2020 uses ACHD's documented definition (venous-confirmed ≥ 5 µg/dL).",
      "2021–2024 values run about 10× higher (tract median 15% vs 1.6%) and ACHD doesn't document that column's definition; confirm with ACHD before citing.",
      "Faded tracts had fewer than 10 elevated results. Pre-1978 paint is the main local source, not only water lines.",
    ],
  },
};
