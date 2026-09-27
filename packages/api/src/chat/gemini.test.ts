import { afterEach, describe, expect, test } from "bun:test";

import { GeminiError, geminiGenerate, MODELS } from "./gemini";

// Each model's behavior: answer after `ms`, fail with `status`, or hang until cancelled.
type Behavior = { ms: number; status?: number } | "hang";

const realFetch = globalThis.fetch;
let calls: string[] = [];
let cancelled: string[] = [];

function fakeModels(behaviors: Behavior[]) {
  calls = [];
  cancelled = [];
  globalThis.fetch = ((url: string, init: RequestInit) => {
    const model = MODELS.find((m) => url.includes(`/${m}:`))!;
    calls.push(model);
    const behavior = behaviors[MODELS.indexOf(model)]!;
    return new Promise((resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        cancelled.push(model);
        reject(new DOMException("aborted", "AbortError"));
      });
      if (behavior === "hang") return;
      setTimeout(() => {
        if (behavior.status) resolve(new Response("{}", { status: behavior.status }));
        else resolve(Response.json({ candidates: [{ content: { parts: [{ text: `from ${model}` }] } }] }));
      }, behavior.ms);
    });
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

const req = { system: "s", contents: [] };
const HEDGE = 30;

describe("geminiGenerate", () => {
  test("uses the first model when it answers quickly, without starting others", async () => {
    fakeModels([{ ms: 5 }, { ms: 5 }, { ms: 5 }]);
    const parts = await geminiGenerate("key", HEDGE)(req);
    expect(parts).toEqual([{ text: `from ${MODELS[0]}` }]);
    expect(calls).toEqual([MODELS[0]]);
  });

  test("starts the next model when the first stalls, and cancels the stalled one", async () => {
    fakeModels(["hang", { ms: 5 }, { ms: 5 }]);
    const started = Date.now();
    const parts = await geminiGenerate("key", HEDGE)(req);
    expect(parts).toEqual([{ text: `from ${MODELS[1]}` }]);
    expect(Date.now() - started).toBeLessThan(HEDGE * 4);
    expect(cancelled).toContain(MODELS[0]);
  });

  test("moves on right away after a retryable error", async () => {
    fakeModels([{ ms: 1, status: 429 }, { ms: 5 }, { ms: 5 }]);
    const parts = await geminiGenerate("key", 10_000)(req);
    expect(parts).toEqual([{ text: `from ${MODELS[1]}` }]);
  });

  test("stops at a non-retryable error", async () => {
    fakeModels([{ ms: 1, status: 400 }, { ms: 5 }, { ms: 5 }]);
    const error = await geminiGenerate("key", 10_000)(req).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GeminiError);
    expect((error as GeminiError).status).toBe(400);
    expect(calls).toEqual([MODELS[0]]);
  });

  test("fails with the last error when every model fails", async () => {
    fakeModels([{ ms: 1, status: 503 }, { ms: 1, status: 429 }, { ms: 1, status: 404 }]);
    const error = await geminiGenerate("key", HEDGE)(req).catch((e: unknown) => e);
    expect((error as GeminiError).status).toBe(404);
    expect(calls).toEqual([...MODELS]);
  });
});
