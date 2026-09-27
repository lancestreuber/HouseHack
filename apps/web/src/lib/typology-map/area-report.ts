// The report for one rezoning area: what the three public levers local
// government holds (zoning, incentives, public land) look like there, plus an
// equity guardrail. Hackathon SMEs (2026-09-27): the end user is a government
// planner, and those three levers are how government steers where housing goes.
// Every sentence comes from counts the engine computed or from sourced research
// facts; the chat explains these facts and never adds numbers of its own.

import type { ChatContext, ContextFact, FactKind } from "@HouseHack/api/chat/types";

import { DISTRICT_PATHWAYS } from "@/components/map/overlays/legal-matrix.generated";
import { SHORT_LABEL } from "@/components/map/typology-meta";

import { CAPACITY_ASSUMPTIONS } from "./capacity";
import { type Cluster, EASE_WEIGHTS, HEAT_TYPOLOGIES, type HeatParams, type MvaGroup, mostlyStressed } from "./engine";

export type Tone = "go" | "maybe" | "stop" | "unknown" | "warn";
export type ReportLine = { id: string; label: string; value: string; kind: FactKind; source: string };
export type ReportSection = { key: "homes" | "zoning" | "incentives" | "land" | "equity"; title: string; answer: string; tone: Tone; lines: ReportLine[] };
export type AreaReport = { id: number; title: string; subtitle: string; sections: ReportSection[] };

const COUNCIL = "Council land-use actions 2015–26 (research/knowledge/data/legal-feasibility-datasets.md)";
const APPROVAL = "Pittsburgh approval pathway (research/knowledge/policy/approval-pathway.md)";
const ZBA = "Zoning Board decisions 2023–26 (research team)";
const HUD = "HUD QCT/DDA 2026 and Opportunity Zones (designation-areas overlay)";
const OVERLAYS = "City of Pittsburgh zoning overlays (City ArcGIS)";
const URA = "URA Rental Gap Program guidelines (Aug 2024)";
const CITY_LAND = "City-owned property, treasurer sales and tax delinquency (WPRDC)";
const MVA = "Reinvestment Fund Market Value Analysis 2021 (WPRDC)";
const ENGINE = "Yinzone where-to-build engine (§903.03 envelope estimate)";

const LIHTC_TYPES = new Set(["multi_unit"]);
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const of = (n: number, total: number) => `${fmt(n)} of ${fmt(total)} parcels`;
const line = (id: string, label: string, value: string, kind: FactKind, source: string): ReportLine => ({ id, label, value, kind, source });

const MVA_LABEL: Record<MvaGroup, string> = {
  robust: "Robust (A–C)",
  steady: "Steady (D–F)",
  transitional: "Transitional (G–H)",
  stressed: "Stressed (I–J)",
  unclassified: "Not classified",
};

function easeText(c: Cluster) {
  const step = c.easeParts.step === 1 ? "only the density suffix changes" : c.easeParts.step === 0.5 ? "one step up the district ladder" : "a big jump in district";
  const border = c.easeParts.borders ? `the area touches an existing ${c.target.split("-")[0]} district, so the rezoning extends it` : `no ${c.target.split("-")[0]} district next door`;
  return `${Math.round(c.ease * 100)}/100: ${step}; ${border}; the Zoning Board approves ${Math.round(c.easeParts.approval * 100)}% of relief requests in this district. Weights ${EASE_WEIGHTS.step * 100}/${EASE_WEIGHTS.borders * 100}/${EASE_WEIGHTS.approval * 100} are value judgments.`;
}

function alsoAllowed(zones: string[], target: string, typology: string) {
  const after = DISTRICT_PATHWAYS[target] ?? {};
  return HEAT_TYPOLOGIES.filter((t) => t !== typology && after[t] === "by_right" && zones.some((z) => DISTRICT_PATHWAYS[z]?.[t] !== "by_right")).map((t) => SHORT_LABEL[t] ?? t);
}

export function areaReport(c: Cluster, params: HeatParams): AreaReport {
  const n = c.parcels.length;
  const type = SHORT_LABEL[params.typology] ?? params.typology;
  const l = c.levers;
  const zones = c.zones.join(", ");

  const homes: ReportSection = {
    key: "homes",
    title: "Homes",
    answer: `+${fmt(c.homes)} homes (${type.toLowerCase()}), ${fmt(c.affordableHomes)} affordable`,
    tone: "go",
    lines: [
      line("area.homes", "New homes", `About ${fmt(c.homes)} more homes than today's zoning allows, on ${fmt(n)} parcels (${c.acres.toFixed(1)} acres, ${fmt(c.vacant)} vacant or parking). A rough envelope estimate, not a site plan.`, "assumption", ENGINE),
      line("area.affordable", "Affordable", `${fmt(c.affordableHomes)} if ${Math.round(params.rezone.affordableShare * 100)}% of new homes are income-restricted (your assumption; the IZ overlay and the proposed bonus use 10%).`, "assumption", ENGINE),
      line("area.fit", "Why here", `Every parcel rates as a good ${type.toLowerCase()} site with zoning set aside, under your weights and checks, and today's zoning is the only blocker.`, "value", ENGINE),
    ],
  };

  const also = alsoAllowed(c.zones, c.target, params.typology);
  const zoningLines = [
    line("area.zoning.change", "What changes", `A zoning map amendment moves these parcels from ${zones} to ${c.target}, where ${type.toLowerCase()} is allowed by right.`, "policy", APPROVAL),
    line("area.zoning.who", "Who decides", "City Council votes on the map amendment. A Registered Community Organization (RCO) Development Activities Meeting is required first.", "policy", APPROVAL),
    line("area.zoning.record", "Track record", "42 of 49 site rezonings adopted since 2015, none voted down; median 123 days at Council.", "evidence", COUNCIL),
    line("area.zoning.ease", "Ease of rezoning", easeText(c), "value", ENGINE),
    line("area.zoning.variance", "Per-project alternative", "A use variance from the Zoning Board, one project at a time: the builder must show hardship (five findings, §922.09). 22 of 30 granted 2023–26; runs high because withdrawn cases are missing.", "evidence", ZBA),
  ];
  if (also.length) zoningLines.push(line("area.zoning.also", "Also allowed after", `${also.join(", ")} (by right in ${c.target}).`, "policy", APPROVAL));
  if (l.inclusionary)
    zoningLines.push(line("area.zoning.iz", "Inclusionary zoning", `${of(l.inclusionary, n)} are in the Inclusionary Housing Overlay: projects of 20+ units must include affordable units (reported as 10% at 50% AMI; not yet read in the code).`, "policy", OVERLAYS));
  if (l.historic) zoningLines.push(line("area.zoning.historic", "Historic review", `${of(l.historic, n)} are in a historic district or landmark site: exterior design needs historic review.`, "policy", OVERLAYS));
  if (l.parkingReduction) zoningLines.push(line("area.zoning.parking", "Parking", `${of(l.parkingReduction, n)} are in a parking-reduction or transit area: fewer spaces required.`, "policy", OVERLAYS));
  const zoning: ReportSection = {
    key: "zoning",
    title: "Zoning: what the rezoning takes",
    answer: `${zones} → ${c.target}, ease ${Math.round(c.ease * 100)}/100`,
    tone: c.ease >= 0.6 ? "go" : c.ease >= 0.4 ? "maybe" : "stop",
    lines: zoningLines,
  };

  const lihtc = LIHTC_TYPES.has(params.typology);
  const incentiveLines: ReportLine[] = [];
  if (!l.known) incentiveLines.push(line("area.incentive.unknown", "Designations", "Not in this data build; unknown.", "evidence", HUD));
  else {
    const basis = lihtc ? "affordable rentals financed with Low-Income Housing Tax Credits can claim up to 30% more eligible basis" : `only helps tax-credit rentals, not ${type.toLowerCase()}`;
    incentiveLines.push(line("area.incentive.qct", "Qualified Census Tract", `${of(l.qct, n)}${l.qct ? `: ${basis}` : ""}.`, "evidence", HUD));
    incentiveLines.push(line("area.incentive.dda", "Difficult Development Area", `${of(l.dda, n)}${l.dda ? `: ${basis}` : ""}.`, "evidence", HUD));
    incentiveLines.push(
      line("area.incentive.oz", "Opportunity Zone", `${of(l.oz, n)}${l.oz ? ": investors can defer federal capital-gains tax (2018 designation; whether it carries past 2026 is unverified)" : ""}.`, "evidence", HUD),
    );
  }
  if (params.typology === "multi_unit")
    incentiveLines.push(line("area.incentive.ura", "URA Rental Gap (City-wide)", "Up to $75k per unit at 30% AMI, $50k at 50%, $35k at 60%; 4+ units; $2M per project.", "policy", URA));
  incentiveLines.push(line("area.incentive.local", "Local abatements (LERTA, TIF)", "Not in our data yet: unknown, not absent.", "evidence", "Not yet collected"));
  const incentives: ReportSection = {
    key: "incentives",
    title: "Incentives",
    answer: !l.known ? "Unknown" : l.anyIncentive ? `${of(l.anyIncentive, n)} in a federal designation` : "No federal designation here",
    tone: !l.known ? "unknown" : l.anyIncentive ? (lihtc || l.oz ? "go" : "maybe") : "unknown",
    lines: incentiveLines,
  };

  const cityControl = l.cityForSale + l.cityTransfer + l.cityPending;
  const landLines = l.known
    ? [
        line("area.land.city", "City-owned", `${fmt(l.cityForSale)} for sale, ${fmt(l.cityTransfer)} being transferred to the URA or Land Bank, ${fmt(l.cityPending)} with a deal pending, ${fmt(l.cityHeld)} held.`, "evidence", CITY_LAND),
        line("area.land.tax", "Tax-delinquent", `${fmt(l.delinquent)} parcels behind on City property taxes (${fmt(l.delinquent3)} for 3+ years); ${fmt(l.treasurySale)} on the treasurer's sale list. Long delinquency is how many lots reach tax sale or the Land Bank.`, "evidence", CITY_LAND),
        line("area.land.landbank", "Land Bank", "Publishes no parcel list, so Land Bank lots may not show here. Its sales need a two-thirds board vote, 30+ days' notice and a sign, then a 20-day objection window.", "policy", "Pittsburgh Land Bank disposition process (2022)"),
      ]
    : [line("area.land.unknown", "Public land", "Not in this data build; unknown.", "evidence", CITY_LAND)];
  const land: ReportSection = {
    key: "land",
    title: "Public land",
    answer: !l.known ? "Unknown" : cityControl ? `${fmt(cityControl)} City lots the City can move` : l.delinquent ? `No City lots; ${fmt(l.delinquent)} tax-delinquent` : "No City-controlled lots",
    tone: !l.known ? "unknown" : cityControl ? "go" : l.delinquent ? "maybe" : "stop",
    lines: landLines,
  };

  const mix = (Object.keys(MVA_LABEL) as MvaGroup[]).filter((g) => l.mva[g] > 0).map((g) => `${MVA_LABEL[g]} ${of(l.mva[g], n)}`);
  const stressed = mostlyStressed(l);
  const equity: ReportSection = {
    key: "equity",
    title: "Equity guardrail",
    answer: !l.known ? "Market type unknown" : stressed ? "Mostly Transitional or Stressed markets: consult first" : "Check with the community",
    tone: stressed ? "warn" : "unknown",
    lines: [
      ...(l.known ? [line("area.equity.mva", "Market type", `${mix.join("; ")}.`, "evidence", MVA)] : []),
      ...(stressed
        ? [
            line(
              "area.equity.warn",
              "Why it matters",
              "Transitional and Stressed markets hold 45% and 21% of Pittsburgh's Black residents (MVA 2021 summary). Density rankings tend to land here. Consult the RCO and weigh anti-displacement tools (community land trust, inclusionary or rent-restricted units) before acting.",
              "evidence",
              MVA,
            ),
          ]
        : []),
      line("area.equity.limits", "What this can't say", "The tool doesn't know community plans, lived experience or owners' intent, and it never says what a neighborhood should get. The published displacement ratio (DRR) is not used: it flags Robust markets, not these.", "value", "research/knowledge/track3/displacement-and-equity.md"),
    ],
  };

  return {
    id: c.id,
    title: `Rezoning area #${c.id}: ${zones} → ${c.target}`,
    subtitle: `${fmt(n)} parcels · ${c.acres.toFixed(1)} acres · home counts are rough envelope estimates (${CAPACITY_ASSUMPTIONS.maxCoverage * 100}% max lot coverage assumed).`,
    sections: [homes, zoning, incentives, land, equity],
  };
}

/** Chat context for an area report: the same facts the report shows, nothing more. */
export function areaChatContext(report: AreaReport, asOf: string): ChatContext {
  const facts: ContextFact[] = report.sections.flatMap((s) =>
    s.lines.map((l) => ({ id: l.id, text: `${s.title} — ${l.label}: ${l.value}`.slice(0, 600), kind: l.kind, source: l.source, source_url: "", as_of: asOf })),
  );
  return {
    subject: report.title,
    facts: [{ id: "area", text: `${report.title}. ${report.subtitle}`.slice(0, 600), kind: "observed", source: ENGINE, source_url: "", as_of: asOf }, ...facts],
    suggestions: ["What would this rezoning take?", "Which public levers line up here?", "What should we check before pushing this?"],
    notes: report.sections.map((s) => `${s.title}: ${s.answer}`),
  };
}
