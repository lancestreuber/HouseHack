import { describe, expect, test } from "bun:test";

import config from "@/lib/pillars/pillars.config.json";

import { capacity } from "./capacity";
import { areaChatContext, areaReport } from "./area-report";
import { DEFAULT_PARAMS, type HeatParams, leverMatrix, runHeatmap, smallestChange, stepCloseness } from "./engine";
import { decodeFacts, type Facts } from "./facts";

type Lot = { zone: string; lng: number; lat: number; w?: number; d?: number; area?: number; norm?: Record<string, number | null>; lever?: Partial<Record<string, number>> };

const LEVER_CODES = {
  designation_bits: { qct: 1, dda: 2, oz: 4 },
  overlay_bits: { inclusionary: 1, historic: 2, historic_landmark: 2, parking_reduction: 4, transit_buffer: 4 },
  city_classes: ["", "available", "transfer", "pending", "hold", "not_developable"],
  mva_types: ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "NC"],
};
const LEVER_COLUMNS = ["designations", "overlays", "mva", "city_owned", "treasury_sale", "years_delinquent"];

// ~100 ft of latitude.
const STEP = 100 / 364_000;

// A small synthetic city: clean, vacant, well-scored lots unless a test says otherwise.
function makeFacts(lots: Lot[]): Facts {
  const n = lots.length;
  const zones = [...new Set(lots.map((l) => l.zone))];
  const indicators = config.indicators.map((i) => i.id);
  const norm: Record<string, Uint8Array> = {};
  for (const id of indicators) {
    norm[id] = Uint8Array.from(lots, (l) => {
      const base: Record<string, number | null> = { site_parcel_use: 0, site_legal_pathway: 0, site_lot_area: 100 };
      const v = l.norm && id in l.norm ? l.norm[id] : (base[id] ?? (id.startsWith("site_") && id.endsWith("_share") ? 100 : 80));
      return v == null ? 255 : v;
    });
  }
  return {
    count: n,
    built: "test",
    pins: lots.map((_, i) => `PIN${String(i).padStart(13, "0")}`),
    zones,
    zone: Uint8Array.from(lots, (l) => zones.indexOf(l.zone)),
    lng: Float32Array.from(lots, (l) => l.lng),
    lat: Float32Array.from(lots, (l) => l.lat),
    widthFt: Float32Array.from(lots, (l) => l.w ?? 60),
    depthFt: Float32Array.from(lots, (l) => l.d ?? 150),
    indicators,
    missing: 255,
    norm,
    raw: {
      site_lot_area: Float32Array.from(lots, (l) => l.area ?? (l.w ?? 60) * (l.d ?? 150)),
      demand_median_sale_price: Float32Array.from(lots, () => Number.NaN),
      afford_rent_vs_ami: Float32Array.from(lots, () => Number.NaN),
    },
    levers: Object.fromEntries(LEVER_COLUMNS.map((c) => [c, Uint8Array.from(lots, (l) => l.lever?.[c] ?? (c === "mva" ? 2 : 0))])),
    leverCodes: LEVER_CODES,
  };
}

const params = (patch: Partial<HeatParams> = {}, rezone: Partial<HeatParams["rezone"]> = {}): HeatParams => ({
  ...DEFAULT_PARAMS,
  ignore: { ...DEFAULT_PARAMS.ignore, pencil: true },
  tiers: { green: 1, red: 0 },
  ...patch,
  rezone: { ...DEFAULT_PARAMS.rezone, target: "RM-M", rankBy: "homes", minHomes: 1, ...rezone },
});

const levelsOf = (r: ReturnType<typeof runHeatmap>) => [...r.level].map((c) => r.legend[c].key);

describe("capacity", () => {
  test("apartments fill the §903.03 envelope", () => {
    // RM-M: 20 ft total side, 25 front + 25 rear, 4 stories. 30 × 70 × 4 × 0.8 / 850 = 7.9.
    expect(capacity("multi_unit", "RM-M", 50, 120)).toBe(7);
  });
  test("setbacks that leave too little width mean no apartments", () => {
    expect(capacity("multi_unit", "RM-M", 30, 120)).toBe(0);
  });
  test("an odd-shaped lot's bounding rectangle can't inflate the footprint", () => {
    // Envelope 180 × 350, but 60% of a 10,000 sf lot is 6,000 sf: 6,000 × 4 × 0.8 / 850 = 22.6.
    expect(capacity("multi_unit", "RM-M", 200, 400, 10_000)).toBe(22);
  });
  test("small types are one building per lot", () => {
    expect(capacity("two_unit", "R2-M", 25, 100)).toBe(2);
    expect(capacity("single_attached", "R1A-M", 48, 100)).toBe(3);
  });
  test("unknown lot size or district is unknown, not zero", () => {
    expect(capacity("multi_unit", "RM-M", Number.NaN, 100)).toBeNull();
    expect(capacity("multi_unit", "GT-A", 50, 100)).toBeNull();
  });
});

describe("runHeatmap", () => {
  const row = [0, 1, 2].map((k) => ({ zone: "R1D-L", lng: -79.95, lat: 40.45 + k * STEP }));
  const rm = { zone: "RM-M", lng: -79.9, lat: 40.46 };

  test("apartments on single-family land are red today and colored by location with zoning ignored", () => {
    const facts = makeFacts([...row, rm]);
    expect(levelsOf(runHeatmap(facts, params()))).toEqual(["red", "red", "red", "green"]);
    expect(levelsOf(runHeatmap(facts, params({ zoning: "ignore" })))).toEqual(["green", "green", "green", "green"]);
  });

  test("adjacent locked lots form one rezoning area with net new homes", () => {
    const r = runHeatmap(makeFacts([...row, rm]), params());
    expect(r.clusters).toHaveLength(1);
    const perLot = capacity("multi_unit", "RM-M", 60, 150, 9000)! - 1; // a house is already allowed
    expect(r.clusters[0].homes).toBe(3 * perLot);
    expect(r.clusters[0].parcels).toEqual([0, 1, 2]);
    expect(r.clusters[0].affordableHomes).toBe(Math.floor(3 * perLot * 0.1));
    expect(r.unlocked[3]).toBe(0);
  });

  test("the join distance and one-district rule split areas", () => {
    const facts = makeFacts([...row, { zone: "R1D-M", lng: -79.95, lat: 40.45 + 3 * STEP }]);
    expect(runHeatmap(facts, params({}, { joinFt: 50 })).clusters).toHaveLength(4);
    expect(runHeatmap(facts, params()).clusters).toHaveLength(2);
    expect(runHeatmap(facts, params({}, { sameDistrict: false })).clusters).toHaveLength(1);
  });

  test("vacant-only drops occupied lots", () => {
    const facts = makeFacts([row[0], { ...row[1], norm: { site_parcel_use: 5 } }]);
    expect(runHeatmap(facts, params()).summary.lockedParcels).toBe(2);
    expect(runHeatmap(facts, params({}, { vacantOnly: true })).summary.lockedParcels).toBe(1);
  });

  test("an unchecked hazard counts as absent", () => {
    const facts = makeFacts([{ ...rm, norm: { site_undermined_share: 0 } }]);
    expect(levelsOf(runHeatmap(facts, params({ strict: true })))).toEqual(["yellow"]);
    const ignored = params({ strict: true });
    ignored.ignore.undermined = true;
    expect(levelsOf(runHeatmap(facts, ignored))).toEqual(["green"]);
  });

  test("a floodway deal-killer is red even in the top tier", () => {
    const facts = makeFacts([{ ...rm, norm: { site_floodway_share: 0 } }]);
    expect(levelsOf(runHeatmap(facts, params()))).toEqual(["red"]);
  });

  test("location tiers split scored parcels", () => {
    const lots = [20, 50, 80, 95].map((v, k) => ({ ...rm, lat: 40.46 + k * STEP * 10, norm: Object.fromEntries(config.indicators.filter((i) => !i.id.startsWith("site_")).map((i) => [i.id, v])) }));
    expect(levelsOf(runHeatmap(makeFacts(lots), params({ tiers: { green: 0.25, red: 0.25 } })))).toEqual(["red", "yellow", "yellow", "green"]);
  });
});

describe("decodeFacts", () => {
  test("reads the header and typed columns", () => {
    const header = new TextEncoder().encode(
      JSON.stringify({
        format: "typology-facts/1",
        built: "x",
        pillars_config_version: "v",
        count: 2,
        missing_u8: 255,
        indicators: ["a"],
        zones: ["RM-M"],
        pins: ["P1", "P2"],
        columns: [
          { name: "zone", type: "u8", offset: 0 },
          { name: "lng", type: "f32", offset: 4 },
          { name: "lat", type: "f32", offset: 12 },
          { name: "width_ft", type: "f32", offset: 20 },
          { name: "depth_ft", type: "f32", offset: 28 },
          { name: "norm:a", type: "u8", offset: 36 },
        ],
      }),
    );
    const start = Math.ceil((4 + header.byteLength) / 4) * 4;
    const buffer = new ArrayBuffer(start + 40);
    new DataView(buffer).setUint32(0, header.byteLength, true);
    new Uint8Array(buffer).set(header, 4);
    new Float32Array(buffer, start + 4, 2).set([-79.9, -80]);
    new Uint8Array(buffer, start + 36, 2).set([7, 255]);
    const facts = decodeFacts(buffer);
    expect(facts.pins).toEqual(["P1", "P2"]);
    expect(facts.lng[1]).toBeCloseTo(-80);
    expect([...facts.norm.a]).toEqual([7, 255]);
  });
});

describe("rezoning delta", () => {
  const row = [0, 1, 2].map((k) => ({ zone: "R1D-L", lng: -79.95, lat: 40.45 + k * STEP }));
  const rm = { zone: "RM-M", lng: -79.9, lat: 40.46 };

  test("the delta view shows only what a rezoning changes", () => {
    const lone = { zone: "R1D-L", lng: -79.99, lat: 40.40, w: 60, d: 150 };
    const r = runHeatmap(makeFacts([...row, rm, lone]), params({ zoning: "delta" }, { minHomes: 20 }));
    expect(levelsOf(r)).toEqual(["unlocked", "unlocked", "unlocked", "today", "unlocked_small"]);
    expect(r.legend.find((e) => e.key === "same")?.color).toBe("rgba(0,0,0,0)");
  });

  test("the smallest change keeps the density and moves the fewest district steps", () => {
    expect(smallestChange("R1D-L", "two_unit")).toBe("R2-L");
    expect(smallestChange("R2-M", "three_unit")).toBe("R3-M");
    // RM-L doesn't exist, so the tie between RM-VL and RM-M goes to the denser one.
    expect(smallestChange("R1D-L", "multi_unit")).toBe("RM-M");
    expect(stepCloseness("RM-L", "RM-M")).toBe(1);
    expect(stepCloseness("R2-M", "R3-M")).toBe(0.5);
    expect(stepCloseness("R1D-L", "RM-M")).toBe(0.2);
  });

  test("an area next to a district that already allows the type is easier", () => {
    const near = [0, 1].map((k) => ({ zone: "R1D-L", lng: -79.95, lat: 40.45 + k * STEP }));
    const far = [0, 1].map((k) => ({ zone: "R1D-M", lng: -79.8, lat: 40.5 + k * STEP }));
    const neighbor = { zone: "RM-M", lng: -79.95, lat: 40.45 - STEP };
    const r = runHeatmap(makeFacts([...far, ...near, neighbor]), params({}, { rankBy: "ease" }));
    expect(r.clusters.map((c) => c.zones[0])).toEqual(["R1D-L", "R1D-M"]);
    expect(r.clusters[0].easeParts.borders).toBe(true);
    expect(r.clusters[1].easeParts.borders).toBe(false);
    expect(r.clusters[0].ease).toBeGreaterThan(r.clusters[1].ease);
  });
});

describe("public levers", () => {
  // Two separate areas: one with a City lot for sale in a QCT, one in a Stressed market.
  const withLand = [0, 1].map((k) => ({ zone: "R1D-L", lng: -79.95, lat: 40.45 + k * STEP, lever: k === 0 ? { city_owned: 1, designations: 1, years_delinquent: 4 } : { designations: 1 } }));
  const stressed = [0, 1].map((k) => ({ zone: "R1D-L", lng: -79.8, lat: 40.5 + k * STEP, lever: { mva: 9 } }));

  test("areas carry lever counts", () => {
    const r = runHeatmap(makeFacts([...withLand, ...stressed]), params());
    const land = r.clusters.find((c) => c.levers.cityForSale > 0)!;
    expect(land.levers).toMatchObject({ cityForSale: 1, qct: 2, anyIncentive: 2, delinquent: 1, delinquent3: 1 });
    expect(land.levers.mva.robust).toBe(2);
    expect(r.summary.byLevers.reduce((a, b) => a + b.areas, 0)).toBe(2);
  });

  test("levers in reach count zoning ease, City land and a type-relevant incentive", () => {
    const r = runHeatmap(makeFacts([...withLand, ...stressed]), params({}, { rankBy: "levers" }));
    const [first, second] = r.clusters;
    // R1D-L → RM-M is a big jump with no RM next door, so the zoning lever is out of reach here.
    expect(first.access).toEqual({ zoning: false, land: true, incentive: true, count: 2 });
    expect(second.access.count).toBe(0);
    expect(r.summary.byLevers.map((b) => b.areas)).toEqual([1, 0, 1, 0]);
    // A QCT only helps tax-credit apartments; Opportunity Zones help any type.
    const duplex = runHeatmap(makeFacts(withLand), params({ typology: "two_unit" }, { target: "R2-L" }));
    expect(duplex.clusters[0].access.incentive).toBe(false);
    expect(runHeatmap(makeFacts(withLand), params({}, { minLevers: 3 })).clusters).toHaveLength(0);
  });

  test("lever filters narrow the areas", () => {
    const facts = makeFacts([...withLand, ...stressed]);
    expect(runHeatmap(facts, params()).clusters).toHaveLength(2);
    expect(runHeatmap(facts, params({}, { requireCityLand: true })).clusters).toHaveLength(1);
    expect(runHeatmap(facts, params({}, { requireIncentive: true })).clusters).toHaveLength(1);
    const kept = runHeatmap(facts, params({}, { excludeStressed: true })).clusters;
    expect(kept).toHaveLength(1);
    expect(kept[0].levers.cityForSale).toBe(1);
  });

  test("the area report warns on Transitional/Stressed markets and the chat gets the same facts", () => {
    const r = runHeatmap(makeFacts(stressed), params());
    const report = areaReport(r.clusters[0], r.params);
    const equity = report.sections.find((s) => s.key === "equity")!;
    expect(equity.tone).toBe("warn");
    expect(equity.lines.map((l) => l.id)).toContain("area.equity.warn");
    const chat = areaChatContext(report, "2026-09-27");
    expect(chat.facts.map((f) => f.id)).toContain("area.zoning.record");
    expect(chat.facts.every((f) => f.text.length <= 600)).toBe(true);
    expect(report.sections.find((s) => s.key === "land")!.tone).toBe("stop");
  });
});

describe("lever matrix", () => {
  test("runs every housing type under the same knobs", () => {
    const lots = [0, 1].map((k) => ({ zone: "R1D-L", lng: -79.95, lat: 40.45 + k * STEP, lever: { city_owned: 1, designations: 4 } }));
    const rows = leverMatrix(makeFacts(lots), params({}, { target: "auto" }));
    expect(rows.map((r) => r.typology)).toEqual(["single_detached", "single_attached", "two_unit", "three_unit", "multi_unit"]);
    const apartments = rows.find((r) => r.typology === "multi_unit")!;
    expect(apartments.areas).toBe(1);
    expect(apartments.withLever).toEqual({ zoning: 0, land: 1, incentive: 1 });
    // Houses are already allowed on R1D land, so there is nothing to unlock.
    expect(rows[0].areas).toBe(0);
  });
});
