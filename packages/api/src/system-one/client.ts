import z from "zod";

import type {
  AnswerFor,
  DecideInput,
  DecideResult,
  Decisions,
  Question,
  Questions,
  SystemOne,
  SystemOneConfig,
} from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

export type SystemOneErrorCode = "not_configured" | "http_error" | "network_error" | "bad_response";

/**
 * Every failure is a SystemOneError. Messages are safe to log: they never
 * contain the API key or request headers. Callers decide whether to fall back;
 * a failed request is never turned into a decision here.
 */
export class SystemOneError extends Error {
  readonly code: SystemOneErrorCode;
  readonly status?: number;

  constructor(code: SystemOneErrorCode, message: string, status?: number) {
    super(message);
    this.name = "SystemOneError";
    this.code = code;
    this.status = status;
  }
}

const answerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("noul"), noul: z.number() }),
  z.object({
    type: z.literal("choice"),
    choice: z.string(),
    probabilities: z.record(z.string(), z.number()),
    confidence: z.number(),
  }),
  z.object({
    type: z.literal("score"),
    score: z.number(),
    probabilities: z.record(z.string(), z.number()),
    confidence: z.number(),
  }),
]);

const responseSchema = z.object({
  model: z.string(),
  answers: z.record(z.string(), answerSchema),
  usage: z.object({ input_tokens: z.number(), cost: z.number().optional() }).partial().optional(),
});

type RawAnswer = z.infer<typeof answerSchema>;

function toAnswer<Q extends Question>(id: string, question: Q, raw: RawAnswer | undefined): AnswerFor<Q> {
  if (!raw || raw.type !== question.type) {
    throw new SystemOneError("bad_response", `No ${question.type} answer for question "${id}"`);
  }
  switch (raw.type) {
    case "noul":
      return { type: "noul", probability: raw.noul } as AnswerFor<Q>;
    case "choice":
      return {
        type: "choice",
        choice: raw.choice,
        probabilities: raw.probabilities,
        confidence: raw.confidence,
      } as AnswerFor<Q>;
    case "score": {
      const levels = (question as Extract<Question, { type: "score" }>).criteria;
      const top = levels.length - 1;
      const probabilities = levels.map((_, i) => raw.probabilities[String(i)] ?? 0);
      // Use the probability-weighted expected value, not the model's raw top
      // pick: a raw score of e.g. 0 can be near-argmax on an almost-even
      // split against 1, which collapses real uncertainty into a falsely
      // confident extreme. Expected value only softens *that* case -- a
      // genuinely confident distribution still lands near the extreme.
      const expected = probabilities.reduce((sum, p, i) => sum + p * i, 0);
      return {
        type: "score",
        score: raw.score,
        normalized: top > 0 ? expected / top : 0,
        label: levels[Math.min(top, Math.max(0, Math.round(expected)))] ?? "",
        probabilities,
        confidence: raw.confidence,
      } as AnswerFor<Q>;
    }
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: unknown } };
    const message = body?.error?.message;
    if (typeof message === "string") return message.slice(0, 300);
  } catch {
    // Non-JSON error body; the status is enough.
  }
  return response.statusText || "request failed";
}

export function createSystemOne(config: SystemOneConfig): SystemOne {
  const apiKey = config.apiKey?.trim() || undefined;
  const endpoint = `${config.baseURL.replace(/\/+$/, "")}/v1/systemone`;
  const doFetch = config.fetch ?? fetch;

  return {
    configured: apiKey !== undefined,
    model: config.model,

    async decide<Qs extends Questions>({ state, questions }: DecideInput<Qs>): Promise<DecideResult<Qs>> {
      if (!apiKey) {
        throw new SystemOneError("not_configured", "System One API key is not set");
      }

      let response: Response;
      try {
        response = await doFetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: config.model, state, questions }),
          signal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.name : "unknown";
        throw new SystemOneError("network_error", `System One request failed (${reason})`);
      }

      if (!response.ok) {
        const detail = await readError(response);
        throw new SystemOneError("http_error", `System One returned ${response.status}: ${detail}`, response.status);
      }

      const parsed = responseSchema.safeParse(await response.json().catch(() => null));
      if (!parsed.success) {
        throw new SystemOneError("bad_response", "System One response did not match the expected shape");
      }

      const answers = {} as Decisions<Qs>;
      for (const [id, question] of Object.entries(questions) as [keyof Qs & string, Qs[keyof Qs]][]) {
        answers[id] = toAnswer(id, question, parsed.data.answers[id]) as Decisions<Qs>[typeof id];
      }

      const usage = parsed.data.usage;
      return {
        answers,
        model: parsed.data.model,
        usage: usage?.input_tokens !== undefined ? { inputTokens: usage.input_tokens, cost: usage.cost } : undefined,
      };
    },
  };
}
