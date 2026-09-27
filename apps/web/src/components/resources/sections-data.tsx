import { useMemo, useState } from "react";

import { OVERLAYS } from "@/components/map/overlays";
import config from "@/lib/pillars/pillars.config.json";
import catalog from "@/lib/resources/catalog.generated.json";

import { Chip, DataTable, ExtLink, FilterInput, hostOf, Md, Mono, Panel, Section, SubHead, Tag } from "./ui";

const matches = (q: string, ...fields: (string | undefined)[]) => {
  const needle = q.trim().toLowerCase();
  return !needle || fields.some((f) => f?.toLowerCase().includes(needle));
};

// ─── Map layers ──────────────────────────────────────────────────────────────

export function LayersSection() {
  const [q, setQ] = useState("");
  const [evidence, setEvidence] = useState<string | null>(null);
  const kinds = [...new Set(OVERLAYS.map((o) => o.meta.evidence))];
  const rows = OVERLAYS.filter(
    (o) => (!evidence || o.meta.evidence === evidence) && matches(q, o.id, o.label, o.description, o.meta.source, o.meta.geography),
  ).sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));

  return (
    <Section
      id="map-layers"
      code="07"
      title="Every map layer and where it comes from"
      lede={
        <>
          Read live from the overlay registry (<Mono>components/map/overlays</Mono>). Every layer has to declare its source, date, geography and evidence type before it can be
          added, and the same metadata appears in the Layers pane.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <FilterInput value={q} onChange={setQ} placeholder="filter layers…" />
        <Chip active={evidence === null} onClick={() => setEvidence(null)}>
          all {OVERLAYS.length}
        </Chip>
        {kinds.map((k) => (
          <Chip key={k} active={evidence === k} onClick={() => setEvidence(evidence === k ? null : k)}>
            {k} {OVERLAYS.filter((o) => o.meta.evidence === k).length}
          </Chip>
        ))}
      </div>
      <DataTable
        maxHeight="36rem"
        head={["Layer", "Group", "Evidence", "Source", "As of", "One value describes", "Caveats"]}
        rows={rows.map((o) => [
          <div className="min-w-[11rem]">
            <div>{o.label}</div>
            <Mono dim>{o.id}</Mono>
          </div>,
          <Mono dim>{o.group}</Mono>,
          <Tag kind={o.meta.evidence} />,
          <div className="min-w-[14rem] max-w-sm">
            <div>{o.meta.source}</div>
            {o.meta.sourceUrl ? <ExtLink href={o.meta.sourceUrl}>{hostOf(o.meta.sourceUrl)}</ExtLink> : null}
          </div>,
          <span className="block min-w-[7rem] text-muted-foreground">{o.meta.asOf}</span>,
          <span className="block min-w-[10rem] text-muted-foreground">{o.meta.geography}</span>,
          o.meta.caveats.length ? (
            <details className="min-w-[12rem] max-w-md text-muted-foreground">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wide">{o.meta.caveats.length} caveats</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {o.meta.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        ])}
      />
    </Section>
  );
}

// ─── Dataset catalog ─────────────────────────────────────────────────────────

const THEME_SHORT: Record<string, string> = {
  "Base map, parcels and geography": "Base map",
  "Natural hazards and climate": "Hazards",
  "Infrastructure and transportation": "Infrastructure",
  "Housing costs, affordability and subsidy": "Housing costs",
  "Land, ownership and property condition": "Land",
  "Population, demand and jobs": "Demand",
  "Equity and opportunity": "Equity",
  "Health and health care": "Health",
  "Public safety": "Safety",
  "Places and everyday services (points)": "Places",
  "Zoning, legal feasibility and approvals": "Zoning",
  "Live cameras": "Cameras",
};

export function CatalogSection() {
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const themes = useMemo(() => [...new Set(catalog.catalog.map((r) => r.theme))], []);
  const rows = catalog.catalog.filter((r) => (!theme || r.theme === theme) && matches(q, r.dataset, r.source, r.usedIn, r.license));

  return (
    <Section
      id="datasets"
      code="08"
      title="Dataset catalog"
      lede={
        <>
          All {catalog.catalog.length} datasets and services behind the map and the scores: publisher, exact endpoint, vintage, license and where each one is used. Compiled from
          the code on every branch and checked so that every endpoint the code calls is cited. Accessed 2026-09-26 unless noted.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <FilterInput value={q} onChange={setQ} placeholder="search datasets, endpoints, layers…" />
        <Chip active={theme === null} onClick={() => setTheme(null)}>
          all
        </Chip>
        {themes.map((t) => (
          <Chip key={t} active={theme === t} onClick={() => setTheme(theme === t ? null : t)}>
            {THEME_SHORT[t] ?? t} {catalog.catalog.filter((r) => r.theme === t).length}
          </Chip>
        ))}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground">
        {rows.length} of {catalog.catalog.length}
        {theme ? ` · ${theme}` : ""}
      </div>
      <DataTable
        maxHeight="40rem"
        head={["Dataset (publisher)", "Source / endpoint", "Vintage", "License", "Used in"]}
        rows={rows.map((r) => [
          <span className="block min-w-[12rem] max-w-xs">
            <Md text={r.dataset} />
          </span>,
          <span className="block min-w-[16rem] max-w-md break-words text-muted-foreground">
            <Md text={r.source} />
          </span>,
          <span className="block min-w-[5rem] text-muted-foreground">{r.vintage || "—"}</span>,
          <span className="block min-w-[5rem] text-muted-foreground">{r.license}</span>,
          <span className="block min-w-[10rem] max-w-xs text-muted-foreground">
            <Md text={r.usedIn} />
          </span>,
        ])}
      />
    </Section>
  );
}

// ─── Services, licenses, legal files ─────────────────────────────────────────

export function ServicesSection() {
  return (
    <Section id="licenses" code="09" title="Licenses, attribution and runtime services">
      <SubHead>Attribution obligations</SubHead>
      <DataTable
        head={["Source", "License / terms", "What we must do"]}
        rows={catalog.licenses.map((r) => [
          <span className="block min-w-[12rem] max-w-sm">
            <Md text={r.source} />
          </span>,
          <span className="whitespace-nowrap text-muted-foreground">{r.terms}</span>,
          <span className="block min-w-[16rem] text-muted-foreground">
            <Md text={r.obligation} />
          </span>,
        ])}
      />
      <SubHead>AI models and runtime services</SubHead>
      <DataTable
        head={["Service", "How it is used", "Endpoint"]}
        rows={catalog.services.map((r) => [
          <span className="block min-w-[10rem]">{r.service}</span>,
          <span className="block min-w-[14rem] text-muted-foreground">{r.use}</span>,
          <span className="block min-w-[14rem] max-w-md break-words text-muted-foreground">
            <Md text={r.endpoint} />
          </span>,
        ])}
      />
      <SubHead right="City of Pittsburgh · raw coded facts, no scores">Legal-feasibility datasets built by the team</SubHead>
      <DataTable
        head={["File", "Primary sources"]}
        rows={catalog.legalFiles
          .filter((r) => !r.file.endsWith(".md`") && !r.file.includes("README"))
          .map((r) => [
            <span className="whitespace-nowrap">
              <Md text={r.file} />
            </span>,
            <span className="text-muted-foreground">
              <Md text={r.sources} />
            </span>,
          ])}
      />
    </Section>
  );
}

// ─── Assumptions ─────────────────────────────────────────────────────────────

const HAND_ASSUMPTIONS: { area: string; text: string; where: string }[] = [
  { area: "Scoring", text: "Missing data is excluded and the remaining weights renormalized; it is never filled with a guess at indicator level.", where: "score.ts · E3" },
  { area: "Scoring", text: "A pillar with too little data counts as that pillar's City 25th-percentile score, so missing data is never rewarded.", where: "pillars.config.json · impute" },
  { area: "Scoring", text: "Pillar scores are floored at 1 inside the geometric mean so one zero doesn't zero the overall.", where: "overall.floor" },
  { area: "Scoring", text: "All pillar weights default to 1. Equal weights are a starting point, not a finding; presets show other value sets.", where: "pillars[].weight" },
  { area: "Zoning", text: "The overall zoning factor uses the easiest pathway among the five mainstream housing types; senior and group housing are scored separately in the typology panel.", where: "legal.typologies" },
  { area: "Zoning", text: "A parcel within 30 m of a district that allows attached or multi-unit homes is treated as a border case (×0.35 instead of ×0.2).", where: "legal.border_m" },
  { area: "Zoning", text: "Where a district has no local Zoning Board cases, the approval likelihood is a neutral 0.7.", where: "typology-panel.tsx · E9" },
  { area: "Zoning", text: "Rezoning closeness uses a simple density ladder R1D → R1A → R2 → R3 → RM; non-residential districts count as distant (0.2).", where: "typology-panel.tsx · E9" },
  { area: "Zoning", text: "Rules are a simplified transcription of §911.02 / §903.03 (post-May-2025 minimum lot sizes). Anything not encoded shows as unknown, never guessed.", where: "site-fit.ts" },
  { area: "Site fit", text: "Lot width and depth come from the parcel's minimum oriented bounding rectangle, which overstates buildable area on irregular lots.", where: "parcels.ts · typologyFit" },
  { area: "Site fit", text: "Hazard shares under 1% of the lot are not mentioned to the model.", where: "site-fit.ts · buildSiteState" },
  { area: "Site fit", text: `Ratings with confidence below ${0.3} (House: 0.2) are shown but flagged for review; the thresholds were tuned on observed answers (~0.3–0.55).`, where: "site-fit.ts · REVIEW_CONFIDENCE" },
  { area: "Data", text: "Area indicators (tract, block group, ZIP) are assigned to every parcel inside that area. They describe the neighborhood, not the lot.", where: "every area indicator" },
];

const PITFALLS: string[] = [
  "ACHD's food-facility \"open\" list still includes closed businesses (Blockbuster, Ames, Eckerd). A facility is kept only if it was inspected in the last ~2 years; test accounts are filtered out.",
  "Rite Aid closed every store by Sept 2025 but still appears in NPPES under Rite Aid, Thrift Drug and Eckerd; these are removed.",
  "USDA SNAP retailer records repeat some stores; they are deduplicated.",
  "ACHD blood-lead 2021–24 columns have no published definition and run 5–10× the county rate; only pooled 2015–20 is used.",
  "County sales for 2018–19 have far fewer \"valid sale\" codes than later years; 2020 is the baseline.",
  "City police incident-level data ends in Nov 2023; crime is not used in any score.",
  "Census tracts starting 98xxxx are special-use (parks, airport); percent changes there are blanked below ~100 households.",
  "ZIP-based filters leak across the county line, so every layer is clipped to the county polygon.",
  "DOE LEAD tenure codes are REN/OWN, not RENT.",
  "Pittsburgh has been a mandatory HUD Small Area FMR area since 2018-04-01; SAFMR, not metro FMR, is the rent benchmark.",
];

export function AssumptionsSection() {
  const flagged = config.indicators.filter((i) => i.evidence === "assumption" || i.evidence === "value");
  const context = config.indicators.filter((i) => i.weight === 0);
  return (
    <Section
      id="assumptions"
      code="10"
      title="Assumptions register"
      lede="Everything we chose rather than measured, in one place. If you disagree with one, the weights popover or the config file is where to change it."
    >
      <SubHead right={`${HAND_ASSUMPTIONS.length} items`}>Method assumptions</SubHead>
      <DataTable
        head={["Area", "Assumption", "Where"]}
        rows={HAND_ASSUMPTIONS.map((a) => [<Mono dim>{a.area}</Mono>, a.text, <Mono dim>{a.where}</Mono>])}
      />
      <SubHead right={`${flagged.length} indicators`}>Indicators labeled assumption or value judgment</SubHead>
      <DataTable
        head={["Indicator", "Evidence", "Weight", "Why"]}
        rows={flagged.map((i) => [
          <div className="min-w-[12rem]">
            <div>{i.label}</div>
            <Mono dim>{i.id}</Mono>
          </div>,
          <Tag kind={i.evidence} />,
          <span className="font-mono tabular-nums">{i.weight}</span>,
          <span className="text-muted-foreground">{i.rationale}</span>,
        ])}
      />
      <SubHead right={`${context.length} indicators`}>Shown for context, weight 0 (not scored)</SubHead>
      <div className="flex flex-wrap gap-1.5">
        {context.map((i) => (
          <span key={i.id} className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground" title={i.rationale}>
            {i.label}
          </span>
        ))}
      </div>
      <SubHead right="verified during the build">Data traps we found and handled</SubHead>
      <Panel className="p-3">
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {PITFALLS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Panel>
    </Section>
  );
}

// ─── Limitations ─────────────────────────────────────────────────────────────

const LIMITS: [string, string][] = [
  ["Not legal advice", "Zoning is a simplified interpretation of the City code. Verify with the Zoning Administrator before acting."],
  ["City of Pittsburgh zoning only", "Legal pathways cover City districts. Suburban municipalities have their own codes, which are not encoded; the map still shows their data layers."],
  ["No market or cost feasibility", "No construction costs, land prices, rents a project could achieve, or financing. Scores say where housing fits, not whether a deal pencils."],
  ["No project-level approval odds", "Zoning Board rates describe districts, not your application."],
  ["Excluded on purpose", "Crime and race never enter any score. Income and rent are context for need, not a filter."],
  ["Not covered", "Water and sewer capacity, school quality, and tornado risk are not scored."],
  ["Proxies", "Air quality is an emissions and modeled-exposure proxy (EJScreen), not monitored air at the lot."],
  ["Area averages", "Tract, block-group and ZIP indicators describe the neighborhood, not the parcel."],
  ["Vintages differ", "Sources range from 2015–20 pooled health data to live feeds; each layer shows its own as-of date."],
  ["AI is advisory", "Jev site fit is a model judgment with shown confidence. The chat only explains cited facts and can't see other map layers."],
];

export function LimitationsSection() {
  return (
    <Section id="limitations" code="11" title="What this tool can't tell you">
      <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2">
        {LIMITS.map(([title, body]) => (
          <div key={title} className="bg-background p-3 text-xs">
            <div className="mb-0.5 font-medium">{title}</div>
            <div className="text-muted-foreground">{body}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── References ──────────────────────────────────────────────────────────────

export function ReferencesSection() {
  return (
    <Section id="references" code="12" title="Methodology references and sources not used">
      <SubHead right={`${catalog.methodology.length} references`}>Composite-indicator standards and index designs we followed</SubHead>
      <Panel className="p-3">
        <ol className="columns-1 gap-6 space-y-1 text-xs md:columns-2 xl:columns-3">
          {catalog.methodology.map((url, i) => (
            <li key={url} className="break-inside-avoid">
              <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">[{String(i + 1).padStart(2, "0")}]</span>
              <ExtLink href={url}>{hostOf(url)}</ExtLink>
              <span className="text-muted-foreground"> {decodeURIComponent(url.split("/").filter(Boolean).pop() ?? "").slice(0, 60)}</span>
            </li>
          ))}
        </ol>
      </Panel>
      <SubHead right={`${catalog.notUsed.length} sources`}>Researched but not used, and why</SubHead>
      <DataTable
        maxHeight="28rem"
        head={["Source", "Why it isn't used"]}
        rows={catalog.notUsed.map((r) => [
          <span className="block min-w-[16rem] max-w-lg">
            <Md text={r.source} />
          </span>,
          <span className="text-muted-foreground">{r.reason}</span>,
        ])}
      />
      <p className="text-xs text-muted-foreground">Source manifest: {catalog.generatedFrom}.</p>
    </Section>
  );
}
