// Helpers for pulling features out of ArcGIS REST FeatureServers as GeoJSON.
// Used by the per-dataset build scripts in this folder; never runs in the app.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type GeoJSONFeature = {
  type: "Feature";
  geometry: unknown;
  properties: Record<string, unknown>;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
  metadata?: Record<string, unknown>;
};

type QueryOptions = {
  where?: string;
  outFields: string[];
  // Decimal places kept in coordinates (5 ≈ 1 m), to keep static files small.
  geometryPrecision?: number;
  // Vertex simplification tolerance in degrees (outSR=4326).
  maxAllowableOffset?: number;
  pageSize?: number;
};

export async function fetchAllGeoJSON(
  layerUrl: string,
  { where = "1=1", outFields, geometryPrecision = 5, maxAllowableOffset, pageSize = 1000 }: QueryOptions,
): Promise<GeoJSONFeature[]> {
  const features: GeoJSONFeature[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      where,
      outFields: outFields.join(","),
      returnGeometry: "true",
      outSR: "4326",
      geometryPrecision: String(geometryPrecision),
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: "geojson",
    });
    if (maxAllowableOffset) params.set("maxAllowableOffset", String(maxAllowableOffset));

    const res = await fetch(`${layerUrl}/query`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!res.ok) throw new Error(`${layerUrl} offset ${offset}: HTTP ${res.status}`);
    const page = (await res.json()) as { features?: GeoJSONFeature[]; error?: unknown };
    if (page.error || !page.features) {
      throw new Error(`${layerUrl} offset ${offset}: ${JSON.stringify(page.error)}`);
    }
    features.push(...page.features);
    if (page.features.length < pageSize) break;
  }
  return features;
}

const OUT_DIR = path.resolve(import.meta.dirname, "../../public/data/overlays");

export async function writeOverlay(fileName: string, collection: FeatureCollection) {
  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, fileName);
  await writeFile(outPath, JSON.stringify(collection));
  const kb = Math.round(Buffer.byteLength(JSON.stringify(collection)) / 1024);
  console.log(`wrote ${fileName}: ${collection.features.length} features, ${kb} KB`);
}
