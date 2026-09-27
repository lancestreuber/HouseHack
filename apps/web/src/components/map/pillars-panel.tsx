import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@HouseHack/ui/components/select";

import config from "@/lib/pillars/pillars.config.json";
import { overallPhrase as overallPhraseFor, phraseFor, pillarPhrase } from "@/lib/pillars/phrases";
import { type PillarId, type PillarScore, scoreMultiplier, scoreParcel, type WeightOverrides, weightSensitivity } from "@/lib/pillars/score";
import { COST_PRESETS, DEFAULT_PENCIL, PENCIL_TYPOLOGIES, pencilCheck } from "@/lib/pillars/pencil";
import { setPencilAssumptions, usePencilAssumptions } from "@/lib/pillars/pencil-assumptions";
import { VERDICT_COLOR, VERDICT_NOT_CHECKED, VERDICT_PERMIT_NOTE } from "@/lib/pillars/verdict";
import { orpc } from "@/utils/orpc";

import { type FitsById, legalLevelFor, SHORT_LABEL, verdictFor } from "./typology-meta";

export type Indicator = (typeof config.indicators)[number] & { sub?: string; unit?: string };
type ShardIndex = {
  config_version: string;
  built: string;
  indicators: string[];
  shards: string[];
  // 101 quantiles (0–100th percentile) of default-weight scores across City parcels.
  quantiles?: Record<string, number[]>;
};
type ParcelRow = [zoning: string, norm: (number | null)[], raw: (number | null)[]];

const EVIDENCE_LABEL: Record<string, string> = {
  observed: "Observed",
  assumption: "Assumption",
  policy: "Policy",
  value: "Value judgment",
  modeled: "Modeled estimate",
};

export const INDICATORS = config.indicators as Indicator[];

let indexPromise: Promise<ShardIndex> | null = null;
const shardCache = new Map<string, Promise<Record<string, ParcelRow>>>();

function loadIndex() {
  indexPromise ??= fetch("/data/pillars/parcels/index.json").then((r) => r.json() as Promise<ShardIndex>);
  return indexPromise;
}

function loadShard(key: string) {
  let shard = shardCache.get(key);
  if (!shard) {
    shard = fetch(`/data/pillars/parcels/${key}.json`).then((r) => (r.ok ? (r.json() as Promise<Record<string, ParcelRow>>) : {}));
    shardCache.set(key, shard);
  }
  return shard;
}

export type ParcelData = {
  zoning: string;
  norm: Record<string, number | null>;
  raw: Record<string, number | null>;
  quantiles?: Record<string, number[]>;
};

// Share of City parcels (at default weights) scoring below this value.
export function percentileRank(q: number[] | undefined, v: number | null) {
  if (!q || v == null) return null;
  let i = 0;
  while (i < q.length && q[i] < v) i++;
  return Math.max(0, Math.min(100, i - 1));
}

export function useParcelData(pin: string | null) {
  const [state, setState] = useState<{ pin: string | null; data: ParcelData | null; status: "idle" | "loading" | "ready" | "missing" }>({
    pin: null,
    data: null,
    status: "idle",
  });
  useEffect(() => {
    if (!pin) return setState({ pin: null, data: null, status: "idle" });
    let cancelled = false;
    setState({ pin, data: null, status: "loading" });
    void (async () => {
      const index = await loadIndex();
      const shard = await loadShard(pin.slice(0, 4));
      if (cancelled) return;
      const row = shard[pin];
      if (!row) return setState({ pin, data: null, status: "missing" });
      const norm: Record<string, number | null> = {};
      const raw: Record<string, number | null> = {};
      index.indicators.forEach((id, i) => {
        norm[id] = row[1][i];
        raw[id] = row[2][i];
      });
      setState({ pin, data: { zoning: row[0], norm, raw, quantiles: index.quantiles }, status: "ready" });
    })();
    return () => {
      cancelled = true;
    };
  }, [pin]);
  return state;
}

export function formatRaw(value: number | null, unit: string | undefined) {
  if (value == null) return "no data";
  switch (unit) {
    case "fraction_pct":
      return `${(value * 100).toFixed(1)}%`;
    case "%":
      return `${value.toFixed(1)}%`;
    case "share":
      return `${Math.round(value * 100)}% of lot`;
    case "m":
      return value >= 10_000 ? "> 10 km" : `${Math.round(value).toLocaleString()} m`;
    case "pctile":
      return `${ordinal(Math.round(value))} percentile (PA)`;
    case "degC":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)} °C`;
    case "miles":
      return `${Math.round(value).toLocaleString()} mi/yr`;
    case "jobs":
      return `${Math.round(value).toLocaleString()} jobs`;
    case "trips":
      return `${Math.round(value).toLocaleString()} trips`;
    case "tons":
      return `${value.toLocaleString()} t/yr`;
    case "per100":
      return `${value} per 100`;
    case "use":
      return config.availability.levels.find((l) => l.code === value)?.label ?? "unknown";
    case "sqft_score":
      return `${Math.round(value).toLocaleString()} sq ft`;
    case "pathway":
      return config.legal.levels.find((l) => l.code === value)?.label ?? "unknown";
    case "ratio":
      return `${value.toFixed(2)}×`;
    case "usd":
      return `$${Math.round(value).toLocaleString()}`;
    default:
      return String(value);
  }
}

function ordinal(n: number) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

export function scoreColor(score: number | null) {
  if (score == null) return "#525252";
  if (score >= 70) return "#22c55e";
  if (score >= 45) return "#eab308";
  return "#ef4444";
}

export function ScoreBar({ score }: { score: number | null }) {
  return (
    <div className="h-1.5 w-full rounded bg-foreground/10">
      <div className="h-1.5 rounded" style={{ width: `${score ?? 0}%`, background: scoreColor(score) }} />
    </div>
  );
}

export const fmtScore = (s: number | null) => (s == null ? "—" : Math.round(s).toString());

function IndicatorRow({ ind, data, contribution, scored }: { ind: Indicator; data: ParcelData; contribution?: number; scored: boolean }) {
  const [open, setOpen] = useState(false);
  const norm = data.norm[ind.id];
  const unitNote = ind.unit ? (config.units as Record<string, string>)[ind.unit] : undefined;
  return (
    <li className="border-t border-border/40 py-1">
      <button type="button" onClick={() => setOpen((v) => !v)} className="grid w-full grid-cols-[1fr_auto] gap-x-2 text-left">
        <span className={ind.weight === 0 ? "text-muted-foreground" : ""}>{ind.label}</span>
        <span className="tabular-nums">{norm == null || ind.unit === "pathway" || ind.unit === "use" ? "—" : norm}</span>
        <span className="text-muted-foreground">{formatRaw(data.raw[ind.id], ind.unit)}</span>
        <span className="text-muted-foreground tabular-nums">
          {ind.weight === 0 ? "context" : !scored ? "not scored" : contribution != null ? `+${contribution.toFixed(1)} pts` : "no data"}
        </span>
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 rounded bg-foreground/5 p-1.5 text-muted-foreground">
          <p>
            Raw: <span className="text-foreground">{formatRaw(data.raw[ind.id], ind.unit)}</span>
            {unitNote ? ` (${unitNote})` : ""}
          </p>
          <p>
            Normalized: <span className="text-foreground">{norm ?? "missing"}</span> / 100 via {describeNormalize(ind)}
          </p>
          <p>
            Weight: <span className="text-foreground">{ind.weight}</span> · {ind.geography} ·{" "}
            <span className="rounded bg-foreground/10 px-1">{EVIDENCE_LABEL[ind.evidence] ?? ind.evidence}</span>
          </p>
          {ind.rationale && <p>{ind.rationale}</p>}
          <p className="break-all">Source: {sourceLabel(ind)}</p>
        </div>
      )}
    </li>
  );
}

function describeNormalize(ind: Indicator) {
  const n = ind.normalize as { method: string; direction?: string; reference?: string; zero?: number; full?: number };
  if (n.method === "percentile")
    return `${n.reference === "parcels" ? "City parcel" : "county-unit"} percentile, ${n.direction === "lower_is_better" ? "lower is better" : "higher is better"}`;
  if (n.method === "linear") return `linear scale: ${n.zero} → 0, ${n.full} → 100`;
  return "used as-is";
}

function sourceLabel(ind: Indicator) {
  const src = ind.source as { kind: string; file: string | string[]; property?: string | string[] };
  const files = (Array.isArray(src.file) ? src.file : [src.file]).map((f) => f.split("/").pop()).join(", ");
  const prop = src.property ? ` → ${Array.isArray(src.property) ? src.property.join(" + ") : src.property}` : "";
  return `${files}${prop} (${src.kind})`;
}

function PillarCard({
  id,
  score,
  data,
  phrase,
  onSelectPillar,
}: {
  id: PillarId;
  score: PillarScore;
  data: ParcelData;
  phrase: string | null;
  onSelectPillar?: (id: PillarId) => void;
}) {
  const [open, setOpen] = useState(false);
  const pillar = config.pillars.find((p) => p.id === id) as (typeof config.pillars)[number] & {
    subscores?: { id: string; label: string; description: string }[];
  };
  const contributions = new Map(score.contributions.map((c) => [c.indicator, c.share]));
  const groups = pillar.subscores ?? [{ id: "", label: "", description: "" }];
  return (
    <section className="rounded border border-border/60 bg-background/60">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          onSelectPillar?.(id);
        }}
        className="w-full space-y-1 p-2 text-left"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">
            {open ? "▾" : "▸"} {pillar.label}
          </span>
          <span className="text-base font-semibold tabular-nums" style={{ color: scoreColor(score.score) }}>
            {fmtScore(score.score)}
          </span>
        </div>
        <ScoreBar score={score.score} />
        {phrase && <p className="text-foreground/90">{phrase}</p>}
        {percentileRank(data.quantiles?.[id], score.score) != null && (
          <p className="text-muted-foreground">Better than {percentileRank(data.quantiles?.[id], score.score)}% of City parcels</p>
        )}
        {score.subscores.length > 0 && (
          <div className="flex gap-3 text-muted-foreground">
            {score.subscores.map((s) => (
              <span key={s.id}>
                {groups.find((g) => g.id === s.id)?.label}: <span className="text-foreground tabular-nums">{fmtScore(s.score)}</span>
              </span>
            ))}
          </div>
        )}
        {score.flags.map((f) => (
          <p key={f.text} className={f.capped ? "text-red-400" : "text-amber-400/90"}>
            ⚠ {f.text}
            {f.capped ? " (pillar capped)" : ""}
          </p>
        ))}
      </button>
      {open && (
        <div className="space-y-2 px-2 pb-2">
          <p className="text-muted-foreground">{pillar.description}</p>
          {"direction_note" in pillar && <p className="text-amber-400/90">⚖ {String(pillar.direction_note)}</p>}
          <p className="text-muted-foreground">
            {Math.round(score.coverage * 100)}% of indicator weight has data. Score = weighted mean of the normalized values
            {pillar.subscores ? " within each sub-score, then the mean of the sub-scores" : ""}; "pts" is each indicator's share of the score.
          </p>
          {groups.map((g) => {
            const sub = score.subscores.find((s) => s.id === g.id);
            const inds = INDICATORS.filter((i) => i.pillar === id && (i.sub ?? "") === g.id);
            return (
              <div key={g.id || "all"}>
                {g.id && (
                  <>
                    <p className="font-medium">
                      {g.label} <span className="tabular-nums">{fmtScore(sub?.score ?? null)}</span>
                      {sub?.score == null && <span className="text-muted-foreground"> (not enough data)</span>}
                    </p>
                    {phraseFor(g.id, sub?.score ?? null, data.norm) && <p className="text-foreground/90">{phraseFor(g.id, sub?.score ?? null, data.norm)}</p>}
                  </>
                )}
                <div className="grid grid-cols-[1fr_auto] gap-x-2 text-muted-foreground">
                  <span>Indicator · raw value</span>
                  <span>score · points</span>
                </div>
                <ul>
                  {inds.map((ind) => (
                    <IndicatorRow
                      key={ind.id}
                      ind={ind}
                      data={data}
                      contribution={contributions.get(ind.id)}
                      scored={!g.id || (sub?.weight ?? 1) > 0}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Shared by the typology panel (bottom) and the Alerts pane, so both read
 * the exact same (cached) System One result instead of issuing their own
 * near-duplicate requests. The chat also reads it, before data may have
 * loaded, so `data` can be null (the query just waits). */
export function useTypologyFit(pin: string | null, data: ParcelData | null) {
  return useQuery(
    orpc.parcels.typologyFit.queryOptions({
      input: {
        pin: pin ?? "",
        zoning: data?.zoning || null,
        hazards: {
          floodway: data?.raw.site_floodway_share,
          floodplain: data?.raw.site_sfha_share,
          steepSlope: data?.raw.site_steep_slope_share,
          landslideProne: data?.raw.site_landslide_prone_share,
          undermined: data?.raw.site_undermined_share,
        },
      },
      enabled: Boolean(data),
      staleTime: Number.POSITIVE_INFINITY,
    }),
  );
}

// The brief's mainstream housing types, in size order.
const VERDICT_TYPOLOGIES = ["single_detached", "single_attached", "two_unit", "three_unit", "multi_unit"];

/** One place that turns a parcel + the global weights into everything the
 * inspector shows: shard data, the scored result, the weight-sensitivity
 * range and the percentile rank. Shared by the inspector header and tabs so
 * they can never disagree. */
export function useParcelScore(pin: string | null, weights: Partial<Record<PillarId, number>>) {
  const { data, status } = useParcelData(pin);
  // "easiest" = the zoning factor uses the easiest of the mainstream types (the
  // published default); otherwise it follows the one housing type picked here.
  const [legalFor, setLegalFor] = useState("easiest");
  const overrides = useMemo<WeightOverrides>(
    () => ({
      pillars: weights,
      ...(legalFor !== "easiest" && data ? { legalLevel: legalLevelFor(data.zoning, legalFor, data.norm.site_legal_pathway) } : {}),
    }),
    [weights, legalFor, data],
  );
  const hasCustomWeights = Object.keys(weights).length > 0;
  const isCustom = hasCustomWeights || legalFor !== "easiest";
  const result = useMemo(() => (data ? scoreParcel(data.norm, overrides) : null), [data, overrides]);
  const range = useMemo(() => {
    if (!result) return null;
    const r = weightSensitivity(result.pillars, overrides);
    // The spread comes from the pillar blend; apply the same zoning and availability multipliers.
    const m = scoreMultiplier(result);
    return r ? { p10: r.p10 * m, p90: r.p90 * m } : null;
  }, [result, overrides]);
  const rank = data && result ? percentileRank(data.quantiles?.overall, result.overall) : null;
  const overallPhrase = result ? overallPhraseFor(result, rank) : null;
  return { pin, data, status, legalFor, setLegalFor, hasCustomWeights, isCustom, result, range, rank, overallPhrase };
}

export type ParcelScoreView = ReturnType<typeof useParcelScore>;

/** Red / yellow / green "can it be built?" per housing type, from pass/fail
 * checks only (see lib/pillars/verdict.ts), kept apart from the weighted score. */
export function BuildVerdicts({ pin, data }: { pin: string; data: ParcelData }) {
  const query = useTypologyFit(pin, data);
  const fitsById = useMemo(() => {
    if (!query.data) return undefined;
    const map: FitsById = {};
    for (const t of query.data.typologies) map[t.id] = t.fit;
    return map;
  }, [query.data]);
  const [open, setOpen] = useState<string | null>(null);
  const pencil = usePencilAssumptions();
  return (
    <section className="rounded border border-border/60 p-2">
      <p className="font-medium">Can it be built?</p>
      <ul className="mt-1 space-y-0.5">
        {VERDICT_TYPOLOGIES.map((id) => {
          const verdict = verdictFor(data.zoning, id, data, { fitsById, lotWidthFt: query.data?.lot.widthFt, pencil });
          const blockers = verdict.reasons.filter((r) => r.level !== "green");
          const shown = open === id ? verdict.reasons : blockers.slice(0, 1);
          return (
            <li key={id}>
              <button type="button" onClick={() => setOpen((cur) => (cur === id ? null : id))} className="w-full text-left">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: VERDICT_COLOR[verdict.level] }} />
                  <span className="font-medium">{SHORT_LABEL[id] ?? id}</span>
                  <span style={{ color: VERDICT_COLOR[verdict.level] }}>{verdict.label}</span>
                </span>
                {shown.map((r) => (
                  <span key={r.text} className="block pl-3.5 text-muted-foreground">
                    <span style={{ color: VERDICT_COLOR[r.level] }}>•</span> {r.text}
                  </span>
                ))}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-muted-foreground">
        {query.isPending ? "Checking physical fit… " : ""}
        {VERDICT_PERMIT_NOTE} {VERDICT_NOT_CHECKED}
      </p>
    </section>
  );
}

const PENCIL_STATUS: Record<string, { label: string; color: string }> = {
  pencils: { label: "Pencils", color: VERDICT_COLOR.green },
  tight: { label: "Tight", color: VERDICT_COLOR.yellow },
  subsidy: { label: "Needs subsidy", color: VERDICT_COLOR.yellow },
  no: { label: "Doesn't pencil", color: VERDICT_COLOR.red },
  unknown: { label: "No data", color: VERDICT_COLOR.unknown },
};
const usdK = (n: number | null) => (n == null ? "—" : `$${Math.round(n / 1000).toLocaleString()}k`);

/** Value per unit vs. cost per unit for each mainstream type, with the two
 * assumptions that move it most editable in place (SME: the tool should do
 * the pro-forma work, and user-typed assumptions help if they're clear). */
export function PencilSection({ data }: { data: ParcelData }) {
  const a = usePencilAssumptions();
  const [open, setOpen] = useState(false);
  const pencil = config.pencil;
  const presets = [
    ["low", "Production builder"],
    ["mid", "Typical infill"],
    ["high", "Small builder"],
  ] as const;
  return (
    <section className="rounded border border-border/60 p-2">
      <p className="font-medium">Does it pencil?</p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="text-muted-foreground">Construction</span>
        {presets.map(([key, label]) => (
          <button
            key={key}
            type="button"
            title={pencil.cost_per_sf.sources[key]}
            onClick={() => setPencilAssumptions({ ...a, costPerSf: COST_PRESETS[key] })}
            className={`rounded border px-1.5 py-0.5 ${a.costPerSf === COST_PRESETS[key] ? "border-foreground/60 bg-foreground/10" : "border-border/60"}`}
          >
            {label} ${COST_PRESETS[key]}
          </button>
        ))}
        <label className="flex items-center gap-1">
          <input
            type="number"
            min={50}
            max={1000}
            step={5}
            value={a.costPerSf}
            onChange={(e) => Number(e.target.value) > 0 && setPencilAssumptions({ ...a, costPerSf: Number(e.target.value) })}
            className="w-16 rounded border border-border/60 bg-background px-1 tabular-nums"
            aria-label="Construction cost per square foot"
          />
          /sf
        </label>
      </div>
      <label className="mt-1 flex items-center gap-1 text-muted-foreground" title={pencil.site_cost_source}>
        Site work per building $
        <input
          type="number"
          min={0}
          max={500000}
          step={2500}
          value={a.siteCostPerBuilding}
          onChange={(e) => Number(e.target.value) >= 0 && setPencilAssumptions({ ...a, siteCostPerBuilding: Number(e.target.value) })}
          className="w-20 rounded border border-border/60 bg-background px-1 tabular-nums text-foreground"
          aria-label="Site work cost per building"
        />
        {(a.costPerSf !== DEFAULT_PENCIL.costPerSf || a.siteCostPerBuilding !== DEFAULT_PENCIL.siteCostPerBuilding) && (
          <button type="button" onClick={() => setPencilAssumptions(DEFAULT_PENCIL)} className="underline">
            reset
          </button>
        )}
      </label>
      <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto] gap-x-2 text-muted-foreground">
        <span>Type</span>
        <span>Value/unit</span>
        <span title={`Cost per unit plus the ${Math.round(config.pencil.margin_pct * 100)}% margin`}>Needed/unit</span>
        <span />
        {PENCIL_TYPOLOGIES.map((id) => {
          const r = pencilCheck(id, data.norm, data.raw, a);
          if (!r) return null;
          const st = PENCIL_STATUS[r.status];
          return [
            <span key={`${id}-n`} className="text-foreground">
              {SHORT_LABEL[id] ?? id}
            </span>,
            <span key={`${id}-v`} className="tabular-nums" title={r.basis === "sale" ? "Median home sale price in this census tract, 2024–25" : "Nearby median rent, capitalized"}>
              {usdK(r.valuePerUnit)}
            </span>,
            <span key={`${id}-c`} className="tabular-nums">
              {usdK(r.costPerUnit * (1 + config.pencil.margin_pct))}
            </span>,
            <span key={`${id}-s`} style={{ color: st.color }}>
              {st.label}
            </span>,
          ];
        })}
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-muted-foreground underline">
        {open ? "Hide" : "How this is worked out"}
      </button>
      {open && (
        <div className="mt-1 space-y-1 text-muted-foreground">
          <p>
            Cost per unit = unit size × construction $/sf × (1 + {Math.round(pencil.soft_cost_pct * 100)}% soft costs) + site work per building ÷ units
            {data.norm.site_steep_slope_share != null && data.norm.site_steep_slope_share < 51 ? `, + $${pencil.steep_site_adder.toLocaleString()} for a mostly steep lot` : ""}.
            Value must beat cost by {Math.round(pencil.margin_pct * 100)}%. Houses use nearby sale prices (close to an appraiser's comps); 2+ units use nearby rent × {pencil.rent_multiplier}.
            Value covering at least {Math.round(pencil.subsidy_floor * 100)}% of cost reads as "needs subsidy"; less doesn't pencil. For scale, URA's gap caps are $
            {pencil.subsidy_cap_per_unit.sale.toLocaleString()} per for-sale unit and ${pencil.subsidy_cap_per_unit.rent.toLocaleString()} per rental unit. {pencil.subsidy_cap_note}
          </p>
          <p>{pencil.value_bias}</p>
          <p>{pencil.not_priced}</p>
          <p>{pencil.cost_per_sf.note}</p>
          <p>{pencil.typologies_note}</p>
        </div>
      )}
    </section>
  );
}

/** Overall viability headline card: score, percentile, coverage, multiplier
 * explanation and the zoning-factor type picker. */
export function OverallScoreCard({ score }: { score: ParcelScoreView }) {
  const { data, result, range, rank, overallPhrase, isCustom, hasCustomWeights, legalFor, setLegalFor } = score;
  if (!data || !result) return null;
  return (
    <>
      <section className="rounded-lg border border-border bg-background/60 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">Overall</span>
          <span className="text-lg font-semibold tabular-nums" style={{ color: scoreColor(result.overall) }}>
            {fmtScore(result.overall)}
          </span>
        </div>
        <ScoreBar score={result.overall} />
        {result.overall == null && <p className="mt-1">Not enough data for an overall score.</p>}
        {config.pillars.some((p) => result.pillars[p.id as PillarId].score == null) && (
          <p className="mt-1 text-warn">
            Not enough data for {config.pillars.filter((p) => result.pillars[p.id as PillarId].score == null).map((p) => p.label).join(", ")};
            counted as a below-typical score (the City's 25th percentile for that pillar).
          </p>
        )}
        {(() => {
          // Missing indicators are dropped and the rest reweighted, so say how much was actually measured.
          const coverage = config.pillars.reduce((a, p) => a + result.pillars[p.id as PillarId].coverage, 0) / config.pillars.length;
          return (
            <p className={`mt-1 ${coverage < 0.8 ? "text-warn" : "text-muted-foreground"}`}>
              Data coverage: {Math.round(coverage * 100)}% of indicator weight has data for this parcel
              {coverage < 0.8 ? "; the score leans on fewer measurements than usual." : "."}
            </p>
          );
        })()}
        {rank != null && (
          <p className="mt-1">
            Better than <span className="font-semibold">{rank}%</span> of City parcels as a place to build
            {isCustom ? " (compared with scores at the default settings)" : ""}.
          </p>
        )}
        {overallPhrase && <p className="mt-1">{overallPhrase}</p>}
        <p className="mt-1 text-muted-foreground">
          Weighted {config.overall.method} mean of the five pillars ({fmtScore(result.overallBeforeMultipliers)}),{" "}
          {hasCustomWeights ? "your weights" : "equal weights"}
          {result.legal && result.legal.multiplier < 1 ? `, × ${result.legal.multiplier} for zoning` : ""}
          {result.availability && result.availability.multiplier < 1 ? `, × ${result.availability.multiplier} for site availability` : ""}
          {result.hazard ? `, × ${result.hazard.multiplier} for a deal-killer hazard` : ""}.
          {range && ` If the weights shifted a little: ${Math.round(range.p10)}–${Math.round(range.p90)}.`}
        </p>
      </section>
      {result.hazard && (
        <section className="rounded-lg border border-red-500/60 bg-red-500/10 p-3">
          <p className="font-medium">Deal-killer site hazard</p>
          {result.hazard.flags.map((f) => (
            <p key={f}>{f}</p>
          ))}
          <p className="text-muted-foreground">
            Overall score × {result.hazard.multiplier}, so a good neighborhood can't average it away.
          </p>
        </section>
      )}
      {result.availability && result.availability.multiplier < 1 && (
        <section className="rounded-lg border border-red-500/60 bg-red-500/10 p-3">
          <p className="font-medium">{result.availability.label}</p>
          <p className="text-muted-foreground">Overall score × {result.availability.multiplier}.</p>
          {result.availability.note && <p className="text-muted-foreground">{result.availability.note}</p>}
        </section>
      )}
      <section
        className={`rounded-lg border p-3 ${result.legal && result.legal.multiplier < 0.6 ? "border-red-500/60 bg-red-500/10" : "border-border"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">Zoning (current code)</p>
          <Select value={legalFor} onValueChange={(v) => v && setLegalFor(v)}>
            <SelectTrigger size="sm" className="h-6 w-auto gap-1 px-1.5" aria-label="Zoning factor for which housing type">
              <SelectValue>{legalFor === "easiest" ? "Easiest type" : (SHORT_LABEL[legalFor] ?? legalFor)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easiest">Easiest type</SelectItem>
              {VERDICT_TYPOLOGIES.map((id) => (
                <SelectItem key={id} value={id}>
                  {SHORT_LABEL[id] ?? id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p>
          {legalFor !== "easiest" && `${SHORT_LABEL[legalFor] ?? legalFor}: `}
          {result.legal ? result.legal.label : "Legal status unknown for this district"}
        </p>
        {result.legal && result.legal.multiplier < 1 && (
          <p className="text-muted-foreground">Overall score × {result.legal.multiplier}.</p>
        )}
        {result.legal?.note && <p className="text-muted-foreground">{result.legal.note}</p>}
        <p className="text-muted-foreground">
          {legalFor === "easiest"
            ? "Easiest pathway among detached, townhouse, two-unit, three-unit and multi-unit housing; pick a type to score for that type instead."
            : "Pathway for this housing type only."}{" "}
          Simplified reading of §911.02;
          verify with the Zoning Administrator.
        </p>
      </section>
    </>
  );
}

/** The five expandable pillar cards plus the config pointer note. */
export function PillarCards({
  score,
  onSelectPillar,
}: {
  score: ParcelScoreView;
  onSelectPillar?: (id: PillarId) => void;
}) {
  const { data, result } = score;
  if (!data || !result) return null;
  return (
    <>
      {config.pillars.map((p) => (
        <PillarCard
          key={p.id}
          id={p.id as PillarId}
          score={result.pillars[p.id as PillarId]}
          data={data}
          phrase={pillarPhrase(result, p.id as PillarId, data.norm)}
          onSelectPillar={onSelectPillar}
        />
      ))}
      <p className="text-muted-foreground">
        All scores 0–100: 100 = a good place to build new housing, 0 = a poor one. Default weights and every rule are
        published in pillars.config.json (v{config.version}). Click a pillar for its calculations, and an indicator for its source.
      </p>
    </>
  );
}
