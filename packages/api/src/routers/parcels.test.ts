import { describe, expect, test } from "bun:test";

import { formatAddress } from "./parcels";

const blank = { PARID: "X", PROPERTYHOUSENUM: " ", PROPERTYFRACTION: " ", PROPERTYADDRESS: " ", PROPERTYUNIT: " ", PROPERTYCITY: " ", PROPERTYSTATE: " ", PROPERTYZIP: " " };

describe("formatAddress", () => {
  test("title-cases the County's all-caps record", () => {
    expect(formatAddress({ ...blank, PROPERTYHOUSENUM: "4307", PROPERTYADDRESS: "DAKOTA ST", PROPERTYCITY: "PITTSBURGH", PROPERTYSTATE: "PA", PROPERTYZIP: "15213" })).toBe(
      "4307 Dakota St, Pittsburgh, PA 15213",
    );
  });

  test("keeps fractions and units", () => {
    expect(formatAddress({ ...blank, PROPERTYHOUSENUM: "12", PROPERTYFRACTION: "1/2", PROPERTYADDRESS: "MAIN ST", PROPERTYUNIT: "UNIT 3", PROPERTYCITY: "PITTSBURGH" })).toBe(
      "12 1/2 Main St UNIT 3, Pittsburgh",
    );
  });

  test("no street means no address", () => {
    expect(formatAddress({ ...blank, PROPERTYCITY: "PITTSBURGH" })).toBeNull();
  });
});
