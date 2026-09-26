import type { LngLatBounds } from "maplibre-gl";

import { matchColor } from "./styles";
import type { GeoJSONData, OverlayDefinition } from "./types";

// 75k vacant lots are too many for one file, so the build splits them into a
// grid of tile files (public/data/overlays/vacant-lots/<ix>_<iy>.geojson) plus
// a density summary. Zoomed out the map shows the summary as a heatmap; zoomed
// in it loads only the tiles in view.
export const VACANT_LOT_GRID = { west: -80.4, south: 40.15, size: 0.02, overviewCell: 0.005 };
const DETAIL_MAX_SPAN = 0.1; // degrees of longitude: zoom 14 on maps up to ~1,150 px wide

const tileCache = new Map<string, Promise<unknown[]>>();
let overviewCache: Promise<unknown[]> | null = null;

function loadFeatures(url: string, signal: AbortSignal): Promise<unknown[]> {
  return fetch(url, { signal })
    .then((r) => (r.ok ? (r.json() as Promise<{ features: unknown[] }>) : { features: [] }))
    .then((d) => d.features);
}

async function fetchVacantLots(bounds: LngLatBounds, signal: AbortSignal): Promise<GeoJSONData> {
  if (bounds.getEast() - bounds.getWest() > DETAIL_MAX_SPAN) {
    overviewCache ??= loadFeatures("/data/overlays/vacant-lots-overview.geojson", signal).catch((e) => {
      overviewCache = null;
      throw e;
    });
    return { type: "FeatureCollection", features: await overviewCache };
  }
  const { west, south, size } = VACANT_LOT_GRID;
  const ix0 = Math.floor((bounds.getWest() - west) / size);
  const ix1 = Math.floor((bounds.getEast() - west) / size);
  const iy0 = Math.floor((bounds.getSouth() - south) / size);
  const iy1 = Math.floor((bounds.getNorth() - south) / size);
  const loads: Promise<unknown[]>[] = [];
  for (let ix = ix0; ix <= ix1; ix++) {
    for (let iy = iy0; iy <= iy1; iy++) {
      const key = `${ix}_${iy}`;
      if (!tileCache.has(key)) {
        // Missing tiles (no lots there) come back empty and are cached as such.
        tileCache.set(
          key,
          loadFeatures(`/data/overlays/vacant-lots/${key}.geojson`, signal).catch((e) => {
            tileCache.delete(key);
            throw e;
          }),
        );
      }
      loads.push(tileCache.get(key)!);
    }
  }
  return { type: "FeatureCollection", features: (await Promise.all(loads)).flat() };
}

const LOT_USE: Record<string, { color: string; label: string }> = {
  L: { color: "#a3e635", label: "Vacant land" },
  B: { color: "#22d3ee", label: "Builder's lot" },
  C: { color: "#fbbf24", label: "Vacant commercial land" },
  I: { color: "#a8a29e", label: "Vacant industrial land" },
};

export const vacantLotsOverlay: OverlayDefinition = {
  id: "vacant-lots",
  label: "Vacant lots",
  group: "land",
  description: "Parcels the county assessor classes as vacant land, county-wide. Density when zoomed out; individual lots from about zoom 14.",
  source: { kind: "viewport", minZoom: 0, fetch: fetchVacantLots },
  layers: (sourceId) => [
    {
      id: "vacant-lots-heat",
      type: "heatmap",
      source: sourceId,
      filter: ["has", "n"] as never,
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "n"], 1, 0.1, 40, 1] as never,
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 6, 13, 18] as never,
        "heatmap-opacity": 0.7,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,0,0)",
          0.2,
          "#365314",
          0.5,
          "#65a30d",
          0.8,
          "#a3e635",
          1,
          "#ecfccb",
        ] as never,
      },
    },
    {
      id: "vacant-lots-dots",
      type: "circle",
      source: sourceId,
      filter: ["!", ["has", "n"]] as never,
      paint: {
        "circle-color": matchColor("u", Object.fromEntries(Object.entries(LOT_USE).map(([k, v]) => [k, v.color])), "#a3a3a3") as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 2.5, 18, 6] as never,
        "circle-stroke-color": "#111111",
        "circle-stroke-width": 0.5,
      },
    },
  ],
  tooltipLayerIds: ["vacant-lots-dots"],
  tooltip: (p) =>
    [
      String(p.a ?? "Address not recorded"),
      // Assessor names City parcels "19th Ward - PITTSBURGH"; suburbs are plain names.
      p.m ? String(p.m).replace(/^(.+?) - PITTSBURGH$/, "Pittsburgh, $1") : "",
      `${LOT_USE[String(p.u)]?.label ?? "Vacant land"}${p.sf ? ` · ${Number(p.sf).toLocaleString()} sq ft` : ""}`,
      p.v ? `Assessed land value: $${Number(p.v).toLocaleString()}` : "",
      p.o === "corp" ? "Owned by a company or organization" : p.o === "individual" ? "Owned by an individual" : "",
      `Parcel ${p.p}`,
    ].filter(Boolean),
  legend: () => [
    { color: "#65a30d", label: "Density of vacant lots (zoomed out)", shape: "fill" as const },
    ...Object.values(LOT_USE).map(({ color, label }) => ({ color, label, shape: "dot" as const })),
  ],
  meta: {
    source: "Allegheny County Office of Property Assessments via WPRDC (vacant-land use codes)",
    sourceUrl: "https://data.wprdc.org/dataset/property-assessments",
    asOf: "Assessments as of Sep 2026",
    geography: "Parcel centroids, all of Allegheny County",
    evidence: "observed",
    caveats: [
      "The assessor's land-use code, not a site visit; some 'vacant' parcels are parking, yards or wooded slopes.",
      "Most vacant lots have no house number, only a street name.",
      "Owner type is the assessor's category; no owner names are included.",
    ],
  },
};

const BUILDING_CLASS: Record<string, { color: string; label: string }> = {
  RESIDENTIAL: { color: "#f472b6", label: "Residential" },
  COMMERCIAL: { color: "#fb923c", label: "Commercial" },
  INDUSTRIAL: { color: "#a8a29e", label: "Industrial" },
  GOVERNMENT: { color: "#60a5fa", label: "Government" },
};

export const vacantBuildingsOverlay: OverlayDefinition = {
  id: "vacant-buildings",
  label: "Vacant buildings (USPS, City)",
  group: "land",
  description: "City of Pittsburgh parcels where USPS stopped collecting mail for 90+ days (Feb 2024).",
  source: { kind: "static", url: "/data/overlays/vacant-buildings.geojson" },
  layers: (sourceId) => [
    {
      id: "vacant-buildings-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": matchColor("class", Object.fromEntries(Object.entries(BUILDING_CLASS).map(([k, v]) => [k, v.color])), "#a3a3a3") as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2, 16, 6] as never,
        "circle-stroke-color": "#111111",
        "circle-stroke-width": 0.5,
      },
    },
  ],
  tooltipLayerIds: ["vacant-buildings-dots"],
  tooltip: (p) =>
    [
      String(p.address ?? "Address not recorded"),
      p.use ? `${String(p.use).toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}` : "",
      p.owner_category && p.owner_category !== "Private" ? `Owner: ${p.owner_category}` : "Privately owned",
      p.zoning ? `Zoning ${p.zoning}${p.neighborhood ? ` · ${p.neighborhood}` : ""}` : "",
      `Parcel ${p.pin}`,
    ].filter(Boolean),
  legend: () => Object.values(BUILDING_CLASS).map(({ color, label }) => ({ color, label, shape: "dot" as const })),
  meta: {
    source: "City of Pittsburgh, USPS vacancy flags by parcel (Vacant_USPS_Feb_24), joined to City parcel records",
    sourceUrl: "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Vacant_USPS_Feb_24/FeatureServer/0",
    asOf: "USPS snapshot Feb 2024",
    geography: "Parcel centroids, City of Pittsburgh only",
    evidence: "observed",
    caveats: [
      "USPS 'vacant' means no mail collected for 90+ days; it includes some renovations and seasonal cases.",
      "A 2024 snapshot; some buildings have since been reoccupied or demolished.",
    ],
  },
};
