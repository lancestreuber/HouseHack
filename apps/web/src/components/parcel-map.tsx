import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

// MapLibre parses vector tiles in a Web Worker. The bundler rewrites the
// worker's URL to an /assets/ path but never emits the file, so the worker 404s
// and the map renders as an empty gray box. Point it at the real asset.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(maplibreWorkerUrl);

import { client } from "@/utils/orpc";

import { LayersPanel } from "./map/layers-panel";
import { PillarsPanel } from "./map/pillars-panel";
import {
  INITIAL_OVERLAY_STATE,
  loadingOverlayIds,
  type OverlayState,
  refreshViewportOverlays,
  registerTooltips,
  syncOverlays,
} from "./map/overlay-controller";

type BasemapId = "carto-dark" | "osm-inverted";

// Free, no-API-key dark vector basemap.
const CARTO_DARK_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Plain OSM raster tiles, made to look dark/B&W with a CSS filter on the
// map canvas (invert + grayscale) instead of a purpose-built dark style.
const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const PARCEL_SOURCE_ID = "parcels";
const PARCEL_LAYER_ID = "parcels-outline";
// Invisible fill so a click anywhere inside a parcel selects it.
const PARCEL_HIT_LAYER_ID = "parcels-hit";
const PARCEL_SELECTED_LAYER_ID = "parcels-selected";

// Pittsburgh CITY zoning only (not county-wide) -- static file, small enough
// (1068 features) to ship as one asset instead of a DB-backed bbox query.
const ZONING_SOURCE_ID = "zoning";
const ZONING_FILL_LAYER_ID = "zoning-fill";
const ZONING_LINE_LAYER_ID = "zoning-outline";
const ZONING_DATA_URL = "/data/pittsburgh-zoning.geojson";

// Full Allegheny County extent, so the map opens zoomed out to the whole
// county rather than any single neighborhood.
const COUNTY_BOUNDS: [[number, number], [number, number]] = [
  [-80.36, 40.19],
  [-79.69, 40.68],
];

// Heat overlays are inserted beneath the first of these that exists, so zoning
// and parcel outlines stay readable on top of the color fill.
const UNDER_OVERLAY_LAYER_IDS = [ZONING_FILL_LAYER_ID, ZONING_LINE_LAYER_ID, PARCEL_LAYER_ID];

// Below this zoom, parcels are too small/numerous to render usefully, so we
// skip fetching them entirely and just show the bare basemap.
const PARCEL_MIN_ZOOM = 14;

function addZoningLayer(map: MapLibreMap) {
  if (map.getSource(ZONING_SOURCE_ID)) return;
  map.addSource(ZONING_SOURCE_ID, {
    type: "geojson",
    data: ZONING_DATA_URL,
  });
  // Added before the parcel layer, so parcel outlines always draw on top of
  // the zoning fill/border.
  map.addLayer({
    id: ZONING_FILL_LAYER_ID,
    type: "fill",
    source: ZONING_SOURCE_ID,
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "non_housing"], true],
        "#ef4444",
        "rgba(0,0,0,0)",
      ],
      "fill-opacity": [
        "case",
        ["==", ["get", "non_housing"], true],
        0.4,
        0,
      ],
    },
  });
  map.addLayer({
    id: ZONING_LINE_LAYER_ID,
    type: "line",
    source: ZONING_SOURCE_ID,
    paint: {
      "line-color": "#ef4444",
      "line-width": 1,
      "line-opacity": [
        "case",
        ["==", ["get", "non_housing"], true],
        0.7,
        0.15,
      ],
    },
  });
}

function addParcelLayer(map: MapLibreMap) {
  if (map.getSource(PARCEL_SOURCE_ID)) return;
  map.addSource(PARCEL_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: PARCEL_HIT_LAYER_ID,
    type: "fill",
    source: PARCEL_SOURCE_ID,
    paint: { "fill-color": "#000000", "fill-opacity": 0 },
  });
  map.addLayer({
    id: PARCEL_LAYER_ID,
    type: "line",
    source: PARCEL_SOURCE_ID,
    paint: {
      "line-color": "#f5f5f5",
      "line-width": 1,
      "line-opacity": 0.85,
    },
  });
  map.addLayer({
    id: PARCEL_SELECTED_LAYER_ID,
    type: "line",
    source: PARCEL_SOURCE_ID,
    filter: ["==", ["get", "pin"], ""],
    paint: { "line-color": "#F2C230", "line-width": 3 },
  });
}

async function refreshParcels(map: MapLibreMap) {
  const source = map.getSource(PARCEL_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  if (!source) return;

  if (map.getZoom() < PARCEL_MIN_ZOOM) {
    source.setData({ type: "FeatureCollection", features: [] });
    return;
  }

  const bounds = map.getBounds();
  const data = await client.parcels.getByBounds({
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth(),
  });
  source.setData(data as Parameters<GeoJSONSource["setData"]>[0]);
}

export function ParcelMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isFirstRun = useRef(true);
  const [basemap, setBasemap] = useState<BasemapId>("carto-dark");
  const [showZoning, setShowZoning] = useState(true);
  const [overlayState, setOverlayState] = useState<OverlayState>(INITIAL_OVERLAY_STATE);
  const overlayStateRef = useRef(overlayState);
  overlayStateRef.current = overlayState;
  const [zoom, setZoom] = useState(0);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: CARTO_DARK_STYLE_URL,
      bounds: COUNTY_BOUNDS,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({}), "top-right");

    map.on("load", () => {
      addZoningLayer(map);
      addParcelLayer(map);
    });
    map.on("styledata", () => {
      addZoningLayer(map);
      addParcelLayer(map);
    });
    map.on("moveend", () => {
      void refreshParcels(map);
      void refreshViewportOverlays(map, overlayStateRef.current);
      setZoom(map.getZoom());
    });

    // Overlays (air quality, weather, lead, sewers, ...) come from the registry
    // in ./map/overlays. Re-applied after every style load, since a basemap
    // swap drops all sources and layers.
    const applyOverlays = () => {
      addZoningLayer(map);
      addParcelLayer(map);
      syncOverlays(map, overlayStateRef.current, UNDER_OVERLAY_LAYER_IDS);
      void refreshViewportOverlays(map, overlayStateRef.current);
    };
    map.on("style.load", applyOverlays);

    // Keep the panel's "loading" badges in sync with MapLibre's source state.
    const updateLoading = () => {
      const next = loadingOverlayIds(map, overlayStateRef.current);
      setLoadingIds((prev) => (prev.join() === next.join() ? prev : next));
    };
    map.on("sourcedata", updateLoading);
    map.on("idle", updateLoading);
    registerTooltips(map, () => overlayStateRef.current);

    map.on("click", PARCEL_HIT_LAYER_ID, (e) => {
      const pin = e.features?.[0]?.properties?.pin;
      if (typeof pin === "string") setSelectedPin(pin);
    });
    map.on("mouseenter", PARCEL_HIT_LAYER_ID, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", PARCEL_HIT_LAYER_ID, () => (map.getCanvas().style.cursor = ""));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Basemap swaps are handled by the effect below via setStyle, not by
    // recreating the map, so this only runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // The constructor already applied the initial style, so skip the first run
    // -- otherwise the map reloads its style (and drops added layers) on mount.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    map.setStyle(basemap === "carto-dark" ? CARTO_DARK_STYLE_URL : OSM_RASTER_STYLE);
  }, [basemap]);

  // Applied imperatively rather than via className on the container: React owns
  // the class attribute, so changing it would wipe the `maplibregl-map` (and
  // friends) classes MapLibre adds to that same element, breaking its layout.
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    canvas.style.filter =
      basemap === "osm-inverted"
        ? "grayscale(100%) hue-rotate(180deg) invert(100%)"
        : "";
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncOverlays(map, overlayState, UNDER_OVERLAY_LAYER_IDS);
    setLoadingIds(loadingOverlayIds(map, overlayState));
    void refreshViewportOverlays(map, overlayState).then(() =>
      setLoadingIds(loadingOverlayIds(map, overlayStateRef.current)),
    );
  }, [overlayState]);

  // Highlight the selected parcel; re-applied after basemap swaps.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(PARCEL_SELECTED_LAYER_ID)) return;
    map.setFilter(PARCEL_SELECTED_LAYER_ID, ["==", ["get", "pin"], selectedPin ?? ""]);
  }, [selectedPin, basemap]);

  // The map canvas changes width when the panel opens or closes.
  useEffect(() => {
    mapRef.current?.resize();
  }, [selectedPin === null]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(ZONING_FILL_LAYER_ID)) return;
    const visibility = showZoning ? "visible" : "none";
    map.setLayoutProperty(ZONING_FILL_LAYER_ID, "visibility", visibility);
    map.setLayoutProperty(ZONING_LINE_LAYER_ID, "visibility", visibility);
    // Re-applied on every style swap too, since setStyle drops layout state.
  }, [showZoning, basemap]);

  return (
    <div className="flex h-[640px] w-full overflow-hidden rounded-lg border">
      <div className="relative h-full min-w-0 flex-1">
        <div className="absolute left-2 top-2 z-10 flex max-h-[calc(100%-3.5rem)]">
          <LayersPanel state={overlayState} onChange={setOverlayState} zoom={zoom} loadingIds={loadingIds} />
        </div>
        <div ref={containerRef} className="h-full w-full" />
        <div className="absolute bottom-2 left-2 z-10 flex overflow-hidden rounded-md border bg-background/80 text-xs backdrop-blur">
          <button
            type="button"
            onClick={() => setBasemap("carto-dark")}
            className={`px-2 py-1 ${basemap === "carto-dark" ? "bg-foreground text-background" : ""}`}
          >
            Dark Matter
          </button>
          <button
            type="button"
            onClick={() => setBasemap("osm-inverted")}
            className={`px-2 py-1 ${basemap === "osm-inverted" ? "bg-foreground text-background" : ""}`}
          >
            OSM (inverted)
          </button>
          <button
            type="button"
            onClick={() => setShowZoning((v) => !v)}
            className={`border-l px-2 py-1 ${showZoning ? "bg-foreground text-background" : ""}`}
          >
            Zoning
          </button>
        </div>
        <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
          <p className="rounded bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
            Zoom in to see parcel boundaries
          </p>
          {showZoning && (
            <p className="flex items-center gap-1 rounded bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#ef4444]" />
              Zoning excludes housing (Pittsburgh city only)
            </p>
          )}
        </div>
      </div>
    {selectedPin && <PillarsPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />}
    </div>
  );
}
