// Turns the explorer's selected parcel into what the chat reads: the same
// pillar scores, indicator breakdowns and zoning pathways the panels render,
// computed with the same functions, so the chat can't disagree with the screen.
import type { ChatContext, ContextFact, FactKind } from "@HouseHack/api/chat/types";
import { useMemo } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { overallPhrase, pillarPhrase } from "@/lib/pillars/phrases";
import { type ParcelScore, type PillarId, scoreMultiplier, scoreParcel } from "@/lib/pillars/score";
import { DEFAULT_WEIGHTS, type PillarWeights, usePillarWeights } from "@/lib/pillars/weights";

import { PATHWAY_META, TYPOLOGIES, zbaLine } from "../map/overlays/legal-feasibility";
import { CELL_NOTES, DISTRICT_PATHWAYS, LEGAL_MATRIX_AS_OF, LEGAL_MATRIX_SOURCE, PATHWAYS } from "../map/overlays/legal-matrix.generated";
import { formatRaw, INDICATORS, type ParcelData, percentileRank, useParcelData } from "../map/pillars-panel";
import { PATHWAY_SCORE } from "../map/typology-panel";

const SCORES_AS_OF = config.version.slice(0, 10);
const SCORES_SOURCE = `Groundwork pillars v${config.version}`;
const MAX_TEXT = 600;

const round = (n: number | null) => (n == null ? null : Math.round(n));
const clip = (text: string) => (text.length <= MAX_TEXT ? text : `${text.slice(0, MAX_TEXT - 1)}…`);

function fact(id: string, text: string, kind: FactKind, source = SCORES_SOURCE, source_url = "", as_of = SCORES_AS_OF): ContextFact {
  return { id, text: clip(text), kind, source, source_url, as_of };
}

// Codes rather than 0–100 scores (legal pathway, current use); covered by their own facts.
const CODE_UNITS = new Set(["pathway", "use"]);

function imputeFor(pillar: (typeof config.pillars)[number]): number | null {
  return (pillar as { impute?: number }).impute ?? (config.overall as { missing_pillar?: { impute: number } }).missing_pillar?.impute ?? null;
}

function pillarFacts(data: ParcelData, result: ParcelScore): ContextFact[] {
  return config.pillars.map((p) => {
    const id = p.id as PillarId;
    const score = result.pillars[id];
    const rank = percentileRank(data.quantiles?.[id], score.score);
    const phrase = pillarPhrase(result, id, data.norm);
    const impute = imputeFor(p);
    const subLabels = (p as { subscores?: { id: string; label: string }[] }).subscores ?? [];
    const subs = score.subscores
      .map((s) => `${subLabels.find((l) => l.id === s.id)?.label ?? s.id} ${round(s.score) ?? "not enough data"}`)
      .join(", ");
    const parts = [
      score.score == null
        ? `${p.label} pillar: not enough data to score${impute != null ? `; the overall score counts it as ${impute}, a conservative City value` : ""}.`
        : `${p.label} pillar: ${round(score.score)} of 100.`,
      phrase && `In plain words: ${phrase}.`,
      rank != null && `Better than ${rank}% of City parcels.`,
      p.description,
      subs && `Sub-scores: ${subs}.`,
      `${Math.round(score.coverage * 100)}% of its indicator weight has data.`,
      ...score.flags.map((f) => (f.capped ? `Warning: ${f.text}, so this pillar is capped.` : `Note: ${f.text}.`)),
    ];
    return fact(`pillar.${p.id}`, parts.filter(Boolean).join(" "), "value");
  });
}

// Per pillar, only what explains its score: the indicators adding the most
// points and the weakest ones. Keeps each question small (and fast) while
// still answering "why is this high/low".
const STRENGTHS = 2;
const WEAKNESSES = 2;

function keyIndicators(data: ParcelData) {
  return config.pillars.flatMap((p) => {
    const scored = INDICATORS.filter(
      (i) => i.pillar === p.id && i.weight > 0 && data.norm[i.id] != null && !CODE_UNITS.has(i.unit ?? ""),
    );
    const byValue = [...scored].sort((a, b) => (data.norm[b.id] as number) - (data.norm[a.id] as number));
    const picked = new Set([...byValue.slice(0, STRENGTHS), ...byValue.slice(-WEAKNESSES)]);
    return [...picked];
  });
}

function indicatorFacts(data: ParcelData, result: ParcelScore): ContextFact[] {
  const points = new Map<string, number>();
  for (const p of Object.values(result.pillars)) for (const c of p.contributions) points.set(c.indicator, c.share);
  return keyIndicators(data).map((ind) => {
    const pillar = config.pillars.find((p) => p.id === ind.pillar)?.label ?? ind.pillar;
    const raw = data.raw[ind.id];
    const norm = data.norm[ind.id];
    const share = points.get(ind.id);
    const n = ind.normalize as { method: string; direction?: string };
    const better = n.direction === "lower_is_better" ? "lower is better" : "higher is better";
    const text = `${ind.label}: ${formatRaw(raw, ind.unit)}. Scores ${norm} of 100 (${better}) and adds ${share?.toFixed(1) ?? "0.0"} points to the ${pillar} score.`;
    const kind: FactKind = ind.evidence === "assumption" ? "assumption" : ind.evidence === "value" ? "value" : "observed";
    const file = (ind.source as { file: string | string[] }).file;
    const dataset = (Array.isArray(file) ? file : [file]).map((f) => f.split("/").pop()).join(", ");
    return fact(`i.${ind.id}`, text, kind, `${dataset} (${ind.geography})`);
  });
}

// The housing types on the typology tiles, plus any other type this district
// allows without a hearing (so "what else could go here?" has an answer).
const MAIN_TYPOLOGIES = new Set(["single_detached", "single_attached", "two_unit", "three_unit", "multi_unit"]);
const EASY_PATHWAYS = new Set(["by_right", "za"]);

function typologyFacts(zoning: string): ContextFact[] {
  const row = DISTRICT_PATHWAYS[zoning];
  if (!row) return [];
  return TYPOLOGIES.flatMap(([id, label]) => {
    const pathwayId = row[id];
    if (!pathwayId || !(MAIN_TYPOLOGIES.has(id) || EASY_PATHWAYS.has(pathwayId))) return [];
    const meta = PATHWAY_META[pathwayId];
    const pathway = PATHWAYS[pathwayId];
    const score = PATHWAY_SCORE[pathwayId];
    const parts = [
      `${label}: ${meta?.label ?? pathwayId}.`,
      score != null && `Typology score ${score} of 100 (higher means fewer approvals or hearings).`,
      pathway && `Decided by ${pathway.decider}; public hearing: ${pathway.hearing}.`,
      CELL_NOTES[zoning]?.[id]?.unconfirmed && "This reading of the code is unconfirmed.",
      zbaLine(zoning, id) && `${zbaLine(zoning, id)}.`,
    ];
    return [fact(`t.${id}`, parts.filter(Boolean).join(" "), "policy", "Pittsburgh Zoning Code §911.02", LEGAL_MATRIX_SOURCE, LEGAL_MATRIX_AS_OF)];
  });
}

function definitions(): ContextFact[] {
  const def = (id: string, text: string) => fact(id, text, "definition", "Groundwork methodology");
  return [
    def("def.scale", config.scale),
    def(
      "def.overall",
      `The overall score blends the five pillars with a weighted ${config.overall.method} mean, so one strong pillar can't fully make up for a weak one. It is then multiplied by a zoning factor (whether housing is legal here) and a site factor (what is on the parcel now), so good access can't rescue a parcel where housing isn't allowed. The weights are the user's priorities, equal by default.`,
    ),
    def("def.missing", `Missing data is excluded and the remaining weights renormalized; a score needs at least ${Math.round(config.missing.min_coverage * 100)}% of its weight to have data.`),
  ];
}

function weightsText(weights: PillarWeights): string {
  const isDefault = config.pillars.every((p) => weights[p.id as PillarId] === DEFAULT_WEIGHTS[p.id as PillarId]);
  if (isDefault) return "equal weights";
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return `the user's priorities (${config.pillars.map((p) => `${p.label} ${Math.round((weights[p.id as PillarId] / total) * 100)}%`).join(", ")})`;
}

// The zoning, site and hazard factors that multiply the overall score, when they apply.
function statusFacts(result: ParcelScore): ContextFact[] {
  const facts: ContextFact[] = [];
  const { legal, availability, hazard } = result;
  if (legal) {
    const factor = legal.multiplier === 1 ? "so the overall score isn't reduced" : `so the overall score is multiplied by ${legal.multiplier}`;
    facts.push(fact("legal", `Zoning: ${legal.label}, ${factor}.${legal.note ? ` ${legal.note}` : ""}`, "policy", "Pittsburgh Zoning Code §911.02", LEGAL_MATRIX_SOURCE, LEGAL_MATRIX_AS_OF));
  }
  if (availability) {
    const factor = availability.multiplier === 1 ? "so the overall score isn't reduced" : `so the overall score is multiplied by ${availability.multiplier}`;
    facts.push(fact("site_use", `On the parcel now: ${availability.label}, ${factor}.${availability.note ? ` ${availability.note}` : ""}`, "observed"));
  }
  if (hazard) {
    facts.push(fact("site_hazard", `Deal-killer site hazard: ${hazard.flags.join("; ")}, so the overall score is multiplied by ${hazard.multiplier}.`, "observed"));
  }
  return facts;
}

/** What the chat may say about one explorer parcel: scores, key indicators and zoning, at the user's weights. */
export function parcelChatContext(pin: string, data: ParcelData | null, weights: PillarWeights = DEFAULT_WEIGHTS): ChatContext {
  const subject = `Parcel ${pin}`;
  if (!data) {
    const text = "No pillar scores for this parcel. Scores cover City of Pittsburgh parcels only.";
    return { subject, facts: [fact("parcel", `Parcel ${pin}: ${text}`, "observed")], notes: [text] };
  }

  const result = scoreParcel(data.norm, { pillars: weights });
  const multiplier = scoreMultiplier(result);
  const districtName = DISTRICT_PATHWAYS[data.zoning]?.full_zoning_type;
  const overall = round(result.overall);
  const rank = percentileRank(data.quantiles?.overall, result.overall);
  const phrase = overallPhrase(result, rank);
  const pillars = config.pillars.map((p) => ({ id: p.id, label: p.label, score: result.pillars[p.id as PillarId].score }));
  const weakest = pillars.filter((p) => p.score != null).sort((a, b) => (a.score as number) - (b.score as number))[0];
  const duplex = PATHWAY_META[DISTRICT_PATHWAYS[data.zoning]?.two_unit ?? ""];

  const overallText =
    overall == null
      ? "Overall score: not enough data to score."
      : [
          `Overall score: ${overall} of 100, blending the five pillars at ${weightsText(weights)}: ${pillars
            .map((p) => `${p.label} ${round(p.score) ?? "no data"}`)
            .join(", ")}.`,
          multiplier < 1 && result.overallBeforeMultipliers != null &&
            `The pillar blend alone is ${round(result.overallBeforeMultipliers)}; zoning, site and hazard factors bring it to ${overall}.`,
          phrase && `In plain words: ${phrase}.`,
          rank != null && `Better than ${rank}% of City parcels.`,
        ]
          .filter(Boolean)
          .join(" ");

  const facts: ContextFact[] = [
    fact(
      "parcel",
      `Parcel ${pin}: zoning district ${data.zoning || "unknown"}${districtName ? ` (${districtName.toLowerCase()})` : ""}.`,
      "observed",
      "City of Pittsburgh zoning",
      LEGAL_MATRIX_SOURCE,
      LEGAL_MATRIX_AS_OF,
    ),
    fact("overall", overallText, "value"),
    ...statusFacts(result),
    ...pillarFacts(data, result),
    ...typologyFacts(data.zoning),
    ...indicatorFacts(data, result),
    ...definitions(),
  ];

  return {
    subject,
    facts,
    scoring: {
      method: config.overall.method as "geometric" | "arithmetic",
      floor: config.overall.floor,
      multiplier,
      parts: config.pillars.map((p) => ({
        id: p.id,
        label: p.label,
        score: result.pillars[p.id as PillarId].score,
        weight: weights[p.id as PillarId],
        impute: imputeFor(p),
      })),
    },
    suggestions: [
      overall != null ? `Why is the overall score ${overall}?` : "Why can't this parcel be scored?",
      weakest ? `What's holding back ${weakest.label}?` : "What do the pillars measure?",
      multiplier < 0.9 ? "Why does zoning or the site lower the score?" : duplex ? "Could I build a duplex here?" : "What housing is allowed here?",
    ],
    notes: [
      overall != null ? `Overall score ${overall} of 100.` : "Not enough data for an overall score.",
      ...pillars.map((p) => `${p.label}: ${round(p.score) ?? "not enough data"}.`),
    ],
  };
}

/** The chat context for the explorer's selected parcel; null while nothing is selected or it's loading. */
export function useParcelChatContext(pin: string | null): ChatContext | null {
  const { pin: loadedPin, data, status } = useParcelData(pin);
  const weights = usePillarWeights();
  return useMemo(() => {
    if (!pin || loadedPin !== pin) return null;
    if (status === "ready" && data) return parcelChatContext(pin, data, weights);
    if (status === "missing") return parcelChatContext(pin, null);
    return null;
  }, [pin, loadedPin, data, status, weights]);
}
