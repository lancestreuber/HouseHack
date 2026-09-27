import { describe, expect, test } from "bun:test";

import { buildSiteState, parseZoning, siteFitQuestion, toSiteFit, TYPOLOGIES } from "./site-fit";

describe("siteFitQuestion", () => {
  test("has a question for every one of the 16 typologies", () => {
    for (const t of TYPOLOGIES) expect(siteFitQuestion(t.id).instructions).toContain(t.describe);
  });
});

describe("buildSiteState", () => {
  test("states pre-computed numbers in words and skips negligible hazards", () => {
    const state = buildSiteState(
      { areaSf: 3251.2, widthFt: 30.4, depthFt: 107.9 },
      parseZoning("R2-L"),
      { floodplain: 0.3, steepSlope: 0.004 },
    );
    expect(state.lot).toBe("Lot area 3,251 sq ft. Roughly 30 ft wide by 108 ft deep (bounding rectangle).");
    expect(state.zoning).toContain("at or above");
    expect(state.hazards).toBe("30% of the lot is in the 100-year floodplain.");
  });
});

describe("toSiteFit", () => {
  test("flags low-confidence ratings for human review", () => {
    const base = { type: "score" as const, score: 1, normalized: 0.33, label: "x", probabilities: [] };
    expect(toSiteFit({ ...base, confidence: 0.2 }, "duplex").needsReview).toBe(true);
    expect(toSiteFit({ ...base, confidence: 0.5 }, "duplex").needsReview).toBe(false);
  });

  test("detached gets a lower review-confidence bar (least demanding typology)", () => {
    const base = { type: "score" as const, score: 3, normalized: 1, label: "x", probabilities: [] };
    expect(toSiteFit({ ...base, confidence: 0.25 }, "detached").needsReview).toBe(false);
    expect(toSiteFit({ ...base, confidence: 0.25 }, "duplex").needsReview).toBe(true);
  });
});
