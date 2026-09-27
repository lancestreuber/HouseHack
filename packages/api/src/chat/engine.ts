import { DEFINITIONS } from "./definitions";
import type { FunctionDeclaration, GeminiContent, GeminiPart, GenerateFn } from "./gemini";
import { keepVerified, numbersIn, parseReply, unverifiedNumbers } from "./guard";
import { systemPrompt } from "./prompt";
import { overallScore } from "./rescore";
import { GENERAL_QUESTIONS } from "./suggestions";
import type { ChatContext, ChatFact, ChatMessage, ChatResult, ReplyBlock, ScoringModel } from "./types";

export interface ChatInput {
  context?: ChatContext;
  messages: ChatMessage[];
}

const MAX_HISTORY = 10;
// Matches the navbar's pillar weight sliders (weights-popover.tsx, 0–3).
const MAX_WEIGHT = 3;
const MAX_TOOL_STEPS = 3;
const CACHE_LIMIT = 200;

function rescoreTool(model: ScoringModel): FunctionDeclaration {
  return {
    name: "rescore",
    description:
      "Recompute the overall score with different weights. Use this whenever the user asks what happens if they change, raise or lower a weight, slider or priority.",
    parameters: {
      type: "object",
      properties: {
        weights: {
          type: "object",
          description: `New weights, each from 0 (ignore) to ${MAX_WEIGHT} (most important); 1 is the default. Unlisted ones keep their current value. Keys: ${model.parts.map((p) => `${p.id} (${p.label})`).join(", ")}.`,
          properties: Object.fromEntries(model.parts.map((p) => [p.id, { type: "number" }])),
        },
      },
      required: ["weights"],
    },
  };
}

const textOf = (parts: GeminiPart[]) => parts.map((p) => ("text" in p ? p.text : "")).join("");
const fmt = (n: number | null) => (n === null ? "unavailable" : String(Math.round(n)));

/** Facts from the screen, plus the standing definitions (screen facts win on id clashes). */
function factsFrom(context: ChatContext | undefined): ChatFact[] {
  const seen = new Set<string>();
  const facts: ChatFact[] = [];
  for (const f of [...(context?.facts ?? []), ...DEFINITIONS]) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    facts.push({ ...f, numbers: numbersIn(f.text) });
  }
  return facts;
}

/**
 * Create the chat handler. `generate` is null when no API key is configured,
 * in which case every answer falls back to the screen's own notes.
 */
export function createChat(deps: { generate: GenerateFn | null }) {
  const cache = new Map<string, ChatResult>();

  return async function chat(input: ChatInput): Promise<ChatResult> {
    const suggestions = input.context?.suggestions?.length ? input.context.suggestions.slice(0, 3) : GENERAL_QUESTIONS;
    const unavailable = (reason: string): ChatResult => ({
      status: "unavailable",
      reason,
      notes: input.context?.notes ?? [],
      suggestions,
    });
    if (!deps.generate) return unavailable("The chat assistant isn't set up yet (no API key).");

    const history = input.messages.slice(-MAX_HISTORY);
    const key = JSON.stringify([input.context, history]);
    const cached = cache.get(key);
    if (cached) return cached;

    const facts = factsFrom(input.context);
    const contents: GeminiContent[] = history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));
    const run = () => runWithTools(deps.generate as GenerateFn, input.context, facts, contents);

    try {
      let reply = await run();
      let blocks = parseReply(reply, facts.map((f) => f.id));
      const bad = unverifiedIn(blocks, facts);
      if (bad.length) {
        contents.push(
          { role: "model", parts: [{ text: reply }] },
          {
            role: "user",
            parts: [
              {
                text: `Your last reply used numbers that aren't in the FACTS: ${bad.join(", ")}. Rewrite it using only numbers exactly as written in the FACTS, or leave those details out.`,
              },
            ],
          },
        );
        reply = await run();
        blocks = parseReply(reply, facts.map((f) => f.id));
      }
      const allowed = facts.flatMap((f) => f.numbers);
      const verified = blocks.map((b) => keepVerified(b, allowed)).filter((b): b is ReplyBlock => b !== null);
      if (!verified.length) return unavailable("I couldn't give an answer I could verify against the data. Try rephrasing.");

      const cited = new Set(verified.flatMap((b) => b.fact_ids));
      const result: ChatResult = { status: "ok", blocks: verified, facts: facts.filter((f) => cited.has(f.id)), suggestions };
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      cache.set(key, result);
      return result;
    } catch {
      return unavailable("The assistant is busy right now. Please try again in a moment.");
    }
  };
}

function unverifiedIn(blocks: ReplyBlock[], facts: ChatFact[]): string[] {
  const allowed = facts.flatMap((f) => f.numbers);
  return [...new Set(blocks.flatMap((b) => unverifiedNumbers(b.text, allowed)))];
}

/** Call the model, running rescore calls, until it returns text. Mutates `facts` and `contents`. */
async function runWithTools(
  generate: GenerateFn,
  context: ChatContext | undefined,
  facts: ChatFact[],
  contents: GeminiContent[],
): Promise<string> {
  const scoring = context?.scoring;
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const parts = await generate({
      system: systemPrompt(facts, context?.subject),
      contents,
      tools: scoring ? [rescoreTool(scoring)] : undefined,
    });
    const calls = parts.filter((p): p is Extract<GeminiPart, { functionCall: unknown }> => "functionCall" in p);
    if (!calls.length) return textOf(parts);

    contents.push({ role: "model", parts });
    const responses: GeminiPart[] = calls.map((call) => {
      if (!scoring) return { functionResponse: { name: call.functionCall.name, response: { error: "No scores to recompute." } } };
      const requested = (call.functionCall.args as { weights?: Record<string, unknown> }).weights ?? {};
      const changes: Record<string, number> = {};
      for (const part of scoring.parts) {
        if (part.id in requested) changes[part.id] = Math.min(MAX_WEIGHT, Math.max(0, Number(requested[part.id]) || 0));
      }
      const before = overallScore(scoring);
      const after = overallScore(scoring, changes);
      const described = Object.entries(changes)
        .filter(([id, w]) => w !== scoring.parts.find((p) => p.id === id)?.weight)
        .map(([id, w]) => `${scoring.parts.find((p) => p.id === id)?.label ?? id} weight ${w}`)
        .join(", ");
      const id = `rescore.${facts.filter((f) => f.id.startsWith("rescore.")).length + 1}`;
      const text = `With ${described || "the same weights"}, the overall score changes from ${fmt(before)} to ${fmt(after)} out of 100.`;
      facts.push({
        id,
        text,
        source: "Recomputed with the tool's published weights and formula",
        source_url: "/methodology",
        as_of: new Date().toISOString().slice(0, 10),
        kind: "value",
        numbers: numbersIn(text),
      });
      return { functionResponse: { name: call.functionCall.name, response: { fact_id: id, text } } };
    });
    contents.push({ role: "user", parts: responses });
  }
  throw new Error("Too many tool steps");
}
