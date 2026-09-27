import { describe, expect, test } from "bun:test";

import { DEFAULT_PENCIL, pencilCheck } from "./pencil";
import config from "./pillars.config.json";

const flat = { site_steep_slope_share: 100 };
const steep = { site_steep_slope_share: 20 };
const P = config.pencil;

// House cost at the defaults: 1,400 sf × $225 × 1.15 + $37,500 site work.
const houseCost = 1400 * DEFAULT_PENCIL.costPerSf * (1 + P.soft_cost_pct) + DEFAULT_PENCIL.siteCostPerBuilding;
const need = houseCost * (1 + P.margin_pct);

describe("pencilCheck", () => {
  test("house cost follows the published formula", () => {
    const r = pencilCheck("single_detached", flat, { demand_median_sale_price: 500000 });
    expect(r?.costPerUnit).toBeCloseTo(houseCost, 5);
    expect(r?.status).toBe("pencils");
  });

  test("bands: tight at production-builder cost, subsidy above the floor, else no", () => {
    const lowNeed = (1400 * P.cost_per_sf.low * (1 + P.soft_cost_pct) + DEFAULT_PENCIL.siteCostPerBuilding) * (1 + P.margin_pct);
    expect(pencilCheck("single_detached", flat, { demand_median_sale_price: Math.ceil(lowNeed) })?.status).toBe("tight");
    // Subsidy: value covers at least the subsidy floor.
    const high = { costPerSf: P.cost_per_sf.high, siteCostPerBuilding: DEFAULT_PENCIL.siteCostPerBuilding };
    const highNeed = (1400 * high.costPerSf * (1 + P.soft_cost_pct) + high.siteCostPerBuilding) * (1 + P.margin_pct);
    expect(pencilCheck("single_detached", flat, { demand_median_sale_price: Math.ceil(highNeed * P.subsidy_floor) }, high)?.status).toBe("subsidy");
    expect(pencilCheck("single_detached", flat, { demand_median_sale_price: Math.floor(highNeed * P.subsidy_floor) - 1 }, high)?.status).toBe("no");
    const weak = pencilCheck("single_detached", flat, { demand_median_sale_price: 60000 });
    expect(weak?.status).toBe("no");
    expect(weak?.gapPerUnit).toBeCloseTo(need - 60000, 5);
  });

  test("a mostly steep lot adds site cost", () => {
    const a = pencilCheck("single_detached", flat, { demand_median_sale_price: 300000 })!;
    const b = pencilCheck("single_detached", steep, { demand_median_sale_price: 300000 })!;
    expect(b.costPerUnit - a.costPerUnit).toBe(P.steep_site_adder);
  });

  test("rentals use capitalized rent, and site work is shared across units", () => {
    // Rent ratio 1.0 = $1,242.50/month.
    const r = pencilCheck("multi_unit", flat, { afford_rent_vs_ami: 1 })!;
    expect(r.basis).toBe("rent");
    expect(r.valuePerUnit).toBeCloseTo(1242.5 * P.rent_multiplier, 5);
    expect(r.costPerUnit).toBeCloseTo(850 * DEFAULT_PENCIL.costPerSf * (1 + P.soft_cost_pct) + DEFAULT_PENCIL.siteCostPerBuilding / 12, 5);
  });

  test("missing value data is unknown; other typologies are not assessed", () => {
    expect(pencilCheck("single_detached", flat, {})?.status).toBe("unknown");
    expect(pencilCheck("community_home", flat, {})).toBeNull();
  });

  test("the user's cost assumption moves the result", () => {
    const raw = { demand_median_sale_price: 300000 };
    expect(pencilCheck("single_detached", flat, raw, { costPerSf: 150, siteCostPerBuilding: 25000 })?.status).toBe("pencils");
    expect(pencilCheck("single_detached", flat, raw, { costPerSf: 350, siteCostPerBuilding: 50000 })?.status).toBe("subsidy");
  });
});
