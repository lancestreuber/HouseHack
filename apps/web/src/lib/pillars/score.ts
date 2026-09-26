// Turns a parcel's normalized indicator values (0–100, 100 = better) into the
// five pillar scores and an overall number, using the open weights in
// pillars.config.json. Pure and synchronous so it runs on every slider move.

import config from "./pillars.config.json";

export type PillarId = "demand" | "site" | "afford" | "access" | "climate";
export type IndicatorValues = Record<string, number | null | undefined>;

export type PillarsConfig = typeof config;

// User edits layered on top of the published defaults.
export type WeightOverrides = {
  pillars?: Partial<Record<PillarId, number>>;
  indicators?: Record<string, number>;
  overall?: "arithmetic" | "geometric";
};

export type Contribution = { indicator: string; value: number; weight: number; share: number };

export type PillarScore = {
  score: number | null;
  coverage: number;
  contributions: Contribution[];
  flags: string[];
};

export type ParcelScore = {
  pillars: Record<PillarId, PillarScore>;
  overall: number | null;
};

export const PILLAR_IDS = config.pillars.map((p) => p.id) as PillarId[];

export function scoreParcel(values: IndicatorValues, overrides: WeightOverrides = {}, cfg: PillarsConfig = config): ParcelScore {
  const pillars = {} as Record<PillarId, PillarScore>;

  for (const pillar of cfg.pillars) {
    const id = pillar.id as PillarId;
    const indicators = cfg.indicators.filter((i) => i.pillar === id);
    let totalWeight = 0;
    let availableWeight = 0;
    let sum = 0;
    const used: { indicator: string; value: number; weight: number }[] = [];

    for (const ind of indicators) {
      const weight = overrides.indicators?.[ind.id] ?? ind.weight;
      if (weight <= 0) continue;
      totalWeight += weight;
      const value = values[ind.id];
      if (value == null || Number.isNaN(value)) continue;
      availableWeight += weight;
      sum += weight * value;
      used.push({ indicator: ind.id, value, weight });
    }

    const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0;
    let score = availableWeight > 0 && coverage >= cfg.missing.min_coverage ? sum / availableWeight : null;

    const flags: string[] = [];
    for (const gate of (pillar as { gates?: { indicator: string; below: number; cap: number; flag: string }[] }).gates ?? []) {
      const value = values[gate.indicator];
      if (value != null && value < gate.below) {
        flags.push(gate.flag);
        if (score != null) score = Math.min(score, gate.cap);
      }
    }

    const contributions = used
      .map((u) => ({ ...u, share: availableWeight > 0 ? (u.weight * u.value) / availableWeight : 0 }))
      .sort((a, b) => b.share - a.share);

    pillars[id] = { score, coverage, contributions, flags };
  }

  return { pillars, overall: overallScore(pillars, overrides, cfg) };
}

// Combines the pillars. Arithmetic lets a strong pillar offset a weak one;
// geometric limits that trade-off (the UN HDI switched to it in 2010 for this reason).
export function overallScore(pillars: Record<PillarId, PillarScore>, overrides: WeightOverrides = {}, cfg: PillarsConfig = config): number | null {
  const method = overrides.overall ?? cfg.overall.method;
  let weightSum = 0;
  let acc = 0;
  for (const pillar of cfg.pillars) {
    const id = pillar.id as PillarId;
    const weight = overrides.pillars?.[id] ?? pillar.weight;
    const score = pillars[id].score;
    if (weight <= 0 || score == null) continue;
    weightSum += weight;
    acc += method === "geometric" ? weight * Math.log(Math.max(score, cfg.overall.floor ?? 1)) : weight * score;
  }
  if (weightSum === 0) return null;
  return method === "geometric" ? Math.exp(acc / weightSum) : acc / weightSum;
}

// Rank stability: re-draws the pillar weights around the current ones
// (Dirichlet, via normalized gamma draws) and reports the p10–p90 range of the
// overall score. A narrow range means the result doesn't hinge on the weights.
export function weightSensitivity(pillars: Record<PillarId, PillarScore>, overrides: WeightOverrides = {}, draws = config.sensitivity.draws, concentration = config.sensitivity.concentration, cfg: PillarsConfig = config) {
  const base = cfg.pillars.map((p) => overrides.pillars?.[p.id as PillarId] ?? p.weight);
  const total = base.reduce((a, b) => a + b, 0) || 1;
  const results: number[] = [];
  for (let d = 0; d < draws; d++) {
    const drawn = base.map((w) => (w > 0 ? gamma((w / total) * concentration) : 0));
    const sample: Partial<Record<PillarId, number>> = {};
    cfg.pillars.forEach((p, i) => (sample[p.id as PillarId] = drawn[i]));
    const score = overallScore(pillars, { ...overrides, pillars: sample }, cfg);
    if (score != null) results.push(score);
  }
  results.sort((a, b) => a - b);
  if (results.length === 0) return null;
  const at = (q: number) => results[Math.min(results.length - 1, Math.floor(q * results.length))];
  return { p10: at(0.1), p50: at(0.5), p90: at(0.9) };
}

// Marsaglia–Tsang gamma sampler (shape k > 0, scale 1).
function gamma(k: number): number {
  if (k < 1) return gamma(k + 1) * Math.random() ** (1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal();
      v = 1 + c * x;
    } while (v <= 0);
    v = v ** 3;
    const u = Math.random();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normal() {
  const u = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}
