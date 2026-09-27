// JRC-style statistical checks on the built indicators (OECD/JRC Handbook 2008,
// step 4): each indicator's correlation with its own pillar, correlations
// between pillars, and how much the overall ranking moves between aggregation
// methods and presets. Run after build-indicators.ts.

import config from "../../src/lib/pillars/pillars.config.json";
import { PILLAR_IDS, type PillarId, scoreParcel, type WeightOverrides } from "../../src/lib/pillars/score";

const ROOT = new URL("../../", import.meta.url).pathname;
const data = (await Bun.file(`${ROOT}public/data/pillars/parcel-indicators.json`).json()) as {
  missing: number; count: number; indicators: string[]; columns: Record<string, string>;
};
const cols = Object.fromEntries(data.indicators.map((id) => [id, Buffer.from(data.columns[id], "base64")]));
const valuesAt = (i: number) =>
  Object.fromEntries(data.indicators.map((id) => [id, cols[id][i] === data.missing ? null : cols[id][i]]));

function pearson(a: (number | null)[], b: (number | null)[]) {
  const pairs = a.map((x, i) => [x, b[i]]).filter((p): p is [number, number] => p[0] != null && p[1] != null);
  const n = pairs.length;
  if (n < 3) return NaN;
  const ma = pairs.reduce((s, p) => s + p[0], 0) / n;
  const mb = pairs.reduce((s, p) => s + p[1], 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (const [x, y] of pairs) {
    sab += (x - ma) * (y - mb);
    saa += (x - ma) ** 2;
    sbb += (y - mb) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
}
const ranks = (v: (number | null)[]) => {
  const idx = v.map((x, i) => [x ?? -1, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(v.length);
  idx.forEach(([, i], k) => (r[i] = k));
  return r;
};
const spearman = (a: (number | null)[], b: (number | null)[]) => pearson(ranks(a), ranks(b));

// Sample for speed; correlations are stable at this size.
const step = Math.max(1, Math.floor(data.count / 20000));
const sample = Array.from({ length: Math.floor(data.count / step) }, (_, k) => k * step);
const scored = (o: WeightOverrides) => sample.map((i) => scoreParcel(valuesAt(i), o));
const base = scored({});

console.log("\nIndicator vs its pillar or sub-score (flag: r > 0.95 redundant, |r| < 0.3 weak, r < -0.3 conflicting)");
const rows = [];
for (const ind of config.indicators) {
  if (ind.weight <= 0) continue;
  const iv = sample.map((i) => (cols[ind.id][i] === data.missing ? null : cols[ind.id][i]));
  // Compare with the indicator's own sub-score when it has one: pillars with
  // sub-scores (Climate: carbon vs local environment) mix deliberately opposed parts.
  const sub = (ind as { sub?: string }).sub;
  const pv = base.map((s) =>
    sub ? (s.pillars[ind.pillar as PillarId].subscores.find((x) => x.id === sub)?.score ?? null) : s.pillars[ind.pillar as PillarId].score,
  );
  const r = pearson(iv, pv);
  const alone = config.indicators.filter((o) => o.pillar === ind.pillar && (o as { sub?: string }).sub === sub && o.weight > 0).length === 1;
  rows.push({ indicator: ind.id, pillar: sub ? `${ind.pillar}/${sub}` : ind.pillar, r: r.toFixed(2), flag: alone ? "only indicator" : r > 0.95 ? "redundant" : r < -0.3 ? "CONFLICT" : Math.abs(r) < 0.3 ? "weak" : "" });
}
console.table(rows);

console.log("\nPillar × pillar Pearson r");
const pm: Record<string, Record<string, string>> = {};
for (const a of PILLAR_IDS) {
  pm[a] = {};
  for (const b of PILLAR_IDS) pm[a][b] = pearson(base.map((s) => s.pillars[a].score), base.map((s) => s.pillars[b].score)).toFixed(2);
}
console.table(pm);

console.log("\nRanking stability: Spearman ρ of the overall score vs the published default");
const baseOverall = base.map((s) => s.overall);
const variants: Record<string, WeightOverrides> = {
  arithmetic: { overall: "arithmetic" },
  ...Object.fromEntries(Object.entries(config.presets).map(([k, w]) => [`preset:${k}`, { pillars: w }])),
};
console.table(Object.entries(variants).map(([name, o]) => ({ variant: name, rho: spearman(baseOverall, scored(o).map((s) => s.overall)).toFixed(3) })));

console.log("\nPillar score distribution (sample)");
console.table(
  [...PILLAR_IDS, "overall"].map((p) => {
    const v = base.map((s) => (p === "overall" ? s.overall : s.pillars[p as PillarId].score)).filter((x): x is number => x != null).sort((a, b) => a - b);
    const q = (f: number) => v[Math.floor(f * (v.length - 1))].toFixed(0);
    return { pillar: p, scored: `${((v.length / sample.length) * 100).toFixed(1)}%`, p10: q(0.1), median: q(0.5), p90: q(0.9) };
  }),
);
