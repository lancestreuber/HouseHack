import z from "zod";

import { createChat } from "../chat/engine";
import { geminiGenerate, geminiSpeak } from "../chat/gemini";
import { publicProcedure } from "../index";

const factKind = z.enum(["evidence", "assumption", "observed", "policy", "value", "definition"]);

const contextFact = z.object({
  id: z.string().regex(/^[a-z0-9_.:-]{1,80}$/i),
  text: z.string().min(1).max(600),
  source: z.string().max(200),
  source_url: z.string().max(500),
  as_of: z.string().max(40),
  kind: factKind,
});

const chatContext = z.object({
  subject: z.string().max(200),
  facts: z.array(contextFact).max(300),
  scoring: z
    .object({
      method: z.enum(["geometric", "arithmetic"]),
      floor: z.number().min(0).max(100),
      parts: z
        .array(z.object({ id: z.string().max(40), label: z.string().max(80), score: z.number().nullable(), weight: z.number().min(0).max(10) }))
        .max(20),
    })
    .optional(),
  suggestions: z.array(z.string().max(200)).max(6).optional(),
  notes: z.array(z.string().max(400)).max(20).optional(),
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

// Spoken replies, cached by text so replays and repeated demo answers are free.
// Bump VOICE_VERSION when the TTS request changes so stale clips aren't reused.
const VOICE_VERSION = 2;
const speechCache = new Map<string, { mimeType: string; data: string }>();
const SPEECH_CACHE_LIMIT = 100;

export const chatRouter = {
  /** Explain-only assistant grounded in the facts the screen is showing. */
  ask: publicProcedure.input(askInput).handler(({ input, context }) => chatFor(context.geminiApiKey)(input)),

  /** A natural voice for one or two sentences of a reply. `null` means use the browser voice. */
  speak: publicProcedure
    .input(z.object({ text: z.string().min(1).max(1200) }))
    .handler(async ({ input, context }) => {
      if (!context.geminiApiKey) return null;
      const cacheKey = `${VOICE_VERSION}:${input.text}`;
      const cached = speechCache.get(cacheKey);
      if (cached) return cached;
      try {
        const audio = await geminiSpeak(context.geminiApiKey, input.text);
        if (speechCache.size >= SPEECH_CACHE_LIMIT) speechCache.delete(speechCache.keys().next().value as string);
        speechCache.set(cacheKey, audio);
        return audio;
      } catch {
        return null;
      }
    }),
};
