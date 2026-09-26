import type { OverlayDefinition } from "./types";

// Below this zoom, stops draw as a heatmap weighted by weekday trips.
const DOT_ZOOM = 12;

// Weekday trip bins: roughly "hourly or worse" … "frequent".
const BINS = [
  { min: 0, color: "#64748b", label: "Under 20 weekday trips" },
  { min: 20, color: "#22d3ee", label: "20–50 trips" },
  { min: 50, color: "#34d399", label: "50–100 trips" },
  { min: 100, color: "#facc15", label: "100+ trips (frequent)" },
];

const tripsColor: unknown[] = ["step", ["to-number", ["get", "trips_wd"], 0], BINS[0].color];
for (const bin of BINS.slice(1)) tripsColor.push(bin.min, bin.color);

export const transitStopsOverlay: OverlayDefinition = {
  id: "transit-stops",
  label: "Transit stops",
  group: "infrastructure",
  description: "Pittsburgh Regional Transit stops, colored by scheduled weekday trips.",
  source: { kind: "static", url: "/data/overlays/transit-stops.geojson" },
  layers: (sourceId) => [
    {
      id: "transit-stops-heat",
      type: "heatmap",
      source: sourceId,
      maxzoom: DOT_ZOOM + 1,
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["to-number", ["get", "trips_wd"], 0], 0, 0, 300, 1] as never,
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 8, DOT_ZOOM, 18] as never,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(52,211,153,0)",
          0.4,
          "rgba(52,211,153,0.4)",
          1,
          "rgba(250,204,21,0.85)",
        ] as never,
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], DOT_ZOOM - 1, 0.8, DOT_ZOOM + 1, 0] as never,
      },
    },
    {
      id: "transit-stops-dots",
      type: "circle",
      source: sourceId,
      minzoom: DOT_ZOOM,
      paint: {
        "circle-color": tripsColor as never,
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          DOT_ZOOM,
          ["match", ["get", "mode"], "BUS", 2, 4],
          17,
          ["match", ["get", "mode"], "BUS", 5, 8],
        ] as never,
        // Rail and incline stops get a white ring.
        "circle-stroke-color": ["match", ["get", "mode"], "BUS", "#000000", "#ffffff"] as never,
        "circle-stroke-width": ["match", ["get", "mode"], "BUS", 0.5, 2] as never,
      },
    },
  ],
  tooltipLayerIds: ["transit-stops-dots"],
  tooltip: (p) => [
    `${p.stop_name} (${String(p.mode).toLowerCase()})`,
    `Weekday trips: ${p.trips_wd} · Sat: ${p.trips_sa} · Sun: ${p.trips_su}`,
    `Routes: ${p.route_filter}`,
  ],
  legend: () => [
    ...BINS.map((b) => ({ color: b.color, label: b.label, shape: "dot" as const })),
    { color: "#ffffff", label: "Rail or incline stop (white ring)", shape: "dot" },
  ],
  meta: {
    source: "Pittsburgh Regional Transit stops (WPRDC, CC-BY)",
    sourceUrl: "https://data.wprdc.org/dataset/prt-of-allegheny-county-transit-stops",
    asOf: "Updated 2026-09-22 (GTFS feed 2606, service from 2026-06-28)",
    geography: "Stop points; heatmap below zoom 12 is weighted by weekday trips",
    evidence: "observed",
    caveats: [
      "Scheduled trips, not realized reliability.",
      "Walking distance to a stop is longer than it looks on hilly terrain.",
    ],
  },
};
