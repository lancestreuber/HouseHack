import { matchColor } from "./styles";
import type { OverlayDefinition } from "./types";

const CLASS_COLORS: Record<string, string> = {
  floodway: "#1e40af",
  sfha: "#3b82f6",
  moderate: "#93c5fd",
};

const CLASS_LABELS: Record<string, string> = {
  floodway: "Regulatory floodway",
  sfha: "1% annual chance (100-year, SFHA)",
  moderate: "0.2% annual chance (500-year)",
};

export const floodZonesOverlay: OverlayDefinition = {
  id: "flood-zones",
  label: "Flood zones",
  group: "hazard",
  description: "FEMA mapped flood hazard zones (effective FIRMs).",
  source: { kind: "static", url: "/data/overlays/flood-zones.geojson" },
  layers: (sourceId) => [
    {
      id: "flood-zones-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": matchColor("class", CLASS_COLORS, "#93c5fd") as never,
        "fill-opacity": ["match", ["get", "class"], "moderate", 0.3, 0.5] as never,
      },
    },
    {
      id: "flood-zones-outline",
      type: "line",
      source: sourceId,
      filter: ["!=", ["get", "class"], "moderate"],
      paint: { "line-color": "#1e3a8a", "line-width": 0.6, "line-opacity": 0.8 },
    },
  ],
  tooltipLayerIds: ["flood-zones-fill"],
  tooltip: (p) => [
    CLASS_LABELS[String(p.class)] ?? String(p.class),
    `FEMA zone ${p.zone}${p.subtype ? ` (${String(p.subtype).toLowerCase()})` : ""}`,
    p.bfe_ft == null ? "" : `Base flood elevation: ${p.bfe_ft} ft`,
  ].filter(Boolean),
  legend: () =>
    Object.entries(CLASS_COLORS).map(([k, color]) => ({ color, label: CLASS_LABELS[k], shape: "fill" as const })),
  meta: {
    source: "FEMA National Flood Hazard Layer (effective FIRMs)",
    sourceUrl: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
    asOf: "Effective FIRM panels (dates vary by panel)",
    geography: "Mapped flood zone polygons; check parcel overlap, not just its center",
    evidence: "observed",
    caveats: [
      "FIRMs map riverine flooding only, not flash floods, basement backups or combined-sewer flooding.",
      "Some panels are decades old.",
      "Not an insurance or legal flood determination.",
    ],
  },
};
