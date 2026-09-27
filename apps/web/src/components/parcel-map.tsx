import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { Map as MapLibreMap, LngLat, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "@tanstack/react-router";
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
import { Navigation, Settings2 } from "lucide-react";

import type { PillarId } from "@/lib/pillars/score";
import { client } from "@/utils/orpc";

import type { AddressResult } from "./map/address-search";
import { setAddressSelectHandler } from "./map/address-select-store";
import { decodeWeights, encodeWeights, setPillarWeights, usePillarWeights } from "./map/pillar-weights-store";
import { CameraViewer } from "./map/camera-viewer";
import { DISCLAIMER, LIMITATIONS_URL } from "./disclaimer";
import {
  hitsClickableOverlay,
  loadingOverlayIds,
  refreshViewportOverlays,
  registerTooltips,
  syncOverlays,
} from "./map/overlay-controller";
import { getOverlayView, setOverlayView, useOverlayView } from "./map/overlay-store";
import { useParcelData, useTypologyFit } from "./map/pillars-panel";
import { Inspector, type InspectorTab } from "./explorer/inspector";
import { setShellState, useShellState } from "./shell/shell-store";

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

// Full Allegheny County extent, so the map opens zoomed out to the whole
// county rather than any single neighborhood.
const COUNTY_BOUNDS: [[number, number], [number, number]] = [
  [-80.36, 40.19],
  [-79.69, 40.68],
];

// Heat overlays are inserted beneath parcel outlines, so parcel boundaries
// stay readable on top of the color fill. Zoning used to be its own always-on
// layer here; it's now just the default heat overlay (registered in
// overlays/legal-feasibility.ts as "residential-zoning"), so it no longer
// needs its own entry in this list.
const UNDER_OVERLAY_LAYER_IDS = [PARCEL_LAYER_ID];

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

/** Degrees-minutes-seconds readout for the coordinate HUD. */
function dms(value: number, isLat: boolean) {
  const hemi = isLat ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  return `${deg}°${String(min).padStart(2, "0")}'${sec.toFixed(1)}"${hemi}`;
}

export function ParcelMap({ initialPin, initialWeights }: { initialPin?: string; initialWeights?: string }) {
  const navigate = useNavigate({ from: "/" });
  const initialPinRef = useRef(initialPin);
  const pillarWeights = usePillarWeights();
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
  // Dark-only console: the basemap and parcel outlines always use their dark
  // variants.
  const isDark = true;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const { state: overlayState } = useOverlayView();
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
  const { inspectorOpen } = useShellState();
  const [tab, setTab] = useState<InspectorTab>("alerts");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const centroidRef = useRef<{ pin: string; lng: number; lat: number } | null>(null);
  const [chip, setChip] = useState<{ x: number; y: number } | null>(null);
  const parcel = useParcelData(selectedPin);
  const lotFit = useTypologyFit(selectedPin, parcel.data);

  const updateChip = () => {
    const map = mapRef.current;
    const c = centroidRef.current;
    if (!map || !c || c.pin !== selectedPin) return;
    const pt = map.project(new LngLat(c.lng, c.lat));
    setChip({ x: pt.x, y: pt.y });
  };

  const handleAddressSelect = (result: AddressResult) => {
    mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 17 });
    if (result.pin) {
      setSelectedPin(result.pin);
      setShellState({ inspectorOpen: true });
    }
  };

  // Cross-tab scroll links: a pillar card jumps into Breakdowns, a typology
  // card into Alerts, then scrolls to its anchored section.
  const handleSelectPillar = (id: PillarId) => {
    setTab("breakdowns");
    requestAnimationFrame(() =>
      document.getElementById(`breakdown-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const handleSelectTypology = (siteFitId: string) => {
    setTab("alerts");
    requestAnimationFrame(() =>
      document.getElementById(`alert-${siteFitId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // The address search itself lives in the navbar (mounted on every route);
  // registering here lets it drive this map while this page is showing it.
  useEffect(() => {
    setAddressSelectHandler(handleAddressSelect);
    return () => setAddressSelectHandler(null);
  });

  // Seed the global weights store from the URL once on mount; only ever runs
  // for the very first page load (a real navigation replaces the URL from
  // the store below, not the other way around).
  useEffect(() => {
    if (initialWeights) setPillarWeights(decodeWeights(initialWeights));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the selected parcel and pillar weights in the URL so a refresh (or
  // a shared link) restores the same view, instead of always falling back to
  // the demo parcel and default weights.
  useEffect(() => {
    void navigate({
      search: (prev) => ({ ...prev, pin: selectedPin ?? undefined, w: encodeWeights(pillarWeights) }),
      replace: true,
      resetScroll: false,
    });
  }, [selectedPin, pillarWeights, navigate]);

  // Keep the selected-parcel chip glued to the parcel's centroid on screen.
  useEffect(() => {
    if (!selectedPin) {
      centroidRef.current = null;
      setChip(null);
      return;
    }
    if (centroidRef.current?.pin === selectedPin) {
      updateChip();
      return;
    }
    let cancelled = false;
    void client.parcels.getCentroid({ pin: selectedPin }).then((point) => {
      if (cancelled || !point) return;
      centroidRef.current = { pin: selectedPin, lng: point.lng, lat: point.lat };
      updateChip();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPin]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: basemap === "osm" ? OSM_RASTER_STYLE : cartoStyleUrl(isDarkRef.current),
      bounds: COUNTY_BOUNDS,
      attributionControl: { compact: true, customAttribution: `${DISCLAIMER} <a href="${LIMITATIONS_URL}">Limitations</a>` },
    });
    mapRef.current = map;

    map.on("load", () => {
      addParcelLayer(map, isDarkRef.current);
      add3dBuildingsLayer(map, threeDEnabledRef.current);
      collapseAttribution(map);
      setCenter(map.getCenter());

      // Restored from the URL (a refresh or a shared link): fly to it, since
      // we only have its PIN, not a screen position, at load time.
      if (initialPinRef.current) {
        void client.parcels.getCentroid({ pin: initialPinRef.current }).then((point) => {
          if (point) map.flyTo({ center: [point.lng, point.lat], zoom: 17 });
        });
        setShellState({ inspectorOpen: true });
      }
    });
    map.on("styledata", () => {
      addParcelLayer(map, isDarkRef.current);
      add3dBuildingsLayer(map, threeDEnabledRef.current);
    });
    map.on("resize", () => collapseAttribution(map));
    map.on("moveend", () => {
      void refreshParcels(map);
      void refreshViewportOverlays(map, getOverlayView().state);
      setOverlayView({ zoom: map.getZoom() });
      setCenter(map.getCenter());
      updateChip();

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
      addParcelLayer(map, isDarkRef.current);
      add3dBuildingsLayer(map, threeDEnabledRef.current);
      syncOverlays(map, getOverlayView().state, UNDER_OVERLAY_LAYER_IDS);
      void refreshViewportOverlays(map, getOverlayView().state);
    };
    map.on("style.load", applyOverlays);

    // Keep the sidebar's "loading" badges in sync with MapLibre's source state.
    const updateLoading = () => {
      const next = loadingOverlayIds(map, getOverlayView().state);
      if (getOverlayView().loadingIds.join() !== next.join()) setOverlayView({ loadingIds: next });
    };
    map.on("sourcedata", updateLoading);
    map.on("idle", updateLoading);
    registerTooltips(map, () => getOverlayView().state);

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
    setOverlayView({ loadingIds: loadingOverlayIds(map, overlayState) });
    void refreshViewportOverlays(map, overlayState).then(() =>
      setOverlayView({ loadingIds: loadingOverlayIds(map, getOverlayView().state) }),
    );
  }, [overlayState]);

  // Highlight the selected parcel; re-applied after basemap swaps.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(PARCEL_SELECTED_LAYER_ID)) return;
    map.setFilter(PARCEL_SELECTED_LAYER_ID, ["==", ["get", "pin"], selectedPin ?? ""]);
  }, [selectedPin, basemap]);

  const lotArea = lotFit.data?.lot.areaSf;
  const steepShare = parcel.data?.raw.site_steep_slope_share;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="relative min-w-0 flex-1">
        <div ref={containerRef} className="h-full w-full" />
        {chip && parcel.data && (
          <div
            className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-lg border border-border bg-card/95 px-2.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
            style={{ left: chip.x, top: chip.y - 10 }}
          >
            <span className="size-1.5 rounded-full bg-brass" aria-hidden />
            <span className="flex flex-col">
              <span className="text-[13px] font-semibold leading-tight tracking-tight text-foreground">
                {parcel.data.zoning || "unknown"} • Pittsburgh
              </span>
              <span className="text-[13px] leading-tight text-muted-foreground tnum">
                {lotArea == null ? "lot size unknown" : `${Math.round(lotArea).toLocaleString("en-US")} sq ft`}
                {steepShare == null ? "" : ` • ${Math.round(steepShare * 100)}% steep`}
              </span>
            </span>
          </div>
        )}
        <CameraViewer />
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1.5">
          <Popover>
            <PopoverTrigger
              title="Map options"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-popover hover:text-foreground"
            >
              <Settings2 className="size-4" />
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
                  onClick={() => setSpinning((v) => !v)}
                  className={`flex-1 px-2 py-1 ${spinning ? "bg-foreground text-background" : ""}`}
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
                  2.5D
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 })}
            title="Reset north"
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-popover hover:text-foreground"
          >
            <Navigation className="size-4 text-brass" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom in"
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-popover hover:text-foreground"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom out"
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-popover hover:text-foreground"
          >
            −
          </button>
        </div>
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-[13px] text-faint tnum backdrop-blur-md">
          <span>LAT {center ? dms(center.lat, true) : "—"}</span>
          <span className="text-border">•</span>
          <span>LON {center ? dms(center.lng, false) : "—"}</span>
          <span className="text-border">•</span>
          <span>ELEV unknown</span>
          <span className="text-border">•</span>
          <span className="text-muted-foreground">EPSG:2272 (PA-S)</span>
        </div>
      </div>
      {inspectorOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setShellState({ inspectorOpen: false })} aria-hidden />
          <Inspector
            pin={selectedPin}
            weights={pillarWeights}
            tab={tab}
            onTab={setTab}
            onSelectPillar={handleSelectPillar}
            onSelectTypology={handleSelectTypology}
          />
        </>
      )}
    </div>
  );
}
