import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";

import { RAMPS, stepFill, stepLegend } from "./styles";
import { detailSourceId, type OverlayDefinition } from "./types";

// Breaks at the p10/p30/p50/p70/p90 of the fine City hexes, as printed by
// scripts/pillars/build-hexes.ts (2026-09-26 build; overall and site 2026-09-27), so each pillar spreads
// across the ramp even where its scores sit in a narrow band (Climate ~50–70).
type MetricId = PillarId | "overall";

const BREAKS: Record<MetricId, number[]> = {
  overall: [35, 43, 47, 52, 59],
  demand: [27, 35, 44, 53, 64],
  site: [53, 69, 74, 94, 100],
  afford: [33, 44, 55, 63, 78],
  access: [45, 56, 64, 75, 88],
  climate: [51, 57, 61, 64, 70],
};

// What the tooltip counts among the parcels inside a hex.
const CAPPED_NOTE: Record<MetricId, string> = {
  overall: "reduced for zoning, site availability or a deal-killer hazard",
  demand: "capped by a gate",
  site: "capped by a hazard (floodway, slope, …)",
  afford: "capped by a gate",
  access: "capped by a gate",
  climate: "capped by a gate",
};

// Must match LEVELS in scripts/pillars/build-hexes.ts: ~100 m hexes below
// zoom 14, ~50 m hexes (loaded for the view only) from zoom 14 in.
const DETAIL_ZOOM = 14;
const LEVELS = [
  { level: 0, minzoom: 0, maxzoom: DETAIL_ZOOM, detail: false },
  { level: 1, minzoom: DETAIL_ZOOM, maxzoom: 24, detail: true },
];

type Metric = { id: string; label: string; description: string };

const OVERALL: Metric = {
  id: "overall",
  label: "Overall",
  description:
    "The overall score from the parcel panel: a weighted geometric mean of the five pillars at equal default weights, times the zoning and site-availability multipliers.",
};

function pillarOverlay(pillar: Metric): OverlayDefinition {
  const id = pillar.id as MetricId;
  const breaks = BREAKS[id];
  const fillIds = LEVELS.map((l) => `pillar-${id}-fill-${l.level}`);
  return {
    id: `pillar-${id}`,
    label: pillar.label,
    group: "pillar",
    description: pillar.description,
    source: { kind: "static", url: "/data/overlays/pillar-hexes.geojson" },
    sharedSource: "pillar-hexes",
    detail: { url: "/data/overlays/pillar-hexes-fine.geojson", minZoom: DETAIL_ZOOM },
    layers: (sourceId) =>
      LEVELS.flatMap((l, i) => {
        const band = { source: l.detail ? detailSourceId(sourceId) : sourceId, minzoom: l.minzoom, maxzoom: l.maxzoom };
        return [
          {
            id: fillIds[i],
            type: "fill" as const,
            ...band,
            paint: { "fill-color": stepFill(id, breaks, RAMPS.score) as never, "fill-opacity": 0.6 },
          },
          {
            id: `pillar-${id}-outline-${l.level}`,
            type: "line" as const,
            ...band,
            paint: { "line-color": "#000000", "line-width": 0.2, "line-opacity": 0.3 },
          },
        ];
      }),
    tooltipLayerIds: fillIds,
    tooltip: (p) => {
      const score = p[id];
      const scored = Number(p.scored ?? 0);
      const capped = Number(p[`${id}_capped`] ?? 0);
      const reach = p.reach;
      return [
        score == null ? `${pillar.label}: no scored parcels within 1.5 km` : `${pillar.label}: ${score} / 100`,
        reach == null ? "" : `Distance-weighted mean of parcels within ~${reach} m`,
        `${scored} scored parcel${scored === 1 ? "" : "s"} inside this hex${scored === 0 ? " (value comes from neighbors)" : ""}`,
        capped > 0 ? `⚠ ${capped} of them ${CAPPED_NOTE[id]}` : "",
        "Click a parcel for its own score",
      ].filter(Boolean);
    },
    legend: () => [
      ...stepLegend(breaks, RAMPS.score, (lo, hi) => (hi ? `${lo}–${hi}` : `${lo}+`)),
      { color: "rgba(120,120,120,0.35)", label: "No scored parcels within 1.5 km", shape: "fill" },
    ],
    meta: {
      source: "HouseHack pillar scores (pillars.config.json, default weights)",
      sourceUrl: "https://github.com/matmanna/HouseHack/blob/lance-map-data/apps/web/src/lib/pillars/pillars.config.json",
      asOf: config.version,
      geography:
        "Distance-weighted mean of nearby City of Pittsburgh parcels, drawn as hexagons (~170 m across, ~85 m when zoomed in), not one parcel",
      evidence: "value",
      caveats: [
        "100 = a good place to build new housing. Scores combine observed data using weights that are value judgments.",
        "Colors are relative: the bins are City hex percentiles (p10–p90), not fixed score bands.",
        "Smoothed: each hex blends parcels around it (Gaussian, widening until it reaches 8 scored parcels), so sharp edges such as a floodway bleed into neighboring hexes.",
        "A hex mean can hide a capped parcel; the tooltip counts those inside the hex.",
        "Many inputs are tract or block-group values, so neighboring hexes can share them.",
      ],
    },
  };
}

export const PILLAR_OVERLAYS: OverlayDefinition[] = [OVERALL, ...config.pillars].map(pillarOverlay);
