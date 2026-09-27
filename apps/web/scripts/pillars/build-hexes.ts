// Rolls the per-parcel pillar scores up into a hexagon grid so each pillar can be
// shown as a citywide map overlay. Each hex holds the mean of its parcels'
// pillar scores at the published default weights, plus how many parcels a
// hazard gate capped (a floodway parcel can't be averaged back to "good" in the
// panel, but it can in a hex mean, so the capped share is kept alongside).
//
//   bun scripts/pillars/build-hexes.ts   (after build-indicators.ts)

import config from "../../src/lib/pillars/pillars.config.json";
import { PILLAR_IDS, scoreParcel } from "../../src/lib/pillars/score";
import { CACHE } from "./fetch-inputs";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT = `${ROOT}public/data/overlays/pillar-hexes.geojson`;

// Circumradius of a pointy-top hexagon, in meters. 175 m gives ~0.08 km² cells,
// about the size of an H3 resolution-9 cell (a few city blocks).
const RADIUS_M = 175;
// Hexes with fewer scored parcels than this show as no data.
const MIN_PARCELS = 3;

const LAT0 = 40.44;
const LON0 = -79.99;
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LON = 111_320 * Math.cos((LAT0 * Math.PI) / 180);
const toXY = (lon: number, lat: number) => [(lon - LON0) * M_PER_DEG_LON, (lat - LAT0) * M_PER_DEG_LAT];
const toLonLat = (x: number, y: number) => [+(LON0 + x / M_PER_DEG_LON).toFixed(6), +(LAT0 + y / M_PER_DEG_LAT).toFixed(6)];

// Axial coordinates of the pointy-top hex containing (x, y), by cube rounding.
function hexOf(x: number, y: number): [number, number] {
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / RADIUS_M;
  const r = ((2 / 3) * y) / RADIUS_M;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
}

function hexRing(q: number, r: number) {
  const cx = RADIUS_M * Math.sqrt(3) * (q + r / 2);
  const cy = RADIUS_M * 1.5 * r;
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return toLonLat(cx + RADIUS_M * Math.cos(a), cy + RADIUS_M * Math.sin(a));
  });
  return [...ring, ring[0]];
}

const data = (await Bun.file(`${ROOT}public/data/pillars/parcel-indicators.json`).json()) as {
  config_version: string;
  missing: number;
  count: number;
  pins: string[];
  indicators: string[];
  columns: Record<string, string>;
};
if (data.config_version !== config.version)
  console.warn(`indicators were built with config ${data.config_version}; current config is ${config.version}. Rebuild if sources changed.`);

const coords = new Map<string, [number, number]>();
const csv = (await Bun.file(`${CACHE}parcel-centroids.csv`).text()).split("\n");
const header = csv[0].split(",");
const [iLat, iLon, iPin] = ["LAT", "LONG", "PIN"].map((h) => header.indexOf(h));
for (const line of csv.slice(1)) {
  const cells = line.split(",");
  const lat = Number(cells[iLat]);
  const lon = Number(cells[iLon]);
  if (cells[iPin] && Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0) coords.set(cells[iPin], [lon, lat]);
}

type Acc = { n: number; sum: Record<string, number>; scored: Record<string, number>; capped: Record<string, number> };
const hexes = new Map<string, Acc>();
const columns = Object.fromEntries(data.indicators.map((id) => [id, Buffer.from(data.columns[id], "base64")]));
let located = 0;

for (let i = 0; i < data.count; i++) {
  const c = coords.get(data.pins[i]);
  if (!c) continue;
  located++;
  const values: Record<string, number | null> = {};
  for (const id of data.indicators) values[id] = columns[id][i] === data.missing ? null : columns[id][i];
  const s = scoreParcel(values);

  const key = hexOf(...(toXY(c[0], c[1]) as [number, number])).join(",");
  let acc = hexes.get(key);
  if (!acc) {
    acc = { n: 0, sum: {}, scored: {}, capped: {} };
    hexes.set(key, acc);
  }
  acc.n++;
  for (const p of PILLAR_IDS) {
    const score = s.pillars[p].score;
    if (score == null) continue;
    acc.sum[p] = (acc.sum[p] ?? 0) + score;
    acc.scored[p] = (acc.scored[p] ?? 0) + 1;
    if (s.pillars[p].flags.some((f) => f.capped)) acc.capped[p] = (acc.capped[p] ?? 0) + 1;
  }
}

const features = [...hexes.entries()].map(([key, acc]) => {
  const [q, r] = key.split(",").map(Number);
  const properties: Record<string, number | null> = { parcels: acc.n };
  for (const p of PILLAR_IDS) {
    const scored = acc.scored[p] ?? 0;
    properties[p] = scored >= MIN_PARCELS ? Math.round(acc.sum[p] / scored) : null;
    properties[`${p}_parcels`] = scored;
    properties[`${p}_capped`] = acc.capped[p] ?? 0;
  }
  return { type: "Feature", properties, geometry: { type: "Polygon", coordinates: [hexRing(q, r)] } };
});

await Bun.write(
  OUT,
  JSON.stringify({
    type: "FeatureCollection",
    metadata: { config_version: config.version, built: new Date().toISOString(), radius_m: RADIUS_M, min_parcels: MIN_PARCELS },
    features,
  }),
);
console.log(`${located}/${data.count} parcels located → ${features.length} hexes → ${OUT}`);
