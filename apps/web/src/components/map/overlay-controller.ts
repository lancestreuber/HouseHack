import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { Popup } from "maplibre-gl";

import { OVERLAYS } from "./overlays";
import type { OverlayDefinition, OverlayMetric } from "./overlays/types";

export type OverlayState = {
  // The single active "heat" overlay, or null.
  heatId: string | null;
  // Checked "infrastructure" overlays (stackable).
  infraIds: string[];
  // Selected metric per overlay id, for overlays with sub-selectors.
  metricByOverlay: Record<string, string>;
};

export const INITIAL_OVERLAY_STATE: OverlayState = { heatId: null, infraIds: [], metricByOverlay: {} };

const sourceIdFor = (def: OverlayDefinition) => `overlay-${def.id}`;

export function isVisible(def: OverlayDefinition, state: OverlayState) {
  return def.group === "heat" ? state.heatId === def.id : state.infraIds.includes(def.id);
}

export function selectedMetric(def: OverlayDefinition, state: OverlayState): OverlayMetric | undefined {
  if (!def.metrics?.length) return undefined;
  return def.metrics.find((m) => m.id === state.metricByOverlay[def.id]) ?? def.metrics[0];
}

// Heat fills draw beneath the zoning/parcel layers so outlines stay readable;
// infrastructure draws on top of everything.
function beforeIdFor(map: MapLibreMap, def: OverlayDefinition, underLayerIds: string[]) {
  if (def.group !== "heat") return undefined;
  return underLayerIds.find((id) => map.getLayer(id));
}

// Idempotent: safe to call on every state change and after every basemap swap
// (setStyle drops all sources and layers).
export function syncOverlays(map: MapLibreMap, state: OverlayState, underLayerIds: string[]) {
  for (const def of OVERLAYS) {
    const sourceId = sourceIdFor(def);
    const visible = isVisible(def, state);
    const specs = def.layers(sourceId, selectedMetric(def, state));

    if (!visible) {
      for (const spec of specs) {
        if (map.getLayer(spec.id)) map.setLayoutProperty(spec.id, "visibility", "none");
      }
      continue;
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: def.source.kind === "static" ? def.source.url : { type: "FeatureCollection", features: [] },
      });
    }

    for (const spec of specs) {
      if (!map.getLayer(spec.id)) {
        map.addLayer(spec, beforeIdFor(map, def, underLayerIds));
      } else if ("paint" in spec && spec.paint) {
        // Metric switches only change paint, so update in place.
        for (const [key, value] of Object.entries(spec.paint)) {
          // Paint keys vary by layer type; MapLibre validates them at runtime.
          map.setPaintProperty(spec.id, key as "fill-color", value as never);
        }
      }
      map.setLayoutProperty(spec.id, "visibility", "visible");
    }
  }
}

// Reload viewport-bound overlays (e.g. sewers) for the current map area.
const requestCounters = new Map<string, number>();
export async function refreshViewportOverlays(map: MapLibreMap, state: OverlayState) {
  for (const def of OVERLAYS) {
    if (def.source.kind !== "viewport" || !isVisible(def, state)) continue;
    const source = map.getSource(sourceIdFor(def)) as GeoJSONSource | undefined;
    if (!source) continue;
    if (map.getZoom() < def.source.minZoom) {
      source.setData({ type: "FeatureCollection", features: [] });
      continue;
    }
    const request = (requestCounters.get(def.id) ?? 0) + 1;
    requestCounters.set(def.id, request);
    try {
      const data = await def.source.fetch(map.getBounds());
      // Drop stale responses if the map moved again meanwhile.
      if (requestCounters.get(def.id) === request) {
        source.setData(data as Parameters<GeoJSONSource["setData"]>[0]);
      }
    } catch (error) {
      console.warn(`[overlays] ${def.id} failed to load`, error);
    }
  }
}

// One shared popup. Registered once per tooltip layer; MapLibre keeps
// layer-scoped listeners across style swaps and fires them once the layer exists.
export function registerTooltips(map: MapLibreMap, getState: () => OverlayState) {
  const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: "260px" });
  for (const def of OVERLAYS) {
    for (const layerId of def.tooltipLayerIds ?? []) {
      map.on("mousemove", layerId, (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature || !def.tooltip) return;
        const lines = def.tooltip(feature.properties ?? {}, selectedMetric(def, getState()));
        const body = document.createElement("div");
        body.className = "text-xs text-neutral-900";
        const title = document.createElement("div");
        title.className = "font-medium";
        title.textContent = def.label;
        body.append(title, ...lines.map((line) => Object.assign(document.createElement("div"), { textContent: line })));
        map.getCanvas().style.cursor = "pointer";
        popup.setLngLat(e.lngLat).setDOMContent(body).addTo(map);
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    }
  }
}
