// Computes every indicator in src/lib/pillars/pillars.config.json for every City
// parcel, normalizes each to 0–100 (100 = a good place to build), and writes
// public/data/pillars/parcel-indicators.json. Weights are NOT applied here, so
// changing a weight never needs a rebuild; changing a source or normalization
// rule does.
//
// Run from apps/web: `bun scripts/pillars/fetch-inputs.ts` once, then
// `bun scripts/pillars/build-indicators.ts`.

import { mkdir } from "node:fs/promises";
import config from "../../src/lib/pillars/pillars.config.json";
import { type PillarId, scoreParcel } from "../../src/lib/pillars/score";
import { parseCSV } from "../data/geo";
import { CACHE } from "./fetch-inputs";
import { distanceM, type Geometry, polygonLookup, polygonsOf, pointIndex, samplePoints } from "./spatial";

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

// `where` keeps rows whose fields equal (or are in) the given values; a
// `$not` entry excludes rows instead, e.g. { $not: { facility: [...] } }.
const matches = (props: Record<string, unknown>, where?: Record<string, unknown>): boolean =>
  !where ||
  Object.entries(where).every(([k, v]) =>
    k === "$not" ? !matchesAny(props, v as Record<string, unknown>) : Array.isArray(v) ? v.includes(props[k]) : props[k] === v,
  );
const matchesAny = (props: Record<string, unknown>, where: Record<string, unknown>) =>
  Object.entries(where).some(([k, v]) => (Array.isArray(v) ? v.includes(props[k]) : props[k] === v));

const num = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Reads one raw value from a feature/row: a single property, a mapped category,
// or the mean of several properties.
type Rule = { property: string; min?: number; equals?: string };
const passes = (props: Record<string, unknown>, r: Rule) =>
  r.min != null ? (num(props[r.property]) ?? -Infinity) >= r.min : String(props[r.property]) === r.equals;

function readValue(props: Record<string, unknown>, src: Source): number | null {
  // Blank the value when a reliability rule fails (e.g. too few addresses or sales).
  if (((src.require as Rule[] | undefined) ?? []).some((r) => !passes(props, r))) return null;
  const value = readRawValue(props, src);
  // Replace a real value with a neutral one when it is within noise (e.g. inside
  // the ACS margin of error). Missing stays missing.
  const neutral = src.neutral_unless as (Rule & { value: number }) | undefined;
  if (value != null && neutral && !passes(props, neutral)) return neutral.value;
  return value;
}

function readRawValue(props: Record<string, unknown>, src: Source): number | null {
  const property = src.property as string | string[] | undefined;
  const map = src.map as Record<string, number> | undefined;
  if (Array.isArray(property)) {
    const vals = property.map((p) => num(props[p])).filter((v): v is number => v != null);
    return vals.length === property.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  // A share computed from two count fields, e.g. renters ≤30% AMI ÷ all renters.
  const ratio = src.ratio_of as [string, string] | undefined;
  if (ratio) {
    const n = num(props[ratio[0]]);
    const d = num(props[ratio[1]]);
    return n != null && d != null && d > 0 ? n / d : null;
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
  if (!pin || polygonsOf(f.geometry).length === 0) continue;
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
  return { pin, props: f.properties, zoning: (f.properties.zon_new as string) ?? "", polys, x, y, tract: c?.tract ?? null, bg: c?.bg ?? null, zip: zipLookup(x, y) ?? null };
});
console.timeEnd("load parcels");
console.log(`${rawParcels.length} features → ${spine.length} unique parcels; ${spine.filter((p) => p.tract).length} matched to census geography`);

// Points every `stepM` meters along a ring.
function densify(ring: number[][], stepM: number) {
  const out: { x: number; y: number; value: null }[] = [];
  for (let k = 1; k < ring.length; k++) {
    const [x0, y0] = ring[k - 1];
    const [x1, y1] = ring[k];
    const steps = Math.max(1, Math.ceil(distanceM(x0, y0, x1, y1) / stepM));
    for (let t = 0; t < steps; t++) out.push({ x: x0 + ((x1 - x0) * t) / steps, y: y0 + ((y1 - y0) * t) / steps, value: null });
  }
  return out;
}

// Points from a CSV with lat/lon or latitude/longitude columns.
async function csvPoints(file: string, where?: Record<string, unknown>) {
  return parseCSV(await Bun.file(`${ROOT}${file}`).text())
    .map((r) => ({ r, x: num(r.lon ?? r.longitude), y: num(r.lat ?? r.latitude) }))
    .filter((p) => p.x != null && p.y != null && matches(p.r, where))
    .map((p) => ({ x: p.x as number, y: p.y as number, value: p.r as Record<string, unknown> }));
}

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
      const join = src.join as "tract" | "bg" | "zip" | "pin";
      return { raw: spine.map((p) => (p[join] ? (byKey.get(p[join] as string) ?? null) : null)), units };
    }
    case "overlap": {
      const feats = (await features(files[0])).filter((f) => matches(f.properties, where));
      const lookup = polygonLookup(feats.map((f) => ({ value: true, geometry: f.geometry })));
      return {
        raw: spine.map((p) => {
          const pts = samplePoints(p.polys, [p.x, p.y], 6);
          return pts.filter(([x, y]) => lookup(x, y)).length / pts.length;
        }),
        units: null,
      };
    }
    case "nearest": {
      const pts: { x: number; y: number; value: null }[] = [];
      const polys: { value: true; geometry: Geometry | null }[] = [];
      for (const file of files) {
        if (file.endsWith(".csv")) {
          for (const p of await csvPoints(file, where)) pts.push({ x: p.x, y: p.y, value: null });
          continue;
        }
        for (const f of await features(file)) {
          if (!f.geometry || !matches(f.properties, where)) continue;
          if (f.geometry.type === "Point") {
            const [x, y] = f.geometry.coordinates as number[];
            pts.push({ x, y, value: null });
          } else {
            // Polygons: distance to the boundary, sampled every 25 m so long
            // straight edges aren't missed; a parcel inside counts as 0.
            polys.push({ value: true as const, geometry: f.geometry });
            for (const poly of polygonsOf(f.geometry)) pts.push(...densify(poly[0], 25));
          }
        }
      }
      const index = pointIndex(pts);
      const inside = polys.length ? polygonLookup(polys) : () => undefined;
      return { raw: spine.map((p) => (inside(p.x, p.y) ? 0 : (index.nearest(p.x, p.y)?.distance ?? 10_000))), units: null };
    }
    case "count_within":
    case "sum_within":
    case "decay_sum": {
      const pts = files[0].endsWith(".csv")
        ? await csvPoints(files[0], where)
        : (await features(files[0]))
            .filter((f) => f.geometry?.type === "Point" && matches(f.properties, where))
            .map((f) => {
              const [x, y] = (f.geometry as Geometry).coordinates as number[];
              return { x, y, value: f.properties };
            });
      // Several permits for one project (phases, trades) count once: keep the
      // row with the largest `property` per `dedupe_by` key.
      const dedupeBy = src.dedupe_by as string | undefined;
      if (dedupeBy) {
        const best = new Map<string, (typeof pts)[number]>();
        const keyless: typeof pts = [];
        for (const p of pts) {
          const key = String(p.value[dedupeBy] ?? "");
          if (!key) keyless.push(p);
          else if ((num(p.value[src.property as string]) ?? 0) >= (num(best.get(key)?.value[src.property as string]) ?? -1)) best.set(key, p);
        }
        pts.splice(0, pts.length, ...best.values(), ...keyless);
      }
      const index = pointIndex(pts);
      if (src.kind === "count_within") return { raw: spine.map((p) => index.within(p.x, p.y, src.radius_m as number).length), units: null };
      if (src.kind === "sum_within") {
        // Σ transform(property) over points within the radius; a blank property counts as `default`.
        const f = src.transform === "log1p" ? Math.log1p : (v: number) => v;
        return {
          raw: spine.map((p) =>
            index
              .within(p.x, p.y, src.radius_m as number)
              .reduce((sum, { item }) => sum + f(num(item.value[src.property as string]) ?? ((src.default as number) ?? 1)), 0),
          ),
          units: null,
        };
      }
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
      const map = src.map as unknown as Record<string, number>;
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
    case "parcel_attr":
      return { raw: spine.map((p) => num(p.props[src.property as string])), units: null };
    case "parcel_use": {
      // Categorical code for parcels that aren't development sites, from the
      // assessor land-use description plus overlap with mapped parks.
      const rules = src.rules as { code: number; usedesc?: string[]; usedesc_prefix?: string[]; overlap?: { file: string; min: number } }[];
      const overlapLookups = new Map<string, (x: number, y: number) => true | undefined>();
      for (const r of rules)
        if (r.overlap && !overlapLookups.has(r.overlap.file))
          overlapLookups.set(r.overlap.file, polygonLookup((await features(r.overlap.file)).map((f) => ({ value: true as const, geometry: f.geometry }))));
      return {
        raw: spine.map((p) => {
          const use = String(p.props.usedesc ?? "");
          for (const r of rules) {
            if (r.usedesc?.includes(use) || r.usedesc_prefix?.some((pre) => use.startsWith(pre))) return r.code;
            if (r.overlap) {
              const lookup = overlapLookups.get(r.overlap.file)!;
              const pts = samplePoints(p.polys, [p.x, p.y], 4);
              if (pts.filter(([x, y]) => lookup(x, y)).length / pts.length >= r.overlap.min) return r.code;
            }
          }
          return 0;
        }),
        units: null,
      };
    }
    case "legal_pathway": {
      // Easiest pathway among the configured housing types for the parcel's
      // district; "not permitted" parcels within border_m of a district that
      // allows housing by right or with ZA approval get the border code.
      const legal = config.legal;
      const matrix = (await Bun.file(`${ROOT}${files[0]}`).json()) as {
        pathway_order: string[];
        districts: Record<string, Record<string, string>>;
      };
      const levelCode = Object.fromEntries(legal.levels.map((l) => [l.id, l.code]));
      const rank = (pathway: string) => ["by_right", "za", "zbe_special_exception", "conditional_use", "not_permitted"].indexOf(pathway);
      const best = new Map<string, string>();
      for (const [district, row] of Object.entries(matrix.districts)) {
        const paths = legal.typologies.map((t) => row[t]).filter(Boolean);
        const ranked = paths.filter((p) => rank(p) >= 0).sort((a, b) => rank(a) - rank(b));
        best.set(district, ranked[0] ?? paths.find((p) => p === "per_plan" || p === "not_city_jurisdiction") ?? "unknown");
      }
      // Border exception only counts districts that allow attached or multi-unit
      // homes by right or with ZA approval (not P, H or EMI, which allow only a detached house).
      const borderTypes = (legal as { border_types?: string[] }).border_types ?? legal.typologies;
      const bordersHousing = (district: string) =>
        borderTypes.some((t) => ["by_right", "za"].includes(matrix.districts[district]?.[t] ?? ""));
      const zoning = await features(src.zoning as string);
      const allowed = [];
      for (const f of zoning) {
        if (!bordersHousing(String(f.properties.zon_new))) continue;
        for (const poly of polygonsOf(f.geometry)) for (const ring of poly) allowed.push(...densify(ring, 20));
      }
      const index = pointIndex(allowed);
      return {
        raw: spine.map((p) => {
          const b = best.get(p.zoning);
          if (!b || b === "unknown") return levelCode.unknown ?? null;
          if (b === "za" && p.zoning === "H") return levelCode.za_hillside;
          if (b !== "not_permitted") return levelCode[b] ?? null;
          const near = p.polys.some((poly) => poly[0].some(([x, y]) => index.nearest(x, y, legal.border_m) != null));
          return near ? levelCode.not_permitted_border : levelCode.not_permitted;
        }),
        units: null,
      };
    }
    default:
      throw new Error(`${ind.id}: unknown source kind ${src.kind}`);
  }
}

const columns: Record<string, string> = {};
const rawColumns: (number | null)[][] = [];
const normColumns: Uint8Array[] = [];
const summary: Record<string, unknown>[] = [];
for (const ind of config.indicators) {
  console.time(ind.id);
  const { raw, units } = await computeRaw(ind);
  const norm = normalize(raw, units, ind.normalize as Normalize);
  columns[ind.id] = Buffer.from(norm).toString("base64");
  rawColumns.push(raw);
  normColumns.push(norm);
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

// Per-parcel detail for the map panel, sharded by the first 4 characters of the
// PIN (~140 files) so a click loads one small file. Each parcel row is
// [zoning, normalized values (null = missing), raw values (3 significant digits)].
const sig = (v: number | null) => (v == null || !Number.isFinite(v) ? null : Number(v.toPrecision(3)));
const shards = new Map<string, Record<string, unknown>>();
spine.forEach((p, i) => {
  const key = p.pin.slice(0, 4);
  let shard = shards.get(key);
  if (!shard) shards.set(key, (shard = {}));
  shard[p.pin] = [
    p.zoning,
    normColumns.map((c) => (c[i] === MISSING ? null : c[i])),
    rawColumns.map((c) => sig(c[i])),
  ];
});
await mkdir(`${OUT_DIR}parcels/`, { recursive: true });
for (const [key, shard] of shards) await Bun.write(`${OUT_DIR}parcels/${key}.json`, JSON.stringify(shard));
// Default-weight score distribution, so the panel can say "better than X% of
// City parcels" instead of a raw number on a compressed scale.
const dist: Record<string, number[]> = { overall: [] };
for (const p of config.pillars) dist[p.id] = [];
for (let i = 0; i < spine.length; i++) {
  const values: Record<string, number | null> = {};
  config.indicators.forEach((ind, k) => (values[ind.id] = normColumns[k][i] === MISSING ? null : normColumns[k][i]));
  const s = scoreParcel(values);
  if (s.overall != null) dist.overall.push(s.overall);
  for (const p of config.pillars) {
    const v = s.pillars[p.id as PillarId].score;
    if (v != null) dist[p.id].push(v);
  }
}
const quantiles = Object.fromEntries(
  Object.entries(dist).map(([k, v]) => {
    v.sort((a, b) => a - b);
    return [k, Array.from({ length: 101 }, (_, q) => Number(v[Math.min(v.length - 1, Math.floor((q / 100) * (v.length - 1)))].toFixed(2)))];
  }),
);
await Bun.write(
  `${OUT_DIR}parcels/index.json`,
  JSON.stringify({ config_version: config.version, built: new Date().toISOString(), indicators: config.indicators.map((i) => i.id), shards: [...shards.keys()].sort(), quantiles }),
);
console.log(`wrote ${shards.size} parcel shards`);
