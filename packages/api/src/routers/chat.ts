import z from "zod";

import { createChat } from "../chat/engine";
import { geminiGenerate } from "../chat/gemini";
import { fixtureSource } from "../chat/source";
import { publicProcedure } from "../index";

const considerationId = z.enum([
  "lot", "zoning", "hazards", "slope", "air", "transit", "parks", "health", "schools", "shops", "demand",
]);

const askInput = z.object({
  pins: z.array(z.string().min(1).max(40)).max(3).default([]),
  weights: z.partialRecord(considerationId, z.number().min(0).max(3)).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

// One chat (and its answer cache) per API key, reused across requests.
const chats = new Map<string, ReturnType<typeof createChat>>();
const noKeyChat = createChat({ source: fixtureSource, generate: null });

function chatFor(apiKey: string | undefined) {
  if (!apiKey) return noKeyChat;
  let chat = chats.get(apiKey);
  if (!chat) {
    chat = createChat({ source: fixtureSource, generate: geminiGenerate(apiKey) });
    chats.set(apiKey, chat);
  }
  return chat;
}

export const chatRouter = {
  ask: publicProcedure.input(askInput).handler(({ input, context }) => chatFor(context.geminiApiKey)(input)),
};
