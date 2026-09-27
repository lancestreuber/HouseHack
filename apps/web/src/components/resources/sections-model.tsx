import { MODELS as CHAT_MODELS } from "@HouseHack/api/chat/gemini";
import { REVIEW_CONFIDENCE, SITE_FIT_LEVELS, TYPOLOGIES as SITE_FIT_TYPOLOGIES } from "@HouseHack/api/typology/site-fit";
import { Fragment } from "react";

import { PATHWAY_META, TYPOLOGIES } from "@/components/map/overlays/legal-feasibility";
import { DISTRICT_PATHWAYS, LEGAL_MATRIX_AS_OF, LEGAL_MATRIX_SOURCE, PATHWAYS, ZBA_OUTCOMES } from "@/components/map/overlays/legal-matrix.generated";
import { PATHWAY_SCORE } from "@/components/map/typology-panel";
import config from "@/lib/pillars/pillars.config.json";
import { overallScore, type PillarId, type PillarScore } from "@/lib/pillars/score";

import { DataTable, Equation, ExtLink, Mono, Panel, Section, SubHead, Tag, Tex } from "./ui";

type Indicator = (typeof config.indicators)[number] & {
  sub?: string;
  normalize: { method: string; direction?: string; reference?: string; zero?: number; full?: number };
  source: { kind: string; file?: string | string[]; property?: string; radius_m?: number; max_m?: number; transform?: string };
};
type Condition = { indicator: string; below?: number; atLeast?: number; notEquals?: number };
type Gate = { indicator?: string; below?: number; when?: Condition[]; cap: number; flag: string };
type Pillar = {
  id: string;
  label: string;
  weight: number;
  description: string;
  subscores?: { id: string; label: string; weight: number; description: string }[];
  gates?: Gate[];
  min_coverage?: number;
  impute?: number;
  direction_note?: string;
};

const INDICATORS = config.indicators as Indicator[];
const PILLARS = config.pillars as unknown as Pillar[];
const LABEL: Record<string, string> = Object.fromEntries(INDICATORS.map((i) => [i.id, i.label]));
const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

function normalizeText(n: Indicator["normalize"]) {
  if (n.method === "percentile") {
    const ref = n.reference === "parcels" ? "vs. City parcels" : "vs. county units";
    return `percentile ${n.direction === "lower_is_better" ? "↓" : "↑"} ${ref}`;
  }
  if (n.method === "linear") return `linear ${n.zero} → 0, ${n.full} → 100`;
  return "code (already 0–100)";
}

function sourceText(s: Indicator["source"]) {
  const files = s.file == null ? [] : Array.isArray(s.file) ? s.file : [s.file];
  const file = files.map((f) => f.split("/").pop()).join(" + ");
  const extra = s.radius_m ? ` within ${s.radius_m} m` : s.max_m ? ` ≤ ${s.max_m} m` : "";
  return `${s.kind}${extra}: ${file ?? ""}${s.property ? ` → ${s.property}` : ""}${s.transform ? ` (${s.transform})` : ""}`;
}

function gateText(g: Gate) {
  return (g.when ?? [{ indicator: g.indicator ?? "", below: g.below }])
    .map((c) => {
      const label = LABEL[c.indicator] ?? c.indicator;
      if (c.below != null) return `${label} score < ${c.below}`;
      if (c.atLeast != null) return `${label} score ≥ ${c.atLeast}`;
      if (c.notEquals != null) return `${label} ≠ ${c.notEquals}`;
      return label;
    })
    .join(" AND ");
}

// ─── Overview ────────────────────────────────────────────────────────────────

const STAGES: { tag: string; title: string; body: string }[] = [
  { tag: "observed", title: "1 · Public data", body: "134 datasets from City, County, WPRDC, Census, HUD, FEMA, EPA, USGS, PA agencies and OSM, pulled 2026-09-26/27." },
  { tag: "code", title: "2 · Build scripts", body: "Clip to Allegheny County, clean known traps, write map overlays and per-parcel indicator shards. No model involved." },
  { tag: "code", title: "3 · Normalize", body: `${INDICATORS.length} indicators → 0–100 by percentile rank or fixed linear thresholds. 100 = a good place to build.` },
  { tag: "value", title: "4 · Weight + aggregate", body: "Open weights (a published JSON file) → sub-scores → 5 pillars → overall. Hazard gates cap Site Feasibility." },
  { tag: "policy", title: "5 · Legal + availability", body: "Zoning use table (§911.02) and current land use multiply the overall score. Legality is read from code, never estimated." },
  { tag: "model", title: "6 · Site fit (Jev)", body: "A typed decision model rates physical fit per housing type from facts code already computed. Shown with its confidence." },
  { tag: "llm", title: "7 · Explain (chat)", body: "Gemini explains on-screen facts with citations. Sentences with numbers not found in the facts are dropped." },
];

export function OverviewSection() {
  return (
    <Section
      id="overview"
      code="01"
      title="How a parcel gets its numbers"
      lede={
        <>
          Everything the map shows comes from public data run through deterministic code, with open weights you can change. Two AI components sit at the edges: one rates physical
          site fit, one explains. Neither decides legality or produces a score you can't trace. This page is generated from the same config and registry files the app reads, so it
          can't drift from what the UI does.
        </>
      }
    >
      <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STAGES.map((s) => (
          <div key={s.title} className="bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-medium">{s.title}</span>
              <Tag kind={s.tag} />
            </div>
            <p className="text-xs text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Legend</span>
        {Object.entries(config.evidence_types).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <Tag kind={k} /> {v}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <Tag kind="code" /> Deterministic code
        </span>
        <span className="flex items-center gap-1.5">
          <Tag kind="model" /> Typed decision model
        </span>
        <span className="flex items-center gap-1.5">
          <Tag kind="llm" /> Language model
        </span>
      </div>
      <SubHead>Who decides what</SubHead>
      <DataTable
        head={["Component", "Kind", "Decides", "Never decides", "If it fails"]}
        rows={[
          [
            "Pillar scorer (score.ts)",
            <Tag kind="code" />,
            "All five pillar scores, the overall score, hazard caps, zoning and availability multipliers",
            "Anything not in pillars.config.json",
            "n/a: pure function in the browser",
          ],
          [
            "Zoning gate (legal matrix + use table)",
            <Tag kind="policy" />,
            "Which approval pathway each housing type needs in each district",
            "Whether a specific project will be approved",
            'Unknown districts show "verify with the Zoning Administrator"',
          ],
          [
            `Jev site fit (${SITE_FIT_TYPOLOGIES.length} housing types)`,
            <Tag kind="model" />,
            "How well a housing type physically fits the lot, as a rubric level + probabilities + confidence",
            "Legality, scores, any free text",
            "Shown as unavailable; no fallback number is invented",
          ],
          [
            "Chat companion (Gemini)",
            <Tag kind="llm" />,
            "Wording of explanations; can call the rescore tool to show what a weight change does",
            "Any score, legality, or number not present in the cited facts",
            "Falls back to the screen's own notes",
          ],
        ]}
      />
    </Section>
  );
}

// ─── Equations ───────────────────────────────────────────────────────────────

function stub(score: number): PillarScore {
  return { score, coverage: 1, subscores: [], contributions: [], flags: [] };
}

export function EquationsSection() {
  const example: Record<PillarId, number> = { demand: 72, site: 85, afford: 30, access: 64, climate: 58 };
  const pillars = Object.fromEntries(Object.entries(example).map(([k, v]) => [k, stub(v)])) as Record<PillarId, PillarScore>;
  const geo = overallScore(pillars, { overall: "geometric" }) ?? 0;
  const arith = overallScore(pillars, { overall: "arithmetic" }) ?? 0;
  const zbe = config.legal.levels.find((l) => l.id === "zbe_special_exception")!;
  const occupied = config.availability.levels.find((l) => l.id === "occupied")!;
  const finalScore = geo * zbe.multiplier * occupied.multiplier;

  return (
    <Section
      id="equations"
      code="02"
      title="The scoring equations"
      lede={
        <>
          The exact math in <Mono>apps/web/src/lib/pillars/score.ts</Mono> (runs in the browser on every slider move) and{" "}
          <Mono>scripts/pillars/build-indicators.ts</Mono> (runs once at build time). Config version <Mono>{config.version}</Mono>.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Equation
          label="E1 · Normalize: percentile (mid-rank)"
          tex={String.raw`\begin{aligned}
p(v) &= 100\cdot\frac{\#\{x < v\} + \tfrac{1}{2}\,\#\{x = v\}}{N}\\[6pt]
s &= \begin{cases} p(v) & \text{higher is better}\\ 100 - p(v) & \text{lower is better}\end{cases}
\end{aligned}`}
          where={[
            [String.raw`x`, "every value in the reference set: all Allegheny County units in the source file (block groups, tracts, ZIPs), or all City parcels"],
            [String.raw`N`, "size of the reference set"],
            [String.raw`s`, "indicator score, rounded and clamped to 0–100"],
          ]}
          note="Ties share the middle of their rank, so a value shared by many units doesn't jump to the top or bottom."
        />
        <Equation
          label="E2 · Normalize: fixed linear scale"
          tex={String.raw`s = \operatorname{clamp}_{[0,\,100]}\!\left(100\cdot\frac{v - v_{\text{zero}}}{v_{\text{full}} - v_{\text{zero}}}\right)`}
          where={[
            [String.raw`v_{\text{zero}}`, "raw value that scores 0 (e.g. 2,400 m to a supermarket)"],
            [String.raw`v_{\text{full}}`, "raw value that scores 100 (e.g. 400 m)"],
          ]}
          note="Used for distances, shares of lot area and other values with a meaningful absolute threshold. Category codes (lead line, legal pathway, parcel use) are used as-is."
        />
        <Equation
          label="E3 · Sub-score: weighted mean with renormalization"
          tex={String.raw`S_k = \frac{\displaystyle\sum_{i \in A_k} w_i\, s_i}{\displaystyle\sum_{i \in A_k} w_i}
\qquad\text{undefined if}\quad \frac{\sum_{i \in A_k} w_i}{\sum_{i \in I_k} w_i} < c_{\min}`}
          where={[
            [String.raw`w_i`, "indicator weight from the config (0 = shown as context, not scored)"],
            [String.raw`I_k,\ A_k`, "all indicators of sub-score k, and those with a value for this parcel; missing values are excluded, never filled"],
            [String.raw`c_{\min}`, `minimum coverage: ${config.missing.min_coverage} by default; Demand requires ${PILLARS.find((p) => p.id === "demand")?.min_coverage}`],
          ]}
        />
        <Equation
          label="E4 · Pillar: sub-scores, then hazard gates"
          tex={String.raw`P_j = \min\!\left(\frac{\sum_k W_k\, S_k}{\sum_k W_k},\ \min_{g \in G_j} \mathrm{cap}_g\right)`}
          where={[
            [String.raw`W_k`, "sub-score weight (scored sub-scores only); a pillar without sub-scores is one implicit sub-score"],
            [String.raw`G_j`, "the pillar's gates whose conditions all hold for this parcel"],
            [String.raw`\mathrm{cap}_g`, "a ceiling such as 5 (half the lot in the floodway) or 50 (mostly 25%+ slope); cap 100 = warning only"],
          ]}
          note="Gates exist so an average can't hide a disqualifying hazard: great transit doesn't make a floodway buildable."
        />
        <Equation
          label="E5 · Overall: weighted geometric mean"
          tex={String.raw`O = \exp\!\left(\frac{\sum_j \omega_j \,\ln \max(P_j,\,1)}{\sum_j \omega_j}\right)
\qquad P_j \leftarrow \mathrm{impute}_j\ \text{if missing}`}
          where={[
            [String.raw`\omega_j`, "pillar weight (0–3 in the navbar Weights popover; published default 1)"],
            [String.raw`\max(P_j, 1)`, "floor of 1 keeps a zero pillar from zeroing the whole product"],
            [String.raw`\mathrm{impute}_j`, "City 25th-percentile score for that pillar, used when it lacks data (and flagged): " + PILLARS.map((p) => `${p.label} ${p.impute}`).join(" · ")],
          ]}
          note={config.overall.rationale}
        />
        <Equation
          label="E6 · Final parcel score"
          tex={String.raw`\text{Score} = O \times m_{\text{legal}} \times m_{\text{avail}}`}
          where={[
            [String.raw`m_{\text{legal}}`, "multiplier for the easiest legal pathway among detached, townhouse, two-, three- and multi-unit homes (§4)"],
            [String.raw`m_{\text{avail}}`, "multiplier for what's on the lot now: vacant 1.0 … park, rail, right-of-way 0.05"],
          ]}
          note="Multiplied, not averaged: a parcel where housing isn't permitted can't be rescued by good access."
        />
        <Equation
          label="E7 · Contribution shown in the panel"
          tex={String.raw`\mathrm{share}_i = \frac{W_k}{\sum_{k'} W_{k'}} \cdot \frac{w_i\, s_i}{\sum_{i' \in A_k} w_{i'}}`}
          note="The shares of one pillar add up to the pillar score before any gate cap, so the parcel panel can say exactly which indicator added how many points."
        />
        <Equation
          label="E8 · Weight sensitivity (rank stability)"
          tex={String.raw`\boldsymbol{\omega}' \sim \operatorname{Dirichlet}\!\left(\alpha\,\frac{\boldsymbol{\omega}}{\sum_j \omega_j}\right),
\quad \alpha = ${config.sensitivity.concentration},\ \ ${config.sensitivity.draws}\ \text{draws}`}
          where={[[String.raw`P_{10},\,P_{50},\,P_{90}`, "percentiles of the overall score O(ω′) across the draws, shown as the range in the parcel panel"]]}
          note={config.sensitivity.rationale}
        />
      </div>

      <SubHead right="computed live by score.ts">Worked example</SubHead>
      <Panel className="p-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {PILLARS.map((p) => (
            <span key={p.id} className="rounded-sm border border-border px-2 py-1 font-mono">
              {p.label} <span className="text-foreground">{example[p.id as PillarId]}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 text-[14px]">
          <Tex block>{String.raw`\begin{aligned}
O_{\text{geo}} &= \exp\!\left(\dfrac{\ln 72 + \ln 85 + \ln 30 + \ln 64 + \ln 58}{5}\right) = ${fmt(geo, 1)}\\[10pt]
O_{\text{arith}} &= \dfrac{72 + 85 + 30 + 64 + 58}{5} = ${fmt(arith, 1)}\\[10pt]
\text{Score} &= ${fmt(geo, 1)} \times \underbrace{${zbe.multiplier}}_{\text{special exception}} \times \underbrace{${occupied.multiplier}}_{\text{occupied building}} = ${fmt(finalScore, 1)}
\end{aligned}`}</Tex>
        </div>
        <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
          The weak Affordability pillar (30) pulls the geometric mean {fmt(arith - geo, 1)} points below the arithmetic one. That is the intended effect: strengths elsewhere only
          partly offset a real weakness.
        </p>
      </Panel>
    </Section>
  );
}

// ─── Pillars ─────────────────────────────────────────────────────────────────

export function PillarsSection() {
  const presetIds = Object.keys(config.presets);
  return (
    <Section
      id="pillars"
      code="03"
      title="The five pillars, indicator by indicator"
      lede={
        <>
          Read straight from <Mono>pillars.config.json</Mono>. {config.scale} {config.reference} <em>{config.about.split(". ").pop()}</em>
        </>
      }
    >
      {PILLARS.map((p) => {
        const inds = INDICATORS.filter((i) => i.pillar === p.id);
        const scored = inds.filter((i) => i.weight > 0);
        return (
          <div key={p.id} id={`pillar-${p.id}`} className="scroll-mt-4 space-y-2">
            <SubHead right={`weight ${p.weight} · ${scored.length} scored / ${inds.length} indicators · impute ${p.impute ?? config.overall.missing_pillar.impute}`}>
              {p.label}
            </SubHead>
            <p className="max-w-3xl text-xs text-muted-foreground">{p.description}</p>
            {p.direction_note ? (
              <p className="max-w-3xl text-xs text-amber-600 dark:text-amber-300/80">
                <Tag kind="value" /> {p.direction_note}
              </p>
            ) : null}
            {p.subscores?.length ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {p.subscores.map((s) => (
                  <span key={s.id} className="rounded-sm border border-border px-2 py-1" title={s.description}>
                    <Mono>{s.id}</Mono> {s.label} · weight <span className="tabular-nums">{s.weight}</span>
                    {s.weight === 0 ? <span className="text-muted-foreground"> (shown as a flag, not scored)</span> : null}
                  </span>
                ))}
              </div>
            ) : null}
            <DataTable
              head={["Indicator", "Geo", "Weight", "Evidence", "Normalization", "Input", "Why"]}
              rows={inds.map((i) => [
                <div className="min-w-[12rem]">
                  <div className={i.weight > 0 ? "" : "text-muted-foreground"}>{i.label}</div>
                  <Mono dim>
                    {i.id}
                    {i.sub ? ` · ${i.sub}` : ""}
                  </Mono>
                </div>,
                <Mono dim>{i.geography}</Mono>,
                i.weight > 0 ? <span className="font-mono tabular-nums">{i.weight}</span> : <span className="font-mono text-muted-foreground">0 · context</span>,
                <Tag kind={i.evidence} />,
                <Mono dim>{normalizeText(i.normalize)}</Mono>,
                <span className="font-mono text-[10.5px] break-all text-muted-foreground">{sourceText(i.source)}</span>,
                <span className="block min-w-[18rem] max-w-xl text-muted-foreground">{i.rationale}</span>,
              ])}
            />
            {p.gates?.length ? (
              <DataTable
                head={["Gate: fires when", "Cap", "Flag shown"]}
                rows={p.gates.map((g) => [
                  <span className="text-muted-foreground">{gateText(g)}</span>,
                  <span className="font-mono tabular-nums">{g.cap === 100 ? "flag only" : `≤ ${g.cap}`}</span>,
                  g.flag,
                ])}
              />
            ) : null}
          </div>
        );
      })}

      <SubHead right="navbar → Weights">Weight presets</SubHead>
      <DataTable
        head={["Preset", ...PILLARS.map((p) => p.label), "Note"]}
        rows={presetIds.map((id) => [
          <Mono>{id}</Mono>,
          ...PILLARS.map((p) => <span className="font-mono tabular-nums">{(config.presets as Record<string, Record<string, number>>)[id][p.id]}</span>),
          <span className="text-muted-foreground">{(config.preset_notes as Record<string, string>)[id] ?? ""}</span>,
        ])}
      />
    </Section>
  );
}

// ─── Legal + availability multipliers ────────────────────────────────────────

export function MultipliersSection() {
  return (
    <Section
      id="multipliers"
      code="04"
      title="Zoning and site-availability multipliers"
      lede={
        <>
          The two factors in E6. Both are <Tag kind="value" /> judgments about how much approval risk and existing use should cost, applied on top of <Tag kind="policy" /> facts.
        </>
      }
    >
      <SubHead right={`indicator ${config.legal.indicator} · border ${config.legal.border_m} m`}>Legal pathway (m_legal)</SubHead>
      <p className="max-w-3xl text-xs text-muted-foreground">{config.legal.description}</p>
      <DataTable
        head={["Code", "Level", "×", "Note"]}
        rows={config.legal.levels.map((l) => [
          <Mono dim>{l.code}</Mono>,
          l.label,
          <span className="font-mono tabular-nums">{l.multiplier.toFixed(2)}</span>,
          <span className="text-muted-foreground">{(l as { note?: string }).note ?? ""}</span>,
        ])}
      />
      <SubHead right={`indicator ${config.availability.indicator}`}>Site availability (m_availability)</SubHead>
      <p className="max-w-3xl text-xs text-muted-foreground">{config.availability.description}</p>
      <DataTable
        head={["Code", "What's on the lot", "×", "Note"]}
        rows={[...config.availability.levels]
          .sort((a, b) => b.multiplier - a.multiplier)
          .map((l) => [
            <Mono dim>{l.code}</Mono>,
            l.label,
            <span className="font-mono tabular-nums">{l.multiplier.toFixed(2)}</span>,
            <span className="text-muted-foreground">{(l as { note?: string }).note ?? ""}</span>,
          ])}
      />
    </Section>
  );
}

// ─── Housing types ───────────────────────────────────────────────────────────

const PATHWAY_ORDER = ["by_right", "za", "zbe_special_exception", "conditional_use", "not_permitted", "per_plan", "not_city_jurisdiction"];

export function TypologySection() {
  const districts = Object.keys(DISTRICT_PATHWAYS);
  const zba = Object.entries(ZBA_OUTCOMES)
    .flatMap(([base, o]) => (o.ALL && o.ALL.n > 0 ? [{ base, ...o.ALL }] : []))
    .sort((a, b) => b.n - a.n);

  return (
    <Section
      id="housing-types"
      code="05"
      title="Housing types: legal pathway and physical fit"
      lede={
        <>
          The bottom panel scores {TYPOLOGIES.length} housing types on a parcel in two independent layers: a <Tag kind="policy" /> legal pathway read from the City zoning code, and a{" "}
          <Tag kind="model" /> physical site fit. They are shown side by side and never blended, so a lot that would physically fit a duplex but isn't zoned for one reads as a
          rezoning question, not a dead end.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Equation
          label="E9 · Legal pathway score (tile number)"
          tex={String.raw`T = \begin{cases}
${PATHWAY_ORDER.filter((id) => PATHWAY_SCORE[id] != null)
  .map((id) => `${PATHWAY_SCORE[id]} & \\text{${PATHWAY_META[id]?.label.split(" (")[0].toLowerCase() ?? id}}`)
  .join(" \\\\ ")} \\
\operatorname{round}\!\left(5 + 30\, c\, \ell\right) & \text{not permitted}
\end{cases}`}
          where={[
            [String.raw`c`, "rezoning closeness: 1 if a district in the same family allows it (density-suffix change), 0.5 if one step up/down the R1D → R1A → R2 → R3 → RM ladder, 0.2 if only a distant district, 0 if none"],
            [String.raw`\ell`, "likelihood: Zoning Board relief approval rate in this base district, 2023–26 (all case types); 0.7 where there are no local cases"],
          ]}
          note="Not-permitted tops out at 35, below conditional use (40): it always means extra process, but it isn't a flat zero either. Planned-unit districts and Mount Oliver get no single number."
        />
        <Equation
          label="E10 · Jev site fit (typed rubric)"
          tex={String.raw`\begin{aligned}
E &= \sum_{i=0}^{L-1} i\, p_i \qquad \mathrm{fit} = \frac{E}{L-1}\\[10pt]
\text{label} &= \text{level}_{\,\operatorname{round}(E)} \qquad \text{review if } \mathrm{conf} < ${REVIEW_CONFIDENCE}\ (\text{House: } 0.2)
\end{aligned}`}
          where={[
            [String.raw`L`, `${SITE_FIT_LEVELS.length} levels: ` + SITE_FIT_LEVELS.map((l, i) => `${i} ${l}`).join(" · ")],
            [String.raw`p_i`, "the model's probability for each level"],
            [String.raw`\text{facts}`, "lot area, bounding-rectangle width × depth, district minimum lot size, hazard shares ≥ 1%, all computed in PostGIS/code first"],
          ]}
          note="The expected value, not the model's top pick: a near 50/50 split between two levels lands between them instead of snapping to a falsely confident extreme."
        />
      </div>

      <SubHead right={`${PATHWAYS ? Object.keys(PATHWAYS).length : 0} pathways · Zoning Code Ch. 922`}>Approval pathways</SubHead>
      <DataTable
        head={["Pathway", "Who decides", "Hearing", "Clock", "If the City misses it", "§"]}
        rows={Object.entries(PATHWAYS).map(([id, p]) => [
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="inline-block size-2 rounded-full" style={{ background: PATHWAY_META[id]?.color ?? "#71717a" }} />
            {PATHWAY_META[id]?.label ?? id}
          </span>,
          p.decider,
          p.hearing,
          <span className="text-muted-foreground">{p.clock}</span>,
          <span className="text-muted-foreground">{p.missedDeadline}</span>,
          <Mono dim>{p.section}</Mono>,
        ])}
      />

      <SubHead
        right={
          <>
            {TYPOLOGIES.length} types × {districts.length} districts · as of {LEGAL_MATRIX_AS_OF} · <ExtLink href={LEGAL_MATRIX_SOURCE}>§911.02</ExtLink>
          </>
        }
      >
        Typology × district matrix
      </SubHead>
      <div className="overflow-x-auto rounded-sm border border-border">
        <div className="grid w-max text-[10px]" style={{ gridTemplateColumns: `11rem repeat(${districts.length}, 1.1rem)` }}>
          <div className="sticky left-0 z-10 bg-background" />
          {districts.map((d) => (
            <div key={d} className="flex h-16 items-end justify-center pb-1">
              <span className="font-mono text-muted-foreground [writing-mode:vertical-rl] rotate-180">{d}</span>
            </div>
          ))}
          {TYPOLOGIES.map(([tid, tlabel]) => (
            <Fragment key={tid}>
              <div className="sticky left-0 z-10 truncate border-t border-border/50 bg-background px-2 py-0.5" title={tlabel}>
                {tlabel}
              </div>
              {districts.map((d) => {
                const pw = DISTRICT_PATHWAYS[d]?.[tid];
                return (
                  <div
                    key={d}
                    className="border-t border-l border-background"
                    style={{ background: PATHWAY_META[pw]?.color ?? "transparent", opacity: pw ? 0.85 : 1 }}
                    title={`${tlabel} in ${d}: ${PATHWAY_META[pw]?.label ?? pw ?? "no data"}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {PATHWAY_ORDER.map((id) => (
          <span key={id} className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm" style={{ background: PATHWAY_META[id]?.color }} />
            {PATHWAY_META[id]?.label}
          </span>
        ))}
      </div>

      <SubHead right="ZBA decision PDFs, 2023–26">Zoning Board outcomes by base district (the likelihood term in E9)</SubHead>
      <DataTable
        head={["Base district", "Cases", "Approved", "Denied", "Approval rate"]}
        rows={zba.map((o) => [
          <Mono>{o.base}</Mono>,
          <span className="font-mono tabular-nums">{o.n}</span>,
          <span className="font-mono tabular-nums">{o.approved}</span>,
          <span className="font-mono tabular-nums">{o.denied}</span>,
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-sm bg-foreground/10">
              <div className="h-1.5 rounded-sm bg-emerald-500/70" style={{ width: `${(o.approved / o.n) * 100}%` }} />
            </div>
            <span className="font-mono tabular-nums">{Math.round((o.approved / o.n) * 100)}%</span>
          </div>,
        ])}
      />
      <p className="text-xs text-muted-foreground">
        Only posted decisions are counted, and the rate covers all relief types, not rezonings specifically. It is an approximation of how a district treats requests the code
        doesn't allow outright.
      </p>
    </Section>
  );
}

// ─── AI components ───────────────────────────────────────────────────────────

export function AiSection() {
  return (
    <Section
      id="ai"
      code="06"
      title="The AI components and their guardrails"
      lede="Each model gets narrow, pre-computed inputs and has a documented failure mode. No model output becomes a score without being labeled as such."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-2 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Jev site-fit model</span>
            <Tag kind="model" />
          </div>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            <li>A System One decision API (TypeSafe's Jev, served via OpenRouter). It returns typed answers with probabilities. There is no free text to parse or hallucinate.</li>
            <li>
              One <Mono>score</Mono> question per housing type ({SITE_FIT_TYPOLOGIES.map((t) => t.label).join(", ")}), asked in a single call against the same facts.
            </li>
            <li>Facts are computed first in PostGIS and code: lot area, oriented-rectangle width and depth, district minimum lot size, hazard shares. The model does no arithmetic.</li>
            <li>Every type is rated, including ones zoning forbids, because physical fit is what makes a rezoning ask worth pursuing.</li>
            <li>Your pillar weights are passed as a note that may nudge a borderline rating, never override lot size or hazards.</li>
            <li>Answers are cached per (model, facts, types). On timeout (10 s) or a missing key the panel says the fit is unavailable. It never shows a guessed number.</li>
          </ul>
        </Panel>
        <Panel className="space-y-2 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Chat companion</span>
            <Tag kind="llm" />
          </div>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            <li>
              Google Gemini: <Mono>{CHAT_MODELS.join(" → ")}</Mono>. If a model errors, or hasn't answered after 4 s, the next one starts too and the first
              answer wins; each call times out at 12 s.
            </li>
            <li>
              Sees only what the panels show for the selected parcel (scores, breakdowns, typology tiles with Jev's site fit, alerts, zoning) plus standing definitions. Each fact
              has an id, source and as-of date. Without a parcel, it only explains how the tool works.
            </li>
            <li>Replies must cite fact ids. Citations to ids that weren't provided are removed.</li>
            <li>
              <span className="text-foreground">Number guard:</span> any sentence containing a number that no provided fact states is dropped. Small counting numbers (0–10) and a
              fraction's percent form (0.81 → 81) are allowed.
            </li>
            <li>
              What-ifs are computed, never estimated: the <Mono>rescore</Mono> tool reruns E5–E6 with new weights or a preset, and rezoning and vacant-land scenarios
              are scored by the real scorer ahead of time. Anything else gets "not computed".
            </li>
            <li>At most 10 turns of history and 3 tool steps per answer. Without a key, it shows the screen's own notes instead.</li>
          </ul>
        </Panel>
      </div>
    </Section>
  );
}
