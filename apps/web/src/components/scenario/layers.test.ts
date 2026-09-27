import { describe, expect, test } from "bun:test";

import config from "@/lib/pillars/pillars.config.json";

import { OVERLAYS } from "../map/overlays";
import { TYPOLOGIES } from "../map/overlays/legal-feasibility";
import { indicatorLayers, layersForFact, scenarioOverlayState } from "./layers";

const exists = (id: string) => OVERLAYS.some((o) => o.id === id);

describe("scenario layers", () => {
  test("every indicator's layer, and sub-metric, exists on the map", () => {
    const missing: string[] = [];
    for (const ind of config.indicators) {
      const layers = indicatorLayers(ind.id);
      if (!layers.length) missing.push(ind.id);
      for (const layer of layers) {
        expect(exists(layer.id)).toBe(true);
        if (layer.metric) expect(OVERLAYS.find((o) => o.id === layer.id)!.metrics!.some((m) => m.id === layer.metric)).toBe(true);
      }
    }
    console.log(`indicators with no map layer (${missing.length}): ${missing.join(", ")}`);
  });

  test("known indicators land on the right layer", () => {
    const ids = (id: string) => indicatorLayers(id).map((l) => l.id);
    expect(indicatorLayers("site_sfha_share")).toEqual([{ id: "flood-zones", metric: undefined }]);
    expect(ids("access_park")).toEqual(["parks"]);
    expect(ids("access_transit")).toEqual(["transit-stops"]);
    expect(ids("access_child_care")).toEqual(["places-child-care"]);
    expect(ids("access_health")).toEqual(["places-health-centers", "places-clinics", "places-hospitals"]);
    expect(indicatorLayers("climate_traffic_combustion")).toEqual([{ id: "air-quality", metric: "dslpm" }]);
    expect(indicatorLayers("demand_job_growth")).toEqual([{ id: "jobs", metric: "jobs_change_pct" }]);
    expect(ids("site_steep_slope_share")).toEqual(["city-steep-slopes"]);
  });

  test("zoning points show where this housing type is legal", () => {
    for (const id of ["t.two_unit", "legal", "alert.duplex"]) {
      expect(layersForFact(id, "two_unit").heat).toEqual({ id: "legal-pathway", metric: "two_unit" });
    }
    const legal = OVERLAYS.find((o) => o.id === "legal-pathway")!;
    for (const [id] of TYPOLOGIES) expect(legal.metrics!.some((m) => m.id === id)).toBe(true);
  });

  test("warnings and hazards map to hazard layers that exist", () => {
    expect(layersForFact("warning.site.1", "two_unit", "Site Feasibility warning: Over mapped mines.").stack).toEqual(["city-hazard-overlays"]);
    // Only the hazards actually on the lot.
    const text = "Hazards on the lot: 36% of the lot is at 25%+ slope; 100% of the lot is over mapped mines.";
    expect(layersForFact("hazards", "two_unit", text).stack).toEqual(["city-hazard-overlays", "city-steep-slopes"]);
    expect(layersForFact("hazards", "two_unit", "Hazards on the lot: No mapped floodway, floodplain, steep slope, landslide-prone area or undermining on this lot.").stack).toEqual([]);
    expect(layersForFact("hazards", "two_unit", "Hazards on the lot: 20% of the lot is in the 100-year floodplain.").stack).toEqual(["flood-zones"]);
    for (const [, id] of [[0, "city-hazard-overlays"], [0, "city-steep-slopes"], [0, "flood-zones"]] as const) expect(exists(id)).toBe(true);
    for (const p of config.pillars) expect(exists(`pillar-${p.id}`)).toBe(true);
  });

  test("the scenario map state keeps other layers' metric choices", () => {
    const state = scenarioOverlayState({ heatId: "x", infraIds: ["y"], metricByOverlay: { "air-quality": "pm25" } }, "multi_unit", { stack: ["parks"] });
    expect(state).toEqual({ heatId: "legal-pathway", infraIds: ["parks"], metricByOverlay: { "air-quality": "pm25", "legal-pathway": "multi_unit" } });
  });
});
