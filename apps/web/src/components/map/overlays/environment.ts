import type { OverlayDefinition } from "./types";

const mrlcWms = (layer: string) =>
  "https://www.mrlc.gov/geoserver/mrlc_display/wms?service=WMS&version=1.1.1&request=GetMap" +
  `&layers=${layer}&styles=&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true`;

export const surfaceHeatOverlay: OverlayDefinition = {
  id: "surface-heat",
  label: "Surface heat (2020)",
  group: "environment",
  description: "Mean land surface temperature from satellite imagery, 2020 (brighter = hotter).",
  source: {
    kind: "raster",
    tiles: [
      "https://tiles.arcgis.com/tiles/YZCmUqbcsUpOKfj7/arcgis/rest/services/UHI_CU_PIT_2020_MEANLST_Clip1/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    minZoom: 9,
    attribution: "City of Pittsburgh",
  },
  layers: (sourceId) => [
    { id: "surface-heat-raster", type: "raster", source: sourceId, paint: { "raster-opacity": 0.6, "raster-fade-duration": 0 } },
  ],
  legend: () => [
    { color: "#1f1f1f", label: "Cooler surface", shape: "fill" },
    { color: "#f5f5f5", label: "Hotter surface", shape: "fill" },
  ],
  meta: {
    source: "City of Pittsburgh urban heat island layer: 2020 mean land surface temperature",
    sourceUrl:
      "https://tiles.arcgis.com/tiles/YZCmUqbcsUpOKfj7/arcgis/rest/services/UHI_CU_PIT_2020_MEANLST_Clip1/MapServer",
    asOf: "2020 composite",
    geography: "Satellite grid covering the county",
    evidence: "observed",
    caveats: [
      "Surface (roof and pavement) temperature, not air temperature.",
      "Relative only: the tiles are a grayscale stretch, so absolute temperatures aren't shown.",
    ],
  },
};

export const treeCanopyOverlay: OverlayDefinition = {
  id: "tree-canopy",
  label: "Tree canopy",
  group: "environment",
  description: "Percent tree canopy cover, NLCD 2021 (30 m).",
  source: { kind: "raster", tiles: [mrlcWms("nlcd_tcc_conus_2021_v2021-4")], tileSize: 256, minZoom: 9, attribution: "USFS / MRLC" },
  layers: (sourceId) => [
    { id: "tree-canopy-raster", type: "raster", source: sourceId, paint: { "raster-opacity": 0.65, "raster-fade-duration": 0 } },
  ],
  legend: () => [
    { color: "#c7e9c0", label: "Low canopy", shape: "fill" },
    { color: "#00441b", label: "High canopy (no fill = none)", shape: "fill" },
  ],
  meta: {
    source: "USFS / MRLC National Land Cover Database tree canopy cover 2021 (public domain)",
    sourceUrl: "https://www.mrlc.gov/data",
    asOf: "2021",
    geography: "30 m grid",
    evidence: "observed",
    caveats: ["30 m resolution misses street trees and small yards."],
  },
};

export const imperviousOverlay: OverlayDefinition = {
  id: "impervious",
  label: "Impervious surface",
  group: "environment",
  description: "Percent impervious surface (pavement and roofs), NLCD 2021 (30 m).",
  source: { kind: "raster", tiles: [mrlcWms("NLCD_2021_Impervious_L48")], tileSize: 256, minZoom: 9, attribution: "MRLC" },
  layers: (sourceId) => [
    { id: "impervious-raster", type: "raster", source: sourceId, paint: { "raster-opacity": 0.55, "raster-fade-duration": 0 } },
  ],
  legend: () => [
    { color: "#bdbdbd", label: "Low impervious", shape: "fill" },
    { color: "#ef4444", label: "Moderate", shape: "fill" },
    { color: "#9333ea", label: "High impervious (MRLC default colors)", shape: "fill" },
  ],
  meta: {
    source: "MRLC National Land Cover Database percent developed impervious 2021 (public domain)",
    sourceUrl: "https://www.mrlc.gov/data",
    asOf: "2021",
    geography: "30 m grid",
    evidence: "observed",
    caveats: ["A stormwater and heat proxy; parcel-level billed impervious area is kept by PWSA."],
  },
};
