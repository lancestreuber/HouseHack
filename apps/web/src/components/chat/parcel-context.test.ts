import { describe, expect, test } from "bun:test";

import { scoreParcel } from "@/lib/pillars/score";

import type { ParcelData } from "../map/pillars-panel";
import { parcelChatContext } from "./parcel-context";

// The explorer's demo parcel, read from the real shard the panels load.
const PIN = "0001N00154000000";
const DATA = "public/data/pillars/parcels";

async function load(pin: string): Promise<ParcelData> {
  const index = (await Bun.file(`${DATA}/index.json`).json()) as { indicators: string[] };
  const shard = (await Bun.file(`${DATA}/${pin.slice(0, 4)}.json`).json()) as Record<string, [string, (number | null)[], (number | null)[]]>;
  const [zoning, normRow, rawRow] = shard[pin]!;
  const norm: ParcelData["norm"] = {};
  const raw: ParcelData["raw"] = {};
  index.indicators.forEach((id, i) => {
    norm[id] = normRow[i] ?? null;
    raw[id] = rawRow[i] ?? null;
  });
  return { zoning, norm, raw };
}

describe("parcelChatContext", () => {
  test("stays within the chat API's limits", async () => {
    const ctx = parcelChatContext(PIN, await load(PIN));
    expect(ctx.facts.length).toBeLessThanOrEqual(300);
    expect(new Set(ctx.facts.map((f) => f.id)).size).toBe(ctx.facts.length);
    for (const f of ctx.facts) {
      expect(f.id).toMatch(/^[a-z0-9_.:-]{1,80}$/i);
      expect(f.text.length).toBeLessThanOrEqual(600);
      expect(f.source.length).toBeLessThanOrEqual(200);
    }
    expect(ctx.suggestions!.length).toBeLessThanOrEqual(6);
    expect(ctx.scoring!.parts.length).toBe(5);
  });

  test("matches what the panels show", async () => {
    const data = await load(PIN);
    const ctx = parcelChatContext(PIN, data);
    const result = scoreParcel(data.norm);
    const text = (id: string) => ctx.facts.find((f) => f.id === id)?.text ?? "";

    expect(text("overall")).toContain(`${Math.round(result.overall!)} of 100`);
    expect(text("pillar.demand")).toContain(`${Math.round(result.pillars.demand.score!)} of 100`);
    expect(text("parcel")).toContain(data.zoning);
    // R1D-H: single-unit by right, duplex not permitted (the typology tiles show 100 and 0).
    expect(text("t.single_detached")).toContain("By right");
    expect(text("t.single_detached")).toContain("100 of 100");
    expect(text("t.two_unit")).toContain("Not permitted");
    expect(ctx.suggestions![0]).toBe(`Why is the overall score ${Math.round(result.overall!)}?`);
  });

  test("a parcel without scores says so instead of guessing", () => {
    const ctx = parcelChatContext("9999X00000000000", null);
    expect(ctx.facts).toHaveLength(1);
    expect(ctx.facts[0]!.text).toContain("City of Pittsburgh parcels only");
    expect(ctx.scoring).toBeUndefined();
  });
});
