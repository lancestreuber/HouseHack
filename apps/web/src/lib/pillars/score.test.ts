import { describe, expect, test } from "bun:test";

import { phraseFor } from "./phrases";
import config from "./pillars.config.json";
import { PILLAR_IDS, scoreParcel, weightSensitivity } from "./score";

// Every indicator at `value`, with a buildable, by-right, non-hazard parcel.
function parcel(value: number, extra: Record<string, number | null> = {}) {
  const values: Record<string, number | null> = {};
  for (const ind of config.indicators) values[ind.id] = value;
  Object.assign(values, {
    site_legal_pathway: 0,
    site_parcel_use: 0,
    site_lot_area: 100,
    site_floodway_share: 100,
    site_sfha_share: 100,
    site_steep_slope_share: 100,
    site_landslide_prone_share: 100,
    site_undermined_share: 100,
    site_lead_line: null,
    ...extra,
  });
  return values;
}

describe("scoreParcel", () => {
  test("uniform indicators give uniform pillars and overall", () => {
    // Floodway stays at 100 (none): any floodway share triggers a cap by design.
    const s = scoreParcel(parcel(70, {
      site_sfha_share: 70,
      site_steep_slope_share: 70,
      site_landslide_prone_share: 70,
      site_undermined_share: 70,
    }));
    for (const p of PILLAR_IDS) expect(s.pillars[p].score).toBeCloseTo(70, 5);
    expect(s.overall).toBeCloseTo(70, 5);
    expect(s.legal?.id).toBe("by_right");
    expect(s.availability?.id).toBe("site");
  });

  test("contributions add up to the pillar score when nothing is capped", () => {
    const values = parcel(0);
    config.indicators.forEach((ind, i) => (values[ind.id] = (i * 37) % 101));
    Object.assign(values, { site_legal_pathway: 0, site_parcel_use: 0, site_lot_area: 100, site_floodway_share: 100 });
    const s = scoreParcel(values);
    for (const p of PILLAR_IDS) {
      if (s.pillars[p].flags.some((f) => f.capped)) continue;
      const sum = s.pillars[p].contributions.reduce((a, c) => a + c.share, 0);
      expect(sum).toBeCloseTo(s.pillars[p].score as number, 5);
    }
  });

  test("a floodway parcel is capped and flagged, not averaged away", () => {
    const s = scoreParcel(parcel(100, { site_floodway_share: 40 }));
    expect(s.pillars.site.score).toBeLessThanOrEqual(5);
    expect(s.pillars.site.flags.some((f) => f.capped)).toBe(true);
  });

  test("flag-only gates warn without capping", () => {
    const s = scoreParcel(parcel(90, { site_undermined_share: 20 }));
    const flag = s.pillars.site.flags.find((f) => f.text.includes("mines"));
    expect(flag?.capped).toBe(false);
  });

  test("zoning and site-availability multiply the overall score", () => {
    const base = scoreParcel(parcel(80));
    const notPermitted = scoreParcel(parcel(80, { site_legal_pathway: 5 }));
    const park = scoreParcel(parcel(80, { site_parcel_use: 1 }));
    expect(notPermitted.overall).toBeCloseTo((base.overall as number) * 0.2, 5);
    expect(park.overall).toBeCloseTo((base.overall as number) * 0.05, 5);
    expect(notPermitted.overallBeforeMultipliers).toBeCloseTo(base.overall as number, 5);
  });

  test("a pillar without enough data counts as a neutral 50 in the overall", () => {
    const demandIds = config.indicators.filter((i) => i.pillar === "demand").map((i) => i.id);
    const s = scoreParcel(parcel(80, Object.fromEntries(demandIds.map((id) => [id, null]))));
    expect(s.pillars.demand.score).toBeNull();
    expect(s.overall).not.toBeNull();
    expect(s.overall as number).toBeLessThan(80);
  });

  test("the displacement sub-score is shown but does not move the pillar", () => {
    const a = scoreParcel(parcel(60, { afford_price_growth: 0, afford_displacement_ratio: 0, afford_rent_growth_5yr: 0 }));
    const b = scoreParcel(parcel(60, { afford_price_growth: 100, afford_displacement_ratio: 100, afford_rent_growth_5yr: 100 }));
    expect(a.pillars.afford.score).toBeCloseTo(b.pillars.afford.score as number, 5);
    expect(a.pillars.afford.subscores.find((x) => x.id === "displacement")?.score).toBe(0);
  });

  test("a zero pillar weight removes the pillar from the overall", () => {
    const values = parcel(80, config.indicators.filter((i) => i.pillar === "climate").reduce((o, i) => ({ ...o, [i.id]: 0 }), {}));
    const withClimate = scoreParcel(values);
    const without = scoreParcel(values, { pillars: { climate: 0 } });
    expect(without.overall as number).toBeGreaterThan(withClimate.overall as number);
  });

  test("geometric mean penalizes an unbalanced parcel more than arithmetic", () => {
    const values = parcel(90, config.indicators.filter((i) => i.pillar === "access").reduce((o, i) => ({ ...o, [i.id]: 5 }), {}));
    const geo = scoreParcel(values, { overall: "geometric" }).overall as number;
    const arith = scoreParcel(values, { overall: "arithmetic" }).overall as number;
    expect(geo).toBeLessThan(arith);
  });

  test("weight sensitivity brackets the score", () => {
    const s = scoreParcel(parcel(70));
    const r = weightSensitivity(s.pillars);
    expect(r).not.toBeNull();
    expect(r!.p10).toBeLessThanOrEqual(r!.p90);
  });
});

describe("phraseFor", () => {
  test("the top Site band needs every hazard under a quarter of the lot", () => {
    const clean = phraseFor("site", 95, { site_steep_slope_share: 100 });
    const steep = phraseFor("site", 95, { site_steep_slope_share: 60 });
    expect(clean).toBe(config.phrases.site[0].text);
    expect(steep).toBe(config.phrases.site[1].text);
  });

  test("missing scores have no phrase", () => {
    expect(phraseFor("demand", null)).toBeNull();
  });
});
