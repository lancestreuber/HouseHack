import { describe, expect, test } from "bun:test";

import { typologyImpact } from "./typology-impact";

const parcel = (norm: Record<string, number | null>, raw: Record<string, number | null>) => ({ norm, raw });
const keys = (typology: string, data: ReturnType<typeof parcel>) => typologyImpact(typology, data).map((i) => `${i.effect}.${i.key}`);

describe("typologyImpact", () => {
  test("rental types help low-income renters where cost burden is high; a house doesn't", () => {
    const data = parcel({ afford_lowinc_renter_burden: 80 }, { afford_lowinc_renter_burden: 74.4 });
    const duplex = typologyImpact("two_unit", data);
    expect(duplex.map((i) => i.key)).toContain("lowinc_renters");
    expect(duplex.find((i) => i.key === "lowinc_renters")!.text).toStartWith("Helps low-income renters: 74.4% of low-income renters");
    expect(keys("single_detached", data)).not.toContain("helps.lowinc_renters");
  });

  test("missing data yields no item, never a harm", () => {
    expect(typologyImpact("multi_unit", parcel({}, {}))).toEqual([]);
    expect(keys("elderly_general", parcel({}, {}))).toEqual(["helps.older_adults"]);
  });

  test("an occupied building on the lot may harm its current occupants", () => {
    expect(keys("two_unit", parcel({}, { site_parcel_use: 5 }))).toContain("harms.current_occupants");
    expect(keys("two_unit", parcel({}, { site_parcel_use: 0 }))).not.toContain("harms.current_occupants");
  });

  test("displacement pressure flags nearby renters, with the numbers", () => {
    const item = typologyImpact("multi_unit", parcel({ afford_rent_growth_5yr: 10 }, { afford_rent_growth_5yr: 31 })).find((i) => i.key === "nearby_renters");
    expect(item?.effect).toBe("harms");
    expect(item?.text).toContain("rents rose 31.0% in 5 years");
    expect(item?.indicators).toEqual(["afford_rent_growth_5yr"]);
  });

  test("transit helps car-light types and its absence may harm them", () => {
    expect(keys("multi_unit", parcel({ access_transit: 90 }, { access_transit: 3200 }))).toContain("helps.car_free");
    expect(keys("multi_unit", parcel({ access_transit: 10 }, { access_transit: 120 }))).toContain("harms.car_free");
    expect(keys("single_detached", parcel({ access_transit: 10 }, { access_transit: 120 }))).not.toContain("harms.car_free");
  });

  test("far-off care may harm older residents", () => {
    const far = parcel({ access_health: 10, access_pharmacy: 20, access_senior_center: 0 }, { access_health: 3000, access_pharmacy: 2200, access_senior_center: 2600 });
    expect(keys("assisted_living_a", far)).toEqual(["helps.older_adults", "harms.older_adults"]);
  });
});
