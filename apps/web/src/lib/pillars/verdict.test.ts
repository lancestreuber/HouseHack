import { describe, expect, test } from "bun:test";

import config from "./pillars.config.json";
import { typologyVerdict } from "./verdict";

// Normalized values for a clean, vacant, by-right lot: 100 = none of the hazard.
function clean(extra: Record<string, number | null> = {}) {
  const values: Record<string, number | null> = {};
  for (const ind of config.indicators) values[ind.id] = 80;
  return {
    ...values,
    site_parcel_use: 0,
    site_lot_area: 100,
    site_floodway_share: 100,
    site_sfha_share: 100,
    site_steep_slope_share: 100,
    site_landslide_prone_share: 100,
    site_recent_landslide_share: 100,
    site_undermined_share: 100,
    ...extra,
  };
}

describe("typologyVerdict", () => {
  test("by right on a clean vacant lot is green", () => {
    const v = typologyVerdict({ typology: "two_unit", pathway: "by_right", values: clean() });
    expect(v.level).toBe("green");
  });

  test("hearings make it yellow", () => {
    expect(typologyVerdict({ typology: "two_unit", pathway: "zbe_special_exception", values: clean() }).level).toBe("yellow");
    expect(typologyVerdict({ typology: "multi_unit", pathway: "conditional_use", values: clean() }).level).toBe("yellow");
  });

  test("not permitted is red unless a nearby-density district allows it", () => {
    expect(typologyVerdict({ typology: "multi_unit", pathway: "not_permitted", rezoningCloseness: 0.2, values: clean() }).level).toBe("red");
    expect(typologyVerdict({ typology: "multi_unit", pathway: "not_permitted", rezoningCloseness: 1, values: clean() }).level).toBe("yellow");
  });

  test("a floodway lot is red even when zoning allows it by right", () => {
    const v = typologyVerdict({ typology: "single_detached", pathway: "by_right", values: clean({ site_floodway_share: 30 }) });
    expect(v.level).toBe("red");
    expect(v.reasons[0].text).toContain("floodway");
  });

  test("mines need an investigation (yellow) with type-specific wording", () => {
    const values = clean({ site_undermined_share: 0 });
    const multi = typologyVerdict({ typology: "multi_unit", pathway: "by_right", values });
    const house = typologyVerdict({ typology: "single_detached", pathway: "by_right", values });
    expect(multi.level).toBe("yellow");
    expect(multi.reasons[0].text).toContain("mine investigation");
    expect(house.level).toBe("yellow");
    expect(house.reasons[0].text).toContain("100+ ft of cover");
  });

  test("steep slope adds cost (yellow), not a deal-killer", () => {
    expect(typologyVerdict({ typology: "single_detached", pathway: "by_right", values: clean({ site_steep_slope_share: 20 }) }).level).toBe("yellow");
  });

  test("sliver lots and parks are red; condo units are not treated as slivers", () => {
    expect(typologyVerdict({ typology: "single_detached", pathway: "by_right", values: clean({ site_lot_area: 50 }) }).level).toBe("red");
    expect(typologyVerdict({ typology: "single_detached", pathway: "by_right", values: clean({ site_parcel_use: 1 }) }).level).toBe("red");
    expect(typologyVerdict({ typology: "single_detached", pathway: "by_right", values: clean({ site_lot_area: 50, site_parcel_use: 3 }) }).level).toBe("yellow");
  });

  test("unknown zoning never reads as green, but a known red still shows", () => {
    expect(typologyVerdict({ typology: "two_unit", pathway: undefined, values: clean() }).level).toBe("unknown");
    expect(typologyVerdict({ typology: "two_unit", pathway: undefined, values: clean({ site_floodway_share: 0 }) }).level).toBe("red");
  });

  test("a physical fit of 'Cannot fit' is red; a tight fit is yellow", () => {
    const cannot = { fit: 0, label: "Cannot fit", needsReview: false };
    const tight = { fit: 0.33, label: "Tight fit", needsReview: false };
    expect(typologyVerdict({ typology: "multi_unit", pathway: "by_right", values: clean(), fit: cannot }).level).toBe("red");
    expect(typologyVerdict({ typology: "multi_unit", pathway: "by_right", values: clean(), fit: tight }).level).toBe("yellow");
  });

  test("narrow lots whose side setbacks leave too little width need a variance (SME's 24 ft RM-M example)", () => {
    const base = { typology: "two_unit", pathway: "by_right", values: clean(), zoning: "RM-M" };
    const narrow = typologyVerdict({ ...base, lotWidthFt: 24 });
    expect(narrow.level).toBe("yellow");
    expect(narrow.reasons[0].text).toContain("leave 4 ft");
    expect(typologyVerdict({ ...base, lotWidthFt: 40 }).level).toBe("green");
    // Party-wall rowhouses have no interior side setback.
    expect(typologyVerdict({ ...base, typology: "single_attached", lotWidthFt: 24 }).level).toBe("green");
    // Unknown district or width: no claim either way.
    expect(typologyVerdict({ ...base, zoning: "UC-MU", lotWidthFt: 10 }).level).toBe("green");
  });

  test("missing hazard data is unknown, not green", () => {
    const v = typologyVerdict({ typology: "two_unit", pathway: "by_right", values: clean({ site_undermined_share: null }) });
    expect(v.level).toBe("unknown");
    expect(v.reasons[0].text).toContain("undermined");
  });

  test("pathway reasons carry the approval clock", () => {
    const v = typologyVerdict({ typology: "multi_unit", pathway: "conditional_use", values: clean() });
    expect(v.reasons[0].text).toContain("6 months");
  });
});
