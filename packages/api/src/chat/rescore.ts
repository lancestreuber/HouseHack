import type { ScoringModel } from "./types";

/**
 * Overall score from part scores and weights, matching `scoreParcel` in
 * apps/web/src/lib/pillars/score.ts: a weighted geometric mean (parts floored
 * at `floor`) or a weighted arithmetic mean, times `multiplier`. A part with no
 * score counts as its `impute` value, or is left out if it has none.
 */
export function overallScore(model: ScoringModel, weightChanges: Record<string, number> = {}): number | null {
  let weightSum = 0;
  let acc = 0;
  for (const part of model.parts) {
    const weight = weightChanges[part.id] ?? part.weight;
    const value = part.score ?? part.impute ?? null;
    if (weight <= 0 || value === null) continue;
    weightSum += weight;
    acc += model.method === "geometric" ? weight * Math.log(Math.max(value, model.floor)) : weight * value;
  }
  if (weightSum === 0) return null;
  const blend = model.method === "geometric" ? Math.exp(acc / weightSum) : acc / weightSum;
  return blend * (model.multiplier ?? 1);
}
