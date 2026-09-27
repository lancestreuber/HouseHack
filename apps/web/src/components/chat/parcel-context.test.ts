import { describe, expect, mock, test } from "bun:test";

import { overallScore } from "@HouseHack/api/chat/rescore";
import { chatContext } from "@HouseHack/api/routers/chat";

import config from "@/lib/pillars/pillars.config.json";
import { type PillarId, scoreMultiplier, scoreParcel } from "@/lib/pillars/score";
import { DEFAULT_WEIGHTS, type PillarWeights } from "@/lib/pillars/weights";

import type { ParcelData } from "../map/pillars-panel";

// The panels import the API client, which needs the server env; these tests
// only use the pure scoring helpers, so stub it.
mock.module("@/utils/orpc", () => ({ orpc: {}, client: {} }));
const { parcelChatContext } = await import("./parcel-context");

// Real data, read the way useParcelData reads it.
const DATA = "public/data/pillars/parcels";
type Row = [string, (number | null)[], (number | null)[]];
const index = (await Bun.file(`${DATA}/index.json`).json()) as {
  indicators: string[];
  shards: string[];
  quantiles?: Record<string, number[]>;
};

function toData([zoning, normRow, rawRow]: Row): ParcelData {
  const norm: ParcelData["norm"] = {};
  const raw: ParcelData["raw"] = {};
  index.indicators.forEach((id, i) => {
    norm[id] = normRow[i] ?? null;
    raw[id] = rawRow[i] ?? null;
  });
  return { zoning, norm, raw, quantiles: index.quantiles };
}

async function shard(key: string) {
  return (await Bun.file(`${DATA}/${key}.json`).json()) as Record<string, Row>;
}

// The explorer's demo parcel (R1D-H).
const PIN = "0001N00154000000";
const demo = toData((await shard("0001"))[PIN]!);

const CUSTOM: PillarWeights = { demand: 5, site: 1, afford: 3, access: 0, climate: 2 };

describe("parcelChatContext", () => {
  test("matches what the panels show", () => {
    const ctx = parcelChatContext(PIN, demo);
    const result = scoreParcel(demo.norm, { pillars: DEFAULT_WEIGHTS });
    const text = (id: string) => ctx.facts.find((f) => f.id === id)?.text ?? "";

    expect(text("overall")).toContain(`${Math.round(result.overall!)} of 100`);
    expect(text("pillar.demand")).toContain(`${Math.round(result.pillars.demand.score!)} of 100`);
    expect(text("parcel")).toContain(demo.zoning);
    // R1D-H: single-unit by right, duplex not permitted (the typology tiles show 100 and 0).
    expect(text("t.single_detached")).toContain("By right");
    expect(text("t.single_detached")).toContain("100 of 100");
    expect(text("t.two_unit")).toContain("Not permitted");
    expect(ctx.suggestions![0]).toBe(`Why is the overall score ${Math.round(result.overall!)}?`);
    expect(ctx.facts.map((f) => f.text).join(" ")).not.toContain("[object Object]");
  });

  test("uses the user's priorities, like the scores panel", () => {
    const ctx = parcelChatContext(PIN, demo, CUSTOM);
    const result = scoreParcel(demo.norm, { pillars: CUSTOM });
    const overall = ctx.facts.find((f) => f.id === "overall")!.text;
    expect(overall).toContain(`${Math.round(result.overall!)} of 100`);
    expect(overall).toContain("the user's priorities");
    expect(ctx.scoring!.parts.map((p) => p.weight)).toEqual(config.pillars.map((p) => CUSTOM[p.id as PillarId]));
  });

  test("a parcel without scores says so instead of guessing", () => {
    const ctx = parcelChatContext("9999X00000000000", null);
    expect(ctx.facts).toHaveLength(1);
    expect(ctx.facts[0]!.text).toContain("City of Pittsburgh parcels only");
    expect(ctx.scoring).toBeUndefined();
  });
});

// Every parcel in a spread of real shards: the chat's what-if math must equal
// scoreParcel exactly (zoning/site multipliers and missing-pillar imputation
// included), and every context must pass the server's validation.
describe("across real parcels", () => {
  const keys = index.shards.filter((_, i) => i % 10 === 0);
  const whatIfs: Record<string, number>[] = [{}, { climate: 2 }, { demand: 0 }, { access: 5, afford: 0.5 }];

  test(
    "what-if rescoring equals scoreParcel, and contexts validate",
    async () => {
      let parcels = 0;
      let multiplied = 0;
      let imputed = 0;
      for (const key of keys) {
        for (const [pin, row] of Object.entries(await shard(key))) {
          const data = toData(row);
          for (const weights of [DEFAULT_WEIGHTS, CUSTOM]) {
            const ctx = parcelChatContext(pin, data, weights);
            const parsed = chatContext.safeParse(ctx);
            if (!parsed.success) throw new Error(`${pin}: ${parsed.error.message}`);
            for (const change of whatIfs) {
              const expected = scoreParcel(data.norm, { pillars: { ...weights, ...change } }).overall;
              const actual = overallScore(ctx.scoring!, change);
              if (expected == null) expect(actual).toBeNull();
              else expect(actual).toBeCloseTo(expected, 9);
            }
          }
          const result = scoreParcel(data.norm);
          if (scoreMultiplier(result) < 1) multiplied++;
          if (Object.values(result.pillars).some((p) => p.score == null)) imputed++;
          parcels++;
        }
      }
      // Make sure the tricky cases were actually exercised.
      expect(parcels).toBeGreaterThan(1000);
      expect(multiplied).toBeGreaterThan(0);
      expect(imputed).toBeGreaterThan(0);
      console.log(`checked ${parcels} parcels (${multiplied} with zoning/site factors, ${imputed} with a missing pillar)`);
    },
    120_000,
  );
});
