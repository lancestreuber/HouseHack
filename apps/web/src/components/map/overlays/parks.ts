import { matchColor } from "./styles";
import type { OverlayDefinition } from "./types";

const KIND_COLORS: Record<string, string> = {
  county_park: "#15803d",
  municipal_park: "#4ade80",
  greenway: "#166534",
};
const KIND_LABELS: Record<string, string> = {
  county_park: "County park",
  municipal_park: "Municipal park",
  greenway: "Greenway (protected open space, often wooded slopes)",
};

export const parksOverlay: OverlayDefinition = {
  id: "parks",
  label: "Parks & greenways",
  group: "places",
  drawBelowOutlines: true,
  description: "County parks, municipal parks (all 130 municipalities) and City greenways.",
  source: { kind: "static", url: "/data/overlays/parks.geojson" },
  layers: (sourceId) => [
    {
      id: "parks-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": matchColor("kind", KIND_COLORS, "#4ade80") as never,
        "fill-opacity": ["match", ["get", "kind"], "greenway", 0.45, 0.35] as never,
      },
    },
    {
      id: "parks-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": matchColor("kind", KIND_COLORS, "#4ade80") as never,
        "line-width": 1,
        // Greenways get a dashed edge to set them apart from programmed parks.
        "line-dasharray": ["match", ["get", "kind"], "greenway", ["literal", [2, 1]], ["literal", [1, 0]]] as never,
      },
    },
  ],
  tooltipLayerIds: ["parks-fill"],
  tooltip: (p) =>
    [String(p.name ?? "Unnamed park"), KIND_LABELS[String(p.kind)], p.municipality ? String(p.municipality) : ""].filter(
      Boolean,
    ),
  legend: () =>
    Object.entries(KIND_COLORS).map(([k, color]) => ({ color, label: KIND_LABELS[k], shape: "fill" as const })),
  meta: {
    source: "Allegheny County GIS: municipal parks, county park boundaries, greenways",
    sourceUrl:
      "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Municipal_Parks_New/FeatureServer/0",
    asOf: "Municipal parks and greenways edited Apr 2026; county parks Jun 2023",
    geography: "Park polygons; measure distance to the nearest edge, not the center",
    evidence: "observed",
    caveats: ["Park quality and entrances vary.", "Straight-line distance ignores hills and rivers."],
  },
};

export const trailsOverlay: OverlayDefinition = {
  id: "trails",
  label: "Regional trails",
  group: "places",
  description: "Regional trail network: open trails solid, planned or proposed trails dashed.",
  source: { kind: "static", url: "/data/overlays/trails.geojson" },
  layers: (sourceId) => [
    {
      id: "trails-open",
      type: "line",
      source: sourceId,
      filter: ["==", ["get", "open"], true],
      paint: { "line-color": "#a3e635", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1, 16, 3] as never },
    },
    {
      id: "trails-planned",
      type: "line",
      source: sourceId,
      filter: ["==", ["get", "open"], false],
      paint: {
        "line-color": "#a3e635",
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 16, 2] as never,
        "line-dasharray": [2, 2],
        "line-opacity": 0.6,
      },
    },
  ],
  tooltipLayerIds: ["trails-open", "trails-planned"],
  tooltip: (p) => [String(p.name ?? "Trail"), `Status: ${p.status}`],
  legend: () => [
    { color: "#a3e635", label: "Open trail", shape: "line" },
    { color: "#a3e635", label: "Planned or proposed", shape: "dashed-line" },
  ],
  meta: {
    source: "Allegheny County regional trails (county planning)",
    sourceUrl: "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Regional_Trails_(PUBLIC)/FeatureServer/0",
    asOf: "Edited Jan 2025",
    geography: "Trail segments",
    evidence: "observed",
    caveats: ["Planned and proposed segments are not built."],
  },
};
