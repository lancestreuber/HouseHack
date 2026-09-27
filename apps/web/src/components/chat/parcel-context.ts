// Turns the explorer's selected parcel into what the chat reads: the same
// pillar scores, indicator breakdowns, typology tiles, Jev site-fit ratings and
// alerts the panels render, computed with the same functions, so the chat can't
// disagree with the screen. What-if scenarios (rezoning, vacant land) are
// computed here with scoreParcel too, so the chat never estimates a number.
import type { ChatContext, ContextFact, FactKind } from "@HouseHack/api/chat/types";
import { SITE_FIT_LEVELS } from "@HouseHack/api/typology/site-fit";
import { useMemo } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { overallPhrase, pillarPhrase } from "@/lib/pillars/phrases";
import { type ParcelScore, type PillarId, scoreMultiplier, scoreParcel } from "@/lib/pillars/score";
import { DEFAULT_PENCIL, type PencilAssumptions } from "@/lib/pillars/pencil";
import { usePencilAssumptions } from "@/lib/pillars/pencil-assumptions";

import { PATHWAY_META, TYPOLOGIES, zbaLine } from "../map/overlays/legal-feasibility";
import { CELL_NOTES, DISTRICT_PATHWAYS, LEGAL_MATRIX_AS_OF, LEGAL_MATRIX_SOURCE, PATHWAYS } from "../map/overlays/legal-matrix.generated";
import { typologyAlerts } from "../map/alerts-panel";
import { formatRaw, INDICATORS, type ParcelData, percentileRank, useParcelData, useTypologyFit } from "../map/pillars-panel";
import { type PillarWeights, usePillarWeights } from "../map/pillar-weights-store";
import { notPermittedScore, PATHWAY_SCORE } from "../map/typology-panel";
import { type FitsById, rezoningCloseness, rezoningLikelihood, SHORT_LABEL, SITE_FIT_TYPOLOGY, verdictFor } from "../map/typology-meta";

/** What parcels.typologyFit returns: lot facts, zoning gates and Jev's site-fit ratings. */
export type TypologyFit = NonNullable<ReturnType<typeof useTypologyFit>["data"]>;
/** The site-fit request's state, as the typology and Alerts panes see it. */
export type FitState = { status: "loading" } | { status: "error" } | { status: "ready"; data: TypologyFit };

const SCORES_AS_OF = config.version.slice(0, 10);
const SCORES_SOURCE = `Yinzone pillars v${config.version}`;
const MAX_TEXT = 600;

const round = (n: number | null) => (n == null ? null : Math.round(n));
/** Ends text with exactly one full stop (config phrases may already have one). */
const sentence = (text: string) => `${text.trim().replace(/[.!?]+$/, "")}.`;
const clip = (text: string) => (text.length <= MAX_TEXT ? text : `${text.slice(0, MAX_TEXT - 1)}…`);

/** Joins sentences in priority order, leaving out whole low-priority ones that don't fit. */
function within(parts: (string | false | null | undefined | 0)[], max = MAX_TEXT): string {
  let text = "";
  for (const part of parts) {
    if (!part) continue;
    const next = text ? `${text} ${part}` : part;
    if (next.length <= max) text = next;
  }
  return text;
}

function fact(id: string, text: string, kind: FactKind, source = SCORES_SOURCE, source_url = "", as_of = SCORES_AS_OF): ContextFact {
  return { id, text: clip(text), kind, source, source_url, as_of };
}

// Whether a fact makes the parcel clearly better or worse for building, from its
// own score (every score here is 0–100 with 100 = a good place to build). The
// middle band gets no tone. Scenario pros and cons are sorted by this.
type Tone = ContextFact["tone"];
const toneOf = (score: number | null | undefined, good = 75, bad = 40): Tone =>
  score == null ? undefined : score >= good ? "good" : score <= bad ? "bad" : undefined;
const withTone = (f: ContextFact, tone: Tone): ContextFact => (tone ? { ...f, tone } : f);

// Codes rather than 0–100 scores (legal pathway, current use); covered by their own facts.
const CODE_UNITS = new Set(["pathway", "use"]);

function imputeFor(pillar: (typeof config.pillars)[number]): number | null {
  return (pillar as { impute?: number }).impute ?? (config.overall as { missing_pillar?: { impute: number } }).missing_pillar?.impute ?? null;
}

function pillarFacts(data: ParcelData, result: ParcelScore): ContextFact[] {
  return config.pillars.flatMap((p) => {
    const id = p.id as PillarId;
    const score = result.pillars[id];
    const rank = percentileRank(data.quantiles?.[id], score.score);
    const phrase = pillarPhrase(result, id, data.norm);
    const impute = imputeFor(p);
    const subLabels = (p as { subscores?: { id: string; label: string }[] }).subscores ?? [];
    const subs = score.subscores
      .map((s) => `${subLabels.find((l) => l.id === s.id)?.label ?? s.id} ${round(s.score) ?? "not enough data"}`)
      .join(", ");
    // Most important first: facts are capped at 600 characters, and whatever
    // doesn't fit is left out whole (the general description goes first).
    const parts = [
      score.score == null
        ? `${p.label} pillar: not enough data to score${impute != null ? `; the overall score counts it as ${impute}, a conservative City value` : ""}.`
        : `${p.label} pillar: ${round(score.score)} of 100.`,
      phrase && `In plain words: ${sentence(phrase)}`,
      rank != null && `Better than ${rank}% of City parcels.`,
      subs && `Sub-scores: ${subs}.`,
      `${Math.round(score.coverage * 100)}% of its indicator weight has data.`,
      `What this pillar measures in general (not this parcel's values): ${p.description}`,
    ];
    // Warnings are their own facts: a strong pillar can still carry one, and they point the other way.
    const warnings = score.flags.map((f, i) =>
      withTone(
        fact(`warning.${p.id}.${i + 1}`, `${p.label} warning: ${f.text}${f.capped ? ", so this pillar is capped" : ""}.`, "observed"),
        "bad",
      ),
    );
    return [withTone(fact(`pillar.${p.id}`, within(parts), "value"), toneOf(score.score)), ...warnings];
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
    return withTone(fact(`i.${ind.id}`, text, kind, `${dataset} (${ind.geography})`), toneOf(norm));
  });
}

// Every housing type the typology tiles can show (their dropdowns list all 16),
// with the tile's name, score and, where Jev rates it, the site-fit bar. The
// five mainstream types get the full detail; the rest stay short.
const MAIN_TYPOLOGIES = new Set(config.legal.typologies);
const JEV_SOURCE = "Jev (System One) site-fit model";

/** The number on a typology tile: a fixed score per legal pathway, or the rezoning-based one if not permitted. */
export function tileScore(zoning: string, typologyId: string): number | null {
  const pathwayId = DISTRICT_PATHWAYS[zoning]?.[typologyId];
  if (!pathwayId) return null;
  return pathwayId === "not_permitted" ? notPermittedScore(zoning, typologyId) : (PATHWAY_SCORE[pathwayId] ?? null);
}

function typologyFacts(zoning: string, fit: TypologyFit | null): ContextFact[] {
  const row = DISTRICT_PATHWAYS[zoning];
  if (!row) return [];
  const fits = new Map((fit?.typologies ?? []).map((t) => [t.id as string, t.fit]));
  return TYPOLOGIES.flatMap(([id, label]) => {
    const pathwayId = row[id];
    if (!pathwayId) return [];
    const meta = PATHWAY_META[pathwayId];
    const pathway = PATHWAYS[pathwayId];
    const main = MAIN_TYPOLOGIES.has(id);
    // Same number as the typology tile: a fixed score per pathway, except
    // "not permitted", which reflects how realistic a rezoning would be.
    const notPermitted = pathwayId === "not_permitted";
    const score = tileScore(zoning, id);
    const siteFit = SITE_FIT_TYPOLOGY[id] ? fits.get(SITE_FIT_TYPOLOGY[id]) : undefined;
    // Most important first: facts are capped at 600 characters.
    const parts = [
      `${SHORT_LABEL[id] ?? label}: ${meta?.label ?? pathwayId}.`,
      score != null && `Typology tile score ${score} of 100 (higher means fewer approvals or hearings).`,
      CELL_NOTES[zoning]?.[id]?.unconfirmed && "This reading of the code is unconfirmed.",
      main &&
        notPermitted &&
        `Not-permitted types score 5 to 35 by how close a rezoning would be: rezoning closeness ${Math.round(rezoningCloseness(zoning, id) * 100)}%, district relief approval rate ${Math.round(rezoningLikelihood(zoning) * 100)}%.`,
      main && pathway && `Who decides: ${pathway.decider}. Public hearing: ${pathway.hearing}.`,
      main && zbaLine(zoning, id) && `${zbaLine(zoning, id)}.`,
      main && SHORT_LABEL[id] && SHORT_LABEL[id] !== label && `Zoning code use: ${label}.`,
    ];
    const tile = withTone(
      fact(`t.${id}`, within(parts), "policy", "Pittsburgh Zoning Code §911.02", LEGAL_MATRIX_SOURCE, LEGAL_MATRIX_AS_OF),
      toneOf(score, 85, 40),
    );
    // Jev's physical fit is its own fact: it can point the other way from legality.
    if (!siteFit) return [tile];
    const fitFact = fact(
      `fit.${id}`,
      `${SHORT_LABEL[id] ?? label}, Jev site fit: ${siteFit.label}, fit bar at ${Math.round(siteFit.fit * 100)}%, ${Math.round(siteFit.confidence * 100)}% confidence${siteFit.needsReview ? ", flagged for human review" : ""}.`,
      "assumption",
      JEV_SOURCE,
    );
    return [tile, withTone(fitFact, toneOf(siteFit.fit * 100, 75, 49))];
  });
}

// The same red / yellow / green verdict and pencil check the panels show. Physical
// fit and lot width join once the site-fit request has answered.
function verdictFacts(data: ParcelData, pencil: PencilAssumptions, fit: FitState): ContextFact[] {
  const fitsById: FitsById | undefined = fit.status === "ready" ? Object.fromEntries(fit.data.typologies.map((t) => [t.id, t.fit])) : undefined;
  const lotWidthFt = fit.status === "ready" ? fit.data.lot.widthFt : undefined;
  const facts = [...MAIN_TYPOLOGIES].map((id) => {
    const v = verdictFor(data.zoning, id, data, { fitsById, lotWidthFt, pencil });
    const text = (short: boolean) =>
      `Can a ${SHORT_LABEL[id] ?? id} be built here? ${v.level.toUpperCase()}, ${v.label}. Reasons: ${v.reasons
        .map((r) => `${r.level}: ${short ? r.text.split(/[;:]/)[0] : r.text}`)
        .join("; ")}.`;
    // Full reasons when they fit in one fact; otherwise each reason's first clause.
    return fact(`verdict.${id}`, text(false).length <= MAX_TEXT ? text(false) : text(true), "value");
  });
  facts.push(
    fact(
      "pencil.assumptions",
      `The pencil check assumes construction at $${pencil.costPerSf}/sf plus ${Math.round(config.pencil.soft_cost_pct * 100)}% soft costs, site work $${pencil.siteCostPerBuilding.toLocaleString()} per building, and a ${Math.round(config.pencil.margin_pct * 100)}% margin. ${config.pencil.not_priced}`,
      "assumption",
    ),
    fact("pencil.value_bias", config.pencil.value_bias, "assumption"),
  );
  return facts;
}

// Lot size and shape, hazards, how Jev rates fit, and the Alerts pane.

// What the tiles' fit bars are, whether or not Jev answered this time.
const FIT_BARS = `The fit bars on the typology tiles are Jev's rating of how well each housing type physically fits the lot, from its size, shape and hazards, on four levels: ${SITE_FIT_LEVELS.join(", ")}. Zoning is checked separately in code, not by Jev.`;

function siteFitFacts(fit: FitState): ContextFact[] {
  if (fit.status === "loading") return [fact("jev", `${FIT_BARS} For this parcel they and the alerts are still loading.`, "observed", JEV_SOURCE)];
  if (fit.status === "error") return [fact("jev", `${FIT_BARS} For this parcel they and the alerts couldn't be loaded right now.`, "observed", JEV_SOURCE)];
  const { data } = fit;
  const facts = [
    fact("lot", `Lot: ${data.facts.lot} ${data.facts.zoning}`, "observed", "Allegheny County parcel boundaries"),
    withTone(
      fact("hazards", `Hazards on the lot: ${data.facts.hazards}`, "observed", "FEMA, City and County hazard maps"),
      data.facts.hazards.startsWith("No mapped") ? "good" : "bad",
    ),
    data.jev.status === "ok"
      ? fact(
          "jev",
          `${FIT_BARS} Jev is a decision model (${data.jev.model}). The percentage beside each bar is Jev's confidence; low-confidence ratings are flagged for human review.`,
          "assumption",
          JEV_SOURCE,
        )
      : fact("jev", `${FIT_BARS} Jev isn't available right now, so the tiles show zoning scores only, with no fit bars.`, "observed", JEV_SOURCE),
  ];
  const alerts = typologyAlerts(data);
  if (!alerts.length) facts.push(fact("alerts", "The Alerts panel shows no alerts for this parcel.", "observed", JEV_SOURCE));
  for (const a of alerts) {
    const modelBased = a.notes.some((n) => n.startsWith("Physical fit") || n.startsWith("Site-fit"));
    facts.push(
      withTone(
        fact(`alert.${a.id}`, `Alerts for ${a.label}: ${a.notes.join(" ")}`, modelBased ? "assumption" : "policy", modelBased ? JEV_SOURCE : "Pittsburgh Zoning Code §911.02"),
        "bad",
      ),
    );
  }
  return facts;
}

// What-if scenarios, scored exactly like the real parcel. The zoning factor is
// the easiest legal pathway among the mainstream types in the district, as in
// scripts/pillars/build-indicators.ts; districts where housing is not permitted
// are skipped because their factor depends on nearby districts.
const RESIDENTIAL_BASES = ["R1D", "R1A", "R2", "R3", "RM"];
const DENSITIES = ["VL", "L", "M", "H", "VH"];
const PATHWAY_RANK = ["by_right", "za", "zbe_special_exception", "conditional_use", "not_permitted"];
const LEVEL_CODE = Object.fromEntries(config.legal.levels.map((l) => [l.id, l.code])) as Record<string, number>;

/** The zoning-factor level code a parcel would get in `district`, or null if it depends on the surroundings. */
export function legalCodeFor(district: string): number | null {
  const row = DISTRICT_PATHWAYS[district];
  if (!row) return null;
  const paths = config.legal.typologies.map((t) => row[t]).filter((p): p is string => Boolean(p));
  const ranked = paths.filter((p) => PATHWAY_RANK.includes(p)).sort((a, b) => PATHWAY_RANK.indexOf(a) - PATHWAY_RANK.indexOf(b));
  const best = ranked[0] ?? paths.find((p) => p === "per_plan" || p === "not_city_jurisdiction") ?? "unknown";
  if (best === "not_permitted") return null;
  if (best === "za" && district === "H") return LEVEL_CODE.za_hillside ?? null;
  return LEVEL_CODE[best] ?? null;
}

/** The other residential districts at the nearest density to this one. */
export function rezoningTargets(zoning: string): string[] {
  const [base, density = ""] = zoning.split("-");
  if (!base || !RESIDENTIAL_BASES.includes(base)) return [];
  const at = DENSITIES.indexOf(density);
  return RESIDENTIAL_BASES.filter((b) => b !== base).flatMap((b) => {
    const options = DENSITIES.map((d) => `${b}-${d}`).filter((code) => DISTRICT_PATHWAYS[code]);
    const nearest = options.sort(
      (x, y) => Math.abs(DENSITIES.indexOf(x.split("-")[1]!) - at) - Math.abs(DENSITIES.indexOf(y.split("-")[1]!) - at),
    )[0];
    return nearest ? [nearest] : [];
  });
}

function scenarioFacts(data: ParcelData, weights: PillarWeights, result: ParcelScore): ContextFact[] {
  const facts: ContextFact[] = [];
  const now = round(result.overall);
  const current = DISTRICT_PATHWAYS[data.zoning];
  for (const district of rezoningTargets(data.zoning)) {
    const code = legalCodeFor(district);
    const row = DISTRICT_PATHWAYS[district];
    if (code == null || !row) continue;
    const types = config.legal.typologies;
    if (current && types.every((t) => row[t] === current[t])) continue;
    const alt = scoreParcel({ ...data.norm, site_legal_pathway: code }, { pillars: weights });
    const tiles = types
      .map((t) => {
        const score = tileScore(district, t);
        return `${SHORT_LABEL[t] ?? t} ${PATHWAY_META[row[t] ?? ""]?.label ?? "unresolved"}${score != null ? ` (tile ${score})` : ""}`;
      })
      .join("; ");
    const name = row.full_zoning_type ? ` (${row.full_zoning_type.toLowerCase()})` : "";
    facts.push(
      fact(
        `whatif.rezone.${district.toLowerCase()}`,
        `What if the parcel were rezoned to ${district}${name}, hypothetically: ${tiles}. ${
          (alt.legal?.multiplier ?? 1) === (result.legal?.multiplier ?? 1)
            ? `The zoning factor would stay ${alt.legal?.multiplier ?? 1}, so the overall score would stay ${now}, because housing is already allowed here.`
            : `The zoning factor would be ${alt.legal?.multiplier ?? 1} instead of ${result.legal?.multiplier ?? 1}, so the overall score would be ${round(alt.overall)} instead of ${now} at the current weights.`
        } A hypothetical, not a prediction that a rezoning would be approved.`,
        "value",
      ),
    );
  }
  const site = result.availability;
  if (site && site.multiplier < 1) {
    const vacant = config.availability.levels.find((l) => l.id === "site");
    if (vacant) {
      const alt = scoreParcel({ ...data.norm, site_parcel_use: vacant.code }, { pillars: weights });
      facts.push(
        fact(
          "whatif.vacant",
          `What if the parcel were ${vacant.label.toLowerCase()}, hypothetically: the site factor would be ${vacant.multiplier} instead of ${site.multiplier}, so the overall score would be ${round(alt.overall)} instead of ${now} at the current weights.`,
          "value",
        ),
      );
    }
  }
  return facts;
}

function definitions(): ContextFact[] {
  const def = (id: string, text: string) => fact(id, text, "definition", "Yinzone methodology", "/resources");
  return [
    def("def.scale", config.scale),
    def(
      "def.overall",
      `The overall score blends the five pillars with a weighted ${config.overall.method} mean, so one strong pillar can't fully make up for a weak one. It is then multiplied by a zoning factor (whether housing is legal here), a site factor (what is on the parcel now) and, for deal-killer hazards (floodway, sliver lot, mapped mines), a hazard factor, so good access can't rescue a parcel where housing isn't allowed or can't safely go. The weights are the user's priorities, equal by default.`,
    ),
    def("def.missing", `Missing data is excluded and the remaining weights renormalized; a score needs at least ${Math.round(config.missing.min_coverage * 100)}% of its weight to have data.`),
    ...Object.entries(config.presets).map(([name, w]) =>
      def(
        `def.preset.${name}`,
        `The "${name.replace(/_/g, " ")}" weight preset in the Weights menu sets ${config.pillars
          .map((p) => `${p.label} ${(w as Record<string, number>)[p.id] ?? p.weight}`)
          .join(", ")} (0 to 3, 1 is the default).`,
      ),
    ),
  ];
}

// The navbar's weights hold only what the user changed; the rest are the published defaults.
const weightOf = (weights: PillarWeights, p: (typeof config.pillars)[number]) => weights[p.id as PillarId] ?? p.weight;

function weightsText(weights: PillarWeights): string {
  if (config.pillars.every((p) => weightOf(weights, p) === p.weight)) return "equal weights";
  const total = config.pillars.reduce((a, p) => a + weightOf(weights, p), 0) || 1;
  return `the user's priorities (${config.pillars.map((p) => `${p.label} ${Math.round((weightOf(weights, p) / total) * 100)}%`).join(", ")})`;
}

// The zoning, site and hazard factors that multiply the overall score, when they apply.
function statusFacts(result: ParcelScore): ContextFact[] {
  const facts: ContextFact[] = [];
  const { legal, availability, hazard } = result;
  if (legal) {
    const factor = legal.multiplier === 1 ? "so the overall score isn't reduced" : `so the overall score is multiplied by ${legal.multiplier}`;
    const tone: Tone = legal.multiplier >= 0.98 ? "good" : legal.multiplier < 0.9 ? "bad" : undefined;
    facts.push(withTone(fact("legal", `Zoning: ${legal.label}, ${factor}.${legal.note ? ` ${legal.note}` : ""}`, "policy", "Pittsburgh Zoning Code §911.02", LEGAL_MATRIX_SOURCE, LEGAL_MATRIX_AS_OF), tone));
  }
  if (availability) {
    const factor = availability.multiplier === 1 ? "so the overall score isn't reduced" : `so the overall score is multiplied by ${availability.multiplier}`;
    facts.push(withTone(fact("site_use", `On the parcel now: ${availability.label}, ${factor}.${availability.note ? ` ${availability.note}` : ""}`, "observed"), availability.multiplier === 1 ? "good" : "bad"));
  }
  if (hazard) {
    facts.push(withTone(fact("site_hazard", `Deal-killer site hazard: ${hazard.flags.join("; ")}, so the overall score is multiplied by ${hazard.multiplier}.`, "observed"), "bad"));
  }
  return facts;
}

/** What the chat may say about one explorer parcel: scores, key indicators and zoning, at the user's weights. */
export function parcelChatContext(
  pin: string,
  data: ParcelData | null,
  weights: PillarWeights = {},
  fit: FitState = { status: "loading" },
  pencil: PencilAssumptions = DEFAULT_PENCIL,
): ChatContext {
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
  const rezoneTo = (result.legal?.multiplier ?? 1) < 0.9 ? rezoningTargets(data.zoning).find((d) => legalCodeFor(d) != null) : undefined;

  const overallText =
    overall == null
      ? "Overall score: not enough data to score."
      : [
          `Overall score: ${overall} of 100, blending the five pillars at ${weightsText(weights)}: ${pillars
            .map((p) => `${p.label} ${round(p.score) ?? "no data"}`)
            .join(", ")}.`,
          multiplier < 1 && result.overallBeforeMultipliers != null &&
            `The pillar blend alone is ${round(result.overallBeforeMultipliers)}; zoning, site and hazard factors bring it to ${overall}.`,
          phrase && `In plain words: ${sentence(phrase)}`,
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
    withTone(fact("overall", overallText, "value"), toneOf(result.overall)),
    ...statusFacts(result),
    ...pillarFacts(data, result),
    ...typologyFacts(data.zoning, fit.status === "ready" ? fit.data : null),
    ...siteFitFacts(fit),
    ...scenarioFacts(data, weights, result),
    ...indicatorFacts(data, result),
    ...verdictFacts(data, pencil, fit),
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
        weight: weightOf(weights, p),
        impute: imputeFor(p),
      })),
    },
    suggestions: [
      overall != null ? `Why is the overall score ${overall}?` : "Why can't this parcel be scored?",
      weakest ? `What's holding back ${weakest.label}?` : "What do the pillars measure?",
      rezoneTo
        ? `What if this were rezoned to ${rezoneTo}?`
        : multiplier < 0.9
          ? "Why does zoning or the site lower the score?"
          : duplex
            ? "Could I build a duplex here?"
            : "What housing is allowed here?",
    ],
    notes: [
      overall != null ? `Overall score ${overall} of 100.` : "Not enough data for an overall score.",
      ...pillars.map((p) => `${p.label}: ${round(p.score) ?? "not enough data"}.`),
    ],
  };
}

/** How Yinzone works, for pages with no parcel selected: the same definitions the parcel chat uses. */
export function generalChatContext(): ChatContext {
  return {
    subject: "How Yinzone works",
    facts: [
      ...config.pillars.map((p) => fact(`pillar.${p.id}`, `${p.label} pillar: ${p.description}`, "definition", "Yinzone methodology", "/resources")),
      // One fact per level: the full lists don't fit in one.
      ...config.legal.levels.map((l) =>
        fact(`def.zoning.${l.id}`, `Zoning factor: "${l.label}" multiplies the overall score by ${l.multiplier}.`, "policy", "Yinzone methodology", "/resources"),
      ),
      ...config.availability.levels.map((l) =>
        fact(`def.site.${l.id}`, `Site factor: "${l.label}" multiplies the overall score by ${l.multiplier}.`, "observed", "Yinzone methodology", "/resources"),
      ),
      fact(
        "def.tiles",
        `Typology tile scores: by right ${PATHWAY_SCORE.by_right}, Zoning Administrator exception ${PATHWAY_SCORE.za}, special exception ${PATHWAY_SCORE.zbe_special_exception}, conditional use ${PATHWAY_SCORE.conditional_use}; not permitted scores 5 to 35 by how close a rezoning would be. Higher means fewer approvals or hearings.`,
        "policy",
        "Yinzone methodology",
        "/resources",
      ),
      fact("jev", FIT_BARS, "definition", JEV_SOURCE),
      ...definitions(),
    ],
    suggestions: ["How is the overall score calculated?", "What do the five pillars measure?", "What do the typology tile scores mean?"],
    notes: ["Pick a parcel on the map to ask about it."],
  };
}

/** The chat context for the explorer's selected parcel; null while nothing is selected or it's loading. */
export function useParcelChatContext(pin: string | null): ChatContext | null {
  const { pin: loadedPin, data, status } = useParcelData(pin);
  const weights = usePillarWeights();
  const pencil = usePencilAssumptions();
  const ready = pin != null && loadedPin === pin && status === "ready" ? data : null;
  // The same cached request the typology and Alerts panes use.
  const query = useTypologyFit(pin ?? "", ready);
  const fit: FitState = query.data ? { status: "ready", data: query.data } : query.isError ? { status: "error" } : { status: "loading" };
  return useMemo(() => {
    if (!pin || loadedPin !== pin) return null;
    if (status === "ready" && data) return parcelChatContext(pin, data, weights, fit, pencil);
    if (status === "missing") return parcelChatContext(pin, null);
    return null;
    // `fit` is rebuilt each render; its inputs are listed instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, loadedPin, data, status, weights, query.data, query.isError, pencil]);
}
