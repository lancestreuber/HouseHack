import { describe, expect, test } from "bun:test";

import { overallScore } from "./rescore";
import type { ScoringModel } from "./types";

const pillars = (method: ScoringModel["method"]): ScoringModel => ({
  method,
  floor: 1,
  parts: [
    { id: "demand", label: "Demand", score: 80, weight: 1 },
    { id: "climate", label: "Climate", score: 20, weight: 1 },
    { id: "afford", label: "Affordability", score: null, weight: 1 },
  ],
});

describe("overallScore (mirrors apps/web/src/lib/pillars/score.ts)", () => {
  test("geometric mean limits how much a strong part offsets a weak one", () => {
    expect(overallScore(pillars("geometric"))).toBeCloseTo(40, 6); // sqrt(80 × 20)
  });

  test("arithmetic mean is the plain weighted average", () => {
    expect(overallScore(pillars("arithmetic"))).toBe(50);
  });

  test("weight changes apply on top of current weights", () => {
    // (3×80 + 1×20) / 4
    expect(overallScore(pillars("arithmetic"), { demand: 3 })).toBe(65);
  });

  test("zero scores are floored so they don't zero the product", () => {
    const model = pillars("geometric");
    model.parts[1] = { id: "climate", label: "Climate", score: 0, weight: 1 };
    expect(overallScore(model)).toBeCloseTo(Math.sqrt(80), 6);
  });

  test("null when every weight is zero", () => {
    expect(overallScore(pillars("arithmetic"), { demand: 0, climate: 0 })).toBeNull();
  });
});
