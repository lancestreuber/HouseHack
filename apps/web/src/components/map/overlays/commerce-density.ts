import type { OverlayDefinition } from "./types";

// Heatmap of licensed restaurants and convenience/retail food stores: a proxy for
// "main street" commercial activity. No individual businesses are drawn.
export const commerceDensityOverlay: OverlayDefinition = {
  id: "commerce-density",
  label: "Restaurants & shops (density)",
  group: "places",
  description: "Density of licensed restaurants and convenience/retail food stores.",
  source: { kind: "static", url: "/data/overlays/commerce-density.geojson" },
  layers: (sourceId) => [
    {
      id: "commerce-density-heat",
      type: "heatmap",
      source: sourceId,
      paint: {
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 5, 14, 18, 17, 30] as never,
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 15, 1.5] as never,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(56,189,248,0)",
          0.3,
          "rgba(56,189,248,0.35)",
          0.7,
          "rgba(129,140,248,0.65)",
          1,
          "rgba(232,121,249,0.9)",
        ] as never,
        "heatmap-opacity": 0.8,
      },
    },
  ],
  legend: () => [
    { color: "rgba(56,189,248,0.5)", label: "Some restaurants and shops", shape: "fill" },
    { color: "rgba(232,121,249,0.9)", label: "Dense commercial activity", shape: "fill" },
  ],
  meta: {
    source: "Allegheny County Health Dept food facility permits (WPRDC, CC0)",
    sourceUrl: "https://data.wprdc.org/dataset/allegheny-county-restaurant-food-facility-inspection-violations",
    asOf: "Permits as of 2025",
    geography: "Density of ~11k licensed restaurants and convenience/retail food stores",
    evidence: "observed",
    caveats: ["Food-licensed businesses only; other shops are not counted.", "Closures can lag."],
  },
};
