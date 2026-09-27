import { describe, expect, mock, test } from "bun:test";

import { overallScore } from "@HouseHack/api/chat/rescore";
import { chatContext } from "@HouseHack/api/routers/chat";

import config from "@/lib/pillars/pillars.config.json";
import { type PillarId, scoreMultiplier, scoreParcel } from "@/lib/pillars/score";
import type { PillarWeights } from "../map/pillar-weights-store";
import type { ParcelData } from "../map/pillars-panel";

// The panels import the API client, which needs the server env; these tests
// only use the pure scoring helpers, so stub it.
mock.module("@/utils/orpc", () => ({ orpc: {}, client: {} }));
const { generalChatContext, legalCodeFor, parcelChatContext, scenarioChatContext, typologyScore } = await import("./parcel-context");
const { notPermittedScore, PATHWAY_SCORE } = await import("../map/typology-panel");
const { legalLevelFor, SHORT_LABEL } = await import("../map/typology-meta");
const { DISTRICT_PATHWAYS } = await import("../map/overlays/legal-matrix.generated");
const { TYPOLOGIES: TILE_TYPES } = await import("../map/overlays/legal-feasibility");
const siteFit = await import("@HouseHack/api/typology/site-fit");
type FitState = import("./parcel-context").FitState;
type TypologyFit = import("./parcel-context").TypologyFit;

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

// The navbar store holds only the pillars the user changed ({} = defaults).
// A realistic parcels.typologyFit response for the demo lot, built with the
// API's own buildSiteState; Jev's ratings are stand-ins, including a poor fit
// and a low-confidence one so the verdict's fit-based reasons all fire.
function fakeFit(zoning: string): TypologyFit {
  const lot = { areaSf: 4463, widthFt: 45, depthFt: 103 };
  const zone = siteFit.parseZoning(zoning);
  const ratings: Record<string, [number, string, number]> = {
    detached: [0.9, "Comfortable fit", 0.6],
    attached: [0.7, "Fits with minor compromises", 0.5],
    duplex: [0.66, "Fits with minor compromises", 0.45],
    apartment: [0.2, "Fits only with major compromises", 0.4],
    elderly: [0.4, "Fits only with major compromises", 0.1],
  };
  // Everything else Jev now rates (three_unit, assisted living, personal
  // care, community home, multi-suite, interim housing) gets the same
  // stand-in rating; the tests don't assert on their specific values.
  const fallbackRating: [number, string, number] = [0.6, "Fits with minor compromises", 0.5];
  return {
    pin: PIN,
    lot,
    zoning: zone,
    facts: siteFit.buildSiteState(lot, zone, { steepSlope: 0.12 }),
    jev: { status: "ok", model: "jev-test" },
    typologies: siteFit.TYPOLOGIES.map((t) => {
      const [fit, label, confidence] = ratings[t.id] ?? fallbackRating;
      return {
        id: t.id,
        category: t.category,
        label: t.label,
        fit: { fit, label, probabilities: [], confidence, needsReview: confidence < 0.3 },
      };
    }),
  } as unknown as TypologyFit;
}

const CUSTOM: PillarWeights = { demand: 3, site: 1, afford: 2.5, access: 0, climate: 0.25 };
const PARTIAL: PillarWeights = { climate: 3 };

describe("parcelChatContext", () => {
  test("matches what the panels show", () => {
    const ctx = parcelChatContext(PIN, demo);
    const result = scoreParcel(demo.norm, { pillars: {} });
    const text = (id: string) => ctx.facts.find((f) => f.id === id)?.text ?? "";

    expect(text("overall")).toContain(`${Math.round(result.overall!)} of 100`);
    expect(text("pillar.demand")).toContain(`${Math.round(result.pillars.demand.score!)} of 100`);
    expect(text("parcel")).toContain(demo.zoning);
    // R1D-H: single-unit by right, duplex not permitted (the typology tiles show 100 and 0).
    expect(text("t.single_detached")).toContain("By right");
    expect(text("t.single_detached")).toContain("100 of 100");
    expect(text("t.two_unit")).toContain("Not permitted");
    // Not-permitted tiles show a rezoning-based score, not 0.
    expect(text("t.two_unit")).toContain(`Typology tile score ${notPermittedScore(demo.zoning, "two_unit")} of 100`);
    expect(text("overall")).toContain("equal weights");
    expect(ctx.suggestions![0]).toBe(`Why is the overall score ${Math.round(result.overall!)}?`);
    expect(ctx.facts.map((f) => f.text).join(" ")).not.toContain("[object Object]");
  });

  test("one changed slider keeps the other pillars at their defaults", () => {
    const ctx = parcelChatContext(PIN, demo, PARTIAL);
    const result = scoreParcel(demo.norm, { pillars: PARTIAL });
    expect(ctx.facts.find((f) => f.id === "overall")!.text).toContain(`${Math.round(result.overall!)} of 100`);
    expect(ctx.scoring!.parts.map((p) => p.weight)).toEqual(config.pillars.map((p) => (p.id === "climate" ? 3 : p.weight)));
  });

  test("uses the user's priorities, like the scores panel", () => {
    const ctx = parcelChatContext(PIN, demo, CUSTOM);
    const result = scoreParcel(demo.norm, { pillars: CUSTOM });
    const overall = ctx.facts.find((f) => f.id === "overall")!.text;
    expect(overall).toContain(`${Math.round(result.overall!)} of 100`);
    expect(overall).toContain("the user's priorities");
    expect(ctx.scoring!.parts.map((p) => p.weight)).toEqual(config.pillars.map((p) => CUSTOM[p.id as PillarId]));
  });

  test("covers every typology tile with the tile's own name and score", () => {
    const ctx = parcelChatContext(PIN, demo);
    for (const f of ctx.facts) expect(f.text.endsWith("…")).toBe(false);
    for (const [id] of TILE_TYPES) {
      const pathway = DISTRICT_PATHWAYS[demo.zoning]![id]!;
      const score = pathway === "not_permitted" ? notPermittedScore(demo.zoning, id) : PATHWAY_SCORE[pathway];
      const text = ctx.facts.find((f) => f.id === `t.${id}`)?.text ?? "";
      expect(text.startsWith(`${SHORT_LABEL[id]}:`)).toBe(true);
      if (score != null) expect(text).toContain(`Typology tile score ${score} of 100`);
    }
  });

  test("explains Jev's site-fit bars, the lot and the typology verdicts the bottom panel shows", () => {
    const fit = fakeFit(demo.zoning);
    const ctx = parcelChatContext(PIN, demo, {}, { status: "ready", data: fit });
    const text = (id: string) => ctx.facts.find((f) => f.id === id)?.text ?? "";
    expect(text("fit.two_unit")).toContain("Jev site fit: Fits with minor compromises, fit bar at 66%, 45% confidence.");
    expect(text("fit.elderly_limited")).toContain("10% confidence, flagged for human review");
    // Tone comes from each fact's own score: legality and physical fit are judged separately.
    const tone = (id: string) => ctx.facts.find((f) => f.id === id)?.tone;
    expect(tone("t.single_detached")).toBe("good");
    expect(tone("t.two_unit")).toBe("bad");
    expect(tone("fit.single_detached")).toBe("good");
    expect(tone("fit.two_unit")).toBeUndefined();
    expect(tone("fit.multi_unit")).toBe("bad");
    expect(tone("hazards")).toBe("bad");
    expect(text("lot")).toContain("Lot area 4,463 sq ft");
    expect(text("hazards")).toContain("12% of the lot is at 25%+ slope");
    expect(text("jev")).toContain("jev-test");
    // The bottom panel's own verdict + pencil check, computed once and cited by
    // the chat -- not the old, now-removed per-alert facts.
    for (const id of config.legal.typologies) {
      const verdictText = text(`verdict.${id}`);
      expect(verdictText).toContain(`Can a ${SHORT_LABEL[id] ?? id} be built here?`);
      expect(verdictText).toMatch(/RED|YELLOW|GREEN|UNKNOWN/);
    }
    // A pillar's warnings are separate, and always count against building.
    for (const f of ctx.facts.filter((f) => f.id.startsWith("warning."))) expect(f.tone).toBe("bad");
  });

  test("says when site-fit ratings are loading or unavailable", () => {
    const loading = parcelChatContext(PIN, demo);
    expect(loading.facts.find((f) => f.id === "jev")!.text).toContain("still loading");
    const failed = parcelChatContext(PIN, demo, {}, { status: "error" });
    expect(failed.facts.find((f) => f.id === "jev")!.text).toContain("couldn't be loaded");
  });

  test("rezoning what-ifs are scored with scoreParcel", () => {
    const ctx = parcelChatContext(PIN, demo);
    const rezones = ctx.facts.filter((f) => f.id.startsWith("whatif.rezone."));
    expect(rezones.length).toBeGreaterThan(0);
    for (const f of rezones) {
      const district = f.id.replace("whatif.rezone.", "").toUpperCase();
      const alt = scoreParcel({ ...demo.norm, site_legal_pathway: legalCodeFor(district) }, { pillars: {} });
      const now = Math.round(scoreParcel(demo.norm).overall!);
      const next = Math.round(alt.overall!);
      expect(f.text).toContain(next === now ? `overall score would stay ${now}` : `overall score would be ${next} instead of ${now}`);
    }
  });

  test("the no-parcel chat explains how Yinzone works, with no mock parcel", () => {
    const ctx = generalChatContext();
    expect(chatContext.safeParse(ctx).success).toBe(true);
    expect(ctx.facts.some((f) => f.id === "parcel")).toBe(false);
    expect(ctx.facts.find((f) => f.id === "def.tiles")!.text).toContain("by right 100");
    for (const f of ctx.facts) expect(f.text.endsWith("…")).toBe(false);
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
  const whatIfs: Record<string, number>[] = [{}, { climate: 2 }, { demand: 0 }, { access: 3, afford: 0.5 }];

  test(
    "what-if rescoring equals scoreParcel, and contexts validate",
    async () => {
      let parcels = 0;
      let multiplied = 0;
      let imputed = 0;
      for (const key of keys) {
        for (const [pin, row] of Object.entries(await shard(key))) {
          const data = toData(row);
          // The rezoning math must reproduce the build script's zoning code.
          const stored = data.norm.site_legal_pathway;
          const computed = legalCodeFor(data.zoning);
          if (stored === 4 || stored === 5) expect(computed).toBeNull();
          else if (stored != null && DISTRICT_PATHWAYS[data.zoning]) expect(computed).toBe(stored);
          for (const weights of [{}, PARTIAL, CUSTOM]) {
            const fit: FitState = weights === PARTIAL ? { status: "ready", data: fakeFit(data.zoning) } : { status: "loading" };
            const ctx = parcelChatContext(pin, data, weights, fit);
            const parsed = chatContext.safeParse(ctx);
            if (!parsed.success) throw new Error(`${pin}: ${parsed.error.message}`);
            const clipped = ctx.facts.find((f) => f.text.endsWith("…"));
            if (clipped) throw new Error(`${pin}: ${clipped.id} was cut off at 600 characters`);
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

  test(
    "with one housing type picked in the Parcel Score panel, the chat scores it the way the panel does",
    async () => {
      let parcels = 0;
      let differs = 0;
      for (const key of keys) {
        for (const [pin, row] of Object.entries(await shard(key))) {
          const data = toData(row);
          for (const type of config.legal.typologies) {
            // The panel's own overrides (pillars-panel.tsx), built independently here.
            const panel = { pillars: {}, legalLevel: legalLevelFor(data.zoning, type, data.norm.site_legal_pathway) };
            const expected = scoreParcel(data.norm, panel);
            const ctx = parcelChatContext(pin, data, {}, { status: "loading" }, undefined, type);
            const parsed = chatContext.safeParse(ctx);
            if (!parsed.success) throw new Error(`${pin} ${type}: ${parsed.error.message}`);
            const clipped = ctx.facts.find((f) => f.text.endsWith("…"));
            if (clipped) throw new Error(`${pin} ${type}: ${clipped.id} was cut off at 600 characters`);
            const overallFact = ctx.facts.find((f) => f.id === "overall")!.text;
            if (expected.overall != null) {
              expect(overallFact).toContain(`for a ${SHORT_LABEL[type]}`);
              expect(overallFact).toContain(`${Math.round(expected.overall)} of 100`);
            }
            if (expected.legal) expect(ctx.facts.find((f) => f.id === "legal")!.text).toContain(expected.legal.label);
            for (const change of whatIfs) {
              const want = scoreParcel(data.norm, { ...panel, pillars: change }).overall;
              const got = overallScore(ctx.scoring!, change);
              if (want == null) expect(got).toBeNull();
              else expect(got).toBeCloseTo(want, 9);
            }
            if (expected.overall !== scoreParcel(data.norm).overall) differs++;
          }
          parcels++;
        }
      }
      expect(differs).toBeGreaterThan(0);
      console.log(`checked ${parcels} parcels x ${config.legal.typologies.length} types (${differs} where the type changes the score)`);
    },
    300_000,
  );
});

describe("scenario facts for one housing type", () => {
  const base = parcelChatContext(PIN, demo, {}, { status: "ready", data: fakeFit(demo.zoning) });

  test("a mainstream type is scored with its own zoning factor, as the pillars panel does", () => {
    for (const id of config.legal.typologies) {
      const own = typologyScore(demo, {}, id)!;
      const panel = scoreParcel(demo.norm, { pillars: {}, legalLevel: legalLevelFor(demo.zoning, id, demo.norm.site_legal_pathway) });
      expect(own.overall).toBe(panel.overall);
      const ctx = scenarioChatContext(base, demo, {}, id);
      const fact = ctx.facts.find((f) => f.id === `overall.${id}`)!;
      expect(fact.text).toContain(`${Math.round(own.overall!)} of 100`);
      expect(fact.text).toContain(`zoning factor of ${own.legal!.multiplier}`);
      // The easiest-type overall, zoning line and what-ifs are gone; everything else stays.
      expect(ctx.facts.some((f) => f.id === "overall" || f.id === "legal" || f.id.startsWith("whatif."))).toBe(false);
      expect(ctx.facts.length).toBe(base.facts.filter((f) => f.id !== "overall" && f.id !== "legal" && !f.id.startsWith("whatif.")).length + 1);
      expect(fact.text.endsWith("…")).toBe(false);
    }
  });

  test("demo parcel: a duplex isn't permitted, so its overall is far below the easiest type's", () => {
    const duplex = scenarioChatContext(base, demo, {}, "two_unit").facts.find((f) => f.id === "overall.two_unit")!;
    console.log(duplex.text);
    expect(duplex.text).toContain("zoning factor of 0.2");
    expect(duplex.tone).toBe("bad");
    expect(typologyScore(demo, {}, "two_unit")!.overall!).toBeLessThan(scoreParcel(demo.norm).overall! / 2);
    // A house is by right here, the same as the easiest type.
    expect(typologyScore(demo, {}, "single_detached")!.overall).toBe(scoreParcel(demo.norm).overall);
  });

  test("types outside the overall score keep the parcel's facts", () => {
    const other = TILE_TYPES.map(([id]) => id).find((id) => !config.legal.typologies.includes(id))!;
    expect(typologyScore(demo, {}, other)).toBeNull();
    expect(scenarioChatContext(base, demo, {}, other)).toBe(base);
  });
});

test("demo parcel with Duplex picked: overall 10, and the rezoning suggestion allows a duplex", () => {
  const ctx = parcelChatContext(PIN, demo, {}, { status: "loading" }, undefined, "two_unit");
  expect(ctx.facts.find((f) => f.id === "overall")!.text).toContain("for a Duplex");
  expect(ctx.suggestions![0]).toBe("Why is the overall score 10?");
  expect(ctx.suggestions![2]).toBe("What if this were rezoned to R2-H?");
  expect(ctx.facts.find((f) => f.id === "whatif.rezone.r2-h")!.text).toContain("would be 50 instead of 10");
  // The default is unchanged.
  expect(parcelChatContext(PIN, demo, {}, { status: "loading" }).suggestions![0]).toBe("Why is the overall score 50?");
});
