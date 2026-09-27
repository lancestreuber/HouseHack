// Picks the plain-language phrase for a score from pillars.config.json:
// 1. a flag-specific phrase (e.g. sliver lot) when that flag fired;
// 2. a sub-score combination (e.g. low driving but poor local environment);
// 3. otherwise the score band, where a guard can forbid the top band
//    (e.g. "easy lot" when a hazard covers more than a quarter of the parcel).

import config from "./pillars.config.json";
import type { ParcelScore, PillarId } from "./score";

type Band = { min: number; text: string };
type Guard = { top_band_requires: { indicators: string[]; min: number } };
type Combo = { when: { sub: string; atLeast?: number; below?: number }[]; text: string };
type FlagPhrase = { flag_contains: string; text: string };

export function phraseFor(
  key: string,
  score: number | null,
  values: Record<string, number | null | undefined> = {},
  subscores: Record<string, number | null> = {},
  flags: string[] = [],
) {
  if (score == null) return null;
  const byFlag = ((config as { phrase_by_flag?: Record<string, FlagPhrase[]> }).phrase_by_flag ?? {})[key] ?? [];
  for (const f of byFlag) if (flags.some((t) => t.includes(f.flag_contains))) return f.text;
  const combos = ((config as { phrase_combos?: Record<string, Combo[]> }).phrase_combos ?? {})[key] ?? [];
  for (const combo of combos) {
    const ok = combo.when.every((c) => {
      const v = subscores[c.sub];
      return v != null && (c.atLeast == null || v >= c.atLeast) && (c.below == null || v < c.below);
    });
    if (ok) return combo.text;
  }
  const bands = (config.phrases as Record<string, Band[]>)[key];
  if (!bands) return null;
  let i = bands.findIndex((b) => score >= b.min);
  if (i < 0) return null;
  const guard = (config.phrase_guards as Record<string, Guard>)[key];
  if (i === 0 && guard) {
    const { indicators, min } = guard.top_band_requires;
    if (indicators.some((id) => values[id] != null && (values[id] as number) < min)) i = 1;
  }
  return bands[i].text;
}

// Phrase for one pillar of a scored parcel.
export function pillarPhrase(result: ParcelScore, id: PillarId, values: Record<string, number | null | undefined>) {
  const p = result.pillars[id];
  const subs = Object.fromEntries(p.subscores.map((s) => [s.id, s.score]));
  return phraseFor(id, p.score, values, subs, p.flags.map((f) => f.text));
}

// Overall phrase: when the parcel isn't a normal development site (park, condo
// unit, institution...), say that; otherwise use the City percentile rank.
export function overallPhrase(result: ParcelScore, rank: number | null) {
  const a = result.availability;
  if (a && a.multiplier < 0.9) return a.label;
  if (result.legal && result.legal.multiplier < 0.5) return result.legal.label;
  return phraseFor("overall", rank);
}
