import { describe, expect, test } from "bun:test";

import { isCityParcel, municipalityName } from "./city-scope";

describe("city scope", () => {
  test("Pittsburgh wards 101-132 are City parcels", () => {
    expect(isCityParcel(101)).toBe(true);
    expect(isCityParcel(132)).toBe(true);
    expect(municipalityName(114)).toBe("Pittsburgh");
  });

  test("Mount Oliver, suburbs and other ward cities are outside", () => {
    expect(isCityParcel(839)).toBe(false);
    expect(municipalityName(839)).toBe("Mount Oliver Borough");
    expect(isCityParcel(402)).toBe(false);
    expect(municipalityName(402)).toBe("McKeesport");
    expect(isCityParcel(null)).toBe(false);
  });

  test("codes that match no municipality or ward stay unnamed", () => {
    expect(municipalityName(293)).toBeNull();
    expect(municipalityName(999)).toBeNull();
    expect(municipalityName(null)).toBeNull();
  });
});
