// Pittsburgh Regional Transit (PRT) stops with scheduled trip counts (WPRDC, CC-BY).

import { writeOverlay, type GeoJSONFeature } from "./arcgis";

const URL =
  "https://data.wprdc.org/dataset/33d5f44b-5315-4374-b3e3-e4246e8ad5c9/resource/d6e6ed6e-9220-4a0e-9796-e72d83ce8e7a/download/stops.geojson";

const KEEP = ["stop_id", "stop_name", "mode", "route_filter", "trips_wd", "trips_sa", "trips_su", "munihood_display"];

export async function buildTransitStops() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`transit stops: HTTP ${res.status}`);
  const data = (await res.json()) as { features: GeoJSONFeature[] };
  const features = data.features.map((f) => {
    const properties: Record<string, unknown> = {};
    for (const key of KEEP) properties[key] = f.properties[key] ?? null;
    for (const key of ["trips_wd", "trips_sa", "trips_su"]) properties[key] = Number(properties[key] ?? 0);
    const geometry = f.geometry as { type: string; coordinates: number[] };
    // Round to 5 decimals (~1 m) to keep the file small.
    return {
      type: "Feature" as const,
      geometry: { type: geometry.type, coordinates: geometry.coordinates.map((c) => Math.round(c * 1e5) / 1e5) },
      properties,
    };
  });
  await writeOverlay("transit-stops.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: URL, dataset: "PRT stops (WPRDC)", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildTransitStops();
