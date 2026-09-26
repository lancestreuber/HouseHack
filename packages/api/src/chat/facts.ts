import { numbersIn } from "./guard";
import type {
  ChatFact,
  Consideration,
  Legal,
  ParcelReport,
  TypologyEval,
  TypologyId,
  Weights,
} from "./types";

export const TYPOLOGY_NAMES: Record<TypologyId, string> = {
  sfd: "Single-family home",
  adu: "ADU (backyard unit)",
  duplex: "Duplex",
  townhome: "Townhome",
  apartments: "Apartments",
  senior: "Senior housing",
};

const LEGAL_TEXT: Record<Legal, string> = {
  by_right: "allowed by right",
  needs_approval: "needs approval",
  not_allowed: "not allowed",
  uncertain: "legal status uncertain",
};

const METHODOLOGY = "Groundwork PGH methodology";
const METHODOLOGY_URL = "/methodology";

function definition(id: string, text: string): ChatFact {
  return { id, text, source: METHODOLOGY, source_url: METHODOLOGY_URL, as_of: "2026-09-27", kind: "definition", numbers: numbersIn(text) };
}

/** Plain-language definitions and limits the chatbot may always cite. */
export const DEFINITIONS: ChatFact[] = [
  definition("def.by_right", "Allowed by right means current zoning permits this housing type without a hearing; a building permit is still needed."),
  definition("def.needs_approval", "Needs approval means it could be allowed through a special exception, Administrator Exception or variance, which adds a hearing and time."),
  definition("def.not_allowed", "Not allowed means current zoning does not permit this housing type on this parcel."),
  definition("def.uncertain", "Uncertain means the zoning rules are unclear for this case; verify with the Zoning Administrator."),
  definition("def.parcel_score", "The Parcel Score is the average of the consideration scores, each multiplied by the weight you set with the sliders. It changes when you change the weights."),
  definition("def.fit", "Fit is how well a housing type suits this parcel, from 0 to 100. When it comes from Jev, a decision model, it shows Jev's confidence; otherwise it is a rule-based estimate."),
  definition("def.severity", "Each consideration is marked ok, consider or warn, based on its score and any hazard."),
  definition("def.suggestions", "Everything here is a suggestion to help you decide, not legal, financial or zoning advice. Zoning is a simplified interpretation; verify with the Zoning Administrator."),
  definition("def.limits", "This tool can't tell you about crime, water or sewer capacity, school quality, tornado risk, or market feasibility and building costs. Air quality is estimated from nearby permitted facility emissions, not measured exposure."),
  definition("def.adu", "ADUs aren't permitted in any Pittsburgh district today. Pending Bill 2025-1545 would allow them by right; it is not law yet."),
];

/** User-weighted mean of consideration scores (PLAN.md §0 "Algorithm"). */
export function parcelScore(considerations: Consideration[], weights: Weights): number | null {
  let sum = 0;
  let total = 0;
  for (const c of considerations) {
    const w = weights[c.id] ?? 1;
    if (c.score === null || w <= 0) continue;
    sum += c.score * w;
    total += w;
  }
  return total === 0 ? null : Math.round(sum / total);
}

function fact(id: string, text: string, src: Omit<ChatFact, "id" | "text" | "numbers">): ChatFact {
  return { id, text, numbers: numbersIn(text), ...src };
}

function considerationFact(prefix: string, c: Consideration): ChatFact {
  const score = c.score === null ? "no data" : `score ${c.score} of 100`;
  return fact(`${prefix}${c.id}`, `${c.name}: ${c.value}. ${c.comment} (${score}, ${c.severity}.)`, {
    source: c.source,
    source_url: c.source_url,
    as_of: c.as_of,
    kind: c.kind,
  });
}

function evalFact(prefix: string, e: TypologyEval, report: ParcelReport, names: Map<string, string>): ChatFact {
  const name = TYPOLOGY_NAMES[e.typology];
  const parts = [`${name}: ${LEGAL_TEXT[e.legal]}. ${e.legal_reason}`];
  if (e.legal !== "not_allowed" && e.fit !== null) {
    parts.push(
      e.source === "jev" && e.confidence !== null
        ? `Fit ${e.fit} of 100 from Jev, with ${Math.round(e.confidence * 100)}% confidence.`
        : `Fit ${e.fit} of 100 as a rule-based estimate (no Jev confidence).`,
    );
  }
  if (e.failing_demands.length) {
    parts.push(`Needs attention: ${e.failing_demands.map((d) => names.get(d) ?? d).join(", ")}.`);
  }
  if (e.major_concern_p !== undefined) {
    parts.push(`Jev sees a major concern with probability ${e.major_concern_p}.`);
  }
  const zoning = report.considerations.find((c) => c.id === "zoning");
  return fact(`${prefix}t.${e.typology}`, parts.join(" "), {
    source: e.source === "jev" ? "Jev (TypeSafe) + zoning rules" : "Rule-based estimate + zoning rules",
    source_url: zoning?.source_url ?? METHODOLOGY_URL,
    as_of: zoning?.as_of ?? "",
    kind: e.source === "jev" ? "assumption" : "evidence",
  });
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Every fact the chatbot may use for these parcels, with stable ids it can
 * cite. With more than one parcel, ids are prefixed `p1.`, `p2.`, …
 */
export function buildFacts(
  parcels: { report: ParcelReport; evals: TypologyEval[] }[],
  weights: Weights,
): ChatFact[] {
  const facts: ChatFact[] = [];
  parcels.forEach(({ report, evals }, i) => {
    const prefix = parcels.length > 1 ? `p${i + 1}.` : "";
    const f = report.features;
    const h = report.hood;
    const names = new Map(report.considerations.map((c) => [c.id, c.name]));
    const base = { source_url: report.considerations[0]?.source_url ?? METHODOLOGY_URL, as_of: report.considerations[0]?.as_of ?? "" };

    facts.push(
      fact(
        `${prefix}parcel`,
        `Parcel ${f.pin}${f.address ? ` at ${f.address}` : ""} in ${h.name}. Zoning ${f.zoning}. Lot ${f.lot_sqft.toLocaleString("en-US")} sq ft. ${f.city_owned ? "City-owned." : "Not city-owned."} ${f.is_vacant === null ? "Vacancy unknown." : f.is_vacant ? "Vacant." : "Not vacant."}`,
        { source: "Allegheny County parcels + City of Pittsburgh", kind: "evidence", ...base },
      ),
    );
    const score = parcelScore(report.considerations, weights);
    facts.push(
      fact(`${prefix}score`, score === null ? "Parcel Score unavailable: all weights are zero." : `Parcel Score ${score} of 100 with the current weights.`, {
        source: METHODOLOGY,
        source_url: METHODOLOGY_URL,
        as_of: base.as_of,
        kind: "assumption",
      }),
    );
    for (const c of report.considerations) facts.push(considerationFact(prefix, c));
    for (const e of evals) facts.push(evalFact(prefix, e, report, names));
    facts.push(
      fact(
        `${prefix}hood`,
        `${h.name}: ${pct(h.pct_65_plus)} of residents are 65+, ${pct(h.pct_under_18)} are under 18, average household size ${h.avg_hh_size}, ${pct(h.pct_single_person_hh)} of households are one person, vacancy rate ${pct(h.vacancy_rate)}, ${h.permits_3yr_per_1k_units} new-residential permits per 1,000 units over 3 years.`,
        { source: "ACS 2019–23 neighborhood profiles + PLI permits", kind: "evidence", ...base },
      ),
    );
    report.notes.forEach((n, j) =>
      facts.push(fact(`${prefix}note.${j + 1}`, n.text, { source: METHODOLOGY, source_url: METHODOLOGY_URL, as_of: base.as_of, kind: "assumption" })),
    );
    report.context.forEach((c, j) =>
      facts.push(fact(`${prefix}ctx.${j + 1}`, `${c.label}: ${c.value}.`, { source: c.label, source_url: c.source_url, as_of: base.as_of, kind: "evidence" })),
    );
  });
  return [...facts, ...DEFINITIONS];
}
