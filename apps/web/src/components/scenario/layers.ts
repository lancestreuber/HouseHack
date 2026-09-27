// Which map layers show the evidence behind a scenario pro or con. Derived from
// the data: a pillar indicator reads a file, and the map layer that draws the
// same file is its layer (with the matching sub-metric, e.g. air quality). A
// few indicators read cached or tabular copies, so they're listed by hand.
import config from "@/lib/pillars/pillars.config.json";

import { OVERLAYS } from "../map/overlays";
import type { OverlayState } from "../map/overlay-controller";

export type LayerPick = { heat?: { id: string; metric?: string }; stack: string[] };

const basename = (path: string) => path.split("/").pop() ?? path;

// Layer id by the file it draws.
const LAYER_BY_FILE = new Map(
  OVERLAYS.flatMap((o) => (o.source?.kind === "static" ? [[basename(o.source.url), o] as const] : [])),
);

type Layer = { id: string; metric?: string };

// Indicators whose data isn't the file a layer draws.
const BY_HAND: Record<string, Layer> = {
  site_steep_slope_share: { id: "city-steep-slopes" },
  site_landslide_prone_share: { id: "city-hazard-overlays" },
  site_undermined_share: { id: "city-hazard-overlays" },
  climate_surface_heat: { id: "surface-heat" },
  climate_tree_canopy: { id: "tree-canopy" },
  demand_new_construction: { id: "permits-activity" },
  demand_job_growth: { id: "jobs", metric: "jobs_change_pct" },
  afford_evictions: { id: "evictions", metric: "filings_per_100_renters" },
};

// Pillar warnings and the lot's hazard summary name the hazards they're about
// ("36% of the lot is at 25%+ slope; 100% of the lot is over mapped mines").
const HAZARD_WORDS: [RegExp, string][] = [
  [/mine|undermin/i, "city-hazard-overlays"],
  [/landslide/i, "city-hazard-overlays"],
  [/slope/i, "city-steep-slopes"],
  [/flood/i, "flood-zones"],
];
const hazardLayers = (text: string) => HAZARD_WORDS.filter(([re]) => re.test(text)).map(([, id]) => id);

function pick(ids: string[], metricFor?: (id: string) => string | undefined): LayerPick {
  const out: LayerPick = { stack: [] };
  for (const id of ids) {
    const overlay = OVERLAYS.find((o) => o.id === id);
    if (!overlay) continue;
    if (overlay.group === "heat" || overlay.group === "pillar") out.heat ??= { id, metric: metricFor?.(id) };
    else if (!out.stack.includes(id)) out.stack.push(id);
  }
  return out;
}

/** The layers an indicator's evidence is drawn on (none for table-only data). */
export function indicatorLayers(indicatorId: string): Layer[] {
  const hand = BY_HAND[indicatorId];
  if (hand) return [hand];
  const ind = config.indicators.find((i) => i.id === indicatorId);
  const file = (ind?.source as { file?: string | string[] } | undefined)?.file;
  if (!ind || !file) return [];
  const property = (ind.source as { property?: string | string[] }).property;
  const first = Array.isArray(property) ? property[0] : property;
  return (Array.isArray(file) ? file : [file]).flatMap((f) => {
    const overlay = LAYER_BY_FILE.get(basename(f));
    if (!overlay) return [];
    return [{ id: overlay.id, metric: overlay.metrics?.find((m) => m.property === first)?.id }];
  });
}

/** The layers behind one fact the scenario cites. */
export function layersForFact(factId: string, typologyId: string, factText = ""): LayerPick {
  const legal = { id: "legal-pathway", metric: typologyId };
  if (factId.startsWith("i.")) {
    const layers = indicatorLayers(factId.slice(2));
    return pick(
      layers.map((l) => l.id),
      (id) => layers.find((l) => l.id === id)?.metric,
    );
  }
  if (factId.startsWith("t.") || factId.startsWith("verdict.") || factId === "legal" || factId.startsWith("alert.")) return pick([legal.id], () => legal.metric);
  // "No mapped floodway, floodplain, …" names hazards that aren't there.
  if (factId === "hazards") return factText.includes("No mapped") ? { stack: [] } : pick(hazardLayers(factText));
  if (factId.startsWith("warning.") || factId === "site_hazard") return pick(hazardLayers(factText));
  if (factId.startsWith("pillar.")) return pick([`pillar-${factId.slice(7)}`]);
  if (factId === "overall") return pick(["overall"]);
  return { stack: [] };
}

/** The layers behind a whole point (all the facts it cites). */
export function layersForPoint(factIds: string[], typologyId: string, textOf: (id: string) => string): LayerPick {
  const out: LayerPick = { stack: [] };
  for (const id of factIds) {
    const one = layersForFact(id, typologyId, textOf(id));
    out.heat ??= one.heat;
    for (const s of one.stack) if (!out.stack.includes(s)) out.stack.push(s);
  }
  return out;
}

/** Map state for a scenario: where this type is legal, plus the given layers. */
export function scenarioOverlayState(base: OverlayState, typologyId: string, layers: LayerPick): OverlayState {
  const heat = layers.heat ?? { id: "legal-pathway", metric: typologyId };
  return {
    heatId: heat.id,
    infraIds: layers.stack,
    metricByOverlay: { ...base.metricByOverlay, ...(heat.metric ? { [heat.id]: heat.metric } : {}) },
  };
}
