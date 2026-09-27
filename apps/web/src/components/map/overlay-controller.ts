import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { Popup } from "maplibre-gl";

import { OVERLAYS } from "./overlays";
import { detailSourceId, type GeoJSONData, type OverlayDefinition, type OverlayMetric } from "./overlays/types";

export type OverlayState = {
  // The single active "heat" or "pillar" overlay, or null.
  heatId: string | null;
  // Checked stackable overlays ("hazard" and "infrastructure" groups).
  infraIds: string[];
  // Selected metric per overlay id, for overlays with sub-selectors.
  metricByOverlay: Record<string, string>;
};

export const INITIAL_OVERLAY_STATE: OverlayState = { heatId: null, infraIds: [], metricByOverlay: {} };

const sourceIdFor = (def: OverlayDefinition) => `overlay-${def.sharedSource ?? def.id}`;

export function isVisible(def: OverlayDefinition, state: OverlayState) {
  return def.group === "heat" || def.group === "pillar" ? state.heatId === def.id : state.infraIds.includes(def.id);
}

export function selectedMetric(def: OverlayDefinition, state: OverlayState): OverlayMetric | undefined {
  if (!def.metrics?.length) return undefined;
  return def.metrics.find((m) => m.id === state.metricByOverlay[def.id]) ?? def.metrics[0];
}

// Area fills (heat, hazard) draw beneath the zoning/parcel layers so outlines
// stay readable; infrastructure and places draw on top of everything.
function beforeIdFor(map: MapLibreMap, def: OverlayDefinition, underLayerIds: string[]) {
  const onTop = def.group === "infrastructure" || def.group === "places";
  if (onTop && !def.drawBelowOutlines) return undefined;
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
      if (def.source.kind === "static") {
        // Static files are cheap to keep: hide them so re-checking is instant.
        for (const spec of specs) {
          if (map.getLayer(spec.id)) map.setLayoutProperty(spec.id, "visibility", "none");
        }
      } else {
        // Live sources (server-rendered tiles, viewport fetches) are removed
        // outright so MapLibre cancels their pending requests immediately.
        abortViewportFetch(def.id);
        for (const spec of specs) {
          if (map.getLayer(spec.id)) map.removeLayer(spec.id);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
      continue;
    }

    if (!map.getSource(sourceId)) {
      if (def.source.kind === "raster") {
        map.addSource(sourceId, {
          type: "raster",
          tiles: def.source.tiles,
          tileSize: def.source.tileSize,
          minzoom: def.source.minZoom,
          maxzoom: def.source.maxZoom,
          attribution: def.source.attribution,
        });
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: def.source.kind === "static" ? def.source.url : { type: "FeatureCollection", features: [] },
        });
      }
    }
    if (def.detail && !map.getSource(detailSourceId(sourceId))) {
      map.addSource(detailSourceId(sourceId), { type: "geojson", data: { type: "FeatureCollection", features: [] } });
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

// In-flight viewport fetches, so a newer request (or unchecking) can cancel them.
const inFlight = new Map<string, AbortController>();
function abortViewportFetch(overlayId: string) {
  inFlight.get(overlayId)?.abort();
  inFlight.delete(overlayId);
}

type DetailFeature = { geometry: { coordinates: number[][][] } };
type DetailIndex = { features: DetailFeature[]; centers: [number, number][] };
const detailFiles = new Map<string, Promise<DetailIndex>>();

// Fetches a detail file once and indexes each feature by its first vertex,
// which is close enough to filter small cells to the view.
function loadDetail(url: string) {
  let file = detailFiles.get(url);
  if (!file) {
    file = fetch(url)
      .then((r) => r.json() as Promise<{ features: DetailFeature[] }>)
      .then(({ features }) => ({ features, centers: features.map((f) => f.geometry.coordinates[0][0] as [number, number]) }));
    detailFiles.set(url, file);
  }
  return file;
}

async function refreshDetail(map: MapLibreMap, def: OverlayDefinition) {
  if (!def.detail || map.getZoom() < def.detail.minZoom) return;
  const source = map.getSource(detailSourceId(sourceIdFor(def))) as GeoJSONSource | undefined;
  if (!source) return;
  const { features, centers } = await loadDetail(def.detail.url);
  const b = map.getBounds();
  const padX = (b.getEast() - b.getWest()) * 0.25;
  const padY = (b.getNorth() - b.getSouth()) * 0.25;
  const inView = features.filter((_, i) => {
    const [x, y] = centers[i];
    return x >= b.getWest() - padX && x <= b.getEast() + padX && y >= b.getSouth() - padY && y <= b.getNorth() + padY;
  });
  source.setData({ type: "FeatureCollection", features: inView } as GeoJSONData as Parameters<GeoJSONSource["setData"]>[0]);
}

// Reload viewport-bound overlays (e.g. sewers) and detail files for the current map area.
export async function refreshViewportOverlays(map: MapLibreMap, state: OverlayState) {
  const details = new Set<string>();
  for (const def of OVERLAYS) {
    if (!def.detail || !isVisible(def, state) || details.has(sourceIdFor(def))) continue;
    details.add(sourceIdFor(def));
    await refreshDetail(map, def).catch((error) => console.warn(`[overlays] ${def.id} detail failed to load`, error));
  }
  for (const def of OVERLAYS) {
    if (def.source.kind !== "viewport" || !isVisible(def, state)) continue;
    const source = map.getSource(sourceIdFor(def)) as GeoJSONSource | undefined;
    if (!source) continue;
    if (map.getZoom() < def.source.minZoom) {
      source.setData({ type: "FeatureCollection", features: [] });
      continue;
    }
    // Cancel the previous request for this overlay; only the latest view matters.
    abortViewportFetch(def.id);
    const controller = new AbortController();
    inFlight.set(def.id, controller);
    try {
      const data = await def.source.fetch(map.getBounds(), controller.signal);
      if (!controller.signal.aborted) source.setData(data as Parameters<GeoJSONSource["setData"]>[0]);
    } catch (error) {
      if (!controller.signal.aborted) console.warn(`[overlays] ${def.id} failed to load`, error);
    } finally {
      if (inFlight.get(def.id) === controller) inFlight.delete(def.id);
    }
  }
}

// Overlays that are visible but whose data hasn't finished loading. Viewport
// overlays count as loading while their fetch is in flight.
export function loadingOverlayIds(map: MapLibreMap, state: OverlayState): string[] {
  return OVERLAYS.filter((def) => {
    if (!isVisible(def, state)) return false;
    if (inFlight.has(def.id)) return true;
    const sourceId = sourceIdFor(def);
    return Boolean(map.getSource(sourceId)) && !map.isSourceLoaded(sourceId);
  }).map((def) => def.id);
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
