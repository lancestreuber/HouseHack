import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

// MapLibre parses vector tiles in a Web Worker. The bundler rewrites the
// worker's URL to an /assets/ path but never emits the file, so the worker 404s
// and the map renders as an empty gray box. Point it at the real asset.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(maplibreWorkerUrl);

import {
  type PanelImperativeHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@HouseHack/ui/components/resizable";
import { GlassSurface } from "@HouseHack/ui/components/glass";
import { cn } from "@HouseHack/ui/lib/utils";

import type { PillarId } from "@/lib/pillars/score";
import { client } from "@/utils/orpc";

import { type AddressResult, AddressSearch } from "./map/address-search";
import { BreakdownPanel } from "./map/breakdown-panel";
import { useChatContext } from "./chat/chat-context-store";
import { SAMPLE } from "./chat/chat-launcher";
import { ChatPane } from "./chat/chat-pane";
import { LayersPanel } from "./map/layers-panel";
import {
  INITIAL_OVERLAY_STATE,
  loadingOverlayIds,
  type OverlayState,
  refreshViewportOverlays,
  registerTooltips,
  syncOverlays,
} from "./map/overlay-controller";
import { ParcelTab } from "./map/parcel-tab";
import { PillarsPanel } from "./map/pillars-panel";
import { TypologyPanel } from "./map/typology-panel";

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
// A blurred, wider outline beneath the crisp selection line for the glow.
const PARCEL_SELECTED_GLOW_LAYER_ID = "parcels-selected-glow";

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

// A real Pittsburgh parcel (R1D-H, single-unit detached residential) with
// full indicator coverage, used so the panels show real demo data on first
// load instead of empty "select a parcel" placeholders everywhere.
const DEMO_PIN = "0001N00154000000";

// The ParcelTab bar; the map is padded this much from the top so parcels and
// search results never hide behind it.
const PARCEL_TAB_HEIGHT = 34;

// CSS variables carry theme colors that MapLibre (which parses plain CSS
// colors, not custom properties) can't read directly, so resolve them here.
function resolveCssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

// --select-glow is `rgb(r g b / a)` space-slash syntax, which MapLibre's color
// parser rejects. Derive an rgba() from the --select hex instead.
function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16) || 0;
  const g = parseInt(raw.slice(2, 4), 16) || 0;
  const b = parseInt(raw.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
      "line-color": "#E8EEF7",
      "line-width": 1,
      "line-opacity": 0.7,
    },
  });
  // The glow: a wide, blurred line beneath the crisp selection outline.
  map.addLayer({
    id: PARCEL_SELECTED_GLOW_LAYER_ID,
    type: "line",
    source: PARCEL_SOURCE_ID,
    filter: ["==", ["get", "pin"], ""],
    paint: {
      "line-color": withAlpha(resolveCssColor("--select", "#2BD4BD"), 0.55),
      "line-width": 9,
      "line-blur": 6,
    },
  });
  map.addLayer({
    id: PARCEL_SELECTED_LAYER_ID,
    type: "line",
    source: PARCEL_SOURCE_ID,
    filter: ["==", ["get", "pin"], ""],
    paint: {
      "line-color": resolveCssColor("--select", "#2BD4BD"),
      "line-width": 3,
    },
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

/** Wires a ResizablePanel up to a header collapse button: tracks whether
 * it's currently collapsed (via onResize, so dragging past the threshold
 * keeps the icon in sync too, not just button clicks) and exposes a toggle. */
function usePaneCollapse() {
  const ref = useRef<PanelImperativeHandle | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const onResize = (size: { asPercentage: number }) => setCollapsed(size.asPercentage <= 0.5);
  const toggle = () => {
    const panel = ref.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };
  return { ref, collapsed, onResize, toggle };
}

/** Pads the map so fitBounds/flyTo/easeTo land parcels in the uncovered
 * region: to the left of the right column, above the bottom strip, and below
 * the ParcelTab. Re-applied whenever a pane reports a new pixel size. */
function useMapPadding(
  mapRef: React.RefObject<MapLibreMap | null>,
  mapReady: boolean,
  rightWidth: number,
  bottomHeight: number,
) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setPadding({
      top: PARCEL_TAB_HEIGHT,
      right: rightWidth,
      bottom: bottomHeight,
      left: 0,
    });
  }, [mapRef, mapReady, rightWidth, bottomHeight]);
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
  // Pre-selected with a real, well-covered demo parcel so the scores,
  // breakdown and typology panes are never empty on first load -- an actual
  // click or address search just swaps this out.
  const [selectedPin, setSelectedPin] = useState<string | null>(DEMO_PIN);
  const [mapReady, setMapReady] = useState(false);
  // Pixel sizes of the panes that overlap the map, tracked for map padding.
  const [rightWidth, setRightWidth] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);
  const mapPane = usePaneCollapse();
  const scoresPane = usePaneCollapse();
  const breakdownPane = usePaneCollapse();
  const typologyPane = usePaneCollapse();
  const chatPane = usePaneCollapse();
  const chatContext = useChatContext() ?? SAMPLE;
  const { resolvedTheme } = useTheme();

  useMapPadding(mapRef, mapReady, rightWidth, bottomHeight);

  const handleAddressSelect = (result: AddressResult) => {
    mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 17 });
    if (result.pin) {
      setSelectedPin(result.pin);
      if (scoresPane.ref.current?.isCollapsed()) scoresPane.ref.current.expand();
    }
  };

  const handleSelectPillar = (id: PillarId) => {
    if (breakdownPane.ref.current?.isCollapsed()) breakdownPane.ref.current.expand();
    document.getElementById(`breakdown-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
      setMapReady(true);
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

    // The map canvas now fills the whole explorer behind the panes, so it only
    // changes size with the viewport. Panes are overlays that no longer resize it.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
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
    map.setFilter(PARCEL_SELECTED_GLOW_LAYER_ID, ["==", ["get", "pin"], selectedPin ?? ""]);
  }, [selectedPin, basemap]);

  // Selection and glow colors track the theme's --select token.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(PARCEL_SELECTED_LAYER_ID)) return;
    const select = resolveCssColor("--select", "#2BD4BD");
    map.setPaintProperty(PARCEL_SELECTED_LAYER_ID, "line-color", select);
    map.setPaintProperty(PARCEL_SELECTED_GLOW_LAYER_ID, "line-color", withAlpha(select, 0.55));
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(ZONING_FILL_LAYER_ID)) return;
    const visibility = showZoning ? "visible" : "none";
    map.setLayoutProperty(ZONING_FILL_LAYER_ID, "visibility", visibility);
    map.setLayoutProperty(ZONING_LINE_LAYER_ID, "visibility", visibility);
    // Re-applied on every style swap too, since setStyle drops layout state.
  }, [showZoning, basemap]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      <ResizablePanelGroup orientation="vertical" className="absolute inset-0 pointer-events-none">
        <ResizablePanel defaultSize="85%" minSize="50%">
          <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
            <ResizablePanel
              defaultSize="75%"
              minSize={0}
              collapsible
              collapsedSize="34px"
              panelRef={mapPane.ref}
              onResize={mapPane.onResize}
            >
              <div className="flex h-full min-w-0 flex-col">
                <ParcelTab pin={selectedPin} collapsed={mapPane.collapsed} onToggleCollapse={mapPane.toggle} />
                <div className="pointer-events-none relative min-h-0 flex-1">
                  <div className="absolute left-2 top-2 z-10 flex max-h-[calc(100%-3.5rem)]">
                    <LayersPanel state={overlayState} onChange={setOverlayState} zoom={zoom} loadingIds={loadingIds} />
                  </div>
                  <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
                    <AddressSearch onSelect={handleAddressSelect} />
                  </div>
                  <div className="absolute bottom-2 left-2 z-10">
                    <GlassSurface edge="none" className="pointer-events-auto rounded-lg">
                      <div className="flex p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setBasemap("carto-dark")}
                          className={cn(
                            "rounded-md px-2.5 py-1",
                            basemap === "carto-dark"
                              ? "border border-primary/40 bg-primary/15 text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Dark Matter
                        </button>
                        <button
                          type="button"
                          onClick={() => setBasemap("osm-inverted")}
                          className={cn(
                            "rounded-md px-2.5 py-1",
                            basemap === "osm-inverted"
                              ? "border border-primary/40 bg-primary/15 text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          OSM (inverted)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowZoning((v) => !v)}
                          className={cn(
                            "rounded-md px-2.5 py-1",
                            showZoning
                              ? "border border-primary/40 bg-primary/15 text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Zoning
                        </button>
                      </div>
                    </GlassSurface>
                  </div>
                  <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
                    <GlassSurface edge="none" className="pointer-events-auto rounded-full px-2.5 py-1">
                      <p className="text-[10px] text-muted-foreground">Zoom in to see parcel boundaries</p>
                    </GlassSurface>
                    {showZoning && (
                      <GlassSurface edge="none" className="pointer-events-auto rounded-full px-2.5 py-1">
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="inline-block h-2 w-2 rounded-sm bg-[#ef4444]" />
                          Zoning excludes housing (Pittsburgh city only)
                        </p>
                      </GlassSurface>
                    )}
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="pointer-events-auto" />
            <ResizablePanel
              defaultSize="25%"
              minSize="18%"
              maxSize="40%"
              onResize={(size) => setRightWidth(size.inPixels)}
            >
              <div className="h-full w-full p-2">
                <GlassSurface edge="left" className="pointer-events-auto flex h-full w-full flex-col">
                  <ResizablePanelGroup orientation="vertical" className="h-full w-full">
                    <ResizablePanel
                      defaultSize="45%"
                      minSize={0}
                      collapsible
                      collapsedSize="80px"
                      panelRef={scoresPane.ref}
                      onResize={scoresPane.onResize}
                    >
                      {selectedPin ? (
                        <PillarsPanel
                          pin={selectedPin}
                          onClose={() => setSelectedPin(null)}
                          onSelectPillar={handleSelectPillar}
                          collapsed={scoresPane.collapsed}
                          onToggleCollapse={scoresPane.toggle}
                        />
                      ) : (
                        <p className="p-2 text-xs text-muted-foreground">
                          Click a parcel on the map to see its scores &amp; considerations.
                        </p>
                      )}
                    </ResizablePanel>
                    <ResizableHandle withHandle className="pointer-events-auto" />
                    <ResizablePanel
                      defaultSize="25%"
                      minSize={0}
                      collapsible
                      collapsedSize="34px"
                      panelRef={breakdownPane.ref}
                      onResize={breakdownPane.onResize}
                    >
                      <BreakdownPanel pin={selectedPin} collapsed={breakdownPane.collapsed} onToggleCollapse={breakdownPane.toggle} />
                    </ResizablePanel>
                    <ResizableHandle withHandle className="pointer-events-auto" />
                    <ResizablePanel
                      defaultSize="30%"
                      minSize={0}
                      collapsible
                      collapsedSize="48px"
                      panelRef={chatPane.ref}
                      onResize={chatPane.onResize}
                    >
                      <ChatPane
                        context={chatContext}
                        className="border-t"
                        collapsed={chatPane.collapsed}
                        onToggleCollapse={chatPane.toggle}
                      />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </GlassSurface>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle className="pointer-events-auto" />
        <ResizablePanel
          defaultSize="15%"
          minSize="8%"
          maxSize="30%"
          collapsible
          collapsedSize="34px"
          panelRef={typologyPane.ref}
          onResize={(size) => {
            typologyPane.onResize(size);
            setBottomHeight(size.inPixels);
          }}
        >
          <div className="h-full w-full p-2">
            <GlassSurface edge="top" className="pointer-events-auto flex h-full w-full flex-col">
              <TypologyPanel pin={selectedPin} collapsed={typologyPane.collapsed} onToggleCollapse={typologyPane.toggle} />
            </GlassSurface>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}