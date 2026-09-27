// "What if we built this housing type here?" Five pros and five cons for one
// typology on one parcel, written by the model from the same facts the chat
// uses and checked the same way: every point must cite a real fact, and every
// number must appear in the facts, or it's dropped. A second pass then checks
// each point against only the facts it cites, drops anything they don't
// directly say or that repeats an earlier point, and decides whether it's a
// pro or a con. Fewer than five is fine.
import { factsFrom, unverifiedIn } from "./engine";
import type { GeminiContent, GeminiPart, GenerateFn } from "./gemini";
import { keepVerified, parseReply } from "./guard";
import type { ChatContext, ChatFact, ReplyBlock } from "./types";

export const MAX_POINTS = 5;
const CACHE_LIMIT = 200;

export interface ScenarioInput {
  context: ChatContext;
  /** The typology tile's id (e.g. "two_unit") and on-screen name (e.g. "Duplex"). */
  typology: { id: string; name: string };
  /** Fact ids most about this typology (its tile, its alerts), listed first for the model. */
  focus?: string[];
}

export type ScenarioResult =
  | { status: "ok"; pros: ReplyBlock[]; cons: ReplyBlock[]; facts: ChatFact[] }
  | { status: "unavailable"; reason: string };

export function scenarioPrompt(facts: ChatFact[], input: ScenarioInput): string {
  const { name } = input.typology;
  const factLines = facts.map((f) => `[${f.id}] ${f.text}`).join("\n");
  const focus = input.focus?.length ? `\nThe facts most about ${name} here: ${input.focus.map((id) => `[${id}]`).join(", ")}.` : "";
  return `You are Parceltongue, the guide inside Yinzone, a tool that suggests which housing types fit a City of Pittsburgh parcel. Someone is looking at ${input.context.subject} and considering building: ${name}.${focus}

List the strongest reasons for and against building ${name} on this parcel, using only the FACTS below.

Write exactly this format and nothing else:
PROS:
- one pro [fact ids]
CONS:
- one con [fact ids]

Rules:
- A pro makes building ${name} here easier or better (for example allowed by right, a good site fit, good access, no mapped hazard). A con makes it harder or worse (for example not permitted, a poor fit, a hazard, an alert, displacement risk).
- Up to ${MAX_POINTS} pros and up to ${MAX_POINTS} cons, most important first. If the FACTS support fewer, write fewer. Never pad or repeat a point.
- Each point is one plain sentence of at most 25 words, specific to ${name} on this parcel: its zoning pathway and tile score, Jev's site fit for it, its alerts, the lot and hazards, and the scores and indicators that matter for it.
- End every point with the ids of the facts it uses in square brackets. A point without a fact behind it must be left out.
- Say only what the cited facts state about this parcel. A pillar's "measures in general" text describes the method, never this parcel's values. To say why something is strong or weak, cite the specific indicator fact that shows it.
- Don't overstate: if a fact says 0% of the lot is in a floodplain, say that, not "no flood risk".
- Each point makes a different point; don't restate the same fact in other words or make two points about the same topic.
- Write numbers as digits, copied exactly as the FACTS write them (never spelled out in words). Never estimate, calculate or invent a number, cost, price or legal status.
- When you quote an indicator's score (like "scores 64 of 100"), say it is that indicator's score, not the pillar's.
- Plain text only: no asterisks, bold, headings or extra commentary. Don't give advice.

FACTS:
${factLines}`;
}

const textOf = (parts: GeminiPart[]) => parts.map((p) => ("text" in p ? p.text : "")).join("");

/** Split the model's reply into its PROS and CONS sections. */
export function splitSections(reply: string): { pros: string; cons: string } {
  const pros: string[] = [];
  const cons: string[] = [];
  let into: string[] | null = null;
  for (const line of reply.split("\n")) {
    const heading = /^\s*(?:#+\s*)?\**\s*(pros?|cons?)\s*\**\s*:?\s*\**\s*$/i.exec(line);
    if (heading) {
      into = heading[1]!.toLowerCase().startsWith("pro") ? pros : cons;
      continue;
    }
    into?.push(line);
  }
  return { pros: pros.join("\n"), cons: cons.join("\n") };
}

/** Parsed, cited, number-checked points: at most MAX_POINTS, no duplicates. */
function points(section: string, facts: ChatFact[]): ReplyBlock[] {
  const allowed = facts.flatMap((f) => f.numbers);
  const seen = new Set<string>();
  const out: ReplyBlock[] = [];
  for (const block of parseReply(section, facts.map((f) => f.id))) {
    if (!block.fact_ids.length) continue;
    const kept = keepVerified(block, allowed);
    if (!kept) continue;
    const key = kept.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...kept, text: kept.text.replace(/[.!?]*$/, "."), type: "bullet" });
    if (out.length === MAX_POINTS) break;
  }
  return out;
}

export type Check = "pro" | "con" | "no" | "repeat";

/**
 * The checking pass. It sees each point with only the facts it cites, and no
 * pro/con label, and answers per point: "pro" or "con" if the facts directly
 * support it (and which side it's on), "no" if they don't, "repeat" if it
 * says the same as an earlier point.
 */
export function checkPrompt(name: string, items: { text: string; facts: string[] }[]): string {
  const list = items.map((item, i) => `${i + 1}. ${item.text}\n${item.facts.map((f) => `   fact: ${f}`).join("\n")}`).join("\n");
  return `You check claims about building ${name} on one land parcel. For each numbered point, answer on its own line with exactly one word:
"N: pro" if the facts listed under it directly state everything it says, and it is an advantage for building ${name} here;
"N: con" if the facts directly state everything it says, and it is a disadvantage or obstacle for building ${name} here;
"N: no" if any part is missing from its facts, stronger than them, calls an indicator's score the pillar's score, or is taken from a general description of a method rather than this parcel's values;
"N: repeat" if it says essentially the same thing as an earlier point.
Rewording is fine: judge what the point means, not its exact words. Answer every point and write nothing else.

${list}`;
}

/** The checking pass's answers. Unanswered points count as "no"; an unreadable reply is null. */
export function parseChecks(reply: string, count: number): Check[] | null {
  const answers = new Map<number, Check>();
  for (const line of reply.split("\n")) {
    const m = /^\s*(\d+)\s*[:.)-]\s*(pro|con|no|repeat)\b/i.exec(line);
    if (m) answers.set(Number(m[1]), m[2]!.toLowerCase() as Check);
  }
  if (!answers.size) return null;
  return Array.from({ length: count }, (_, i) => answers.get(i + 1) ?? "no");
}

/** The side the data itself gives a point: every cited fact with a tone agrees, or null. */
export function sideFromData(point: ReplyBlock, facts: ChatFact[]): "pro" | "con" | null {
  const tones = new Set(point.fact_ids.map((id) => facts.find((f) => f.id === id)?.tone).filter(Boolean));
  if (tones.size !== 1) return null;
  return tones.has("good") ? "pro" : "con";
}

/**
 * Sort points into pros and cons. The data decides where it can (the cited
 * facts' tone); otherwise the writer and the checker must agree, or the point
 * is dropped. Unsupported points, repeats, and a second point citing exactly
 * the same facts are dropped too. If the check can't run, the data's side or
 * the writer's side stands (the points already passed the citation and
 * number checks).
 */
async function checked(
  generate: GenerateFn,
  name: string,
  written: { point: ReplyBlock; side: "pro" | "con" }[],
  facts: ChatFact[],
  /** Cited-fact sets already used by earlier points, so a later pass can't repeat them. */
  citedSets = new Set<string>(),
): Promise<{ pros: ReplyBlock[]; cons: ReplyBlock[] }> {
  let checks: Check[] | null = null;
  if (written.length) {
    const byId = new Map(facts.map((f) => [f.id, f.text]));
    const items = written.map((w) => ({ text: w.point.text, facts: w.point.fact_ids.map((id) => byId.get(id) ?? "") }));
    try {
      const reply = textOf(await generate({ system: checkPrompt(name, items), contents: [{ role: "user", parts: [{ text: "Check each point." }] }] }));
      checks = parseChecks(reply, written.length);
    } catch {
      checks = null;
    }
  }

  const out = { pros: [] as ReplyBlock[], cons: [] as ReplyBlock[] };
  written.forEach((w, i) => {
    const check = checks?.[i];
    if (check === "no" || check === "repeat") return;
    const data = sideFromData(w.point, facts);
    const side = data ?? (!checks || check === w.side ? w.side : null);
    if (!side) return;
    const cited = [...w.point.fact_ids].sort().join(",");
    if (citedSets.has(cited)) return;
    citedSets.add(cited);
    const list = side === "pro" ? out.pros : out.cons;
    if (list.length < MAX_POINTS) list.push(w.point);
  });
  return out;
}

/** Create the scenario handler. `generate` is null when no API key is configured. */
export function createScenario(deps: { generate: GenerateFn | null }) {
  const cache = new Map<string, ScenarioResult>();

  return async function scenario(input: ScenarioInput): Promise<ScenarioResult> {
    if (!deps.generate) return { status: "unavailable", reason: "Pros and cons need the assistant, which isn't set up yet (no API key)." };

    const key = JSON.stringify([input.context, input.typology, input.focus]);
    const cached = cache.get(key);
    if (cached) return cached;

    const facts = factsFrom(input.context);
    const system = scenarioPrompt(facts, input);
    const contents: GeminiContent[] = [{ role: "user", parts: [{ text: `Pros and cons of building ${input.typology.name} here.` }] }];

    try {
      let reply = textOf(await deps.generate({ system, contents }));
      let { pros, cons } = splitSections(reply);
      const bad = unverifiedIn(parseReply(`${pros}\n${cons}`, facts.map((f) => f.id)), facts);
      if (bad.length) {
        contents.push(
          { role: "model", parts: [{ text: reply }] },
          {
            role: "user",
            parts: [{ text: `Some points used numbers that aren't in the FACTS: ${bad.join(", ")}. Rewrite the list using only numbers written as digits exactly as in the FACTS, or leave those details out.` }],
          },
        );
        reply = textOf(await deps.generate({ system, contents }));
        ({ pros, cons } = splitSections(reply));
      }

      const written = [
        ...points(pros, facts).map((point) => ({ point, side: "pro" as const })),
        ...points(cons, facts).map((point) => ({ point, side: "con" as const })),
      ];
      const used = new Set<string>();
      const { pros: prosOut, cons: consOut } = await checked(deps.generate, input.typology.name, written, facts, used);

      // One side came back empty although the data has facts for it (e.g. no
      // pros for a type that isn't permitted, despite a flood-free lot): ask
      // once for just that side, then run the same checks.
      for (const side of ["pro", "con"] as const) {
        const list = side === "pro" ? prosOut : consOut;
        const tone = side === "pro" ? "good" : "bad";
        if (list.length || !facts.some((f) => f.tone === tone)) continue;
        const heading = side === "pro" ? "PROS" : "CONS";
        const more = textOf(
          await deps.generate({
            system,
            contents: [
              ...contents,
              { role: "model", parts: [{ text: reply }] },
              {
                role: "user",
                parts: [{ text: `You gave no ${side}s that hold up. Using the same rules, list up to ${MAX_POINTS} ${side}s of building ${input.typology.name} here, under a ${heading}: heading only. Leave the list empty if the FACTS don't support any.` }],
              },
            ],
          }),
        );
        const section = side === "pro" ? splitSections(more).pros : splitSections(more).cons;
        const extra = await checked(deps.generate, input.typology.name, points(section, facts).map((point) => ({ point, side })), facts, used);
        list.push(...(side === "pro" ? extra.pros : extra.cons));
      }
      if (!prosOut.length && !consOut.length) {
        return { status: "unavailable", reason: "I couldn't write pros and cons I could verify against the data. Try again in a moment." };
      }
      const cited = new Set([...prosOut, ...consOut].flatMap((b) => b.fact_ids));
      const result: ScenarioResult = { status: "ok", pros: prosOut, cons: consOut, facts: facts.filter((f) => cited.has(f.id)) };
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      cache.set(key, result);
      return result;
    } catch {
      return { status: "unavailable", reason: "The assistant is busy right now. Please try again in a moment." };
    }
  };
}
