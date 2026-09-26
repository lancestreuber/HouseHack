import type { OverlayDefinition } from "./types";

// USGS 3DEP computes slope on the fly. The rendering rule reclassifies slope
// degrees into Pittsburgh's code thresholds and colors them, leaving flatter
// ground transparent: 15% = 8.53°, 25% = 14.04° (the §906 steep-slope line).
const RENDERING_RULE = {
  rasterFunction: "Colormap",
  rasterFunctionArguments: {
    Colormap: [
      [2, 250, 204, 21],
      [3, 220, 38, 38],
    ],
    Raster: {
      rasterFunction: "Remap",
      rasterFunctionArguments: {
        InputRanges: [0, 8.53, 8.53, 14.04, 14.04, 90],
        OutputValues: [1, 2, 3],
        NoDataRanges: [0, 8.53],
        Raster: { rasterFunction: "Slope Degrees" },
      },
    },
  },
};

const IMAGE_SERVER = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer";

const TILE_URL =
  `${IMAGE_SERVER}/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256` +
  `&format=png32&transparent=true&f=image&renderingRule=${encodeURIComponent(JSON.stringify(RENDERING_RULE))}`;

export const slopeOverlay: OverlayDefinition = {
  id: "slope",
  label: "Steep slopes",
  group: "hazard",
  description: "Terrain slope from USGS 3DEP elevation, in Pittsburgh's code thresholds (zoom in to load).",
  source: { kind: "raster", tiles: [TILE_URL], tileSize: 256, minZoom: 11, attribution: "USGS 3DEP" },
  layers: (sourceId) => [
    {
      id: "slope-raster",
      type: "raster",
      source: sourceId,
      minzoom: 11,
      paint: { "raster-opacity": 0.6 },
    },
  ],
  legend: () => [
    { color: "#facc15", label: "15–25% slope", shape: "fill" },
    { color: "#dc2626", label: "25%+ slope (city steep-slope rules apply)", shape: "fill" },
  ],
  meta: {
    source: "USGS 3D Elevation Program (3DEP), slope computed on the fly",
    sourceUrl: IMAGE_SERVER,
    asOf: "3DEP service dated 2026-08-25",
    geography: "~1–10 m elevation grid, resampled to the zoom level",
    evidence: "observed",
    caveats: [
      "Bare-earth terrain: retaining walls and graded yards are not reflected.",
      "The 25% line is the zoning threshold, not a geotechnical finding.",
    ],
  },
};
