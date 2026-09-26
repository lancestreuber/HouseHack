import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition } from "./types";

const CITY_ONLY = "City of Pittsburgh only; no county-wide open data exists.";

const KIND_COLORS: Record<string, string> = {
  new_residential: "#22c55e",
  demolition: "#f97316",
  city_demolition: "#ef4444",
};
const KIND_LABELS: Record<string, string> = {
  new_residential: "New residential construction permit",
  demolition: "Demolition permit",
  city_demolition: "City-funded demolition",
};

export const permitsActivityOverlay: OverlayDefinition = {
  id: "permits-activity",
  label: "New homes & demolitions (permits)",
  group: "development",
  description: "PLI permits since 2022: new residential construction and demolitions.",
  source: { kind: "static", url: "/data/overlays/permits-activity.geojson" },
  layers: (sourceId) => [
    {
      id: "permits-activity-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": ["match", ["get", "kind"], "new_residential", "#22c55e", "demolition", "#f97316", "#ef4444"] as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.5, 16, 6] as never,
        "circle-stroke-color": "#000000",
        "circle-stroke-width": 0.5,
      },
    },
  ],
  tooltipLayerIds: ["permits-activity-dots"],
  tooltip: (p) =>
    [
      `${KIND_LABELS[String(p.kind)]}, issued ${p.issued}`,
      p.value ? `Project value: $${Number(p.value).toLocaleString()}` : "",
      p.description ? String(p.description) : "",
      p.neighborhood ? String(p.neighborhood) : "",
    ].filter(Boolean),
  legend: () =>
    Object.entries(KIND_COLORS).map(([k, color]) => ({ color, label: KIND_LABELS[k], shape: "dot" as const })),
  meta: {
    source: "City of Pittsburgh PLI permits (WPRDC, CC-BY)",
    sourceUrl: "https://data.wprdc.org/dataset/pli-permits",
    asOf: "Issued Jan 2022 – Sep 2026",
    geography: "Permit locations",
    evidence: "observed",
    caveats: [CITY_ONLY, "Issued is not built; permits carry no unit counts."],
  },
};

export const condemnedPropertiesOverlay: OverlayDefinition = {
  id: "condemned-properties",
  label: "Condemned properties",
  group: "development",
  description: "Active condemned and dead-end properties (City PLI).",
  source: { kind: "static", url: "/data/overlays/condemned-properties.geojson" },
  layers: (sourceId) => [
    {
      id: "condemned-properties-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": "#a855f7",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 16, 5] as never,
        "circle-stroke-color": "#000000",
        "circle-stroke-width": 0.5,
        "circle-opacity": 0.85,
      },
    },
  ],
  tooltipLayerIds: ["condemned-properties-dots"],
  tooltip: (p) =>
    [
      `Condemned ${String(p.property_type ?? "property").toLowerCase()}`,
      p.since ? `Since ${p.since}` : "",
      p.inspection ? `Latest inspection: ${p.inspection}` : "",
      p.neighborhood ? String(p.neighborhood) : "",
    ].filter(Boolean),
  legend: () => [{ color: "#a855f7", label: "Condemned or dead-end property", shape: "dot" }],
  meta: {
    source: "City of Pittsburgh condemned and dead-end properties (WPRDC, CC-BY)",
    sourceUrl: "https://data.wprdc.org/dataset/condemned-properties",
    asOf: "Updated daily; pulled Sep 2026",
    geography: "Property locations",
    evidence: "observed",
    caveats: [CITY_ONLY, "Condemnation does not establish demolition feasibility or site availability."],
  },
};

const VIOLATION_BREAKS = [10, 25, 40, 70, 110];

export const codeViolationsOverlay: OverlayDefinition = {
  id: "code-violations",
  label: "Code violations (last 24 months)",
  group: "heat",
  description: "Violations found by City inspectors in the last 24 months, per 100 housing units, by block group.",
  source: { kind: "static", url: "/data/overlays/code-violations.geojson" },
  layers: (sourceId) => [
    {
      id: "code-violations-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": stepFill("violations_per_100_units", VIOLATION_BREAKS, RAMPS.warm) as never,
        "fill-opacity": 0.6,
      },
    },
    {
      id: "code-violations-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.3, "line-opacity": 0.4 },
    },
  ],
  tooltipLayerIds: ["code-violations-fill"],
  tooltip: (p) => [
    p.violations_per_100_units == null
      ? "Too few housing units for a rate"
      : `${p.violations_per_100_units} violations found per 100 housing units`,
    `${Number(p.violations_24mo).toLocaleString()} violations in the last 24 months`,
    `Block group ${p.geoid}`,
  ],
  legend: () => [
    ...stepLegend(VIOLATION_BREAKS, RAMPS.warm, (lo, hi) => (hi ? `${lo}–${hi}` : `${lo}+`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${VIOLATION_BREAKS[0]}` } : item,
    ),
    { color: "rgba(120,120,120,0.35)", label: "Outside the city / too few units", shape: "fill" as const },
  ],
  meta: {
    source: "City of Pittsburgh PLI/DOMI/ES violations (WPRDC, CC0); housing units from ACS 2024 5-year",
    sourceUrl: "https://data.wprdc.org/dataset/pittsburgh-pli-violations-report",
    asOf: "Last 24 months, pulled Sep 2026",
    geography: "Census block group rate (city only)",
    evidence: "observed",
    caveats: [
      CITY_ONLY,
      "Complaint-driven: reflects reporting behavior as well as conditions.",
      "Includes refuse and weeds violations, not only building conditions.",
    ],
  },
};
