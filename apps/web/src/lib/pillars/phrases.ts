// Picks the plain-language phrase for a score band from pillars.config.json.
// A guard can forbid the top band, e.g. "easy lot" when a hazard covers
// more than a quarter of the parcel.

import config from "./pillars.config.json";

type Band = { min: number; text: string };
type Guard = { top_band_requires: { indicators: string[]; min: number } };

export function phraseFor(key: string, score: number | null, values: Record<string, number | null | undefined> = {}) {
  if (score == null) return null;
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
