import type { ScoringModel } from "./types";

/**
 * Overall score from part scores and weights, matching `overallScore` in
 * apps/web/src/lib/pillars/score.ts: a weighted geometric mean (parts floored
 * at `floor`) or a weighted arithmetic mean. Parts with no score or zero weight
 * are left out.
 */
export function overallScore(model: ScoringModel, weightChanges: Record<string, number> = {}): number | null {
  let weightSum = 0;
  let acc = 0;
  for (const part of model.parts) {
    const weight = weightChanges[part.id] ?? part.weight;
    if (weight <= 0 || part.score === null) continue;
    weightSum += weight;
    acc += model.method === "geometric" ? weight * Math.log(Math.max(part.score, model.floor)) : weight * part.score;
  }
  if (weightSum === 0) return null;
  return model.method === "geometric" ? Math.exp(acc / weightSum) : acc / weightSum;
}
