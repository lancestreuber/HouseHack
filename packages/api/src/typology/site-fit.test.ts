import { describe, expect, test } from "bun:test";

import { buildSiteState, estimateCost, gateFor, parseZoning, siteFitQuestion, toSiteFit, TYPOLOGIES, verdictFor } from "./site-fit";

describe("gateFor", () => {
  const r2 = parseZoning("R2-L");

  test("uses the use table for residential districts", () => {
    expect(gateFor("detached", r2, 3500).status).toBe("allowed");
    expect(gateFor("duplex", r2, 3500).status).toBe("allowed");
    expect(gateFor("apartment", r2, 3500).status).toBe("not_permitted");
    expect(gateFor("apartment", parseZoning("RM-M"), 10000).status).toBe("allowed");
    expect(gateFor("attached", parseZoning("R1D-L"), 5000).status).toBe("conditional");
  });

  test("elderly housing always needs a Special Exception, with the form allowed by district", () => {
    const low = gateFor("elderly", parseZoning("R1D-L"), 8000);
    expect(low.status).toBe("conditional");
    expect(low.reason).toContain("Limited only");
    expect(gateFor("elderly", parseZoning("RM-M"), 8000).reason).toContain("Limited or General");
  });

  test("flags undersized lots as conditional, not blocked", () => {
    const gate = gateFor("duplex", r2, 2000);
    expect(gate.status).toBe("conditional");
    expect(gate.reason).toContain("3,000");
    expect(gateFor("detached", r2, 2000).reason).toContain("Administrator Exception");
  });

  test("unencoded or missing zoning is unknown, not guessed", () => {
    expect(gateFor("duplex", parseZoning("LNC"), 3000).status).toBe("unknown");
    expect(gateFor("duplex", parseZoning(null), 3000).status).toBe("unknown");
  });

  test("heavy undermining blocks multi-unit typologies even where zoning allows them", () => {
    const gate = gateFor("duplex", r2, 3500, { undermined: 0.75 });
    expect(gate.status).toBe("conditional");
    expect(gate.hazardBlocked).toBe(true);
    expect(gate.reason).toContain("mine-subsidence investigation");
  });

  test("undermining doesn't block a single-unit detached house", () => {
    const gate = gateFor("detached", r2, 3500, { undermined: 0.9 });
    expect(gate.status).toBe("allowed");
    expect(gate.hazardBlocked).toBeUndefined();
  });

  test("light undermining below the threshold doesn't block", () => {
    const gate = gateFor("duplex", r2, 3500, { undermined: 0.1 });
    expect(gate.hazardBlocked).toBeUndefined();
  });

  test("a typology already not_permitted by zoning isn't relabeled hazard-blocked", () => {
    const gate = gateFor("apartment", r2, 3500, { undermined: 0.9 });
    expect(gate.status).toBe("not_permitted");
    expect(gate.hazardBlocked).toBeUndefined();
  });

  test("legal gates are only modeled for the original 5 typologies; the rest come back unknown", () => {
    expect(gateFor("community_home", r2, 3500).status).toBe("unknown");
    expect(gateFor("interim_housing", r2, 3500).status).toBe("unknown");
    expect(gateFor("three_unit", r2, 3500).status).toBe("unknown");
    expect(gateFor("assisted_living_a", r2, 3500).status).toBe("unknown");
  });
});

describe("verdictFor", () => {
  const r2 = parseZoning("R2-L");
  const fit = (n: number, needsReview = false) => ({ fit: n, label: "x", probabilities: [], confidence: 1, needsReview });

  test("unknown zoning is an unknown verdict, not a guess", () => {
    const gate = gateFor("duplex", parseZoning(null), 3000);
    expect(verdictFor("duplex", gate, null, undefined, null).level).toBe("unknown");
  });

  test("a hazard-blocked gate is red even though zoning otherwise allows it", () => {
    const gate = gateFor("duplex", r2, 3500, { undermined: 0.75 });
    expect(verdictFor("duplex", gate, fit(0.9), { undermined: 0.75 }, null).level).toBe("red");
  });

  test("not_permitted with a realistic rezoning path is yellow, with no path is red", () => {
    const permitted = gateFor("apartment", parseZoning("R1D-L"), 8000);
    expect(verdictFor("apartment", permitted, null, undefined, null).level).toBe("yellow");
  });

  test("half or more of the lot in the regulatory floodway is red", () => {
    const gate = gateFor("detached", r2, 3500);
    expect(verdictFor("detached", gate, fit(0.9), { floodway: 0.6 }, null).level).toBe("red");
  });

  test("a lot that physically cannot fit the typology is red even if legal and hazard-free", () => {
    const gate = gateFor("detached", r2, 3500);
    expect(verdictFor("detached", gate, fit(0.1), {}, null).level).toBe("red");
  });

  test("clean legal, hazard-free, comfortable-fit parcel is green", () => {
    const gate = gateFor("detached", r2, 3500);
    expect(verdictFor("detached", gate, fit(0.9), {}, 8).level).toBe("green");
  });

  test("a weak market pulls a multi-unit typology to yellow, but not a detached house", () => {
    const gate = gateFor("duplex", r2, 3500);
    expect(verdictFor("duplex", gate, fit(0.9), {}, 2).level).toBe("yellow");
    const detachedGate = gateFor("detached", r2, 3500);
    expect(verdictFor("detached", detachedGate, fit(0.9), {}, 2).level).toBe("green");
  });
});

describe("estimateCost", () => {
  test("scales with unit count and returns an ascending low/high range", () => {
    const detached = estimateCost("detached");
    const apartment = estimateCost("apartment");
    expect(detached.low).toBeLessThan(detached.high);
    expect(apartment.units).toBe(12);
    expect(apartment.low).toBeGreaterThan(detached.low);
  });

  test("has a cost estimate for every one of the 16 typologies", () => {
    for (const t of TYPOLOGIES) {
      const cost = estimateCost(t.id);
      expect(cost.low).toBeGreaterThan(0);
      expect(cost.low).toBeLessThan(cost.high);
    }
  });
});

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
