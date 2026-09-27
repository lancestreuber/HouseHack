import { DEFINITIONS } from "./definitions";
import type { FunctionDeclaration, GeminiContent, GeminiPart, GenerateFn } from "./gemini";
import { keepVerified, numbersIn, parseReply, unverifiedNumbers } from "./guard";
import { describeView, MAP_TOOL, mapTool, resolveMapCall } from "./map-tool";
import { systemPrompt } from "./prompt";
import { overallScore } from "./rescore";
import { GENERAL_QUESTIONS } from "./suggestions";
import type { ChatAction, ChatContext, ChatFact, ChatMessage, ChatResult, ReplyBlock, ScoringModel } from "./types";

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
export function factsFrom(context: ChatContext | undefined): ChatFact[] {
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
    const map = input.context?.map;
    if (map) facts.push(toolFact("map.now", `The map currently shows ${describeView(map.current, map)}`, "Yinzone map layers"));
    const actions: ChatAction[] = [];
    const contents: GeminiContent[] = history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));
    const run = () => runWithTools(deps.generate as GenerateFn, input.context, facts, contents, actions);

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
                text: `Your last reply used numbers that aren't in the FACTS: ${bad.join(", ")}. Rewrite it using only numbers written as digits exactly as in the FACTS, or leave those details out.`,
              },
            ],
          },
        );
        reply = await run();
        blocks = parseReply(reply, facts.map((f) => f.id));
      }
      const allowed = facts.flatMap((f) => f.numbers);
      let verified = blocks.map((b) => keepVerified(b, allowed)).filter((b): b is ReplyBlock => b !== null);
      // The map changed, so say what it shows even if the rest didn't verify.
      const mapFact = actions.length ? facts.findLast((f) => f.id.startsWith("map.") && f.id !== "map.now") : undefined;
      if (!verified.length && mapFact) verified = [{ type: "paragraph", text: mapFact.text, fact_ids: [mapFact.id] }];
      if (!verified.length) return unavailable("I couldn't give an answer I could verify against the data. Try rephrasing.");

      const cited = new Set(verified.flatMap((b) => b.fact_ids));
      // Only the final view matters; the page applies it once.
      const result: ChatResult = {
        status: "ok",
        blocks: verified,
        facts: facts.filter((f) => cited.has(f.id)),
        suggestions,
        ...(actions.length ? { actions: [actions.at(-1)!] } : {}),
      };
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      cache.set(key, result);
      return result;
    } catch {
      return unavailable("The assistant is busy right now. Please try again in a moment.");
    }
  };
}

export function unverifiedIn(blocks: ReplyBlock[], facts: ChatFact[]): string[] {
  const allowed = facts.flatMap((f) => f.numbers);
  return [...new Set(blocks.flatMap((b) => unverifiedNumbers(b.text, allowed)))];
}

function toolFact(id: string, text: string, source: string): ChatFact {
  return {
    id,
    text,
    source,
    source_url: "/resources",
    as_of: new Date().toISOString().slice(0, 10),
    kind: "observed",
    numbers: numbersIn(text),
  };
}

/** Call the model, running its tool calls, until it returns text. Mutates `facts`, `contents` and `actions`. */
async function runWithTools(
  generate: GenerateFn,
  context: ChatContext | undefined,
  facts: ChatFact[],
  contents: GeminiContent[],
  actions: ChatAction[],
): Promise<string> {
  const scoring = context?.scoring;
  let map = context?.map;
  const tools = [...(scoring ? [rescoreTool(scoring)] : []), ...(map ? [mapTool(map)] : [])];
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const parts = await generate({
      system: systemPrompt(facts, context?.subject, Boolean(map)),
      contents,
      tools: tools.length ? tools : undefined,
    });
    const calls = parts.filter((p): p is Extract<GeminiPart, { functionCall: unknown }> => "functionCall" in p);
    if (!calls.length) return textOf(parts);

    contents.push({ role: "model", parts });
    const responses: GeminiPart[] = calls.map((call) => {
      const { name, args } = call.functionCall;
      const respond = (response: Record<string, unknown>): GeminiPart => ({ functionResponse: { name, response } });
      if (name === MAP_TOOL) {
        if (!map) return respond({ error: "There is no map on this page." });
        const result = resolveMapCall(args ?? {}, map);
        if (!result.ok) return respond({ error: result.error });
        // Later calls in this answer build on this view.
        map = { ...map, current: result.view };
        const id = `map.${facts.filter((f) => f.id.startsWith("map.") && f.id !== "map.now").length + 1}`;
        facts.push(toolFact(id, result.text, "Yinzone map layers"));
        actions.push({ type: "map", view: result.view, summary: result.text });
        return respond({ fact_id: id, text: result.text });
      }
      if (!scoring) return respond({ error: "No scores to recompute." });
      const requested = (args as { weights?: Record<string, unknown> }).weights ?? {};
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
      facts.push({ ...toolFact(id, text, "Recomputed with the tool's published weights and formula"), source_url: "/methodology", kind: "value" });
      return respond({ fact_id: id, text });
    });
    contents.push({ role: "user", parts: responses });
  }
  throw new Error("Too many tool steps");
}
