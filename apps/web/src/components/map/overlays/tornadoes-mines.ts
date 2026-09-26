import type { OverlayDefinition } from "./types";

export const tornadoPathsOverlay: OverlayDefinition = {
  id: "tornado-paths",
  label: "Tornado paths (1950–2025)",
  group: "hazard",
  description: "Recorded tornado tracks touching Allegheny County, colored by (E)F scale.",
  source: { kind: "static", url: "/data/overlays/tornado-paths.geojson" },
  layers: (sourceId) => [
    {
      id: "tornado-paths-lines",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "mag"], null],
          "#a3a3a3",
          [">=", ["get", "mag"], 3],
          "#dc2626",
          [">=", ["get", "mag"], 2],
          "#f97316",
          "#facc15",
        ] as never,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2, 15, 5] as never,
        "line-opacity": 0.9,
      },
    },
  ],
  tooltipLayerIds: ["tornado-paths-lines"],
  tooltip: (p) => [
    `${p.mag == null ? "Unrated" : `(E)F${p.mag}`} tornado, ${p.date ?? p.year}`,
    `${p.length_mi ?? "?"} mi long, ${p.width_yd ?? "?"} yd wide`,
    Number(p.injuries) || Number(p.fatalities) ? `Injuries: ${p.injuries} · Deaths: ${p.fatalities}` : "",
  ].filter(Boolean),
  legend: () => [
    { color: "#facc15", label: "(E)F0–1", shape: "line" },
    { color: "#f97316", label: "(E)F2", shape: "line" },
    { color: "#dc2626", label: "(E)F3+", shape: "line" },
    { color: "#a3a3a3", label: "Unrated", shape: "line" },
  ],
  meta: {
    source: "NOAA Storm Prediction Center tornado paths (public domain)",
    sourceUrl: "https://www.spc.noaa.gov/gis/svrgis/",
    asOf: "1950–2025",
    geography: "Recorded tracks (straight start→end lines for older records)",
    evidence: "observed",
    caveats: [
      "History, not a probability map; see the weather-risk layer for modeled tornado risk.",
      "F-scale before 2007, EF-scale after.",
    ],
  },
};

export const minedOutAreasOverlay: OverlayDefinition = {
  id: "mined-out-areas",
  label: "Undermined areas (coal mines)",
  group: "hazard",
  description: "Mapped underground coal mine workings (PA DEP).",
  source: { kind: "static", url: "/data/overlays/mined-out-areas.geojson" },
  layers: (sourceId) => [
    {
      id: "mined-out-areas-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": "#78716c", "fill-opacity": 0.35 },
    },
    {
      id: "mined-out-areas-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#d6d3d1", "line-width": 0.5, "line-opacity": 0.7 },
    },
  ],
  tooltipLayerIds: ["mined-out-areas-fill"],
  tooltip: (p) => [
    `Undermined: ${p.seam ?? "unknown"} coal seam`,
    p.mine ? `Mine: ${p.mine}` : "",
    p.last_mined ? `Last mined: ${p.last_mined}` : "",
  ].filter(Boolean),
  legend: () => [{ color: "#78716c", label: "Mapped underground coal workings", shape: "fill" }],
  meta: {
    source: "PA DEP mined-out areas, underground coal",
    sourceUrl:
      "https://gis.dep.pa.gov/depgisprd/rest/services/DistrictMiningOperations/DMO_MinedOutAreaCoalUnderground/FeatureServer/0",
    asOf: "PA DEP District Mining Operations layer",
    geography: "Mine footprints compiled from historic mine maps",
    evidence: "observed",
    caveats: [
      "Boundaries are approximate; not being mapped here does not mean not mined.",
      "Undermined land can require a site investigation before building (city §906.05).",
    ],
  },
};

const MSI_BASE = "https://gis.dep.pa.gov/depgisprd/rest/services/MineSubsidenceInsurance/MSI_SubsidenceRiskMiningConfirmed/MapServer";

export const mineSubsidenceOverlay: OverlayDefinition = {
  id: "mine-subsidence",
  label: "Mine subsidence risk zone",
  group: "hazard",
  description: "PA Mine Subsidence Insurance zone where mining is confirmed (rendered by PA DEP).",
  source: {
    kind: "raster",
    tiles: [
      `${MSI_BASE}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image`,
    ],
    tileSize: 512,
    minZoom: 8,
    attribution: "PA DEP",
  },
  layers: (sourceId) => [
    { id: "mine-subsidence-raster", type: "raster", source: sourceId, paint: { "raster-opacity": 0.45, "raster-fade-duration": 0 } },
  ],
  legend: () => [{ color: "#9ca3af", label: "Mining confirmed: susceptible to subsidence", shape: "fill" }],
  meta: {
    source: "PA DEP Mine Subsidence Insurance, subsidence risk (mining confirmed)",
    sourceUrl: MSI_BASE,
    asOf: "PA DEP MSI service",
    geography: "Broad risk zones",
    evidence: "observed",
    caveats: ["Coarse zones for insurance outreach, not parcel-level findings.", "See the PA Mine Subsidence Insurance program."],
  },
};
