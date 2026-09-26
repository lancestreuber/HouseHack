// Turns a parcel's normalized indicator values (0–100, 100 = a good place to build) into the
// five pillar scores and an overall number, using the open weights in
// pillars.config.json. Pure and synchronous so it runs on every slider move.

import config from "./pillars.config.json";

export type PillarId = "demand" | "site" | "afford" | "access" | "climate";
export type IndicatorValues = Record<string, number | null | undefined>;

export type PillarsConfig = typeof config;

// User edits layered on top of the published defaults.
export type WeightOverrides = {
  pillars?: Partial<Record<PillarId, number>>;
  // Legal multipliers by level id, e.g. { not_permitted: 0.1 }.
  legal?: LegalOverrides;
  subscores?: Record<string, number>;
  indicators?: Record<string, number>;
  overall?: "arithmetic" | "geometric";
};

// `share` is the points this indicator adds to its pillar score; the shares of
// one pillar sum to the pillar score (before any gate cap).
export type Contribution = { indicator: string; sub: string | null; value: number; weight: number; share: number };

export type SubScore = { id: string; score: number | null; coverage: number; weight: number };

export type PillarScore = {
  score: number | null;
  coverage: number;
  subscores: SubScore[];
  contributions: Contribution[];
  flags: string[];
};

export type LegalStatus = { code: number; id: string; label: string; multiplier: number; note?: string };
// Same shape for "is this even a development site?" (parks, rail, condo units...).
export type AvailabilityStatus = LegalStatus;

export type ParcelScore = {
  pillars: Record<PillarId, PillarScore>;
  // Overall after the legal multiplier; `overallBeforeLegal` is the pillar blend alone.
  overall: number | null;
  overallBeforeLegal: number | null;
  legal: LegalStatus | null;
  availability: AvailabilityStatus | null;
};

export type LegalOverrides = Record<string, number>;

// A gate fires when every condition holds. It caps the pillar score (cap 100 =
// flag only). The single-indicator form { indicator, below } is shorthand.
type Condition = { indicator: string; below?: number; atLeast?: number; equals?: number; notEquals?: number };
type Gate = { indicator?: string; below?: number; when?: Condition[]; cap: number; flag: string };

function conditionHolds(values: IndicatorValues, c: Condition) {
  const v = values[c.indicator];
  if (v == null) return false;
  if (c.below != null && !(v < c.below)) return false;
  if (c.atLeast != null && !(v >= c.atLeast)) return false;
  if (c.equals != null && v !== c.equals) return false;
  if (c.notEquals != null && v === c.notEquals) return false;
  return true;
}
type SubDef = { id: string; weight: number };

export const PILLAR_IDS = config.pillars.map((p) => p.id) as PillarId[];

// Within a pillar: a weighted mean of indicators per sub-score (missing values
// excluded and the remaining weights renormalized; a sub-score needs at least
// `min_coverage` of its weight present), then a weighted mean of the sub-scores.
// Pillars without sub-scores are one implicit sub-score.
export function scoreParcel(values: IndicatorValues, overrides: WeightOverrides = {}, cfg: PillarsConfig = config): ParcelScore {
  const pillars = {} as Record<PillarId, PillarScore>;

  for (const pillar of cfg.pillars) {
    const id = pillar.id as PillarId;
    const subDefs: SubDef[] = (pillar as { subscores?: SubDef[] }).subscores ?? [{ id: "", weight: 1 }];
    let totalWeight = 0;
    let availableWeight = 0;
    const groups = subDefs.map((sub) => {
      let total = 0;
      let available = 0;
      let sum = 0;
      const used: Omit<Contribution, "share">[] = [];
      for (const ind of cfg.indicators) {
        if (ind.pillar !== id || ((ind as { sub?: string }).sub ?? "") !== sub.id) continue;
        const weight = overrides.indicators?.[ind.id] ?? ind.weight;
        if (weight <= 0) continue;
        total += weight;
        const value = values[ind.id];
        if (value == null || Number.isNaN(value)) continue;
        available += weight;
        sum += weight * value;
        used.push({ indicator: ind.id, sub: sub.id || null, value, weight });
      }
      totalWeight += total;
      availableWeight += available;
      const coverage = total > 0 ? available / total : 0;
      const minCoverage = (pillar as { min_coverage?: number }).min_coverage ?? cfg.missing.min_coverage;
      const score = available > 0 && coverage >= minCoverage ? sum / available : null;
      return { id: sub.id, weight: overrides.subscores?.[sub.id] ?? sub.weight, score, coverage, used, available };
    });

    const scored = groups.filter((g) => g.score != null && g.weight > 0);
    const subWeight = scored.reduce((a, g) => a + g.weight, 0);
    let score = subWeight > 0 ? scored.reduce((a, g) => a + g.weight * (g.score as number), 0) / subWeight : null;

    const flags: string[] = [];
    for (const gate of (pillar as { gates?: Gate[] }).gates ?? []) {
      const when = gate.when ?? [{ indicator: gate.indicator as string, below: gate.below }];
      if (when.every((c) => conditionHolds(values, c))) {
        flags.push(gate.flag);
        if (score != null) score = Math.min(score, gate.cap);
      }
    }

    const contributions = scored
      .flatMap((g) => g.used.map((u) => ({ ...u, share: ((g.weight / subWeight) * u.weight * u.value) / g.available })))
      .sort((a, b) => b.share - a.share);

    pillars[id] = {
      score,
      coverage: totalWeight > 0 ? availableWeight / totalWeight : 0,
      subscores: groups.filter((g) => g.id).map((g) => ({ id: g.id, score: g.score, coverage: g.coverage, weight: g.weight })),
      contributions,
      flags,
    };
  }

  const overallBeforeLegal = overallScore(pillars, overrides, cfg);
  const legal = legalStatus(values, overrides, cfg);
  const availability = levelStatus(cfg.availability, values, overrides.legal);
  const overall = overallBeforeLegal == null ? null : overallBeforeLegal * (legal?.multiplier ?? 1) * (availability?.multiplier ?? 1);
  return { pillars, overall, overallBeforeLegal, legal, availability };
}

type LevelBlock = { indicator: string; levels: { code: number; id: string; label: string; multiplier: number; note?: string }[] };

function levelStatus(block: LevelBlock, values: IndicatorValues, overrides: Record<string, number> = {}): LegalStatus | null {
  const code = values[block.indicator];
  if (code == null) return null;
  const level = block.levels.find((l) => l.code === code);
  if (!level) return null;
  return { code: level.code, id: level.id, label: level.label, multiplier: overrides[level.id] ?? level.multiplier, note: level.note };
}

// Zoning legality multiplies the overall score rather than being averaged in,
// so a parcel where housing isn't permitted can't be rescued by good access.
export function legalStatus(values: IndicatorValues, overrides: WeightOverrides = {}, cfg: PillarsConfig = config): LegalStatus | null {
  return levelStatus(cfg.legal as LevelBlock, values, overrides.legal);
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
    if (weight <= 0) continue;
    const impute = (cfg.overall as { missing_pillar?: { impute: number } }).missing_pillar?.impute;
    if (score == null && impute == null) continue;
    const value = score ?? (impute as number);
    weightSum += weight;
    acc += method === "geometric" ? weight * Math.log(Math.max(value, cfg.overall.floor ?? 1)) : weight * value;
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
