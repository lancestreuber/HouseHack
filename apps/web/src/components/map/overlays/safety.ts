import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

type MetricStyle = { breaks: number[]; unit: string; format: (v: number) => string };

const STYLES: Record<string, MetricStyle> = {
  violent_per_1k: { breaks: [1, 2, 4, 8, 12], unit: "per 1,000 residents / yr", format: (v) => v.toFixed(1) },
  property_per_1k: { breaks: [8, 12, 20, 35, 60], unit: "per 1,000 residents / yr", format: (v) => v.toFixed(0) },
  homicide_per_10k: { breaks: [0.1, 0.5, 1, 2.5, 5], unit: "per 10,000 residents / yr", format: (v) => v.toFixed(1) },
};

const METRICS: OverlayMetric[] = [
  { id: "violent_per_1k", label: "Violent crime, reported (city only)", property: "violent_per_1k" },
  { id: "property_per_1k", label: "Property crime, reported (city only)", property: "property_per_1k" },
  { id: "homicide_per_10k", label: "Homicides (county-wide)", property: "homicide_per_10k" },
];

export const safetyOverlay: OverlayDefinition = {
  id: "safety",
  label: "Safety (reported)",
  group: "heat",
  description: "Reported crime and homicide rates by census tract.",
  source: { kind: "static", url: "/data/overlays/safety-tracts.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[0]) => [
    {
      id: "safety-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill(metric.property, STYLES[metric.id].breaks, RAMPS.warm) as never,
        "fill-opacity": 0.6,
      },
    },
    {
      id: "safety-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["safety-fill"],
  tooltip: (p, metric = METRICS[0]) => {
    const style = STYLES[metric.id];
    const v = p[metric.property];
    const why =
      metric.id !== "homicide_per_10k" && p.in_city === false ? "outside the city (no incident data)" : "too few residents for a rate";
    return [
      `${metric.label}: ${v == null ? `no rate (${why})` : `${style.format(Number(v))} ${style.unit}`}`,
      metric.id === "homicide_per_10k" ? `Homicides counted: ${p.homicides}` : "",
      `Tract ${p.geoid} · population ${Number(p.population).toLocaleString()}`,
    ].filter(Boolean);
  },
  legend: (metric = METRICS[0]) => {
    const style = STYLES[metric.id];
    return [
      ...stepLegend(style.breaks, RAMPS.warm, (lo, hi) =>
        hi ? `${style.format(lo)}–${style.format(hi)}` : `${style.format(lo)}+`,
      ).map((item, i) => (i === 0 ? { ...item, label: `Under ${style.format(style.breaks[0])}` } : item)),
      { color: "rgba(120,120,120,0.35)", label: "No rate", shape: "fill" as const },
    ];
  },
  meta: {
    source:
      "City of Pittsburgh police blotter, UCR Part I (WPRDC); Allegheny County homicide incidents (ACHD / Medical Examiner); population from ACS 2024 5-year",
    sourceUrl: "https://data.wprdc.org/dataset/uniform-crime-reporting-data",
    asOf: "City crime Dec 2020 – Nov 2023 (blotter ends); homicides 2016–2022 and 2024 (no 2023 layer)",
    geography: "Census tract rate, not this parcel",
    evidence: "observed",
    caveats: [
      "Reported incidents reflect reporting and police deployment, not the risk people experience.",
      "Suburbs have no incident-level crime data; only homicides cover the whole county.",
      "Only tract rates are shipped; no individual incidents or victim details.",
    ],
  },
};

export const seriousCrashesOverlay: OverlayDefinition = {
  id: "serious-crashes",
  label: "Serious traffic crashes",
  group: "hazard",
  description: "PennDOT reportable crashes where someone was killed or seriously injured, 2023–2025.",
  source: { kind: "static", url: "/data/overlays/crashes-ksi.geojson" },
  layers: (sourceId) => [
    {
      id: "serious-crashes-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": ["case", ["get", "fatal"], "#dc2626", "#fb923c"] as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2.5, 16, 6] as never,
        // Pedestrian or bicycle crashes get a white ring.
        "circle-stroke-color": ["case", ["any", ["get", "ped"], ["get", "bike"]], "#ffffff", "#000000"] as never,
        "circle-stroke-width": ["case", ["any", ["get", "ped"], ["get", "bike"]], 1.5, 0.5] as never,
      },
    },
  ],
  tooltipLayerIds: ["serious-crashes-dots"],
  tooltip: (p) => [
    `${p.fatal ? "Fatal crash" : "Serious-injury crash"}, ${p.year}`,
    p.ped || p.bike ? `Involved: ${[p.ped && "pedestrian", p.bike && "bicyclist"].filter(Boolean).join(", ")}` : "",
  ].filter(Boolean),
  legend: () => [
    { color: "#dc2626", label: "Fatal", shape: "dot" },
    { color: "#fb923c", label: "Suspected serious injury", shape: "dot" },
    { color: "#ffffff", label: "Pedestrian or bicyclist involved (white ring)", shape: "dot" },
  ],
  meta: {
    source: "PennDOT reportable crashes, Allegheny County (WPRDC, CC0)",
    sourceUrl: "https://data.wprdc.org/dataset/allegheny-county-crash-data",
    asOf: "2023–2025 (2025 file updated Sep 2026)",
    geography: "Crash locations",
    evidence: "observed",
    caveats: ["Reportable crashes only.", "A few crashes without coordinates are not shown."],
  },
};
