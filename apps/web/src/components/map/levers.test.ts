import { describe, expect, test } from "bun:test";

import { computeLevers, type LeverData, pointInGeometry } from "./levers";

const square = (x0: number, y0: number, size: number): [number, number][] => [
  [x0, y0],
  [x0 + size, y0],
  [x0 + size, y0 + size],
  [x0, y0 + size],
  [x0, y0],
];

const PIN = "0043R00172000000";

const data: LeverData = {
  designations: [
    { properties: { designation: "qct" }, geometry: { type: "Polygon", coordinates: [square(-80.1, 40.4, 0.1)] } },
    { properties: { designation: "oz" }, geometry: { type: "MultiPolygon", coordinates: [[square(-80.1, 40.4, 0.1), square(-80.06, 40.44, 0.02)]] } },
  ],
  overlays: [{ properties: { kind: "inclusionary" }, geometry: { type: "Polygon", coordinates: [square(-80.1, 40.4, 0.1)] } }],
  cityOwned: new Map([[PIN, { pin: PIN, inventory_type: "Public Sale", status: "Available for Sale", class: "available" }]]),
  treasury: new Map(),
  delinquent: new Map([["private-delinquent", { pin: "private-delinquent", years_delinquent: 3 }]]),
};

describe("pointInGeometry", () => {
  test("respects holes", () => {
    const geometry = { type: "Polygon" as const, coordinates: [square(0, 0, 10), square(4, 4, 2)] };
    expect(pointInGeometry([1, 1], geometry)).toBe(true);
    expect(pointInGeometry([5, 5], geometry)).toBe(false);
    expect(pointInGeometry([11, 1], geometry)).toBe(false);
  });
});

describe("zoning lever", () => {
  test("apartments in R1D-L spell out the rezoning and the variance", () => {
    const { zoning } = computeLevers(PIN, "R1D-L", "multi_unit", [-80.09, 40.41], data);
    expect(zoning.tone).toBe("stop");
    expect(zoning.answer).toBe("No, not today");
    expect(zoning.paths).toHaveLength(2);
    const [rezone, variance] = zoning.paths;
    expect(rezone?.title).toMatch(/^Rezone the lot to /);
    const steps = Object.fromEntries(rezone!.steps.map((s) => [s.label, s.value]));
    expect(steps["What changes"]).toContain("R1D-L (single-unit detached residential low density)");
    expect(steps["Who decides"]).toContain("City Council");
    expect(steps["Track record"]).toContain("42 of 49");
    expect(variance?.title).toContain("use variance");
    expect(zoning.items.some((l) => l.id === "zoning.iz" && l.detail?.includes("20+"))).toBe(true);
  });

  test("a special exception names who decides and when", () => {
    const { zoning } = computeLevers(PIN, "R1D-L", "single_attached", null, data);
    expect(zoning.tone).toBe("maybe");
    const labels = zoning.paths[0]!.steps.map((s) => s.label);
    expect(labels).toContain("Who decides");
    expect(labels).toContain("Timeline");
  });

  test("a house in R1D-L needs no lever", () => {
    const { zoning } = computeLevers(PIN, "R1D-L", "single_detached", null, data);
    expect(zoning.tone).toBe("go");
    expect(zoning.paths).toHaveLength(0);
  });
});

describe("incentives lever", () => {
  test("QCT and OZ count for apartments", () => {
    const { incentives } = computeLevers(PIN, "R1D-L", "multi_unit", [-80.09, 40.41], data);
    expect(incentives.tone).toBe("go");
    expect(incentives.answer).toBe("Yes, 2 location-based incentives");
    expect(incentives.items.find((l) => l.id === "incentive.abatement")?.status).toBe("unknown");
  });

  test("a hole in a designation is outside it", () => {
    const { incentives } = computeLevers(PIN, "R1D-L", "multi_unit", [-80.05, 40.45], data);
    expect(incentives.items.some((l) => l.id === "incentive.oz")).toBe(false);
    expect(incentives.items.some((l) => l.id === "incentive.qct")).toBe(true);
  });

  test("a QCT doesn't help a single house", () => {
    const { incentives } = computeLevers(PIN, "R1D-L", "single_detached", [-80.05, 40.45], data);
    expect(incentives.items.find((l) => l.id === "incentive.qct")?.status).toBe("no");
    expect(incentives.answer).toBe("Designated, but not for this type");
  });

  test("a missing location is unknown, not absent", () => {
    const { incentives } = computeLevers(PIN, "R1D-L", "multi_unit", null, data);
    expect(incentives.tone).toBe("unknown");
    expect(incentives.answer).toBe("Unknown");
  });
});

describe("land lever", () => {
  test("a City lot for sale is a go", () => {
    expect(computeLevers(PIN, "R1D-L", "multi_unit", null, data).land.answer).toBe("Yes, City-owned and for sale");
  });

  test("a delinquent private lot could come to the City", () => {
    const { land } = computeLevers("private-delinquent", "R1D-L", "multi_unit", null, data);
    expect(land.tone).toBe("maybe");
    expect(land.items.some((l) => l.id === "land.delinquent")).toBe(true);
  });

  test("a private lot is privately held", () => {
    expect(computeLevers("x", "R1D-L", "multi_unit", null, data).land.answer).toBe("No, privately held");
  });
});
