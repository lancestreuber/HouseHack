// Map layers for the typology heatmap: parcel interiors filled green / yellow /
// red / grey when zoomed in (the parcel polygons the map already loads), one
// colored point per parcel when zoomed out, and outlines of the rezoning
// clusters. Re-applied after every basemap swap, like the overlays.

import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { Popup } from "maplibre-gl";

import type { LegendEntry } from "@/lib/typology-map/engine";
import { getHeat, type HeatState } from "@/lib/typology-map/heatmap-store";

const POINTS_SOURCE = "heat-points";
const POINTS_LAYER = "heat-points";
const DENSITY_LAYER = "heat-density";
const FILL_LAYER = "heat-parcel-fill";
const OUTLINE_LAYER = "heat-parcel-outline";
const CLUSTER_SOURCE = "heat-clusters";
const CLUSTER_FILL = "heat-clusters-fill";
const CLUSTER_LINE = "heat-clusters-line";
export const HEAT_POINTS_MAX_ZOOM = 14;
// Below this zoom the parcels blend into a density heatmap (like the lead-line overlay); dots take over above it.
const DOT_ZOOM = 12.5;
// How much each legend entry adds to the heatmap: only the parcels worth building on glow.
const HEAT_WEIGHT: Record<string, number> = { green: 1, yellow: 0.2, unlocked: 1, unlocked_small: 0.6 };
const CLUSTER_COLOR = "#a855f7";

const TRANSPARENT = "rgba(0,0,0,0)";
const levelColor = (legend: LegendEntry[]) =>
  ["match", ["get", "l"], ...legend.flatMap((e, code) => [code, e.color]), TRANSPARENT] as unknown as ExpressionSpecification;

const empty = { type: "FeatureCollection" as const, features: [] };
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** `keepOnTopLayerId` (the selected-parcel outline) stays above the heat layers. */
export type HeatLayerOptions = { parcelSourceId: string; beforeLayerId: string; keepOnTopLayerId?: string };

function ensureLayers(map: MapLibreMap, { parcelSourceId, beforeLayerId }: HeatLayerOptions) {
  const before = map.getLayer(beforeLayerId) ? beforeLayerId : undefined;
  if (!map.getSource(POINTS_SOURCE)) map.addSource(POINTS_SOURCE, { type: "geojson", data: empty });
  if (!map.getSource(CLUSTER_SOURCE)) map.addSource(CLUSTER_SOURCE, { type: "geojson", data: empty });
  if (!map.getLayer(DENSITY_LAYER)) {
    map.addLayer(
      {
        id: DENSITY_LAYER,
        type: "heatmap",
        source: POINTS_SOURCE,
        maxzoom: HEAT_POINTS_MAX_ZOOM + 1,
        filter: [">", ["get", "w"], 0],
        paint: {
          "heatmap-weight": ["get", "w"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 12, 9, HEAT_POINTS_MAX_ZOOM, 16],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.35, HEAT_POINTS_MAX_ZOOM, 1],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            // A dark rim at low density keeps the glow readable over the zoning colors underneath.
            0,
            "rgba(0,0,0,0)",
            0.08,
            "rgba(5,20,10,0.55)",
            0.25,
            "rgba(22,163,74,0.9)",
            0.55,
            "rgba(74,222,128,0.95)",
            0.8,
            "rgba(217,249,157,1)",
            1,
            "rgba(255,255,255,1)",
          ],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], DOT_ZOOM, 0.9, HEAT_POINTS_MAX_ZOOM + 0.5, 0],
        },
      },
      before,
    );
  }
  if (!map.getLayer(POINTS_LAYER)) {
    map.addLayer(
      {
        id: POINTS_LAYER,
        type: "circle",
        source: POINTS_SOURCE,
        minzoom: DOT_ZOOM,
        maxzoom: HEAT_POINTS_MAX_ZOOM,
        paint: {
          "circle-color": TRANSPARENT,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2.5, 14, 4.5],
          "circle-opacity": 0.95,
          "circle-stroke-color": "#000000",
          "circle-stroke-width": 0.75,
          "circle-stroke-opacity": 0.8,
        },
      },
      before,
    );
  }
  if (!map.getLayer(FILL_LAYER) && map.getSource(parcelSourceId)) {
    map.addLayer(
      { id: FILL_LAYER, type: "fill", source: parcelSourceId, paint: { "fill-color": "rgba(0,0,0,0)", "fill-opacity": 0.7 } },
      before,
    );
  }
  if (!map.getLayer(OUTLINE_LAYER) && map.getSource(parcelSourceId)) {
    map.addLayer({ id: OUTLINE_LAYER, type: "line", source: parcelSourceId, paint: { "line-color": "rgba(0,0,0,0)", "line-width": 1.5 } }, before);
  }
  if (!map.getLayer(CLUSTER_FILL)) {
    map.addLayer({ id: CLUSTER_FILL, type: "fill", source: CLUSTER_SOURCE, paint: { "fill-color": CLUSTER_COLOR, "fill-opacity": ["case", ["get", "focus"], 0.3, 0.12] } });
  }
  if (!map.getLayer(CLUSTER_LINE)) {
    map.addLayer({
      id: CLUSTER_LINE,
      type: "line",
      source: CLUSTER_SOURCE,
      paint: { "line-color": CLUSTER_COLOR, "line-width": ["case", ["get", "focus"], 3, 1.5], "line-dasharray": [2, 1] },
    });
  }
}

const HEAT_LAYERS = [DENSITY_LAYER, POINTS_LAYER, FILL_LAYER, OUTLINE_LAYER, CLUSTER_FILL, CLUSTER_LINE];

let lastPointsResult: unknown = null;
let lastClusterKey = "";

/** Brings the heat layers in line with the store. Cheap when nothing changed. */
export function syncHeatLayers(map: MapLibreMap, options: HeatLayerOptions, heat: HeatState = getHeat(), force = false) {
  ensureLayers(map, options);
  const visible = heat.enabled && heat.result != null;
  for (const id of HEAT_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  if (!visible || !heat.base || !heat.result) return;
  // Above the map overlays while on, so the zoning heat underneath doesn't muddy the colors.
  const order = map.getStyle().layers.map((l) => l.id);
  if (order[order.length - 1] !== (options.keepOnTopLayerId ?? CLUSTER_LINE)) {
    for (const id of HEAT_LAYERS) if (map.getLayer(id)) map.moveLayer(id);
    if (options.keepOnTopLayerId && map.getLayer(options.keepOnTopLayerId)) map.moveLayer(options.keepOnTopLayerId);
  }
  const { base, result } = heat;

  if (force || lastPointsResult !== result) {
    lastPointsResult = result;
    const weights = result.legend.map((e) => HEAT_WEIGHT[e.key] ?? 0);
    const features = new Array(base.pins.length);
    for (let i = 0; i < base.pins.length; i++) {
      const l = result.level[i];
      features[i] = { type: "Feature", id: i, geometry: { type: "Point", coordinates: [base.lng[i], base.lat[i]] }, properties: { l, w: weights[l] } };
    }
    (map.getSource(POINTS_SOURCE) as GeoJSONSource).setData({ type: "FeatureCollection", features });
    map.setPaintProperty(POINTS_LAYER, "circle-color", levelColor(result.legend));
  }

  const clusterKey = `${result.summary.ms}:${result.clusters.length}:${heat.focusCluster}`;
  if (force || clusterKey !== lastClusterKey) {
    lastClusterKey = clusterKey;
    (map.getSource(CLUSTER_SOURCE) as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: result.clusters.map((c) => ({
        type: "Feature",
        id: c.id,
        geometry: { type: "Polygon", coordinates: [c.hull] },
        properties: {
          id: c.id,
          homes: c.homes,
          affordable: c.affordableHomes,
          acres: c.acres,
          parcels: c.parcels.length,
          vacant: c.vacant,
          zones: c.zones.join(", "),
          target: c.target,
          ease: Math.round(c.ease * 100),
          focus: c.id === heat.focusCluster,
        },
      })),
    });
  }
  paintParcelFill(map, options, heat);
}

/** Colors the parcel polygons currently loaded for the viewport. */
export function paintParcelFill(map: MapLibreMap, { parcelSourceId }: HeatLayerOptions, heat: HeatState = getHeat()) {
  if (!map.getLayer(FILL_LAYER) || !heat.base || !heat.result || !heat.enabled) return;
  const { legend } = heat.result;
  const byLevel: string[][] = legend.map(() => []);
  const seen = new Set<string>();
  for (const f of map.querySourceFeatures(parcelSourceId)) {
    const pin = f.properties?.pin;
    if (typeof pin !== "string" || seen.has(pin)) continue;
    seen.add(pin);
    const i = heat.base.pinIndex.get(pin);
    if (i != null) byLevel[heat.result.level[i]].push(pin);
  }
  const branches = byLevel.flatMap((pins, code) => (pins.length && legend[code].color !== TRANSPARENT ? [pins, legend[code].color] : []));
  const color = branches.length ? (["match", ["get", "pin"], ...branches, TRANSPARENT] as unknown as ExpressionSpecification) : TRANSPARENT;
  map.setPaintProperty(FILL_LAYER, "fill-color", color);
  if (map.getLayer(OUTLINE_LAYER)) map.setPaintProperty(OUTLINE_LAYER, "line-color", color);
}

/** Hover popups and clicks for the heat layers; returns an unsubscribe. */
export function registerHeatInteractions(map: MapLibreMap, handlers: { onPickPoint: (lngLat: [number, number]) => void; onPickCluster: (id: number) => void }) {
  const popup = new Popup({ closeButton: false, closeOnClick: false, className: "text-xs" });
  const onClusterMove = (e: MapLayerMouseEvent) => {
    const p = e.features?.[0]?.properties;
    if (!p) return;
    map.getCanvas().style.cursor = "pointer";
    popup
      .setLngLat(e.lngLat)
      .setHTML(
        `<div style="color:#171717"><b>Rezoning area #${p.id}</b><br/>+${fmt(p.homes)} homes (${fmt(p.affordable)} affordable)<br/>${Number(p.acres).toFixed(1)} acres · ${p.parcels} parcels (${p.vacant} vacant)<br/>${p.zones} → ${p.target} · ease ${p.ease}/100</div>`,
      )
      .addTo(map);
  };
  const onLeave = () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  };
  const onClusterClick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.id;
    if (typeof id === "number") handlers.onPickCluster(id);
  };
  const onPointClick = (e: MapLayerMouseEvent) => {
    const g = e.features?.[0]?.geometry;
    if (g?.type === "Point") handlers.onPickPoint(g.coordinates as [number, number]);
  };
  const onPointEnter = () => (map.getCanvas().style.cursor = "pointer");
  map.on("mousemove", CLUSTER_FILL, onClusterMove);
  map.on("mouseleave", CLUSTER_FILL, onLeave);
  map.on("click", CLUSTER_FILL, onClusterClick);
  map.on("click", POINTS_LAYER, onPointClick);
  map.on("mouseenter", POINTS_LAYER, onPointEnter);
  map.on("mouseleave", POINTS_LAYER, onLeave);
  return () => {
    map.off("mousemove", CLUSTER_FILL, onClusterMove);
    map.off("mouseleave", CLUSTER_FILL, onLeave);
    map.off("click", CLUSTER_FILL, onClusterClick);
    map.off("click", POINTS_LAYER, onPointClick);
    map.off("mouseenter", POINTS_LAYER, onPointEnter);
    map.off("mouseleave", POINTS_LAYER, onLeave);
    popup.remove();
  };
}
