// Builds public/data/typology/facts.bin.gz: one compact, citywide table of
// parcel *facts* (never scores) for the typology heatmap and the rezoning
// explorer. Scores are computed in the browser from these facts and the user's
// knobs, so nothing here has to be rebuilt when a weight or threshold changes.
//
//   DATABASE_URL=... bun src/scripts/build-typology-facts.ts   (from packages/db; reads only)
//
// Inputs: the pillar shards (zoning + 53 normalized indicators + 2 raw dollar
// values per City parcel) and a read-only query on the parcel table for each
// lot's representative point and oriented-rectangle width and depth.
//
// Layout: [u32 LE header length][header JSON][pad to 4][columns...], gzipped.
// Columns are column-major so neighboring parcels (PINs sort by block) compress well.

import { neon } from "@neondatabase/serverless";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = new URL("../../../../apps/web/", import.meta.url).pathname;
const SHARDS = `${ROOT}public/data/pillars/parcels`;
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
