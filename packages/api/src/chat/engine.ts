import { buildFacts, DEFINITIONS, parcelScore } from "./facts";
import type { FunctionDeclaration, GeminiContent, GeminiPart, GenerateFn } from "./gemini";
import { keepVerified, parseReply, unverifiedNumbers } from "./guard";
import { systemPrompt } from "./prompt";
import type { ChatDataSource } from "./source";
import { GENERAL_QUESTIONS, suggestionsFor } from "./suggestions";
import type {
  ChatFact,
  ChatMessage,
  ChatResult,
  ConsiderationId,
  Note,
  ParcelReport,
  ReplyBlock,
  TypologyEval,
  Weights,
} from "./types";

export interface ChatInput {
  pins: string[];
  weights?: Partial<Weights>;
  messages: ChatMessage[];
}

const CONSIDERATIONS: ConsiderationId[] = [
  "lot", "zoning", "hazards", "slope", "air", "transit", "parks", "health", "schools", "shops", "demand",
];
const DEFAULT_WEIGHTS = Object.fromEntries(CONSIDERATIONS.map((id) => [id, 1])) as Weights;
const MAX_HISTORY = 10;
const MAX_TOOL_STEPS = 3;
const CACHE_LIMIT = 200;

const RESCORE_TOOL: FunctionDeclaration = {
  name: "rescore_parcel",
  description:
    "Recompute the Parcel Score with different slider weights. Use this whenever the user asks what happens if they change, raise or lower a weight or slider.",
  parameters: {
    type: "object",
    properties: {
      parcel: { type: "integer", description: "Which parcel, 1-based, when several are being compared. Default 1." },
      weights: {
        type: "object",
        description: "Weights to change, each 0 (ignore) to 3 (most important). Unlisted ones keep their current value.",
        properties: Object.fromEntries(CONSIDERATIONS.map((id) => [id, { type: "number" }])),
      },
    },
    required: ["weights"],
  },
};

const clampWeight = (v: unknown) => Math.min(3, Math.max(0, Number(v) || 0));

function textOf(parts: GeminiPart[]): string {
  return parts.map((p) => ("text" in p ? p.text : "")).join("");
}

/**
 * Create the chat handler. `generate` is null when no API key is configured,
 * in which case every answer falls back to the deterministic notes.
 */
export function createChat(deps: { source: ChatDataSource; generate: GenerateFn | null }) {
  const cache = new Map<string, ChatResult>();

  return async function chat(input: ChatInput): Promise<ChatResult> {
    const weights: Weights = { ...DEFAULT_WEIGHTS, ...input.weights };
    const parcels: { report: ParcelReport; evals: TypologyEval[] }[] = [];
    for (const pin of input.pins.slice(0, 3)) {
      const report = await deps.source.getReport(pin);
      if (report) parcels.push({ report, evals: await deps.source.getEvals(pin) });
    }
    const first = parcels[0];
    const suggestions = first ? suggestionsFor(first.report, first.evals) : GENERAL_QUESTIONS;
    const notes: Note[] = first
      ? first.report.notes.length
        ? first.report.notes
        : first.report.considerations.map((c) => ({ severity: c.severity, text: `${c.name}: ${c.comment}` }))
      : [];
    const unavailable = (reason: string): ChatResult => ({ status: "unavailable", reason, notes, suggestions });

    if (!deps.generate) return unavailable("The chat assistant is not configured (no API key).");

    const key = JSON.stringify([input.pins, weights, input.messages.slice(-MAX_HISTORY)]);
    const cached = cache.get(key);
    if (cached) return cached;

    const facts: ChatFact[] = parcels.length ? buildFacts(parcels, weights) : [...DEFINITIONS];
    const contents: GeminiContent[] = input.messages.slice(-MAX_HISTORY).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    let reply = "";
    try {
      reply = await runWithTools(deps.generate, facts, contents, parcels, weights);
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
        reply = await runWithTools(deps.generate, facts, contents, parcels, weights);
        blocks = parseReply(reply, facts.map((f) => f.id));
      }
      const allowed = allNumbers(facts);
      const verified = blocks.map((b) => keepVerified(b, allowed)).filter((b): b is ReplyBlock => b !== null);
      if (!verified.length) return unavailable("I couldn't verify an answer against the data.");

      const cited = new Set(verified.flatMap((b) => b.fact_ids));
      const result: ChatResult = {
        status: "ok",
        blocks: verified,
        facts: facts.filter((f) => cited.has(f.id)),
        suggestions,
      };
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      cache.set(key, result);
      return result;
    } catch {
      return unavailable("The chat assistant is busy right now. Here are the key notes instead.");
    }
  };
}

function allNumbers(facts: ChatFact[]): string[] {
  return facts.flatMap((f) => f.numbers);
}

function unverifiedIn(blocks: ReplyBlock[], facts: ChatFact[]): string[] {
  const allowed = allNumbers(facts);
  return [...new Set(blocks.flatMap((b) => unverifiedNumbers(b.text, allowed)))];
}

/** Call the model, running rescore tool calls, until it returns text. Mutates `facts`/`contents`. */
async function runWithTools(
  generate: GenerateFn,
  facts: ChatFact[],
  contents: GeminiContent[],
  parcels: { report: ParcelReport }[],
  weights: Weights,
): Promise<string> {
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const parts = await generate({
      system: systemPrompt(facts),
      contents,
      tools: parcels.length ? [RESCORE_TOOL] : undefined,
    });
    const calls = parts.filter((p): p is Extract<GeminiPart, { functionCall: unknown }> => "functionCall" in p);
    if (!calls.length) return textOf(parts);

    contents.push({ role: "model", parts });
    const responses: GeminiPart[] = calls.map((call) => {
      const args = call.functionCall.args as { parcel?: number; weights?: Record<string, unknown> };
      const index = Math.max(1, Math.min(parcels.length, Number(args.parcel) || 1));
      const report = parcels[index - 1]?.report;
      if (!report) return { functionResponse: { name: "rescore_parcel", response: { error: "No such parcel." } } };

      const next: Weights = { ...weights };
      for (const [k, v] of Object.entries(args.weights ?? {})) {
        if ((CONSIDERATIONS as string[]).includes(k)) next[k as ConsiderationId] = clampWeight(v);
      }
      const before = parcelScore(report.considerations, weights);
      const after = parcelScore(report.considerations, next);
      const changed = Object.entries(next)
        .filter(([k, v]) => v !== weights[k as ConsiderationId])
        .map(([k, v]) => `${k} weight ${v}`)
        .join(", ");
      const id = `rescore.${facts.filter((f) => f.id.startsWith("rescore.")).length + 1}`;
      const label = parcels.length > 1 ? `Parcel ${index}: ` : "";
      facts.push({
        id,
        text: `${label}With ${changed || "the same weights"}, the Parcel Score changes from ${before} to ${after} of 100.`,
        source: "Groundwork PGH algorithm (recomputed)",
        source_url: "/methodology",
        as_of: new Date().toISOString().slice(0, 10),
        kind: "assumption",
        numbers: [before, after].filter((n): n is number => n !== null).map(String),
      });
      return { functionResponse: { name: "rescore_parcel", response: { fact_id: id, before, after } } };
    });
    contents.push({ role: "user", parts: responses });
  }
  throw new Error("Too many tool steps");
}
