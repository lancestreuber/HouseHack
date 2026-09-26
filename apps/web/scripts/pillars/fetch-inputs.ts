// Downloads the parcel spine and the parcel → census geography crosswalk into
// .cache/pillars/. Run from apps/web: `bun scripts/pillars/fetch-inputs.ts`.

import { mkdir } from "node:fs/promises";

export const CACHE = new URL("../../.cache/pillars/", import.meta.url).pathname;

const PARCELS_URL =
  "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ParcelsPublic/FeatureServer/0/query";
const PARCEL_FIELDS = "pin,zon_new,Shape__Area,Vacant,OwnerCateg,classdesc,usedesc,hood";
const CITY_ARCGIS = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services";
// City Ch. 906 code overlays (polygons) and residential lot dimensions (attributes only).
const CITY_LAYERS = [
  { name: "PGHWebSlope25", out: "slope25.geojson", fields: "slope25", geometry: true },
  { name: "PGHWebLandslideProne", out: "landslide-prone.geojson", fields: "landslideprone", geometry: true },
  { name: "PGHWebUndermined", out: "undermined.geojson", fields: "undermined", geometry: true },
  { name: "Parcels_Exp_02052025_Residential_Lot_Dimensions", out: "lot-dimensions.geojson", fields: "pin,Parcel_Width,Parcel_Len", geometry: false },
];
const CENTROIDS_URL =
  "https://data.wprdc.org/dataset/2536e5e2-253b-4c58-969d-687828bb94c6/resource/3fab7152-3f11-4788-8372-4c33f86ea813/download/parcel_centroids_2025_march.csv";

// Pages through an ArcGIS FeatureServer layer and saves it as one GeoJSON file.
async function fetchLayer(url: string, out: string, fields: string, geometry: boolean, pageSize: number) {
  const features: unknown[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: fields,
      returnGeometry: String(geometry),
      outSR: "4326",
      geometryPrecision: "6",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: "geojson",
    });
    const res = await fetch(`${url}?${params}`);
    if (!res.ok) throw new Error(`${out}: HTTP ${res.status} at offset ${offset}`);
    const page = (await res.json()) as { features?: unknown[]; properties?: { exceededTransferLimit?: boolean } };
    if (!page.features) throw new Error(`${out}: no features at offset ${offset}`);
    features.push(...page.features);
    if (page.features.length < pageSize && !page.properties?.exceededTransferLimit) break;
  }
  await Bun.write(`${CACHE}${out}`, JSON.stringify({ type: "FeatureCollection", features }));
  console.log(`${out}: ${features.length} features`);
}

const fetchParcels = () => fetchLayer(PARCELS_URL, "parcels.geojson", PARCEL_FIELDS, true, 2000);

async function fetchCentroids() {
  const res = await fetch(CENTROIDS_URL);
  if (!res.ok) throw new Error(`parcel centroids ${res.status}`);
  await Bun.write(`${CACHE}parcel-centroids.csv`, await res.arrayBuffer());
  console.log("parcel centroids: saved");
}

if (import.meta.main) {
  await mkdir(CACHE, { recursive: true });
  await Promise.all([
    fetchParcels(),
    fetchCentroids(),
    ...CITY_LAYERS.map((l) =>
      fetchLayer(`${CITY_ARCGIS}/${l.name}/FeatureServer/0/query`, l.out, l.fields, l.geometry, 1000),
    ),
  ]);
}
