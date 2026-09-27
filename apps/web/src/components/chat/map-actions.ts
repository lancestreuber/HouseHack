// Lets the chat change the map beside it. The explorer registers its map; a chat
// reply with a map action applies it here, and Undo puts the old view back.
import type { ChatContext, MapLayerInfo, MapView } from "@HouseHack/api/chat/types";

import type { OverlayState } from "../map/overlay-controller";
import { OVERLAYS } from "../map/overlays";

type MapController = { get: () => OverlayState; set: (state: OverlayState) => void };

let controller: MapController | null = null;

export function registerMapController(next: MapController) {
  controller = next;
  return () => {
    if (controller === next) controller = null;
  };
}

/** Show `view` on the map; returns the view it replaced (for Undo), or null if there's no map. */
export function applyMapView(view: MapView): MapView | null {
  if (!controller) return null;
  const before = controller.get();
  controller.set(stateFromView(view, before));
  return viewFromState(before);
}

export function viewFromState(state: OverlayState): MapView {
  return {
    heat: state.heatId ? { id: state.heatId, ...(state.metricByOverlay[state.heatId] ? { metric: state.metricByOverlay[state.heatId] } : {}) } : null,
    stack: state.infraIds,
  };
}

export function stateFromView(view: MapView, base: OverlayState): OverlayState {
  return {
    heatId: view.heat?.id ?? null,
    infraIds: view.stack,
    metricByOverlay: { ...base.metricByOverlay, ...(view.heat?.metric ? { [view.heat.id]: view.heat.metric } : {}) },
  };
}

// The zoom a layer first draws at: its source's minimum, or, if every drawn
// layer has a minzoom (e.g. parcel dots at street zoom), the lowest of those.
function minZoomOf(overlay: (typeof OVERLAYS)[number]): number | undefined {
  const fromSource = overlay.source.kind === "static" ? 0 : overlay.source.minZoom;
  const layers = overlay.layers(`catalog-${overlay.id}`, overlay.metrics?.[0]);
  const fromLayers = layers.length ? Math.min(...layers.map((l) => ("minzoom" in l && l.minzoom) || 0)) : 0;
  const zoom = Math.max(fromSource, fromLayers);
  return zoom > 0 ? zoom : undefined;
}

/** Every map layer, as the chat's map tool sees it: heat and pillar layers are the one-at-a-time backgrounds. */
export const MAP_LAYER_CATALOG: MapLayerInfo[] = OVERLAYS.map((o) => ({
  id: o.id,
  label: o.label,
  group: o.group,
  description: o.description,
  heat: o.group === "heat" || o.group === "pillar",
  ...(o.metrics?.length ? { metrics: o.metrics.map((m) => ({ id: m.id, label: m.label })) } : {}),
  ...(minZoomOf(o) != null ? { minZoom: minZoomOf(o) } : {}),
}));

/** The map part of the chat context: the catalog, what's on now, and the zoom (whole numbers, so answers cache). */
export function mapChatInfo(state: OverlayState, zoom: number | undefined): NonNullable<ChatContext["map"]> {
  return { layers: MAP_LAYER_CATALOG, current: viewFromState(state), ...(zoom != null ? { zoom: Math.floor(zoom) } : {}) };
}
