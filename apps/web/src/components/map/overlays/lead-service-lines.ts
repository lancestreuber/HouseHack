import { matchColor } from "./styles";
import type { OverlayDefinition } from "./types";

// Below this zoom, lead lines draw as a density heatmap; above it, as dots.
const DOT_ZOOM = 14;

const STATUS_COLORS: Record<string, string> = {
  lead: "#ef4444",
  galvanized: "#f59e0b",
  unknown: "#a3a3a3",
};

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead (either side)",
  galvanized: "Galvanized",
  unknown: "Unknown material",
};

export const leadServiceLinesOverlay: OverlayDefinition = {
  id: "lead-service-lines",
  label: "Lead service lines",
  group: "infrastructure",
  description: "Water service lines that are lead, galvanized or of unknown material, by service address.",
  source: { kind: "static", url: "/data/overlays/lead-service-lines.geojson" },
  layers: (sourceId) => [
    {
      id: "lead-service-lines-heat",
      type: "heatmap",
      source: sourceId,
      maxzoom: DOT_ZOOM + 1,
      filter: ["==", ["get", "status"], "lead"],
      paint: {
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, DOT_ZOOM, 14] as never,
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.6, DOT_ZOOM, 1.2] as never,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(239,68,68,0)",
          0.3,
          "rgba(239,68,68,0.35)",
          0.7,
          "rgba(248,113,113,0.7)",
          1,
          "rgba(254,202,202,0.95)",
        ] as never,
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], DOT_ZOOM - 1, 0.85, DOT_ZOOM + 1, 0] as never,
      },
    },
    {
      id: "lead-service-lines-dots",
      type: "circle",
      source: sourceId,
      minzoom: DOT_ZOOM,
      paint: {
        "circle-color": matchColor("status", STATUS_COLORS, "#a3a3a3") as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], DOT_ZOOM, 2, 18, 5] as never,
        "circle-stroke-color": "#000000",
        "circle-stroke-width": 0.5,
      },
    },
  ],
  tooltipLayerIds: ["lead-service-lines-dots"],
  tooltip: (p) => [
    STATUS_LABELS[String(p.status)] ?? String(p.status),
    `Public side: ${p.public} · Private side: ${p.private}`,
  ],
  legend: () => [
    { color: "rgba(248,113,113,0.8)", label: "Lead density (zoomed out)", shape: "fill" },
    ...Object.entries(STATUS_COLORS).map(([k, color]) => ({ color, label: STATUS_LABELS[k], shape: "dot" as const })),
  ],
  meta: {
    source: "Pittsburgh Water (PWSA) service line material",
    sourceUrl:
      "https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/PGH2O_Water_Service_Line_Material/FeatureServer/0",
    asOf: "PWSA layer, edited Sep 2026",
    geography: "One point per service address (PWSA service area only)",
    evidence: "observed",
    caveats: [
      "Non-lead addresses (~61k of ~81k) are not drawn.",
      "Unknown means not yet inspected, not safe.",
      "PWSA publishes this with an accuracy disclaimer.",
    ],
  },
};
