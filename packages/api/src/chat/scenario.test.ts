import { describe, expect, test } from "bun:test";

import type { GenerateFn, GenerateRequest } from "./gemini";
import { createScenario, impactPoint, MAX_POINTS, parseChecks, scenarioPrompt, splitSections } from "./scenario";
import type { ChatContext } from "./types";

const fact = (id: string, text: string, tone?: "good" | "bad") => ({ id, text, source: "test", source_url: "", as_of: "2026-09-27", kind: "observed" as const, tone });

const context: ChatContext = {
  subject: "Parcel 0001N00154000000",
  facts: [
    fact("t.two_unit", "Duplex: Not permitted (variance or rezoning only). Typology tile score 10 of 100.", "bad"),
    fact("lot", "Lot: Lot area 4,463 sq ft. Zoned R1D-H."),
    fact("hazards", "Hazards on the lot: 36% of the lot is at 25%+ slope."),
    fact("pillar.access", "Access to Opportunity pillar: 78 of 100."),
    ...Array.from({ length: 7 }, (_, i) => fact(`i.a${i + 1}`, `Access indicator ${i + 1}.`)),
  ],
};
const input = { context, typology: { id: "two_unit", name: "Duplex" }, focus: ["t.two_unit"] };

const isCheck = (req: GenerateRequest) => req.system.startsWith("You check claims");

/** A fake model: writing calls get `replies` in order; checking calls get `check` (default: an unreadable reply, so the writer's sides stand). */
function fake(...replies: string[]): { generate: GenerateFn; calls: GenerateRequest[]; checks: GenerateRequest[]; check: (text: string | Error) => void } {
  const calls: GenerateRequest[] = [];
  const checks: GenerateRequest[] = [];
  let check: string | Error = "";
  return {
    calls,
    checks,
    check: (text) => (check = text),
    generate: async (req) => {
      if (isCheck(req)) {
        checks.push(req);
        if (check instanceof Error) throw check;
        return [{ text: check || "Looks fine." }];
      }
      calls.push(req);
      return [{ text: replies[Math.min(calls.length - 1, replies.length - 1)]! }];
    },
  };
}

describe("parseChecks", () => {
  test("reads numbered answers; unanswered points count as unsupported", () => {
    expect(parseChecks("1: pro\n2. NO\n3) Con\n4: repeat", 5)).toEqual(["pro", "no", "con", "repeat", "no"]);
    expect(parseChecks("All good.", 2)).toBeNull();
  });
});

describe("splitSections", () => {
  test("accepts the heading styles models actually write", () => {
    for (const [pro, con] of [["PROS:", "CONS:"], ["**Pros:**", "**Cons:**"], ["## Pros", "## Cons"], ["Pro:", "Con:"]]) {
      const { pros, cons } = splitSections(`${pro}\n- a [x]\n${con}\n- b [y]`);
      expect(pros.trim()).toBe("- a [x]");
      expect(cons.trim()).toBe("- b [y]");
    }
  });
});

describe("splitSections with helps and harms", () => {
  test("reads the HELPS and HARMS sections", () => {
    const { pros, cons, helps, harms } = splitSections("PROS:\n- a [x]\nCONS:\n- b [y]\nHELPS:\n- c [z]\n**Harms:**\n- d [w]");
    expect([pros.trim(), cons.trim(), helps.trim(), harms.trim()]).toEqual(["- a [x]", "- b [y]", "- c [z]", "- d [w]"]);
  });
});

describe("impactPoint", () => {
  test("turns a helps/harms fact into a group-first point", () => {
    const f = { ...fact("helps.two_unit.lowinc_renters", "Who a Duplex here helps: low-income renters. 74.4% of low-income renters here pay 30%+ of income on housing."), numbers: [] };
    expect(impactPoint(f)).toEqual({ type: "bullet", text: "Low-income renters: 74.4% of low-income renters here pay 30%+ of income on housing.", fact_ids: [f.id] });
  });
});

describe("scenario helps and harms", () => {
  const impactContext: ChatContext = {
    ...context,
    facts: [
      ...context.facts,
      fact("helps.two_unit.lowinc_renters", "Who a Duplex here helps: low-income renters. 74.4% of low-income renters here pay 30%+ of income on housing."),
      fact("harms.two_unit.current_occupants", "Who a Duplex here may harm: current occupants. The lot has an existing occupied building."),
      fact("harms.two_unit.nearby_renters", "Who a Duplex here may harm: nearby renters. Rents rose 31.0% in 5 years."),
    ],
  };
  const impactInput = { ...input, context: impactContext };

  test("keeps the model's cited groups and fills in the ones it left out", async () => {
    const model = fake(
      "PROS:\n- Access scores 78 of 100 [pillar.access].\nCONS:\n- Not permitted [t.two_unit].\nHELPS:\n- Low-income renters: 74.4% pay 30%+ of income on housing [helps.two_unit.lowinc_renters].\n- Everyone, it's great [pillar.access].\nHARMS:\n- Nearby renters: rents rose 31.0% in 5 years [harms.two_unit.nearby_renters].",
    );
    const result = await createScenario(model)(impactInput);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.helps.map((p) => p.text)).toEqual(["Low-income renters: 74.4% pay 30%+ of income on housing."]);
    expect(result.harms.map((p) => p.fact_ids)).toEqual([["harms.two_unit.nearby_renters"], ["harms.two_unit.current_occupants"]]);
    expect(result.harms[1]!.text).toBe("Current occupants: The lot has an existing occupied building.");
    expect(result.facts.map((f) => f.id)).toContain("harms.two_unit.current_occupants");
  });

  test("lists every group from the facts when the model writes no HELPS or HARMS", async () => {
    const model = fake("PROS:\n- Access scores 78 of 100 [pillar.access].\nCONS:\n- Not permitted [t.two_unit].");
    const result = await createScenario(model)(impactInput);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.helps).toHaveLength(1);
    expect(result.harms).toHaveLength(2);
  });

  test("the prompt asks for HELPS and HARMS by group", () => {
    const prompt = scenarioPrompt([], impactInput);
    expect(prompt).toContain("HELPS:");
    expect(prompt).toContain("HARMS:");
    expect(prompt).toContain("[helps.two_unit.");
  });
});

describe("scenario", () => {
  test("returns cited pros and cons with their facts", async () => {
    const { generate } = fake(
      "PROS:\n- Access to opportunity scores 78 of 100 [pillar.access].\nCONS:\n- A duplex is not permitted here, tile score 10 of 100 [t.two_unit].\n- 36% of the lot is at 25%+ slope [hazards].",
    );
    const result = await createScenario({ generate })(input);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros.map((p) => p.text)).toEqual(["Access to opportunity scores 78 of 100."]);
    expect(result.cons.map((p) => p.fact_ids)).toEqual([["t.two_unit"], ["hazards"]]);
    expect(result.facts.map((f) => f.id).sort()).toEqual(["hazards", "pillar.access", "t.two_unit"]);
  });

  test("drops uncited points, duplicates and anything past five", async () => {
    const many = Array.from({ length: 7 }, (_, i) => `- Point ${i + 1} about access [i.a${i + 1}].`).join("\n");
    const { generate } = fake(`PROS:\n- A point with no source.\n${many}\n- Point 1 about access [i.a1].\nCONS:\n- Steep [hazards].\n- Steep [hazards].`);
    const result = await createScenario({ generate })(input);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros).toHaveLength(MAX_POINTS);
    expect(result.pros[0]!.text).toBe("Point 1 about access.");
    expect(result.cons).toHaveLength(1);
  });

  test("asks once for a rewrite when a number isn't in the facts", async () => {
    const { generate, calls } = fake(
      "PROS:\n- Access scores 91 of 100 [pillar.access].\nCONS:\n- Not permitted [t.two_unit].",
      "PROS:\n- Access scores 78 of 100 [pillar.access].\nCONS:\n- Not permitted [t.two_unit].",
    );
    const result = await createScenario({ generate })(input);
    expect(calls).toHaveLength(2);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros[0]!.text).toBe("Access scores 78 of 100.");
  });

  test("still drops an unverified number if the rewrite keeps it", async () => {
    const { generate } = fake("PROS:\n- Access scores 91 of 100 [pillar.access].\nCONS:\n- Not permitted [t.two_unit].");
    const result = await createScenario({ generate })(input);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros).toHaveLength(0);
    expect(result.cons).toHaveLength(1);
  });

  test("the checking pass drops points their facts don't support", async () => {
    const model = fake("PROS:\n- Access scores 78 of 100 [pillar.access].\n- Demand is booming [pillar.access].\nCONS:\n- Not permitted [t.two_unit].");
    model.check("1: pro\n2: no\n3: con");
    const result = await createScenario(model)(input);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros.map((p) => p.text)).toEqual(["Access scores 78 of 100."]);
    expect(result.cons).toHaveLength(1);
    // The checker only sees each point's own cited facts.
    expect(model.checks[0]!.system).toContain("fact: Access to Opportunity pillar: 78 of 100.");
    expect(model.checks[0]!.system).not.toContain("Lot area");
  });

  test("the data's tone decides pro or con, whatever the writer said", async () => {
    // "Not permitted" written as a pro; its fact is marked bad, so it's a con.
    const model = fake("PROS:\n- A duplex is not permitted here [t.two_unit].\n- Access scores 78 of 100 [pillar.access].\nCONS:\n- Duplexes aren't allowed on this lot [t.two_unit].");
    model.check("1: pro\n2: pro\n3: con");
    const result = await createScenario(model)(input);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros.map((p) => p.text)).toEqual(["Access scores 78 of 100."]);
    // The second point citing exactly the same fact is a repeat.
    expect(result.cons.map((p) => p.text)).toEqual(["A duplex is not permitted here."]);
    // The checker isn't told which side the writer chose.
    expect(model.checks[0]!.system).not.toContain("PROS");
  });

  test("without a tone, writer and checker must agree on the side", async () => {
    // The second reply answers the retry for the now-empty cons side with nothing.
    const model = fake("PROS:\n- 36% of the lot is at 25%+ slope [hazards].\n- Access scores 78 of 100 [pillar.access].\nCONS:\n- Lot area 4,463 sq ft [lot].", "CONS:");
    model.check("1: con\n2: pro\n3: repeat");
    const result = await createScenario(model)(input);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(result.pros.map((p) => p.text)).toEqual(["Access scores 78 of 100."]);
    expect(result.cons).toHaveLength(0);
  });

  test("asks once more for a side that came back empty when the data has facts for it", async () => {
    const withGood = { ...input, context: { ...context, facts: [...context.facts, fact("i.park", "Walking distance to the nearest park is 94 m.", "good")] } };
    const model = fake("PROS:\nCONS:\n- A duplex is not permitted here [t.two_unit].", "PROS:\n- The nearest park is 94 m away [i.park].");
    const result = await createScenario(model)(withGood);
    if (result.status !== "ok") throw new Error(result.reason);
    expect(model.calls).toHaveLength(2);
    expect(model.calls[1]!.contents.at(-1)!.parts[0]).toMatchObject({ text: expect.stringContaining("no pros") });
    expect(result.pros.map((p) => p.text)).toEqual(["The nearest park is 94 m away."]);
    expect(result.cons).toHaveLength(1);
  });

  test("keeps number-checked points if the checking pass can't be read or fails", async () => {
    const unreadable = fake("PROS:\n- Good access [pillar.access].\nCONS:\n- Not permitted [t.two_unit].");
    unreadable.check("Looks fine to me.");
    expect(await createScenario(unreadable)(input)).toMatchObject({ status: "ok", pros: [{}], cons: [{}] });
    const failing = fake("PROS:\n- Good access [pillar.access].\nCONS:\n- Not permitted [t.two_unit].");
    failing.check(new Error("down"));
    expect(await createScenario(failing)(input)).toMatchObject({ status: "ok", pros: [{}], cons: [{}] });
  });

  test("says so when there's no key, nothing verifiable, or the model fails", async () => {
    expect((await createScenario({ generate: null })(input)).status).toBe("unavailable");
    expect(await createScenario(fake("PROS:\n- Nice area.\nCONS:\n- Unclear."))(input)).toMatchObject({ status: "unavailable" });
    const failing: GenerateFn = async () => {
      throw new Error("down");
    };
    expect(await createScenario({ generate: failing })(input)).toMatchObject({ status: "unavailable", reason: expect.stringContaining("busy") });
  });

  test("caches the same parcel and typology", async () => {
    const { generate, calls } = fake("PROS:\n- Good access [pillar.access].\nCONS:\n- Not permitted [t.two_unit].");
    const scenario = createScenario({ generate });
    await scenario(input);
    await scenario(input);
    expect(calls).toHaveLength(1);
    await scenario({ ...input, typology: { id: "single_detached", name: "House" } });
    expect(calls).toHaveLength(2);
  });

  test("the prompt names the typology, its focus facts and the format", () => {
    const prompt = scenarioPrompt([], input);
    expect(prompt).toContain("considering building: Duplex");
    expect(prompt).toContain("[t.two_unit]");
    expect(prompt).toContain("PROS:");
  });
});
