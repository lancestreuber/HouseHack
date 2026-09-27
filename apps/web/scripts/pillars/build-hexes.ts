// Rolls the per-parcel pillar scores up into hexagon grids so each pillar can be
// shown as a citywide map overlay.
//
// Each hex gets a distance-weighted (Gaussian) mean of the default-weight
// parcel scores around its center, not just the parcels inside it. The kernel
// is adaptive: its width starts at the hex size and grows until it reaches
// K_NEAREST scored parcels, so hexes over parks, rail or sparse blocks still
// get a value from their neighbors instead of showing no data. The cost is
// blur: a sharp edge (a floodway, a steep hillside) bleeds into nearby hexes.
// Hazard caps are therefore counted only from parcels inside the hex.
//
//   bun scripts/pillars/build-hexes.ts   (after build-indicators.ts)

import config from "../../src/lib/pillars/pillars.config.json";
import { PILLAR_IDS, scoreParcel } from "../../src/lib/pillars/score";
import { CACHE } from "./fetch-inputs";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT_DIR = `${ROOT}public/data/overlays/`;

// One grid (and file) per zoom band; the map shows level i from
// LEVELS[i].minZoom up to the next level's. Radius is the hexagon's
// circumradius in meters. The fine file is loaded only once zoomed in, and
// only the hexes in view are handed to the map (see OverlayDefinition.detail).
export const LEVELS = [
  { radius: 100, minZoom: 0, file: "pillar-hexes.geojson" },
  { radius: 50, minZoom: 14, file: "pillar-hexes-fine.geojson" },
];
// The kernel widens until at least this many scored parcels fall within 2σ.
const K_NEAREST = 8;
// Beyond this, a hex is left as no data rather than borrowing from far away.
const MAX_REACH_M = 1500;

const LAT0 = 40.44;
const LON0 = -79.99;
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LON = 111_320 * Math.cos((LAT0 * Math.PI) / 180);
const toXY = (lon: number, lat: number) => [(lon - LON0) * M_PER_DEG_LON, (lat - LAT0) * M_PER_DEG_LAT];
const toLonLat = (x: number, y: number) => [+(LON0 + x / M_PER_DEG_LON).toFixed(5), +(LAT0 + y / M_PER_DEG_LAT).toFixed(5)];

// Axial coordinates of the pointy-top hex containing (x, y), by cube rounding.
function hexOf(x: number, y: number, radius: number): [number, number] {
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / radius;
  const r = ((2 / 3) * y) / radius;
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

const hexCenter = (q: number, r: number, radius: number) => [radius * Math.sqrt(3) * (q + r / 2), radius * 1.5 * r];

function hexRing(q: number, r: number, radius: number) {
  const [cx, cy] = hexCenter(q, r, radius);
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return toLonLat(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
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

// Everything mapped: the five pillars, plus the overall score exactly as the
// parcel panel shows it (pillar blend × zoning and site-availability multipliers).
const METRICS = [...PILLAR_IDS, "overall"] as const;

// Located parcels as flat arrays: position in meters, score per metric (NaN =
// not scored) and whether it was capped (a hazard gate for a pillar; a zoning
// or availability multiplier below 1 for the overall).
const columns = Object.fromEntries(data.indicators.map((id) => [id, Buffer.from(data.columns[id], "base64")]));
const X: number[] = [];
const Y: number[] = [];
const score = Object.fromEntries(METRICS.map((p) => [p, [] as number[]]));
const capped = Object.fromEntries(METRICS.map((p) => [p, [] as boolean[]]));
for (let i = 0; i < data.count; i++) {
  const c = coords.get(data.pins[i]);
  if (!c) continue;
  const values: Record<string, number | null> = {};
  for (const id of data.indicators) values[id] = columns[id][i] === data.missing ? null : columns[id][i];
  const s = scoreParcel(values);
  const [x, y] = toXY(c[0], c[1]);
  X.push(x);
  Y.push(y);
  for (const p of PILLAR_IDS) {
    score[p].push(s.pillars[p].score ?? Number.NaN);
    capped[p].push(s.pillars[p].flags.some((f) => f.capped));
  }
  score.overall.push(s.overall ?? Number.NaN);
  capped.overall.push((s.legal?.multiplier ?? 1) * (s.availability?.multiplier ?? 1) < 1);
}
const located = X.length;

// Uniform grid index for radius searches.
const CELL_M = 100;
const cellKey = (i: number, j: number) => `${i},${j}`;
const grid = new Map<string, number[]>();
for (let k = 0; k < located; k++) {
  const key = cellKey(Math.floor(X[k] / CELL_M), Math.floor(Y[k] / CELL_M));
  const bucket = grid.get(key);
  if (bucket) bucket.push(k);
  else grid.set(key, [k]);
}

function within(cx: number, cy: number, reach: number) {
  const out: { k: number; d2: number }[] = [];
  const r2 = reach * reach;
  for (let i = Math.floor((cx - reach) / CELL_M); i <= Math.floor((cx + reach) / CELL_M); i++) {
    for (let j = Math.floor((cy - reach) / CELL_M); j <= Math.floor((cy + reach) / CELL_M); j++) {
      for (const k of grid.get(cellKey(i, j)) ?? []) {
        const d2 = (X[k] - cx) ** 2 + (Y[k] - cy) ** 2;
        if (d2 <= r2) out.push({ k, d2 });
      }
    }
  }
  return out;
}

// Gaussian-weighted mean of one pillar around (cx, cy). σ is the hex radius,
// widened so the K_NEAREST-th scored parcel sits at 2σ where parcels are sparse.
function smooth(p: string, cx: number, cy: number, radius: number) {
  let reach = 3 * radius;
  let near = within(cx, cy, reach).filter((c) => !Number.isNaN(score[p][c.k]));
  while (near.length < K_NEAREST && reach < MAX_REACH_M) {
    reach = Math.min(reach * 2, MAX_REACH_M);
    near = within(cx, cy, reach).filter((c) => !Number.isNaN(score[p][c.k]));
  }
  if (near.length === 0) return null;
  near.sort((a, b) => a.d2 - b.d2);
  const dk = Math.sqrt(near[Math.min(K_NEAREST, near.length) - 1].d2);
  const sigma = Math.max(radius, dk / 2);
  if (3 * sigma > reach) near = within(cx, cy, Math.min(3 * sigma, MAX_REACH_M)).filter((c) => !Number.isNaN(score[p][c.k]));
  let sw = 0;
  let sv = 0;
  for (const { k, d2 } of near) {
    const w = Math.exp(-d2 / (2 * sigma * sigma));
    sw += w;
    sv += w * score[p][k];
  }
  return sw > 0 ? { value: Math.round(sv / sw), reach: Math.round(2 * sigma) } : null;
}

const features: { type: "Feature"; properties: Record<string, number | null>; geometry: unknown }[] = [];
LEVELS.forEach((level, li) => {
  // Hexes that contain at least one parcel, with the parcels inside each.
  const members = new Map<string, number[]>();
  for (let k = 0; k < located; k++) {
    const key = hexOf(X[k], Y[k], level.radius).join(",");
    const list = members.get(key);
    if (list) list.push(k);
    else members.set(key, [k]);
  }
  for (const [key, inside] of members) {
    const [q, r] = key.split(",").map(Number);
    const [cx, cy] = hexCenter(q, r, level.radius);
    // Kept small: every property is copied into every map tile.
    // `reach` is the widest kernel (2σ) among the metrics; `scored` counts parcels
    // inside the hex with an overall score; `<metric>_capped` counts capped ones.
    const properties: Record<string, number | null> = { level: li, scored: inside.filter((k) => !Number.isNaN(score.overall[k])).length };
    let reach = 0;
    for (const p of METRICS) {
      const s = smooth(p, cx, cy, level.radius);
      properties[p] = s?.value ?? null;
      reach = Math.max(reach, s?.reach ?? 0);
      const n = inside.filter((k) => capped[p][k]).length;
      if (n > 0) properties[`${p}_capped`] = n;
    }
    properties.reach = reach;
    features.push({ type: "Feature", properties, geometry: { type: "Polygon", coordinates: [hexRing(q, r, level.radius)] } });
  }
});

for (const [li, level] of LEVELS.entries()) {
  const own = features.filter((f) => f.properties.level === li);
  await Bun.write(
    `${OUT_DIR}${level.file}`,
    JSON.stringify({
      type: "FeatureCollection",
      metadata: { config_version: config.version, built: new Date().toISOString(), level, k_nearest: K_NEAREST, max_reach_m: MAX_REACH_M },
      features: own,
    }),
  );
  console.log(`${located}/${data.count} parcels located → ${own.length} hexes of ${level.radius} m → ${level.file}`);
}

// Legend breaks for overlays/pillars.ts: p10/p30/p50/p70/p90 of the finest level.
const finest = features.filter((f) => f.properties.level === LEVELS.length - 1);
for (const p of METRICS) {
  const v = finest.map((f) => f.properties[p]).filter((x): x is number => x != null).sort((a, b) => a - b);
  const empty = finest.length - v.length;
  console.log(`  ${p}: [${[0.1, 0.3, 0.5, 0.7, 0.9].map((q) => v[Math.floor(q * (v.length - 1))]).join(", ")}]  no data: ${empty}`);
}
