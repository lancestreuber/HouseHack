import { Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

// Same worker fix as parcel-map.tsx: the bundler rewrites the worker URL to an
// /assets/ path but never emits the file, so point MapLibre at the real asset.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(maplibreWorkerUrl);

// Free, keyless dark basemap — the same CARTO style the explorer uses.
const CARTO_DARK_STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Read-only map viewport for the onboarding location step: no pan/zoom,
 * recenters on the selected jurisdiction. Fill the positioned parent. */
export function LocationPreviewMap({
  lat,
  lon,
  zoom,
}: {
  lat: number;
  lon: number;
  zoom: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: CARTO_DARK_STYLE_URL,
      center: [lon, lat],
      zoom,
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Create once; view changes flow through the easeTo effect below.
  }, []);

  useEffect(() => {
    mapRef.current?.easeTo({ center: [lon, lat], zoom, duration: 600 });
  }, [lat, lon, zoom]);

  return <div aria-hidden className="absolute inset-0" ref={containerRef} />;
}
