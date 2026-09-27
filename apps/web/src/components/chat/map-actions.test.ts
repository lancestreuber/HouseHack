import { describe, expect, test } from "bun:test";

import { resolveMapCall } from "@HouseHack/api/chat/map-tool";
import { chatContext } from "@HouseHack/api/routers/chat";

import { INITIAL_OVERLAY_STATE } from "../map/overlay-controller";
import { OVERLAYS } from "../map/overlays";
import { applyMapView, MAP_LAYER_CATALOG, mapChatInfo, registerMapController, stateFromView, viewFromState } from "./map-actions";

describe("map layer catalog", () => {
  test("lists every overlay once and passes the chat API's checks", () => {
    expect(MAP_LAYER_CATALOG.map((l) => l.id)).toEqual(OVERLAYS.map((o) => o.id));
    expect(new Set(MAP_LAYER_CATALOG.map((l) => l.id)).size).toBe(MAP_LAYER_CATALOG.length);
    const info = mapChatInfo(INITIAL_OVERLAY_STATE, 12.7);
    expect(info.zoom).toBe(12);
    expect(chatContext.safeParse({ subject: "x", facts: [], map: info }).success).toBe(true);
    console.log(`${MAP_LAYER_CATALOG.length} layers, ${JSON.stringify(info).length} characters of context`);
  });

  test("heat and pillar layers are the one-at-a-time backgrounds, as in the layers panel", () => {
    for (const l of MAP_LAYER_CATALOG) expect(l.heat).toBe(l.group === "heat" || l.group === "pillar");
  });

  test("layers that only draw close up carry their zoom; ones with a zoomed-out view don't", () => {
    const zoomOf = (id: string) => MAP_LAYER_CATALOG.find((l) => l.id === id)?.minZoom;
    expect(zoomOf("tax-delinquent")).toBe(14);
    expect(zoomOf("slope")).toBe(11);
    // Transit stops and lead lines show as a heat blur when zoomed out.
    expect(zoomOf("transit-stops")).toBeUndefined();
    expect(zoomOf("lead-service-lines")).toBeUndefined();
    expect(zoomOf("pillar-overall")).toBeUndefined();
  });

  test("every background and metric in the catalog can be shown", () => {
    const map = mapChatInfo(INITIAL_OVERLAY_STATE, 12);
    for (const l of MAP_LAYER_CATALOG) {
      if (l.heat) {
        for (const m of l.metrics ?? [undefined]) {
          const r = resolveMapCall({ background: l.id, ...(m ? { metric: m.id } : {}) }, map);
          expect(r.ok && r.view.heat).toEqual({ id: l.id, ...(m ? { metric: m.id } : l.metrics ? { metric: l.metrics[0]!.id } : {}) });
        }
      } else {
        const r = resolveMapCall({ show: [l.id], only: true }, map);
        expect(r.ok && r.view.stack).toEqual([l.id]);
      }
    }
  });
});

describe("applying a map view", () => {
  test("converts to the map's own state, keeping other layers' metric choices", () => {
    const base = { heatId: "air-quality", infraIds: ["parks"], metricByOverlay: { "air-quality": "no2", jobs: "jobs_change_pct" } };
    expect(viewFromState(base)).toEqual({ heat: { id: "air-quality", metric: "no2" }, stack: ["parks"] });
    expect(stateFromView({ heat: { id: "legal-pathway", metric: "two_unit" }, stack: ["flood-zones"] }, base)).toEqual({
      heatId: "legal-pathway",
      infraIds: ["flood-zones"],
      metricByOverlay: { "air-quality": "no2", jobs: "jobs_change_pct", "legal-pathway": "two_unit" },
    });
    expect(stateFromView(viewFromState(base), base)).toEqual(base);
  });

  test("applies to the registered map and returns the old view for Undo", () => {
    expect(applyMapView({ heat: null, stack: [] })).toBeNull();
    let state = { heatId: "residential-zoning", infraIds: [] as string[], metricByOverlay: {} as Record<string, string> };
    const unregister = registerMapController({ get: () => state, set: (next) => (state = next) });
    const before = applyMapView({ heat: { id: "legal-pathway", metric: "two_unit" }, stack: ["flood-zones"] });
    expect(state).toEqual({ heatId: "legal-pathway", infraIds: ["flood-zones"], metricByOverlay: { "legal-pathway": "two_unit" } });
    expect(before).toEqual({ heat: { id: "residential-zoning" }, stack: [] });
    applyMapView(before!);
    expect(state.heatId).toBe("residential-zoning");
    expect(state.infraIds).toEqual([]);
    unregister();
    expect(applyMapView({ heat: null, stack: [] })).toBeNull();
  });
});
