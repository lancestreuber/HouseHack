import { type CameraFeed, openCamera } from "../camera-viewer-store";
import type { OverlayDefinition } from "./types";

const CATEGORIES = [
  { id: "traffic", color: "#38bdf8", label: "Traffic (PennDOT, PA Turnpike)" },
  { id: "skyline", color: "#f472b6", label: "Skyline, stadium and webcams" },
  { id: "river", color: "#2dd4bf", label: "USGS river cams" },
  { id: "air", color: "#fb923c", label: "Breathe Cam industrial smoke cams" },
  { id: "weather", color: "#a3e635", label: "Weather station cams" },
  { id: "wildlife", color: "#facc15", label: "Eagle, hawk and zoo cams" },
];
const OTHER = "#e5e5e5";

const categoryColor: unknown[] = ["match", ["get", "category"]];
for (const c of CATEGORIES) categoryColor.push(c.id, c.color);
categoryColor.push(OTHER);

const FEED_LABEL: Record<string, string> = {
  jpeg: "still image, auto-refreshing",
  mjpeg: "live MJPEG",
  hls: "live video",
  youtube: "live YouTube stream",
  iframe: "live player",
  link: "opens owner's page",
};

export const camerasOverlay: OverlayDefinition = {
  id: "cameras",
  label: "Live cameras",
  group: "cameras",
  description: "Public live camera feeds. Click a camera to watch it.",
  source: { kind: "static", url: "/data/overlays/cameras.geojson" },
  layers: (sourceId) => [
    {
      id: "cameras-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": categoryColor as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3.5, 14, 6, 17, 9] as never,
        "circle-stroke-color": "#0a0a0a",
        "circle-stroke-width": 1.5,
      },
    },
  ],
  tooltipLayerIds: ["cameras-dots"],
  tooltip: (p) => [
    String(p.name),
    `${p.operator} · ${FEED_LABEL[String(p.feed_type)] ?? p.feed_type}`,
    "Click to watch",
  ],
  clickLayerIds: ["cameras-dots"],
  onClick: (p) => openCamera(p as unknown as CameraFeed),
  legend: () => [
    ...CATEGORIES.map((c) => ({ color: c.color, label: c.label, shape: "dot" as const })),
  ],
  meta: {
    source: "511PA (PennDOT, PA Turnpike), USGS HIVIS, CMU Breathe Cam, WeatherSTEM, EarthCam, PixCams, Pittsburgh Zoo",
    sourceUrl: "https://www.511pa.com/cctv",
    asOf: "Feeds are live; camera list built 2026-09-26",
    geography: "Camera locations; some webcam positions are approximate (noted in the viewer)",
    evidence: "observed",
    caveats: [
      "Only feeds their owners publish. Cameras go offline without notice.",
      "511PA traffic cameras show a still image refreshed about every 10 seconds, not video.",
    ],
  },
};

export const alprOverlay: OverlayDefinition = {
  id: "alpr-cameras",
  label: "License plate readers (ALPR)",
  group: "cameras",
  description: "Automatic license plate reader locations mapped in OpenStreetMap (incl. DeFlock). Location only, no feed.",
  source: { kind: "static", url: "/data/overlays/alpr-cameras.geojson" },
  layers: (sourceId) => [
    {
      id: "alpr-cameras-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": ["case", ["==", ["get", "is_flock"], true], "#ef4444", "#fca5a5"] as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2.5, 14, 4.5, 17, 7] as never,
        "circle-stroke-color": "#0a0a0a",
        "circle-stroke-width": 1,
      },
    },
  ],
  tooltipLayerIds: ["alpr-cameras-dots"],
  tooltip: (p) => [
    `Maker: ${p.manufacturer ?? "not tagged"}`,
    `Operator: ${p.operator ?? "not tagged"}`,
    p.direction ? `Facing: ${p.direction}°` : "Facing: not tagged",
  ],
  legend: () => [
    { color: "#ef4444", label: "Flock Safety", shape: "dot" },
    { color: "#fca5a5", label: "Other or unknown maker", shape: "dot" },
  ],
  meta: {
    source: "OpenStreetMap contributors (ODbL), incl. DeFlock mapping",
    sourceUrl: "https://deflock.me",
    asOf: "OSM snapshot pulled 2026-09-26",
    geography: "Mapped camera points, positions as placed by volunteer mappers",
    evidence: "observed",
    caveats: [
      "Crowd-mapped, not an official inventory: coverage is incomplete and some entries may be stale.",
      "Most points have no operator tag, so police vs. retail use can't be told apart for them.",
      "About 310 points tagged PlateSmart/Cyclops look bulk-mapped; treat those with caution.",
    ],
  },
};
