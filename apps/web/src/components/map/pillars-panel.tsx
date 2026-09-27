import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@HouseHack/ui/components/popover";
import { Slider } from "@HouseHack/ui/components/slider";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { type PillarId, type PillarScore, scoreParcel, weightSensitivity } from "@/lib/pillars/score";
import { orpc } from "@/utils/orpc";

import { PaneCollapseButton } from "./pane-collapse-button";

/** Button + popover of one slider per pillar, feeding `scoreParcel`'s
 * `overrides.pillars` -- pure and synchronous, so every drag recomputes the
 * Overall score and every pillar card live (see score.ts). */
function WeightsPopover({
  weights,
  onChange,
}: {
  weights: Partial<Record<PillarId, number>>;
  onChange: (next: Partial<Record<PillarId, number>>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-1 rounded px-1.5 py-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
        <SlidersHorizontal className="size-3.5" />
        Weights
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Pillar weights</PopoverTitle>
        </PopoverHeader>
        <div className="space-y-3">
          {config.pillars.map((p) => {
            const id = p.id as PillarId;
            const value = weights[id] ?? p.weight;
            return (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>{p.label}</span>
                  <span className="tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
                </div>
                <Slider
                  value={[value]}
                  min={0}
                  max={3}
                  step={0.25}
                  onValueChange={(v) => onChange({ ...weights, [id]: Array.isArray(v) ? v[0]! : v })}
                />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onChange({})}
          className="mt-1 text-left text-muted-foreground underline hover:text-foreground"
        >
          Reset to defaults
        </button>
      </PopoverContent>
    </Popover>
  );
}

export type Indicator = (typeof config.indicators)[number] & { sub?: string; unit?: string };
type ShardIndex = { config_version: string; built: string; indicators: string[]; shards: string[] };
type ParcelRow = [zoning: string, norm: (number | null)[], raw: (number | null)[]];

const EVIDENCE_LABEL: Record<string, string> = {
  observed: "Observed",
  assumption: "Assumption",
  policy: "Policy",
  value: "Value judgment",
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

export type ParcelData = { zoning: string; norm: Record<string, number | null>; raw: Record<string, number | null> };

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
      setState({ pin, data: { zoning: row[0], norm, raw }, status: "ready" });
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
    case "ratio":
      return `${value.toFixed(2)}×`;
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

function ScoreBar({ score }: { score: number | null }) {
  return (
    <div className="h-1.5 w-full rounded bg-foreground/10">
      <div className="h-1.5 rounded" style={{ width: `${score ?? 0}%`, background: scoreColor(score) }} />
    </div>
  );
}

export const fmtScore = (s: number | null) => (s == null ? "—" : Math.round(s).toString());

function IndicatorRow({ ind, data, contribution }: { ind: Indicator; data: ParcelData; contribution?: number }) {
  const [open, setOpen] = useState(false);
  const norm = data.norm[ind.id];
  const unitNote = ind.unit ? (config.units as Record<string, string>)[ind.unit] : undefined;
  return (
    <li className="border-t border-border/40 py-1">
      <button type="button" onClick={() => setOpen((v) => !v)} className="grid w-full grid-cols-[1fr_auto] gap-x-2 text-left">
        <span className={ind.weight === 0 ? "text-muted-foreground" : ""}>{ind.label}</span>
        <span className="tabular-nums">{norm == null ? "—" : norm}</span>
        <span className="text-muted-foreground">{formatRaw(data.raw[ind.id], ind.unit)}</span>
        <span className="text-muted-foreground tabular-nums">
          {ind.weight === 0 ? "context" : contribution != null ? `+${contribution.toFixed(1)} pts` : "excluded"}
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
  onSelectPillar,
}: {
  id: PillarId;
  score: PillarScore;
  data: ParcelData;
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
          <p key={f} className="text-red-400">
            ⚠ {f} (pillar capped)
          </p>
        ))}
      </button>
      {open && (
        <div className="space-y-2 px-2 pb-2">
          <p className="text-muted-foreground">{pillar.description}</p>
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
                  <p className="font-medium">
                    {g.label} <span className="tabular-nums">{fmtScore(sub?.score ?? null)}</span>
                    {sub?.score == null && <span className="text-muted-foreground"> (not enough data)</span>}
                  </p>
                )}
                <div className="grid grid-cols-[1fr_auto] gap-x-2 text-muted-foreground">
                  <span>Indicator · raw value</span>
                  <span>score · points</span>
                </div>
                <ul>
                  {inds.map((ind) => (
                    <IndicatorRow key={ind.id} ind={ind} data={data} contribution={contributions.get(ind.id)} />
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

const GATE_LABEL: Record<string, { text: string; className: string }> = {
  allowed: { text: "By right", className: "bg-green-500/15 text-green-400" },
  conditional: { text: "Needs approval", className: "bg-yellow-500/15 text-yellow-400" },
  not_permitted: { text: "Not permitted", className: "bg-foreground/10 text-muted-foreground" },
  unknown: { text: "Zoning unknown", className: "bg-foreground/10 text-muted-foreground" },
};

// Legal gate from the zoning use table (code) plus physical site fit from the
// System One decision model. Ratings are judgments with a confidence, not measurements.
/** Shared by the typology-fit section here and the Alerts pane, so both read
 * the exact same (cached) System One result instead of issuing their own
 * near-duplicate requests. */
export function useTypologyFit(pin: string, data: ParcelData) {
  return useQuery(
    orpc.parcels.typologyFit.queryOptions({
      input: {
        pin,
        zoning: data.zoning || null,
        hazards: {
          floodway: data.raw.site_floodway_share,
          floodplain: data.raw.site_sfha_share,
          steepSlope: data.raw.site_steep_slope_share,
          landslideProne: data.raw.site_landslide_prone_share,
          undermined: data.raw.site_undermined_share,
        },
      },
      staleTime: Number.POSITIVE_INFINITY,
    }),
  );
}

function TypologyFitSection({ pin, data }: { pin: string; data: ParcelData }) {
  const query = useTypologyFit(pin, data);

  return (
    <section className="space-y-1.5 rounded border border-border/60 p-2">
      <p className="font-medium">Housing types on this lot</p>
      {query.isPending && <p className="text-muted-foreground">Checking zoning and site fit…</p>}
      {query.data && (
        <>
          <p className="text-muted-foreground">{query.data.facts.lot}</p>
          <ul className="space-y-1">
            {query.data.typologies.map((t) => {
              const gate = GATE_LABEL[t.gate.status] ?? GATE_LABEL.unknown!;
              return (
                <li key={t.id} className="border-t border-border/40 pt-1" title={t.gate.reason}>
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {t.label} <span className="text-muted-foreground">· {t.category}</span>
                    </span>
                    <span className={`rounded px-1 ${gate.className}`}>{gate.text}</span>
                  </div>
                  {t.fit && (
                    <div className="mt-0.5 space-y-0.5">
                      <ScoreBar score={t.fit.fit * 100} />
                      <p className="text-muted-foreground">
                        {t.fit.label} · confidence {Math.round(t.fit.confidence * 100)}%
                        {t.fit.needsReview && <span className="text-yellow-400"> · needs human review</span>}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground">
            {query.data.jev.status === "ok"
              ? `Permission: simplified zoning use table (hover a row for the rule). Site fit: judged by ${query.data.jev.model} from the lot facts above; physical fit only. Decision support, not zoning advice.`
              : "Site-fit ratings are unavailable right now; zoning permissions are still shown."}
          </p>
        </>
      )}
      {query.isError && <p className="text-muted-foreground">Couldn't load housing types for this parcel.</p>}
    </section>
  );
}

export function PillarsPanel({
  pin,
  onClose,
  onSelectPillar,
  collapsed,
  onToggleCollapse,
}: {
  pin: string;
  onClose: () => void;
  onSelectPillar?: (id: PillarId) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { data, status } = useParcelData(pin);
  const [pillarWeights, setPillarWeights] = useState<Partial<Record<PillarId, number>>>({});
  const overrides = useMemo(() => ({ pillars: pillarWeights }), [pillarWeights]);
  const result = useMemo(() => (data ? scoreParcel(data.norm, overrides) : null), [data, overrides]);
  const range = useMemo(() => (result ? weightSensitivity(result.pillars, overrides) : null), [result, overrides]);
  const hasCustomWeights = Object.keys(pillarWeights).length > 0;

  return (
    <aside className="flex h-full w-full flex-col bg-background text-xs">
      <header className="flex items-start justify-between gap-2 border-b p-3">
        <div>
          <p className="text-muted-foreground">Parcel</p>
          <p className="font-mono text-sm">{pin}</p>
          {data && <p className="text-muted-foreground">Zoning {data.zoning || "unknown"}</p>}
        </div>
        <div className="flex items-center gap-1">
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="scores" />}
          <button type="button" onClick={onClose} className="rounded px-2 py-1 hover:bg-foreground/10" aria-label="Close parcel panel">
            ✕
          </button>
        </div>
      </header>
      {!collapsed && (
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {status === "loading" && <p className="text-muted-foreground">Loading scores…</p>}
        {status === "missing" && (
          <p className="text-muted-foreground">No pillar scores for this parcel. Scores cover City of Pittsburgh parcels only.</p>
        )}
        {data && result && (
          <>
            <section className="rounded border border-border/60 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">Overall</span>
                <div className="flex items-center gap-2">
                  <WeightsPopover weights={pillarWeights} onChange={setPillarWeights} />
                  <span className="text-lg font-semibold tabular-nums" style={{ color: scoreColor(result.overall) }}>
                    {fmtScore(result.overall)}
                  </span>
                </div>
              </div>
              <ScoreBar score={result.overall} />
              <p className="mt-1 text-muted-foreground">
                Weighted {config.overall.method} mean of the five pillars, {hasCustomWeights ? "custom weights" : "equal weights"}.
                {range && ` Range under shifted weights: ${Math.round(range.p10)}–${Math.round(range.p90)}.`}
              </p>
            </section>
            <TypologyFitSection pin={pin} data={data} />
            {config.pillars.map((p) => (
              <PillarCard
                key={p.id}
                id={p.id as PillarId}
                score={result.pillars[p.id as PillarId]}
                data={data}
                onSelectPillar={onSelectPillar}
              />
            ))}
            <p className="text-muted-foreground">
              All scores 0–100, higher = better for a future resident. Weights are value judgments, published in
              pillars.config.json (v{config.version}). Click a pillar for its calculations, and an indicator for its source.
            </p>
          </>
        )}
      </div>
      )}
    </aside>
  );
}
