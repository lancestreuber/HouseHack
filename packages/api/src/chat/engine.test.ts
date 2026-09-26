import { describe, expect, test } from "bun:test";

import { createChat, type ChatInput } from "./engine";
import { reportContext } from "./facts";
import { homewoodEvals, homewoodReport } from "./fixtures";
import type { GeminiPart, GenerateFn, GenerateRequest } from "./gemini";

const flat = { lot: 1, zoning: 1, hazards: 1, slope: 1, air: 1, transit: 1, parks: 1, health: 1, schools: 1, shops: 1, demand: 1 };
const context = reportContext([{ report: homewoodReport, evals: homewoodEvals }], flat);
const ask = (text: string, extra: Partial<ChatInput> = {}): ChatInput => ({
  context,
  messages: [{ role: "user", text }],
  ...extra,
});

/** A fake model that replies with the given turns in order and records requests. */
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

describe("chat engine", () => {
  test("returns plain-text blocks with verified citations", async () => {
    const { generate } = fakeModel([
      [{ text: "A **duplex** is the best fit here, at 75 with 81% confidence from Jev. [t.duplex]\nThe bus stop is 180 m away. [transit]" }],
    ]);
    const res = await createChat({ generate })(ask("Why duplex?"));
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.blocks[0]?.text).toBe("A duplex is the best fit here, at 75 with 81% confidence from Jev.");
    expect(res.blocks[0]?.fact_ids).toEqual(["t.duplex"]);
    expect(res.facts.map((f) => f.id).sort()).toEqual(["t.duplex", "transit"]);
    expect(res.suggestions).toHaveLength(3);
  });

  test("retries once when a number isn't in the facts, and uses the corrected reply", async () => {
    const { generate, calls } = fakeModel([
      [{ text: "The duplex fit is 88. [t.duplex]" }],
      [{ text: "The duplex fit is 75. [t.duplex]" }],
    ]);
    const res = await createChat({ generate })(ask("Duplex fit?"));
    expect(calls).toHaveLength(2);
    const retryNote = calls[1]?.contents.at(-1)?.parts[0];
    expect(retryNote && "text" in retryNote ? retryNote.text : "").toContain("88");
    expect(res.status === "ok" && res.blocks[0]?.text).toBe("The duplex fit is 75.");
  });

  test("drops a sentence that still has an unverified number after the retry", async () => {
    const { generate } = fakeModel([
      [{ text: "Transit is close. [transit]\nRent would be $1,450. [ctx.2]" }],
      [{ text: "Transit is close. [transit]\nRent would be $1,450. [ctx.2]" }],
    ]);
    const res = await createChat({ generate })(ask("Rent?"));
    expect(res.status === "ok" && res.blocks.map((b) => b.text)).toEqual(["Transit is close."]);
  });

  test("falls back to the deterministic notes when nothing can be verified", async () => {
    const { generate } = fakeModel([[{ text: "It will sell for $900,000." }], [{ text: "It will sell for $900,000." }]]);
    const res = await createChat({ generate })(ask("Price?"));
    expect(res.status).toBe("unavailable");
    if (res.status === "unavailable") expect(res.notes.length).toBeGreaterThan(0);
  });

  test("answers what-if questions with the real rescore, never a guess", async () => {
    const { generate, calls } = fakeModel([
      [{ functionCall: { name: "rescore", args: { weights: { air: 3 } } }, thoughtSignature: "sig" }],
      [{ text: "Weighting air higher moves the score from 73 to 71. [rescore.1]" }],
    ]);
    const res = await createChat({ generate })(ask("What if I weight air higher?"));
    expect(res.status === "ok" && res.blocks[0]?.fact_ids).toEqual(["rescore.1"]);
    // The model's tool-call turn is sent back verbatim, signature included.
    const echoed = calls[1]?.contents.find((c) => c.role === "model")?.parts[0];
    expect(echoed && "thoughtSignature" in echoed ? echoed.thoughtSignature : undefined).toBe("sig");
  });

  test("is unavailable without an API key and shows the notes instead", async () => {
    const res = await createChat({ generate: null })(ask("Hi"));
    expect(res.status).toBe("unavailable");
    if (res.status === "unavailable") expect(res.reason).toContain("no API key");
  });

  test("is unavailable when the model errors", async () => {
    const generate: GenerateFn = async () => {
      throw new Error("429");
    };
    const res = await createChat({ generate })(ask("Hi"));
    expect(res.status).toBe("unavailable");
  });

  test("caches identical questions so the demo replays instantly", async () => {
    const { generate, calls } = fakeModel([[{ text: "Transit is close. [transit]" }]]);
    const chat = createChat({ generate });
    await chat(ask("Transit?"));
    const again = await chat(ask("Transit?"));
    expect(calls).toHaveLength(1);
    expect(again.status).toBe("ok");
  });

  test("works with no parcel selected, using only definitions", async () => {
    const { generate, calls } = fakeModel([[{ text: "Needs approval means a hearing is required. [def.needs_approval]" }]]);
    const res = await createChat({ generate })({ messages: [{ role: "user", text: "What is needs approval?" }] });
    expect(res.status).toBe("ok");
    expect(calls[0]?.system).not.toContain("[parcel]");
  });
});
