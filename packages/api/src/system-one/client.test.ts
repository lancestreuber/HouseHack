import { describe, expect, test } from "bun:test";

import { createSystemOne, SystemOneError } from "./client";

const API_KEY = "sk-test-secret-key";

function mockFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function client(fetchImpl: typeof fetch, apiKey: string | undefined = API_KEY) {
  return createSystemOne({ apiKey, baseURL: "https://example.test/api/", model: "jev-1.13", fetch: fetchImpl });
}

async function captureError(promise: Promise<unknown>): Promise<SystemOneError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(SystemOneError);
    return error as SystemOneError;
  }
  throw new Error("expected a SystemOneError");
}

describe("decide", () => {
  test("returns a yes/no (noul) decision as a probability", async () => {
    const { fetchImpl, calls } = mockFetch(200, {
      model: "typesafe/jev-1.13-20260917",
      answers: { transit: { type: "noul", noul: 0.82 } },
      usage: { input_tokens: 120, cost: 0.00001 },
    });

    const result = await client(fetchImpl).decide({
      state: { access: "Frequent bus within 400 ft" },
      questions: { transit: { type: "noul", instructions: "Is `access` good for households without a car?" } },
    });

    expect(result.answers.transit).toEqual({ type: "noul", probability: 0.82 });
    expect(result.model).toBe("typesafe/jev-1.13-20260917");
    expect(result.usage).toEqual({ inputTokens: 120, cost: 0.00001 });

    const call = calls[0]!;
    expect(call.url).toBe("https://example.test/api/v1/systemone");
    expect(JSON.parse(call.init.body as string)).toMatchObject({ model: "jev-1.13" });
  });

  test("returns a choice decision with probabilities and confidence", async () => {
    const { fetchImpl } = mockFetch(200, {
      model: "jev",
      answers: {
        market: { type: "choice", choice: "owner", probabilities: { owner: 0.7, renter: 0.3 }, confidence: 0.6 },
      },
    });

    const result = await client(fetchImpl).decide({
      state: "High owner occupancy",
      questions: {
        market: { type: "choice", criteria: { owner: "Mostly owners", renter: "Mostly renters" } },
      },
    });

    expect(result.answers.market.choice).toBe("owner");
    expect(result.answers.market.probabilities).toEqual({ owner: 0.7, renter: 0.3 });
    expect(result.answers.market.confidence).toBe(0.6);
  });

  test("maps a score to a normalized value, nearest label and ordered probabilities", async () => {
    const { fetchImpl } = mockFetch(200, {
      model: "jev",
      answers: {
        fit: { type: "score", score: 2.43, probabilities: { "0": 0.01, "1": 0.11, "2": 0.32, "3": 0.56 }, confidence: 0.43 },
      },
    });

    const result = await client(fetchImpl).decide({
      state: "Lot area 3,251 sq ft",
      questions: { fit: { type: "score", instructions: "How well does a duplex fit?", criteria: ["No", "Poor", "Okay", "Good"] } },
    });

    expect(result.answers.fit.normalized).toBeCloseTo(0.81, 2);
    expect(result.answers.fit.label).toBe("Okay");
    expect(result.answers.fit.probabilities).toEqual([0.01, 0.11, 0.32, 0.56]);
  });

  test("fails clearly without an API key and makes no request", async () => {
    const { fetchImpl, calls } = mockFetch(200, {});
    const systemOne = client(fetchImpl, "  ");

    expect(systemOne.configured).toBe(false);
    const error = await captureError(
      systemOne.decide({ state: "x", questions: { q: { type: "noul", instructions: "?" } } }),
    );
    expect(error.code).toBe("not_configured");
    expect(calls).toHaveLength(0);
  });

  test("surfaces non-2xx responses without leaking the key", async () => {
    const { fetchImpl } = mockFetch(401, { error: { message: "Invalid credentials" } });

    const error = await captureError(
      client(fetchImpl).decide({ state: "x", questions: { q: { type: "noul", instructions: "?" } } }),
    );
    expect(error.code).toBe("http_error");
    expect(error.status).toBe(401);
    expect(error.message).toContain("Invalid credentials");
    expect(error.message).not.toContain(API_KEY);
  });

  test("rejects a response that is missing a requested answer", async () => {
    const { fetchImpl } = mockFetch(200, { model: "jev", answers: {} });

    const error = await captureError(
      client(fetchImpl).decide({ state: "x", questions: { q: { type: "noul", instructions: "?" } } }),
    );
    expect(error.code).toBe("bad_response");
  });

  test("reports network failures as network_error", async () => {
    const failing = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;

    const error = await captureError(
      client(failing).decide({ state: "x", questions: { q: { type: "noul", instructions: "?" } } }),
    );
    expect(error.code).toBe("network_error");
    expect(error.message).not.toContain(API_KEY);
  });
});
