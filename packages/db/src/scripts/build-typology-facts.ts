// Builds public/data/typology/facts.bin.gz: one compact, citywide table of
// parcel *facts* (never scores) for the typology heatmap and the rezoning
// explorer. Scores are computed in the browser from these facts and the user's
// knobs, so nothing here has to be rebuilt when a weight or threshold changes.
//
//   DATABASE_URL=... bun src/scripts/build-typology-facts.ts   (from packages/db; reads only)
//
// Inputs: the pillar shards (zoning + 53 normalized indicators + 2 raw dollar
// values per City parcel), a read-only query on the parcel table for each
// lot's representative point and oriented-rectangle width and depth, and the
// public-lever overlays already built in public/data/overlays (federal
// designations, City zoning overlays, MVA market type, City-owned land,
// treasurer sales, tax delinquency).
//
// Layout: [u32 LE header length][header JSON][pad to 4][columns...], gzipped.
// Columns are column-major so neighboring parcels (PINs sort by block) compress well.

import { neon } from "@neondatabase/serverless";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = new URL("../../../../apps/web/", import.meta.url).pathname;
const SHARDS = `${ROOT}public/data/pillars/parcels`;
const OVERLAYS = `${ROOT}public/data/overlays`;
const OUT = `${ROOT}public/data/typology/facts.bin.gz`;
const MISSING_U8 = 255;
const RAW_COLUMNS = ["demand_median_sale_price", "afford_rent_vs_ami", "site_lot_area"] as const;

type Row = [zoning: string, norm: (number | null)[], raw: (number | null)[]];
type Index = { config_version: string; indicators: string[]; shards: string[] };

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const readJson = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
const index = readJson<Index>(`${SHARDS}/index.json`);
const rows = new Map<string, Row>();
for (const shard of index.shards) {
  const data = readJson<Record<string, Row>>(`${SHARDS}/${shard}.json`);
  for (const [pin, row] of Object.entries(data)) rows.set(pin, row);
}
console.log(`read ${rows.size} City parcels from ${index.shards.length} shards`);

const sql = neon(url);
const geo = (await sql`
  WITH p AS (SELECT pin, geom, ST_ExteriorRing(ST_OrientedEnvelope(geom)) AS ring FROM parcel)
  SELECT pin,
    ST_X(ST_PointOnSurface(geom)) AS lng,
    ST_Y(ST_PointOnSurface(geom)) AS lat,
    ST_Distance(ST_PointN(ring, 1)::geography, ST_PointN(ring, 2)::geography) AS side_a,
    ST_Distance(ST_PointN(ring, 2)::geography, ST_PointN(ring, 3)::geography) AS side_b
  FROM p
`) as { pin: string; lng: number; lat: number; side_a: number | null; side_b: number | null }[];
const geoByPin = new Map(geo.map((g) => [g.pin, g]));

const pins = [...rows.keys()].filter((pin) => geoByPin.has(pin)).sort();
console.log(`${pins.length} parcels have geometry (${rows.size - pins.length} dropped)`);
const count = pins.length;

const zones = [...new Set(pins.map((pin) => rows.get(pin)![0] ?? ""))].sort();
const zoneIndex = new Map(zones.map((z, i) => [z, i]));
if (zones.length > 254) throw new Error("too many zoning codes for a u8 column");

// --- Public levers (facts per parcel; the engine aggregates them per rezoning area) ---
type Ring = [number, number][];
type Geometry = { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
type Feature<P> = { properties: P; geometry: Geometry };
const features = <P>(file: string) => readJson<{ features: Feature<P>[] }>(`${OVERLAYS}/${file}`).features;

function inRing(x: number, y: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const polygons = (g: Geometry) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
// Point-in-polygon index: each feature's bounding box first, then the ray cast (holes excluded).
function polygonIndex<P>(list: Feature<P>[]) {
  const items = list.map((f) => {
    const polys = polygons(f.geometry);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const poly of polys) for (const [x, y] of poly[0] ?? []) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return { p: f.properties, polys, minX, minY, maxX, maxY };
  });
  return (x: number, y: number) =>
    items
      .filter((it) => x >= it.minX && x <= it.maxX && y >= it.minY && y <= it.maxY)
      .filter((it) => it.polys.some(([outer, ...holes]) => outer && inRing(x, y, outer) && !holes.some((h) => inRing(x, y, h))))
      .map((it) => it.p);
}

const designationsAt = polygonIndex(features<{ designation: string }>("designation-areas.geojson"));
const zoningOverlaysAt = polygonIndex(features<{ kind: string }>("city-zoning-overlays.geojson"));
const mvaAt = polygonIndex(features<{ mva: string }>("market-mva.geojson"));
const byPin = <P extends { pin: string }>(file: string) => new Map(features<P>(file).map((f) => [f.properties.pin, f.properties]));
const cityOwned = byPin<{ pin: string; class: string }>("city-owned-land.geojson");
const treasury = byPin<{ pin: string }>("treasury-sales.geojson");
const delinquent = byPin<{ pin: string; years_delinquent: number }>("tax-delinquent.geojson");

const DESIGNATION_BITS: Record<string, number> = { qct: 1, dda: 2, oz: 4 };
const OVERLAY_BITS: Record<string, number> = { inclusionary: 1, historic: 2, historic_landmark: 2, parking_reduction: 4, transit_buffer: 4 };
const CITY_CLASSES = ["", "available", "transfer", "pending", "hold", "not_developable"];
const MVA_TYPES = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "NC"];

const M_TO_FT = 3.28084;
const columns: { name: string; type: "u8" | "f32"; data: Uint8Array | Float32Array }[] = [];
const u8 = (name: string) => {
  const data = new Uint8Array(count);
  columns.push({ name, type: "u8", data });
  return data;
};
const f32 = (name: string) => {
  const data = new Float32Array(count);
  columns.push({ name, type: "f32", data });
  return data;
};

const zoneCol = u8("zone");
const lng = f32("lng");
const lat = f32("lat");
const width = f32("width_ft");
const depth = f32("depth_ft");
const rawCols = RAW_COLUMNS.map((id) => ({ i: index.indicators.indexOf(id), data: f32(`raw:${id}`) }));
const normCols = index.indicators.map((id) => u8(`norm:${id}`));
const designationCol = u8("lever:designations");
const overlayCol = u8("lever:overlays");
const mvaCol = u8("lever:mva");
const cityCol = u8("lever:city_owned");
const treasuryCol = u8("lever:treasury_sale");
const delinquentCol = u8("lever:years_delinquent");

pins.forEach((pin, i) => {
  const [zoning, norm, raw] = rows.get(pin)!;
  const g = geoByPin.get(pin)!;
  zoneCol[i] = zoneIndex.get(zoning ?? "")!;
  lng[i] = g.lng;
  lat[i] = g.lat;
  const sides = [g.side_a, g.side_b].filter((s): s is number => s != null && s > 0);
  width[i] = sides.length === 2 ? Math.min(...sides) * M_TO_FT : Number.NaN;
  depth[i] = sides.length === 2 ? Math.max(...sides) * M_TO_FT : Number.NaN;
  for (const { i: col, data } of rawCols) data[i] = raw[col] ?? Number.NaN;
  normCols.forEach((data, col) => {
    const v = norm[col];
    data[i] = v == null ? MISSING_U8 : v;
  });
  designationCol[i] = designationsAt(g.lng, g.lat).reduce((bits, p) => bits | (DESIGNATION_BITS[p.designation] ?? 0), 0);
  overlayCol[i] = zoningOverlaysAt(g.lng, g.lat).reduce((bits, p) => bits | (OVERLAY_BITS[p.kind] ?? 0), 0);
  mvaCol[i] = Math.max(0, MVA_TYPES.indexOf(mvaAt(g.lng, g.lat)[0]?.mva ?? ""));
  cityCol[i] = Math.max(0, CITY_CLASSES.indexOf(cityOwned.get(pin)?.class ?? ""));
  treasuryCol[i] = treasury.has(pin) ? 1 : 0;
  delinquentCol[i] = Math.min(254, delinquent.get(pin)?.years_delinquent ?? 0);
});

let offset = 0;
const layout = columns.map((c) => {
  const entry = { name: c.name, type: c.type, offset };
  offset += c.data.byteLength;
  offset = Math.ceil(offset / 4) * 4;
  return entry;
});
const header = new TextEncoder().encode(
  JSON.stringify({
    format: "typology-facts/1",
    built: new Date().toISOString(),
    pillars_config_version: index.config_version,
    count,
    missing_u8: MISSING_U8,
    indicators: index.indicators,
    zones,
    pins,
    columns: layout,
    levers: { designation_bits: DESIGNATION_BITS, overlay_bits: OVERLAY_BITS, city_classes: CITY_CLASSES, mva_types: MVA_TYPES },
  }),
);
const start = Math.ceil((4 + header.byteLength) / 4) * 4;
const buffer = new Uint8Array(start + offset);
new DataView(buffer.buffer).setUint32(0, header.byteLength, true);
buffer.set(header, 4);
columns.forEach((c, k) => buffer.set(new Uint8Array(c.data.buffer), start + layout[k]!.offset));

const gz = gzipSync(buffer, { level: 9 });
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, gz);
console.log(`wrote ${OUT}: ${count} parcels, ${(buffer.byteLength / 1e6).toFixed(1)} MB raw, ${(gz.byteLength / 1e6).toFixed(1)} MB gzipped`);
