import { matchColor } from "./styles";
import type { OverlayDefinition } from "./types";

const CLASS_COLORS: Record<string, string> = {
  recent: "#b91c1c",
  old_or_redbed: "#ea580c",
  fill_or_creep: "#f59e0b",
};

const CLASS_LABELS: Record<string, string> = {
  recent: "Recent landslides or rockfall",
  old_or_redbed: "Old slide deposits or red-bed soils",
  fill_or_creep: "Man-made fill, soil creep or very steep slope",
};

const FLAG_LABELS: Record<string, string> = {
  reclan: "recent landslide",
  rockfall: "rockfall",
  prehis: "prehistoric slide deposit",
  redbed: "red-bed soils",
  manfill: "man-made fill",
  creep: "soil creep",
  vslope: "very steep slope",
};

export const landslideSusceptibilityOverlay: OverlayDefinition = {
  id: "landslide-susceptibility",
  label: "Landslide-prone areas",
  group: "hazard",
  description: "Mapped landslide susceptibility, county-wide.",
  source: { kind: "static", url: "/data/overlays/landslide-susceptibility.geojson" },
  layers: (sourceId) => [
    {
      id: "landslide-susceptibility-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": matchColor("class", CLASS_COLORS, "#f59e0b") as never, "fill-opacity": 0.35 },
    },
    {
      id: "landslide-susceptibility-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": matchColor("class", CLASS_COLORS, "#f59e0b") as never,
        "line-width": 0.5,
        "line-opacity": 0.8,
      },
    },
  ],
  tooltipLayerIds: ["landslide-susceptibility-fill"],
  tooltip: (p) => [
    CLASS_LABELS[String(p.class)] ?? String(p.class),
    `Mapped: ${String(p.flags ?? "")
      .split(",")
      .filter(Boolean)
      .map((f) => FLAG_LABELS[f] ?? f)
      .join(", ")}`,
  ],
  legend: () =>
    Object.entries(CLASS_COLORS).map(([k, color]) => ({ color, label: CLASS_LABELS[k], shape: "fill" as const })),
  meta: {
    source: "USGS-era landslide susceptibility mapping (1970s–80s), via Allegheny County GIS",
    sourceUrl: "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Prone_Areas/FeatureServer/0",
    asOf: "County layer edited Jul 2018; underlying mapping decades old",
    geography: "Mapped susceptibility polygons; check parcel overlap, not just its center",
    evidence: "observed",
    caveats: [
      "Provenance inferred: the county service has no description or license.",
      "Susceptibility, not a prediction. Site-specific geotechnical review is still required.",
    ],
  },
};

export const landslideIncidentsOverlay: OverlayDefinition = {
  id: "landslide-incidents",
  label: "Landslide incidents (county roads)",
  group: "hazard",
  description: "Landslides recorded by Allegheny County Public Works on county roads.",
  source: { kind: "static", url: "/data/overlays/landslide-incidents.geojson" },
  layers: (sourceId) => [
    {
      id: "landslide-incidents-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": ["match", ["get", "remediated"], "Yes", "#fca5a5", "#b91c1c"] as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 16, 7] as never,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    },
  ],
  tooltipLayerIds: ["landslide-incidents-dots"],
  tooltip: (p) =>
    [
      `${p.location ?? "Landslide"}${p.municipality ? `, ${p.municipality}` : ""}`,
      p.date ? `Occurred: ${p.date}` : "Date not recorded",
      `Remediated: ${p.remediated ?? "unknown"} · Traffic restriction: ${p.traffic_restriction ?? "unknown"}`,
    ].filter(Boolean),
  legend: () => [
    { color: "#b91c1c", label: "Not remediated", shape: "dot" },
    { color: "#fca5a5", label: "Remediated", shape: "dot" },
  ],
  meta: {
    source: "Allegheny County Public Works landslide records",
    sourceUrl: "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslides_DPW/FeatureServer/0",
    asOf: "Edited Sep 2025",
    geography: "Incident points on county-maintained roads",
    evidence: "observed",
    caveats: ["County roads only; city and private slides are not included.", "Some dates are missing."],
  },
};
