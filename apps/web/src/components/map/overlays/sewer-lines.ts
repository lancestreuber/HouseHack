import type { LngLatBounds } from "maplibre-gl";

import type { GeoJSONData, OverlayDefinition } from "./types";

// 125k segments countywide: too big to ship as a file, so fetch the visible
// area straight from the County ArcGIS service (CORS-enabled) when zoomed in.
const LAYER_URL =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Pittsburgh_Sewers/FeatureServer/0";
const MIN_ZOOM = 15;
const PAGE_SIZE = 1000;
const MAX_PAGES = 5;

async function fetchSewers(bounds: LngLatBounds, signal: AbortSignal): Promise<GeoJSONData> {
  const features: unknown[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      where: "1=1",
      geometry: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(","),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "System_Type,Pipe_Flow_Type,Diameter_Range,Estimated_Owner",
      outSR: "4326",
      geometryPrecision: "6",
      resultOffset: String(page * PAGE_SIZE),
      resultRecordCount: String(PAGE_SIZE),
      f: "geojson",
    });
    const res = await fetch(`${LAYER_URL}/query?${params}`, { signal });
    if (!res.ok) break;
    const data = (await res.json()) as { features?: unknown[] };
    const batch = data.features ?? [];
    features.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return { type: "FeatureCollection", features };
}

// Diameter_Range values (inches): " <10", "b10-12", "12-14", "15-17", "18-23",
// "24-35", "36-59", "=>60", "no diameter", "". Wider pipe draws a wider line.
const lineWidth = [
  "match",
  ["get", "Diameter_Range"],
  " <10",
  1,
  "b10-12",
  1.2,
  "12-14",
  1.4,
  "15-17",
  1.8,
  "18-23",
  2.2,
  "24-35",
  2.8,
  "36-59",
  3.4,
  "=>60",
  4,
  1,
];

// System_Type values: "combined", "separate sanitary", "stormCOM",
// "unknown system value", "zALCOSAN combined", "zALCOSAN separate sanitary", "".
// ALCOSAN (the regional authority) rows are its large interceptor sewers.

export const sewerLinesOverlay: OverlayDefinition = {
  id: "sewer-lines",
  label: "Sewer lines",
  group: "infrastructure",
  description: "Sewer pipes by system type and diameter (zoom in to load).",
  source: { kind: "viewport", minZoom: MIN_ZOOM, fetch: fetchSewers },
  layers: (sourceId) => [
    {
      id: "sewer-lines-combined",
      type: "line",
      source: sourceId,
      filter: ["in", "combined", ["downcase", ["coalesce", ["get", "System_Type"], ""]]],
      paint: { "line-color": "#7dd3fc", "line-width": lineWidth as never, "line-opacity": 0.9 },
    },
    {
      id: "sewer-lines-separate",
      type: "line",
      source: sourceId,
      filter: ["!", ["in", "combined", ["downcase", ["coalesce", ["get", "System_Type"], ""]]]],
      paint: {
        "line-color": "#5eead4",
        "line-width": lineWidth as never,
        "line-dasharray": [2, 1.5],
        "line-opacity": 0.9,
      },
    },
  ],
  tooltipLayerIds: ["sewer-lines-combined", "sewer-lines-separate"],
  tooltip: (p) => [
    `${String(p.System_Type || "unknown system").replace(/^zALCOSAN /, "ALCOSAN interceptor, ")} · ${p.Pipe_Flow_Type ?? ""}`.trim(),
    `Diameter: ${String(p.Diameter_Range || "unknown").replace(/^b/, "").trim()} in`,
    `Owner (est.): ${p.Estimated_Owner ?? "unknown"}`,
  ],
  legend: () => [
    { color: "#7dd3fc", label: "Combined sewer", shape: "line" },
    { color: "#5eead4", label: "Separate sanitary, storm or unknown", shape: "dashed-line" },
  ],
  meta: {
    source: "Allegheny County sewer lines (3 Rivers Wet Weather / LBs export)",
    sourceUrl: LAYER_URL,
    asOf: "2012 export (last edited Jan 2018)",
    geography: "Pipe segments; loads for the visible area at zoom 15+",
    evidence: "observed",
    caveats: [
      "Dated snapshot: newer PWSA work is not reflected.",
      "Capacity is not public, so this shows where pipes are, not whether they can take new load.",
    ],
  },
};
