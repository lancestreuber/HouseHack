import { describe, expect, test } from "bun:test";

import { buildFacts, DEFINITIONS, parcelScore } from "./facts";
import { homewoodEvals, homewoodReport } from "./fixtures";
import type { Weights } from "./types";

const flat: Weights = {
  lot: 1, zoning: 1, hazards: 1, slope: 1, air: 1, transit: 1,
  parks: 1, health: 1, schools: 1, shops: 1, demand: 1,
};

describe("parcelScore", () => {
  test("is the weighted mean of considerations that have data", () => {
    // 10 scored considerations (shops is null): 64+80+100+90+58+100+75+45+70+52 = 734
    expect(parcelScore(homewoodReport.considerations, flat)).toBe(73);
  });

  test("responds to a heavier weight", () => {
    // (734 + 2×58) / 12 = 70.8
    expect(parcelScore(homewoodReport.considerations, { ...flat, air: 3 })).toBe(71);
  });

  test("returns null when every weight is zero", () => {
    const zero = Object.fromEntries(Object.keys(flat).map((k) => [k, 0])) as Weights;
    expect(parcelScore(homewoodReport.considerations, zero)).toBeNull();
  });
});

describe("buildFacts", () => {
  const facts = buildFacts([{ report: homewoodReport, evals: homewoodEvals }], flat);
  const byId = new Map(facts.map((f) => [f.id, f]));

  test("has one fact per consideration, with its numbers", () => {
    const air = byId.get("air");
    expect(air?.text).toContain("14.2 tons/yr");
    expect(air?.numbers).toContain("14.2");
    expect(air?.numbers).toContain("58");
  });

  test("describes each typology with legality, fit and Jev confidence", () => {
    const duplex = byId.get("t.duplex");
    expect(duplex?.text).toContain("allowed by right");
    expect(duplex?.text).toContain("75");
    expect(duplex?.text).toContain("81% confidence");
    expect(duplex?.text).not.toContain("0.81");
  });

  test("labels rules-based fits as having no Jev confidence", () => {
    expect(byId.get("t.sfd")?.text).toContain("rule-based estimate");
  });

  test("never gives a fit for a not-allowed typology", () => {
    const apts = byId.get("t.apartments");
    expect(apts?.text).toContain("not allowed");
    expect(apts?.text).not.toMatch(/fit \d/i);
  });

  test("includes the parcel score under the current weights", () => {
    expect(byId.get("score")?.numbers).toContain("73");
  });

  test("prefixes ids per parcel when comparing", () => {
    const two = buildFacts(
      [
        { report: homewoodReport, evals: homewoodEvals },
        { report: homewoodReport, evals: homewoodEvals },
      ],
      flat,
    );
    expect(two.some((f) => f.id === "p1.air")).toBe(true);
    expect(two.some((f) => f.id === "p2.t.duplex")).toBe(true);
  });

  test("always includes the definitions and limits", () => {
    for (const d of DEFINITIONS) expect(byId.has(d.id)).toBe(true);
    expect(byId.get("def.limits")?.text).toContain("crime");
  });
});
