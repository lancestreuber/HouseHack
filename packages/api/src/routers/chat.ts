import z from "zod";

import { createChat } from "../chat/engine";
import { type AudioChunk, geminiGenerate, geminiSpeakStream } from "../chat/gemini";
import { createScenario } from "../chat/scenario";
import { publicProcedure } from "../index";

const factKind = z.enum(["evidence", "assumption", "observed", "policy", "value", "definition"]);

const contextFact = z.object({
  id: z.string().regex(/^[a-z0-9_.:-]{1,80}$/i),
  text: z.string().min(1).max(600),
  source: z.string().max(200),
  source_url: z.string().max(500),
  as_of: z.string().max(40),
  kind: factKind,
  tone: z.enum(["good", "bad"]).optional(),
});

const layerId = z.string().regex(/^[a-z0-9_.:-]{1,80}$/i);
const mapView = z.object({
  heat: z.object({ id: layerId, metric: z.string().max(60).optional() }).nullable(),
  stack: z.array(layerId).max(200),
});

export const chatContext = z.object({
  subject: z.string().max(200),
  facts: z.array(contextFact).max(300),
  scoring: z
    .object({
      method: z.enum(["geometric", "arithmetic"]),
      floor: z.number().min(0).max(100),
      parts: z
        .array(
          z.object({
            id: z.string().max(40),
            label: z.string().max(80),
            score: z.number().nullable(),
            weight: z.number().min(0).max(10),
            impute: z.number().nullable().optional(),
          }),
        )
        .max(20),
      multiplier: z.number().min(0).max(1).optional(),
    })
    .optional(),
  suggestions: z.array(z.string().max(200)).max(6).optional(),
  notes: z.array(z.string().max(400)).max(20).optional(),
  map: z
    .object({
      layers: z
        .array(
          z.object({
            id: layerId,
            label: z.string().min(1).max(120),
            group: z.string().max(40),
            description: z.string().max(400).optional(),
            heat: z.boolean(),
            metrics: z
              .array(z.object({ id: z.string().max(60), label: z.string().max(120) }))
              .max(30)
              .optional(),
            minZoom: z.number().min(0).max(24).optional(),
          }),
        )
        .max(200),
      current: mapView,
      zoom: z.number().min(0).max(24).optional(),
    })
    .optional(),
});

const askInput = z.object({
  context: chatContext.optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

// One chat (and its answer cache) per API key, reused across requests.
const chats = new Map<string, ReturnType<typeof createChat>>();
const noKeyChat = createChat({ generate: null });

function chatFor(apiKey: string | undefined) {
  if (!apiKey) return noKeyChat;
  let chat = chats.get(apiKey);
  if (!chat) {
    chat = createChat({ generate: geminiGenerate(apiKey) });
    chats.set(apiKey, chat);
  }
  return chat;
}

const scenarioInput = z.object({
  context: chatContext,
  typology: z.object({ id: z.string().regex(/^[a-z0-9_]{1,40}$/), name: z.string().min(1).max(60) }),
  focus: z.array(z.string().regex(/^[a-z0-9_.:-]{1,80}$/i)).max(10).optional(),
});

// Same pattern for scenario pros and cons.
const scenarios = new Map<string, ReturnType<typeof createScenario>>();
const noKeyScenario = createScenario({ generate: null });

function scenarioFor(apiKey: string | undefined) {
  if (!apiKey) return noKeyScenario;
  let scenario = scenarios.get(apiKey);
  if (!scenario) {
    scenario = createScenario({ generate: geminiGenerate(apiKey) });
    scenarios.set(apiKey, scenario);
  }
  return scenario;
}

// Spoken replies, cached by text so replays and repeated demo answers are free.
// Bump VOICE_VERSION when the TTS request changes so stale clips aren't reused.
const VOICE_VERSION = 3;
const speechCache = new Map<string, AudioChunk[]>();
const SPEECH_CACHE_LIMIT = 100;

export const chatRouter = {
  /** Explain-only assistant grounded in the facts the screen is showing. */
  ask: publicProcedure.input(askInput).handler(({ input, context }) => chatFor(context.geminiApiKey)(input)),

  /** Up to five pros and five cons for building one housing type on the parcel, from the same facts. */
  scenario: publicProcedure.input(scenarioInput).handler(({ input, context }) => scenarioFor(context.geminiApiKey)(input)),

  /**
   * Stream a natural voice reading `text`, chunk by chunk, so playback can start
   * almost immediately. Yields nothing if there's no key or the voice fails before
   * any audio; the client then uses the browser voice.
   */
  speak: publicProcedure
    .input(z.object({ text: z.string().min(1).max(2400) }))
    .handler(async function* ({ input, context }) {
      if (!context.geminiApiKey) return;
      const cacheKey = `${VOICE_VERSION}:${input.text}`;
      const cached = speechCache.get(cacheKey);
      if (cached) {
        yield* cached;
        return;
      }
      const chunks: AudioChunk[] = [];
      try {
        for await (const chunk of geminiSpeakStream(context.geminiApiKey, input.text)) {
          chunks.push(chunk);
          yield chunk;
        }
      } catch {
        return;
      }
      if (speechCache.size >= SPEECH_CACHE_LIMIT) speechCache.delete(speechCache.keys().next().value as string);
      speechCache.set(cacheKey, chunks);
    }),
};
