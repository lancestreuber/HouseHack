import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";

import { RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition } from "./types";

// Breaks at the p10/p30/p50/p70/p90 of City hexes from the 2026-09-26 build
// (scripts/pillars/build-hexes.ts), so each pillar spreads across the ramp
// even where its scores sit in a narrow band (Climate runs ~50–70).
const BREAKS: Record<PillarId, number[]> = {
  demand: [26, 35, 43, 52, 63],
  site: [54, 76, 84, 92, 99],
  afford: [33, 44, 55, 63, 78],
  access: [41, 54, 63, 74, 88],
  climate: [51, 57, 60, 64, 69],
};

const URL = "/data/overlays/pillar-hexes.geojson";

function pillarOverlay(pillar: (typeof config.pillars)[number]): OverlayDefinition {
  const id = pillar.id as PillarId;
  const breaks = BREAKS[id];
  const fillId = `pillar-${id}-fill`;
  return {
    id: `pillar-${id}`,
    label: pillar.label,
    group: "pillar",
    description: pillar.description,
    source: { kind: "static", url: URL },
    layers: (sourceId) => [
      {
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: { "fill-color": stepFill(id, breaks, RAMPS.score) as never, "fill-opacity": 0.6 },
      },
      {
        id: `pillar-${id}-outline`,
        type: "line",
        source: sourceId,
        paint: { "line-color": "#000000", "line-width": 0.2, "line-opacity": 0.3 },
      },
    ],
    tooltipLayerIds: [fillId],
    tooltip: (p) => {
      const score = p[id];
      const scored = Number(p[`${id}_parcels`] ?? 0);
      const capped = Number(p[`${id}_capped`] ?? 0);
      return [
        score == null ? `${pillar.label}: not enough scored parcels` : `${pillar.label}: ${score} / 100`,
        `Mean of ${scored} parcel score${scored === 1 ? "" : "s"} in this hex`,
        capped > 0 ? `⚠ ${capped} of them capped by a hazard (floodway, slope, …)` : "",
        "Click a parcel for its own score",
      ].filter(Boolean);
    },
    legend: () => [
      ...stepLegend(breaks, RAMPS.score, (lo, hi) => (hi ? `${lo}–${hi}` : `${lo}+`)),
      { color: "rgba(120,120,120,0.35)", label: "Fewer than 3 scored parcels", shape: "fill" },
    ],
    meta: {
      source: "HouseHack pillar scores (pillars.config.json, default weights)",
      sourceUrl: "https://github.com/matmanna/HouseHack/blob/lance-map-data/apps/web/src/lib/pillars/pillars.config.json",
      asOf: config.version,
      geography: "Mean of City of Pittsburgh parcels in a ~0.08 km² hexagon, not one parcel",
      evidence: "value",
      caveats: [
        "100 = a good place to build new housing. Scores combine observed data using weights that are value judgments.",
        "Colors are relative: the bins are City hex percentiles (p10–p90), not fixed score bands.",
        "A hex mean can hide a hazard-capped parcel; the tooltip counts them.",
        "Many inputs are tract or block-group values, so neighboring hexes can share them.",
      ],
    },
  };
}

export const PILLAR_OVERLAYS: OverlayDefinition[] = config.pillars.map(pillarOverlay);
