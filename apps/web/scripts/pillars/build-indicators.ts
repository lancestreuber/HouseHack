// Computes every indicator in src/lib/pillars/pillars.config.json for every City
// parcel, normalizes each to 0–100 (100 = better), and writes
// public/data/pillars/parcel-indicators.json. Weights are NOT applied here, so
// changing a weight never needs a rebuild; changing a source or normalization
// rule does.
//
// Run from apps/web: `bun scripts/pillars/fetch-inputs.ts` once, then
// `bun scripts/pillars/build-indicators.ts`.

import { mkdir } from "node:fs/promises";
import config from "../../src/lib/pillars/pillars.config.json";
import { parseCSV } from "../data/geo";
import { CACHE } from "./fetch-inputs";
import { type Geometry, polygonLookup, polygonsOf, pointIndex, samplePoints } from "./spatial";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT_DIR = `${ROOT}public/data/pillars/`;
const MISSING = 255;

type Feature = { properties: Record<string, unknown>; geometry: Geometry | null };
type Indicator = (typeof config.indicators)[number];
type Source = Indicator["source"] & Record<string, unknown>;
type Normalize = { method: string; direction?: string; reference?: string; zero?: number; full?: number };

const fileCache = new Map<string, Feature[]>();
async function features(file: string): Promise<Feature[]> {
  let f = fileCache.get(file);
  if (!f) {
    f = ((await Bun.file(`${ROOT}${file}`).json()) as { features: Feature[] }).features;
    fileCache.set(file, f);
  }
  return f;
}

const matches = (props: Record<string, unknown>, where?: Record<string, unknown>) =>
  !where ||
  Object.entries(where).every(([k, v]) => (Array.isArray(v) ? v.includes(props[k]) : props[k] === v));

const num = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Reads one raw value from a feature/row: a single property, a mapped category,
// or the mean of several properties.
function readValue(props: Record<string, unknown>, src: Source): number | null {
  const property = src.property as string | string[] | undefined;
  const map = src.map as Record<string, number> | undefined;
  if (Array.isArray(property)) {
    const vals = property.map((p) => num(props[p])).filter((v): v is number => v != null);
    return vals.length === property.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  const raw = props[property as string];
  const value = map ? (map[String(raw)] ?? null) : num(raw);
  if (value == null) return null;
  return src.divide_by ? value / (src.divide_by as number) : value;
}

// Mid-rank percentile (0–100) of v within a sorted reference list.
function percentileOf(sorted: number[], v: number) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  let eq = lo;
  while (eq < sorted.length && sorted[eq] === v) eq++;
  return ((lo + (eq - lo) / 2) / sorted.length) * 100;
}

function normalize(raw: (number | null)[], unitValues: number[] | null, norm: Normalize): Uint8Array {
  const out = new Uint8Array(raw.length).fill(MISSING);
  const reference =
    norm.method === "percentile"
      ? (norm.reference === "parcels" || !unitValues ? raw.filter((v): v is number => v != null) : unitValues).sort((a, b) => a - b)
      : [];
  raw.forEach((v, i) => {
    if (v == null) return;
    let score: number;
    if (norm.method === "percentile") {
      const pct = percentileOf(reference, v);
      score = norm.direction === "lower_is_better" ? 100 - pct : pct;
    } else if (norm.method === "linear") {
      const { zero = 0, full = 1 } = norm;
      score = ((v - zero) / (full - zero)) * 100;
    } else score = v;
    out[i] = Math.round(Math.max(0, Math.min(100, score)));
  });
  return out;
}

// ---------- parcels ----------
console.time("load parcels");
const rawParcels = ((await Bun.file(`${CACHE}parcels.geojson`).json()) as { features: Feature[] }).features;
const byPin = new Map<string, Feature>();
for (const f of rawParcels) {
  const pin = f.properties.pin as string;
  if (!pin || !f.geometry) continue;
  const prev = byPin.get(pin);
  if (!prev || (num(f.properties.Shape__Area) ?? 0) > (num(prev.properties.Shape__Area) ?? 0)) byPin.set(pin, f);
}
const parcels = [...byPin.values()];

const centroids = new Map<string, { x: number; y: number; tract: string; bg: string }>();
for (const r of parseCSV(await Bun.file(`${CACHE}parcel-centroids.csv`).text())) {
  if (r.MUNI_NAME !== "PITTSBURGH") continue;
  const tract = `42003${r.FIPS_TRACT}`;
  centroids.set(r.PIN, { x: Number(r.LONG), y: Number(r.LAT), tract, bg: `${tract}${r.FIPS_BLOCKGROUP}` });
}

const zipLookup = polygonLookup(
  (await features("public/data/overlays/market-zip.geojson")).map((f) => ({ value: String(f.properties.zip), geometry: f.geometry })),
);

const spine = parcels.map((f) => {
  const pin = f.properties.pin as string;
  const polys = polygonsOf(f.geometry);
  const c = centroids.get(pin);
  const ring = polys[0][0];
  const x = c?.x ?? ring.reduce((a, p) => a + p[0], 0) / ring.length;
  const y = c?.y ?? ring.reduce((a, p) => a + p[1], 0) / ring.length;
  return { pin, zoning: (f.properties.zon_new as string) ?? "", polys, x, y, tract: c?.tract ?? null, bg: c?.bg ?? null, zip: zipLookup(x, y) ?? null };
});
console.timeEnd("load parcels");
console.log(`${rawParcels.length} features → ${spine.length} unique parcels; ${spine.filter((p) => p.tract).length} matched to census geography`);

// ---------- indicators ----------
async function computeRaw(ind: Indicator): Promise<{ raw: (number | null)[]; units: number[] | null }> {
  const src = ind.source as Source;
  const where = src.where as Record<string, unknown> | undefined;
  const files = Array.isArray(src.file) ? (src.file as string[]) : [src.file as string];

  switch (src.kind) {
    case "area": {
      const feats = (await features(files[0])).filter((f) => matches(f.properties, where));
      const lookup = polygonLookup(feats.map((f) => ({ value: readValue(f.properties, src), geometry: f.geometry })));
      const units = feats.map((f) => readValue(f.properties, src)).filter((v): v is number => v != null);
      return { raw: spine.map((p) => lookup(p.x, p.y) ?? null), units };
    }
    case "table": {
      const rows = parseCSV(await Bun.file(`${ROOT}${files[0]}`).text());
      const byKey = new Map(rows.map((r) => [r[src.key as string], readValue(r, src)]));
      const units = [...byKey.values()].filter((v): v is number => v != null);
      const join = src.join as "tract" | "bg" | "zip";
      return { raw: spine.map((p) => (p[join] ? (byKey.get(p[join] as string) ?? null) : null)), units };
    }
    case "overlap": {
      const feats = (await features(files[0])).filter((f) => matches(f.properties, where));
      const lookup = polygonLookup(feats.map((f) => ({ value: true, geometry: f.geometry })));
      return {
        raw: spine.map((p) => {
          const pts = samplePoints(p.polys, [p.x, p.y]);
          return pts.filter(([x, y]) => lookup(x, y)).length / pts.length;
        }),
        units: null,
      };
    }
    case "nearest": {
      const pts = [];
      for (const file of files)
        for (const f of await features(file)) {
          if (!f.geometry || !matches(f.properties, where)) continue;
          if (f.geometry.type === "Point") {
            const [x, y] = f.geometry.coordinates as number[];
            pts.push({ x, y, value: null });
          } else for (const poly of polygonsOf(f.geometry)) for (const [x, y] of poly[0]) pts.push({ x, y, value: null });
        }
      const index = pointIndex(pts);
      return { raw: spine.map((p) => index.nearest(p.x, p.y)?.distance ?? 10_000), units: null };
    }
    case "count_within":
    case "decay_sum": {
      const pts = (await features(files[0]))
        .filter((f) => f.geometry?.type === "Point" && matches(f.properties, where))
        .map((f) => {
          const [x, y] = (f.geometry as Geometry).coordinates as number[];
          return { x, y, value: f.properties };
        });
      const index = pointIndex(pts);
      if (src.kind === "count_within") return { raw: spine.map((p) => index.within(p.x, p.y, src.radius_m as number).length), units: null };
      const full = src.full_m as number;
      const zero = src.zero_m as number;
      const modeWeight = (src.mode_weight as Record<string, number>) ?? {};
      return {
        raw: spine.map((p) =>
          index.within(p.x, p.y, zero).reduce((sum, { item, distance }) => {
            const decay = distance <= full ? 1 : (zero - distance) / (zero - full);
            const trips = num(item.value[src.property as string]) ?? 0;
            return sum + trips * (modeWeight[String(item.value.mode)] ?? 1) * decay;
          }, 0),
        ),
        units: null,
      };
    }
    case "nearest_attr": {
      const map = src.map as Record<string, number>;
      const pts = (await features(files[0]))
        .filter((f) => f.geometry?.type === "Point")
        .map((f) => {
          const [x, y] = (f.geometry as Geometry).coordinates as number[];
          return { x, y, value: String(f.properties[src.property as string]) };
        });
      const index = pointIndex(pts);
      return {
        raw: spine.map((p) => {
          const hit = index.nearest(p.x, p.y, src.max_m as number);
          return hit ? (map[hit.item.value] ?? null) : null;
        }),
        units: null,
      };
    }
    default:
      throw new Error(`${ind.id}: unknown source kind ${src.kind}`);
  }
}

const columns: Record<string, string> = {};
const summary: Record<string, unknown>[] = [];
for (const ind of config.indicators) {
  console.time(ind.id);
  const { raw, units } = await computeRaw(ind);
  const norm = normalize(raw, units, ind.normalize as Normalize);
  columns[ind.id] = Buffer.from(norm).toString("base64");
  const present = norm.filter((v) => v !== MISSING);
  const sorted = [...present].sort((a, b) => a - b);
  summary.push({
    id: ind.id,
    coverage: `${((present.length / norm.length) * 100).toFixed(1)}%`,
    p10: sorted[Math.floor(sorted.length * 0.1)],
    median: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
  });
  console.timeEnd(ind.id);
}

await mkdir(OUT_DIR, { recursive: true });
await Bun.write(
  `${OUT_DIR}parcel-indicators.json`,
  JSON.stringify({
    config_version: config.version,
    built: new Date().toISOString(),
    missing: MISSING,
    count: spine.length,
    pins: spine.map((p) => p.pin),
    zoning: spine.map((p) => p.zoning),
    indicators: config.indicators.map((i) => i.id),
    columns,
  }),
);
console.table(summary);
