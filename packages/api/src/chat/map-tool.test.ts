import { describe, expect, test } from "bun:test";

import { chatContext } from "../routers/chat";
import { createChat } from "./engine";
import type { GeminiPart, GenerateFn, GenerateRequest } from "./gemini";
import { describeView, MAP_TOOL, mapTool, resolveMapCall } from "./map-tool";
import type { ChatContext } from "./types";

// A small catalog shaped like the explorer's (apps/web mapLayerCatalog).
const map: NonNullable<ChatContext["map"]> = {
  layers: [
    { id: "residential-zoning", label: "Zoning: residential density allowed", group: "heat", heat: true },
    {
      id: "air-quality",
      label: "Air quality",
      group: "heat",
      heat: true,
      metrics: [
        { id: "pm25", label: "PM2.5" },
        { id: "no2", label: "NO2" },
      ],
    },
    {
      id: "legal-pathway",
      label: "Legal pathway by housing type",
      group: "heat",
      heat: true,
      metrics: [
        { id: "single_detached", label: "House" },
        { id: "two_unit", label: "Duplex" },
      ],
    },
    { id: "flood-zones", label: "FEMA flood zones", group: "hazard", heat: false },
    { id: "transit-stops", label: "Transit stops", group: "infrastructure", heat: false },
    { id: "vacant-lots", label: "Vacant lots", group: "land", heat: false, minZoom: 14 },
  ],
  current: { heat: { id: "residential-zoning" }, stack: ["transit-stops"] },
  zoom: 12,
};

describe("resolveMapCall", () => {
  test("background with a metric, plus stacked layers added to what's on", () => {
    const r = resolveMapCall({ background: "legal-pathway", metric: "two_unit", show: ["flood-zones"] }, map);
    expect(r).toEqual({
      ok: true,
      view: { heat: { id: "legal-pathway", metric: "two_unit" }, stack: ["transit-stops", "flood-zones"] },
      text: "The map now shows Legal pathway by housing type (Duplex) as the colored background, plus Transit stops and FEMA flood zones.",
    });
  });

  test("only replaces the stacked layers; hide and none turn things off", () => {
    expect(resolveMapCall({ show: ["flood-zones"], only: true }, map)).toMatchObject({ view: { heat: { id: "residential-zoning" }, stack: ["flood-zones"] } });
    expect(resolveMapCall({ hide: ["transit-stops"] }, map)).toMatchObject({ view: { stack: [] } });
    expect(resolveMapCall({ background: "none" }, map)).toMatchObject({ view: { heat: null, stack: ["transit-stops"] } });
    expect(resolveMapCall({ hide: ["residential-zoning"] }, map)).toMatchObject({ view: { heat: null } });
  });

  test("metrics: by id or label, default to the first, keep the current one", () => {
    expect(resolveMapCall({ background: "air-quality", metric: "PM2.5" }, map)).toMatchObject({ view: { heat: { id: "air-quality", metric: "pm25" } } });
    expect(resolveMapCall({ background: "air-quality" }, map)).toMatchObject({ view: { heat: { id: "air-quality", metric: "pm25" } } });
    const onNo2 = { ...map, current: { heat: { id: "air-quality", metric: "no2" }, stack: [] } };
    expect(resolveMapCall({ show: ["flood-zones"] }, onNo2)).toMatchObject({ view: { heat: { id: "air-quality", metric: "no2" } } });
  });

  test("a background layer asked for in show becomes the background", () => {
    expect(resolveMapCall({ show: ["air-quality", "flood-zones"] }, map)).toMatchObject({
      view: { heat: { id: "air-quality", metric: "pm25" }, stack: ["transit-stops", "flood-zones"] },
    });
  });

  test("made-up layers and metrics are refused, with the reason", () => {
    const r = resolveMapCall({ show: ["crime-heatmap"] }, map);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("crime-heatmap");
    const m = resolveMapCall({ background: "air-quality", metric: "lead" }, map);
    expect(!m.ok && m.error).toContain("pm25, no2");
    expect(resolveMapCall({ background: "residential-zoning", metric: "x" }, map).ok).toBe(false);
  });

  test("the result says what each shown layer means, from its description", () => {
    const withDescriptions = {
      ...map,
      layers: map.layers.map((l) => (l.id === "flood-zones" ? { ...l, description: "FEMA mapped flood hazard zones (effective FIRMs)" } : l)),
    };
    const r = resolveMapCall({ show: ["flood-zones"], only: true }, withDescriptions);
    expect(r.ok && r.text).toEndWith("What these show: FEMA flood zones: FEMA mapped flood hazard zones (effective FIRMs).");
  });

  test("layers that only draw close up are called out", () => {
    const r = resolveMapCall({ show: ["vacant-lots"] }, map);
    expect(r.ok && r.text).toContain("Vacant lots appears only once the map is zoomed in closer.");
    expect(describeView({ heat: null, stack: ["vacant-lots"] }, { ...map, zoom: 15 })).not.toContain("zoomed in");
  });

  test("the tool lists every layer and only offers real ids", () => {
    const tool = mapTool(map);
    for (const l of map.layers) expect(tool.description).toContain(`${l.id}: ${l.label}`);
    const props = tool.parameters.properties as Record<string, { enum?: string[]; items?: { enum: string[] } }>;
    expect(props.background?.enum).toEqual(["residential-zoning", "air-quality", "legal-pathway", "none"]);
    expect(props.show?.items?.enum).toEqual(["flood-zones", "transit-stops", "vacant-lots"]);
  });

  test("the router accepts the map context", () => {
    expect(chatContext.safeParse({ subject: "x", facts: [], map }).success).toBe(true);
  });
});

function fakeModel(turns: GeminiPart[][]) {
  const calls: GenerateRequest[] = [];
  const generate: GenerateFn = async (req) => {
    calls.push(structuredClone(req));
    const next = turns.shift();
    if (!next) throw new Error("no more fake turns");
    return next;
  };
  return { generate, calls };
}

const context: ChatContext = { subject: "Pittsburgh map", facts: [], map };
const ask = (text: string) => ({ context, messages: [{ role: "user" as const, text }] });
const call = (args: Record<string, unknown>): GeminiPart[] => [{ functionCall: { name: MAP_TOOL, args } }];

describe("chat with the map tool", () => {
  test("changes the map and says what it shows", async () => {
    const { generate, calls } = fakeModel([
      call({ background: "legal-pathway", metric: "two_unit", show: ["flood-zones"] }),
      [{ text: "The map now colors where a duplex is allowed, with flood zones on top. [map.1]" }],
    ]);
    const res = await createChat({ generate })(ask("Show me where duplexes are allowed and flood risk"));
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.actions).toEqual([
      {
        type: "map",
        view: { heat: { id: "legal-pathway", metric: "two_unit" }, stack: ["transit-stops", "flood-zones"] },
        summary: "The map now shows Legal pathway by housing type (Duplex) as the colored background, plus Transit stops and FEMA flood zones.",
      },
    ]);
    expect(res.facts.map((f) => f.id)).toEqual(["map.1"]);
    // The tool is offered, and the prompt knows what the map shows now.
    expect(calls[0]?.tools?.map((t) => t.name)).toEqual([MAP_TOOL]);
    expect(calls[0]?.system).toContain("[map.now] The map currently shows Zoning: residential density allowed as the colored background, plus Transit stops.");
    expect(calls[0]?.system).toContain("show_map_layers tool");
  });

  test("a refused layer goes back to the model, which can correct itself", async () => {
    const { generate, calls } = fakeModel([
      call({ show: ["floods"] }),
      call({ show: ["flood-zones"] }),
      [{ text: "Flood zones are on now. [map.1]" }],
    ]);
    const res = await createChat({ generate })(ask("show floods"));
    const refusal = calls[1]?.contents.at(-1)?.parts[0];
    expect(refusal && "functionResponse" in refusal ? refusal.functionResponse.response.error : "").toContain("floods");
    expect(res.status === "ok" && res.actions?.[0]?.view.stack).toEqual(["transit-stops", "flood-zones"]);
  });

  test("two calls in one answer: the second builds on the first, and only the final view is applied", async () => {
    const { generate } = fakeModel([
      call({ show: ["flood-zones"] }),
      call({ hide: ["transit-stops"] }),
      [{ text: "Done. [map.2]" }],
    ]);
    const res = await createChat({ generate })(ask("flood zones, and turn off transit"));
    expect(res.status === "ok" && res.actions).toEqual([
      { type: "map", view: { heat: { id: "residential-zoning" }, stack: ["flood-zones"] }, summary: expect.any(String) },
    ]);
  });

  test("if the reply can't be verified, it still says what the map shows", async () => {
    const { generate } = fakeModel([
      call({ show: ["flood-zones"] }),
      [{ text: "About 12% of the city is in a flood zone. [map.1]" }],
      [{ text: "About 12% of the city is in a flood zone. [map.1]" }],
    ]);
    const res = await createChat({ generate })(ask("show flood zones"));
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.blocks).toEqual([{ type: "paragraph", text: expect.stringContaining("FEMA flood zones"), fact_ids: ["map.1"] }]);
    expect(res.actions?.[0]?.view.stack).toEqual(["transit-stops", "flood-zones"]);
  });

  test("no map, no tool", async () => {
    const { generate, calls } = fakeModel([[{ text: "Hi. [def.scale]" }]]);
    await createChat({ generate })({ context: { subject: "x", facts: [] }, messages: [{ role: "user", text: "hi" }] });
    expect(calls[0]?.tools).toBeUndefined();
    expect(calls[0]?.system).not.toContain("show_map_layers");
  });
});
