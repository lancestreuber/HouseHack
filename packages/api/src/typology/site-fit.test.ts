import { describe, expect, test } from "bun:test";

import { buildSiteState, gateFor, parseZoning, toSiteFit } from "./site-fit";

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
    expect(toSiteFit({ ...base, confidence: 0.2 }).needsReview).toBe(true);
    expect(toSiteFit({ ...base, confidence: 0.5 }).needsReview).toBe(false);
  });
});
