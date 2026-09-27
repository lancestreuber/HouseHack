import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

// MapLibre parses vector tiles in a Web Worker. The bundler rewrites the
// worker's URL to an /assets/ path but never emits the file, so the worker 404s
// and the map renders as an empty gray box. Point it at the real asset.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(maplibreWorkerUrl);

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@HouseHack/ui/components/popover";
import {
  type PanelImperativeHandle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@HouseHack/ui/components/resizable";
import { Layers, SlidersHorizontal } from "lucide-react";

import type { PillarId } from "@/lib/pillars/score";
import { client } from "@/utils/orpc";

import type { AddressResult } from "./map/address-search";
import { setAddressSelectHandler } from "./map/address-select-store";
import { BreakdownPanel } from "./map/breakdown-panel";
import { CameraViewer } from "./map/camera-viewer";
import { ChatPane } from "./chat/chat-pane";
import { useParcelChatContext } from "./chat/parcel-context";
import { LayersPanel } from "./map/layers-panel";
import {
  hitsClickableOverlay,
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

type BasemapId = "carto" | "osm";

// Free, no-API-key vector basemaps -- picks the light/dark variant to match
// the site's own theme (next-themes), not a fixed choice.
const CARTO_DARK_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const CARTO_LIGHT_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const cartoStyleUrl = (isDark: boolean) => (isDark ? CARTO_DARK_STYLE_URL : CARTO_LIGHT_STYLE_URL);

// Plain OSM raster tiles. In dark theme these get a CSS filter on the map
// canvas (invert + grayscale) so they read as dark/B&W like the CARTO style;
// in light theme they're shown as-is.
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

// CARTO's vector tiles carry a "building" source-layer (source id "carto")
// with render_height/render_min_height fields -- the standard MapLibre 3D
// buildings recipe. Only present on the CARTO vector style; the OSM
// raster style has no vector data to extrude, so this is a no-op there.
const BUILDINGS_3D_LAYER_ID = "buildings-3d";
const BUILDING_ZOOM_THRESHOLD = 15;
const TILTED_PITCH = 55;
const SPIN_DEGREES_PER_SECOND = 6;

// A real Pittsburgh parcel (R1D-H, single-unit detached residential) with
// full indicator coverage, used so the panels show real demo data on first
// load instead of empty "select a parcel" placeholders everywhere.
const DEMO_PIN = "0001N00154000000";

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

// MapLibre's compact attribution control briefly shows its full text next to
// the (i) icon the first time it enters compact mode (and again on some
// resizes), instead of staying fully collapsed until clicked. Strip the class
// it uses for that so it always starts/stays icon-only until the user clicks it.
function collapseAttribution(map: MapLibreMap) {
  const el = map.getContainer().querySelector<HTMLElement>(".maplibregl-ctrl-attrib");
  el?.classList.remove("maplibregl-compact-show");
}

function add3dBuildingsLayer(map: MapLibreMap, visible: boolean) {
  if (!map.getSource("carto")) return;
  if (map.getLayer(BUILDINGS_3D_LAYER_ID)) return;
  map.addLayer({
    id: BUILDINGS_3D_LAYER_ID,
    type: "fill-extrusion",
    source: "carto",
    "source-layer": "building",
    minzoom: BUILDING_ZOOM_THRESHOLD,
    filter: ["!=", ["get", "hide_3d"], true],
    layout: { visibility: visible ? "visible" : "none" },
    paint: {
      "fill-extrusion-color": "#a3a3a3",
      "fill-extrusion-height": ["coalesce", ["get", "render_height"], 5],
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
      "fill-extrusion-opacity": 0.85,
    },
  });
}

function addParcelLayer(map: MapLibreMap, isDark: boolean) {
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
      // Light outline reads on a dark basemap; needs to flip dark-on-light.
      "line-color": isDark ? "#f5f5f5" : "#171717",
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

export function ParcelMap({ initialPin }: { initialPin?: string }) {
  const navigate = useNavigate({ from: "/" });
  const initialPinRef = useRef(initialPin);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isFirstRun = useRef(true);
  const [basemap, setBasemap] = useState<BasemapId>("carto");
  const basemapRef = useRef(basemap);
  basemapRef.current = basemap;
  // OSM raster tiles have no vector building data to extrude, so 3D/tilt only
  // makes sense on the CARTO style -- tilting a flat raster image just warps
  // it into a distorted trapezoid with nothing "3D" to show for it.
  const can3d = basemap === "carto";
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const [showZoning, setShowZoning] = useState(true);
  const [overlayState, setOverlayState] = useState<OverlayState>(INITIAL_OVERLAY_STATE);
  const overlayStateRef = useRef(overlayState);
  overlayStateRef.current = overlayState;
  const [zoom, setZoom] = useState(0);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  // Pre-selected with a real, well-covered demo parcel so the scores,
  // breakdown and typology panes are never empty on first load -- an actual
  // click or address search just swaps this out.
  const [selectedPin, setSelectedPin] = useState<string | null>(initialPin ?? DEMO_PIN);
  const [spinning, setSpinning] = useState(false);
  const spinningRef = useRef(spinning);
  spinningRef.current = spinning;
  const [threeDEnabled, setThreeDEnabled] = useState(true);
  const threeDEnabledRef = useRef(threeDEnabled);
  threeDEnabledRef.current = threeDEnabled;
  const wasZoomedInRef = useRef(false);
  // True once the current style has been parsed and our layers can be added.
  // Not map.isStyleLoaded(): that also waits for every tile, so it stays false
  // while spin/3D keeps streaming tiles and layer toggles were silently dropped.
  const styleReadyRef = useRef(false);
  const mapPane = usePaneCollapse();
  const scoresPane = usePaneCollapse();
  const breakdownPane = usePaneCollapse();
  const typologyPane = usePaneCollapse();
  const chatPane = usePaneCollapse();
  // The chat explains exactly what the panes show for the selected parcel.
  const chatContext = useParcelChatContext(selectedPin) ?? undefined;

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

  // The address search itself lives in the navbar (mounted on every route);
  // registering here lets it drive this map while this page is showing it.
  useEffect(() => {
    setAddressSelectHandler(handleAddressSelect);
    return () => setAddressSelectHandler(null);
  });

  // Keep the selected parcel in the URL so a refresh (or a shared link)
  // restores the same one, instead of always falling back to the demo parcel.
  useEffect(() => {
    void navigate({
      search: (prev) => ({ ...prev, pin: selectedPin ?? undefined }),
      replace: true,
      resetScroll: false,
    });
  }, [selectedPin, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: basemap === "osm" ? OSM_RASTER_STYLE : cartoStyleUrl(isDarkRef.current),
      bounds: COUNTY_BOUNDS,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({}), "top-right");

    map.on("load", () => {
      addZoningLayer(map);
      addParcelLayer(map, isDarkRef.current);
      add3dBuildingsLayer(map, threeDEnabledRef.current);
      collapseAttribution(map);

      // Restored from the URL (a refresh or a shared link): fly to it, since
      // we only have its PIN, not a screen position, at load time.
      if (initialPinRef.current) {
        void client.parcels.getCentroid({ pin: initialPinRef.current }).then((point) => {
          if (point) map.flyTo({ center: [point.lng, point.lat], zoom: 17 });
        });
        if (scoresPane.ref.current?.isCollapsed()) scoresPane.ref.current.expand();
      }
    });
    map.on("styledata", () => {
      addZoningLayer(map);
      addParcelLayer(map, isDarkRef.current);
      add3dBuildingsLayer(map, threeDEnabledRef.current);
    });
    map.on("resize", () => collapseAttribution(map));
    map.on("moveend", () => {
      void refreshParcels(map);
      void refreshViewportOverlays(map, overlayStateRef.current);
      setZoom(map.getZoom());

      // Tilt into a 3D view when zoomed in close enough to see buildings, and
      // back out when zooming back out -- but not while spin mode is driving
      // the camera itself, or when 3D mode has been turned off entirely.
      if (!spinningRef.current && threeDEnabledRef.current && basemapRef.current === "carto") {
        const zoomedIn = map.getZoom() >= BUILDING_ZOOM_THRESHOLD;
        if (zoomedIn !== wasZoomedInRef.current) {
          wasZoomedInRef.current = zoomedIn;
          map.easeTo({ pitch: zoomedIn ? TILTED_PITCH : 0, duration: 500 });
        }
      }
    });

    // Stop spin the instant the user touches the map -- not on "dragstart",
    // which only fires after a movement threshold, during which the spin
    // loop keeps changing bearing underneath the drag handler's own math
    // (it converts pixel delta to lng/lat using the *current* bearing), so
    // panning felt broken/unresponsive for that whole initial window.
    // ("rotatestart" is deliberately not used here: MapLibre also fires it
    // for our own programmatic setBearing calls in the spin loop, which
    // made spin mode cancel itself within a frame or two of starting.)
    const stopSpin = () => setSpinning(false);
    map.on("mousedown", stopSpin);
    map.on("touchstart", stopSpin);

    // Overlays (air quality, weather, lead, sewers, ...) come from the registry
    // in ./map/overlays. Re-applied after every style load, since a basemap
    // swap drops all sources and layers.
    const applyOverlays = () => {
      styleReadyRef.current = true;
      addZoningLayer(map);
      addParcelLayer(map, isDarkRef.current);
      add3dBuildingsLayer(map, threeDEnabledRef.current);
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
      if (hitsClickableOverlay(map, e.point)) return;
      const pin = e.features?.[0]?.properties?.pin;
      if (typeof pin === "string") setSelectedPin(pin);
    });
    map.on("mouseenter", PARCEL_HIT_LAYER_ID, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", PARCEL_HIT_LAYER_ID, () => (map.getCanvas().style.cursor = ""));

    // The map's container is one pane in a resizable/collapsible layout, so
    // its size changes from panel drags and collapses, not just React state.
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
    styleReadyRef.current = false;
    map.setStyle(basemap === "osm" ? OSM_RASTER_STYLE : cartoStyleUrl(isDark));
  }, [basemap, isDark]);

  // Manual 3D toggle: shows/hides the building extrusions and snaps pitch to
  // match, independent of the auto zoom-based tilt above. Also re-run when
  // the basemap changes, so switching to OSM (no vector buildings) always
  // flattens back out even if 3D mode is still "on".
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer(BUILDINGS_3D_LAYER_ID)) {
      map.setLayoutProperty(BUILDINGS_3D_LAYER_ID, "visibility", threeDEnabled && can3d ? "visible" : "none");
    }
    if (!threeDEnabled || !can3d) {
      wasZoomedInRef.current = false;
      map.easeTo({ pitch: 0, duration: 500 });
    } else if (map.getZoom() >= BUILDING_ZOOM_THRESHOLD) {
      wasZoomedInRef.current = true;
      map.easeTo({ pitch: TILTED_PITCH, duration: 500 });
    }
  }, [threeDEnabled, can3d]);

  // Spin mode: continuously rotates the bearing around the current center.
  // Tilted so extruded buildings actually orbit rather than just spinning
  // flat -- but only on CARTO; OSM has no buildings to show for it, and
  // pitching a flat raster tile just warps it into a distorted trapezoid.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !spinning) return;
    if (can3d) map.easeTo({ pitch: TILTED_PITCH, duration: 500 });
    let frame: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      map.setBearing((map.getBearing() + SPIN_DEGREES_PER_SECOND * dt) % 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [spinning, can3d]);

  // Applied imperatively rather than via className on the container: React owns
  // the class attribute, so changing it would wipe the `maplibregl-map` (and
  // friends) classes MapLibre adds to that same element, breaking its layout.
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    canvas.style.filter =
      basemap === "osm" && isDark
        ? "grayscale(100%) hue-rotate(180deg) invert(100%)"
        : "";
  }, [basemap, isDark]);

  useEffect(() => {
    const map = mapRef.current;
    // Mid style swap: the style.load handler applies the latest state instead.
    if (!map || !styleReadyRef.current) return;
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(ZONING_FILL_LAYER_ID)) return;
    const visibility = showZoning ? "visible" : "none";
    map.setLayoutProperty(ZONING_FILL_LAYER_ID, "visibility", visibility);
    map.setLayoutProperty(ZONING_LINE_LAYER_ID, "visibility", visibility);
    // Re-applied on every style swap too, since setStyle drops layout state.
  }, [showZoning, basemap]);

  return (
    <div className="h-full w-full overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize="75%" minSize="40%">
          <ResizablePanelGroup orientation="vertical" className="h-full w-full">
            <ResizablePanel
              defaultSize="85%"
              minSize={0}
              collapsible
              collapsedSize="34px"
              panelRef={mapPane.ref}
              onResize={mapPane.onResize}
            >
              <div className="flex h-full min-w-0 flex-col">
                <ParcelTab pin={selectedPin} collapsed={mapPane.collapsed} onToggleCollapse={mapPane.toggle} />
                <div className="relative min-h-0 flex-1">
                  <div className="absolute left-2 top-2 z-10">
                    <Popover>
                      <PopoverTrigger className="flex items-center gap-1.5 rounded-md border bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur hover:text-foreground">
                        <Layers className="size-3.5" />
                        Layers
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="w-auto border-none bg-transparent p-0 shadow-none ring-0">
                        <LayersPanel state={overlayState} onChange={setOverlayState} zoom={zoom} loadingIds={loadingIds} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div ref={containerRef} className="h-full w-full" />
                  <CameraViewer />
                  <div className="absolute bottom-2 left-2 z-10">
                    <Popover>
                      <PopoverTrigger className="flex items-center gap-1.5 rounded-md border bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur hover:text-foreground">
                        <SlidersHorizontal className="size-3.5" />
                        Map options
                      </PopoverTrigger>
                      <PopoverContent side="top" align="start" className="w-56">
                        <PopoverHeader>
                          <PopoverTitle>Basemap</PopoverTitle>
                        </PopoverHeader>
                        <div className="flex overflow-hidden rounded-md border">
                          <button
                            type="button"
                            onClick={() => setBasemap("carto")}
                            className={`flex-1 px-2 py-1 ${basemap === "carto" ? "bg-foreground text-background" : ""}`}
                          >
                            CARTO
                          </button>
                          <button
                            type="button"
                            onClick={() => setBasemap("osm")}
                            className={`flex-1 border-l px-2 py-1 ${basemap === "osm" ? "bg-foreground text-background" : ""}`}
                          >
                            OSM
                          </button>
                        </div>
                        <PopoverHeader>
                          <PopoverTitle>View</PopoverTitle>
                        </PopoverHeader>
                        <div className="flex overflow-hidden rounded-md border">
                          <button
                            type="button"
                            onClick={() => setShowZoning((v) => !v)}
                            className={`flex-1 px-2 py-1 ${showZoning ? "bg-foreground text-background" : ""}`}
                          >
                            Zoning
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpinning((v) => !v)}
                            className={`flex-1 border-l px-2 py-1 ${spinning ? "bg-foreground text-background" : ""}`}
                          >
                            Spin
                          </button>
                          <button
                            type="button"
                            onClick={() => setThreeDEnabled((v) => !v)}
                            disabled={!can3d}
                            title={can3d ? undefined : "3D buildings need the CARTO basemap"}
                            className={`flex-1 border-l px-2 py-1 disabled:opacity-40 ${threeDEnabled && can3d ? "bg-foreground text-background" : ""}`}
                          >
                            3D
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize="15%"
              minSize="8%"
              maxSize="30%"
              collapsible
              collapsedSize="34px"
              panelRef={typologyPane.ref}
              onResize={typologyPane.onResize}
            >
              <TypologyPanel pin={selectedPin} collapsed={typologyPane.collapsed} onToggleCollapse={typologyPane.toggle} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="25%" minSize="18%" maxSize="40%">
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
            <ResizableHandle withHandle />
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
            <ResizableHandle withHandle />
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
