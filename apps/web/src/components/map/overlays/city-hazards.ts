import type { LngLatBounds } from "maplibre-gl";

import type { GeoJSONData, OverlayDefinition } from "./types";

const CITY = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services";
const SLOPE25_URL = `${CITY}/PGHWebSlope25/FeatureServer/0`;
const SLOPE_MIN_ZOOM = 14;
const PAGE_SIZE = 1000;
const MAX_PAGES = 3;

// The City's 25%+ slope layer is ~13 MB even simplified, so fetch the visible area.
async function fetchSteepSlopes(bounds: LngLatBounds, signal: AbortSignal): Promise<GeoJSONData> {
  const features: unknown[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      where: "1=1",
      geometry: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(","),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "objectid",
      outSR: "4326",
      geometryPrecision: "6",
      maxAllowableOffset: "0.00002",
      resultOffset: String(page * PAGE_SIZE),
      resultRecordCount: String(PAGE_SIZE),
      f: "geojson",
    });
    const res = await fetch(`${SLOPE25_URL}/query?${params}`, { signal });
    if (!res.ok) break;
    const batch = ((await res.json()) as { features?: unknown[] }).features ?? [];
    features.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return { type: "FeatureCollection", features };
}

const CITY_HAZARD_META = {
  source: "City of Pittsburgh zoning hazard overlays (Zoning Code Ch. 906), City ArcGIS",
  sourceUrl: `${CITY}/PGHWebLandslideProne/FeatureServer/0`,
  asOf: "Current City layers (pulled Sep 2026)",
  geography: "City of Pittsburgh only",
  evidence: "policy" as const,
};

export const citySteepSlopesOverlay: OverlayDefinition = {
  id: "city-steep-slopes",
  label: "City steep-slope overlay (25%+)",
  group: "hazard",
  drawBelowOutlines: true,
  description: "Areas the City maps as 25% slope or steeper, which trigger extra zoning review. Zoom in to load.",
  source: { kind: "viewport", minZoom: SLOPE_MIN_ZOOM, fetch: fetchSteepSlopes },
  layers: (sourceId) => [
    {
      id: "city-steep-slopes-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": "#ea580c", "fill-opacity": 0.3 },
    },
  ],
  tooltipLayerIds: ["city-steep-slopes-fill"],
  tooltip: () => ["City steep-slope area (25%+)", "Development here gets additional zoning review (Ch. 906)"],
  legend: () => [{ color: "#ea580c", label: "Slope 25% or more (City overlay)", shape: "fill" }],
  meta: {
    ...CITY_HAZARD_META,
    sourceUrl: SLOPE25_URL,
    caveats: [
      `Loads at zoom ${SLOPE_MIN_ZOOM} and closer.`,
      "This is the City's regulatory layer; the USGS slope raster covers the whole county.",
    ],
  },
};

const HAZARD_COLORS: Record<string, string> = { landslide_prone: "#f97316", undermined: "#a855f7" };
const HAZARD_LABELS: Record<string, string> = {
  landslide_prone: "City landslide-prone overlay",
  undermined: "City undermined-area overlay (old mines below)",
};

export const cityHazardOverlaysOverlay: OverlayDefinition = {
  id: "city-hazard-overlays",
  label: "City landslide-prone & undermined overlays",
  group: "hazard",
  drawBelowOutlines: true,
  description: "The City's own landslide-prone and undermined overlay districts, which trigger extra zoning review.",
  source: { kind: "static", url: "/data/overlays/city-hazard-overlays.geojson" },
  layers: (sourceId) => [
    {
      id: "city-hazard-overlays-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": ["match", ["get", "kind"], "undermined", HAZARD_COLORS.undermined, HAZARD_COLORS.landslide_prone] as never,
        "fill-opacity": 0.2,
      },
    },
    {
      id: "city-hazard-overlays-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": ["match", ["get", "kind"], "undermined", HAZARD_COLORS.undermined, HAZARD_COLORS.landslide_prone] as never,
        "line-width": 1.5,
      },
    },
  ],
  tooltipLayerIds: ["city-hazard-overlays-fill"],
  tooltip: (p) => [HAZARD_LABELS[String(p.kind)] ?? "City hazard overlay", "Development here gets additional zoning review (Ch. 906)"],
  legend: () => Object.entries(HAZARD_COLORS).map(([k, color]) => ({ color, label: HAZARD_LABELS[k], shape: "fill" as const })),
  meta: {
    ...CITY_HAZARD_META,
    caveats: [
      "Regulatory overlays, not site surveys. The county landslide and DEP mined-out layers cover more ground.",
    ],
  },
};

export const landslidePublicAssistanceOverlay: OverlayDefinition = {
  id: "landslide-public-assistance",
  label: "Landslide damage sites (FEMA aid)",
  group: "hazard",
  description: "Landslide damage sites in the county with FEMA public-assistance records (roads, utilities, parks).",
  source: { kind: "static", url: "/data/overlays/landslide-public-assistance.geojson" },
  layers: (sourceId) => [
    {
      id: "landslide-public-assistance-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": "#dc2626",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 16, 7] as never,
        "circle-stroke-color": "#fde68a",
        "circle-stroke-width": 1.5,
      },
    },
  ],
  tooltipLayerIds: ["landslide-public-assistance-dots"],
  tooltip: (p) =>
    [
      String(p.location ?? "Landslide site"),
      p.municipality ? String(p.municipality).replace(/^Allegheny,\s*/, "") : "",
      p.category ? String(p.category).replace(/^[A-G] - /, "Aid category: ") : "",
      p.damage_value ? `Estimated damage: $${Number(p.damage_value).toLocaleString()}` : "",
    ].filter(Boolean),
  legend: () => [{ color: "#dc2626", label: "Landslide site with FEMA aid record", shape: "dot" }],
  meta: {
    source: "Allegheny County landslide public-assistance sites (County ArcGIS)",
    sourceUrl:
      "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Public_Assistance/FeatureServer/0",
    asOf: "Pulled Sep 2026 (event dates not published in the layer)",
    geography: "Damage site points",
    evidence: "observed",
    caveats: ["Public infrastructure damage only; private property slides aren't included.", "Damage values are the layer's estimates."],
  },
};
