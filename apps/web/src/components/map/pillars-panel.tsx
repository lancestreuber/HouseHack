import { SectionCard } from "@HouseHack/ui/components/glass";
import { Button } from "@HouseHack/ui/components/button";
import { Bus, Home, Leaf, Users, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { accentHue, accentChipStyle, scoreColor } from "@/lib/pillars/score-color";
import { type PillarId, type PillarScore, scoreParcel, weightSensitivity } from "@/lib/pillars/score";

import { PaneCollapseButton } from "./pane-collapse-button";

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

function ScoreBar({ score }: { score: number | null }) {
  const color = scoreColor(score);
  return (
    <div className="h-1.5 w-full rounded-full bg-white/8">
      <div
        className="h-1.5 rounded-full"
        style={{
          width: `${score ?? 0}%`,
          background: `linear-gradient(90deg, color-mix(in oklch, ${color}, black 25%), ${color})`,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

export const fmtScore = (s: number | null) => (s == null ? "—" : Math.round(s).toString());

function IndicatorRow({ ind, data, contribution }: { ind: Indicator; data: ParcelData; contribution?: number }) {
  const [open, setOpen] = useState(false);
  const norm = data.norm[ind.id];
  const unitNote = ind.unit ? (config.units as Record<string, string>)[ind.unit] : undefined;
  return (
    <li className="border-t border-glass-border py-1">
      <button type="button" onClick={() => setOpen((v) => !v)} className="grid w-full grid-cols-[1fr_auto] gap-x-2 text-left">
        <span className={ind.weight === 0 ? "text-muted-foreground" : ""}>{ind.label}</span>
        <span className="tabular-nums">{norm == null ? "—" : norm}</span>
        <span className="text-muted-foreground">{formatRaw(data.raw[ind.id], ind.unit)}</span>
        <span className="text-muted-foreground tabular-nums">
          {ind.weight === 0 ? "context" : contribution != null ? `+${contribution.toFixed(1)} pts` : "excluded"}
        </span>
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 rounded-md border border-glass-border bg-black/[0.03] p-2 text-muted-foreground dark:bg-black/20">
          <p>
            Raw: <span className="text-foreground">{formatRaw(data.raw[ind.id], ind.unit)}</span>
            {unitNote ? ` (${unitNote})` : ""}
          </p>
          <p>
            Normalized: <span className="text-foreground">{norm ?? "missing"}</span> / 100 via {describeNormalize(ind)}
          </p>
          <p>
            Weight: <span className="text-foreground">{ind.weight}</span> · {ind.geography} ·{" "}
            <span className="rounded-full border border-glass-border bg-glass-card px-1.5 text-[10px]">{EVIDENCE_LABEL[ind.evidence] ?? ind.evidence}</span>
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

const PILLAR_ICONS = [Users, Home, Wallet, Bus, Leaf] as const;

function PillarCard({
  id,
  score,
  data,
  index,
  onSelectPillar,
}: {
  id: PillarId;
  score: PillarScore;
  data: ParcelData;
  index: number;
  onSelectPillar?: (id: PillarId) => void;
}) {
  const [open, setOpen] = useState(false);
  const pillar = config.pillars.find((p) => p.id === id) as (typeof config.pillars)[number] & {
    subscores?: { id: string; label: string; description: string }[];
  };
  const contributions = new Map(score.contributions.map((c) => [c.indicator, c.share]));
  const groups = pillar.subscores ?? [{ id: "", label: "", description: "" }];
  const hue = accentHue(index);
  const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length];
  return (
    <SectionCard className="p-0">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          onSelectPillar?.(id);
        }}
        className="w-full space-y-1 p-2 text-left hover:bg-glass-card-hover"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-white"
            style={accentChipStyle(hue)}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">
                {open ? "▾" : "▸"} {pillar.label}
              </span>
              <span className="text-lg font-semibold tabular-nums tracking-[-0.02em]" style={{ color: scoreColor(score.score) }}>
                {fmtScore(score.score)}
              </span>
            </div>
            <ScoreBar score={score.score} />
          </div>
        </div>
        {score.subscores.length > 0 && (
          <div className="flex gap-3 pl-9 text-muted-foreground">
            {score.subscores.map((s) => (
              <span key={s.id}>
                {groups.find((g) => g.id === s.id)?.label}: <span className="text-foreground tabular-nums">{fmtScore(s.score)}</span>
              </span>
            ))}
          </div>
        )}
        {score.flags.map((f) => (
          <p key={f} className="pl-9 text-score-bad">
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
    </SectionCard>
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
  const result = useMemo(() => (data ? scoreParcel(data.norm) : null), [data]);
  const range = useMemo(() => (result ? weightSensitivity(result.pillars) : null), [result]);

  return (
    <aside className="flex h-full w-full flex-col text-xs">
      <header className="flex items-start justify-between gap-2 border-b border-glass-border p-3">
        <div>
          <p className="text-muted-foreground">Parcel</p>
          <p className="font-mono text-[13px]">{pin}</p>
          {data && <p className="text-muted-foreground">Zoning {data.zoning || "unknown"}</p>}
        </div>
        <div className="flex items-center gap-1">
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="scores" />}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Close parcel panel"
            className="text-muted-foreground hover:text-foreground"
          >
            <X />
          </Button>
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
            <SectionCard title="Overall">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums tracking-[-0.02em]" style={{ color: scoreColor(result.overall) }}>
                  {fmtScore(result.overall)}
                </span>
                <span className="text-[11px] text-muted-foreground">/ 100</span>
              </div>
              <ScoreBar score={result.overall} />
              <p className="mt-1 text-muted-foreground">
                Weighted {config.overall.method} mean of the five pillars, equal weights.
                {range && ` Range under shifted weights: ${Math.round(range.p10)}–${Math.round(range.p90)}.`}
              </p>
            </SectionCard>
            {config.pillars.map((p, i) => (
              <PillarCard
                key={p.id}
                id={p.id as PillarId}
                score={result.pillars[p.id as PillarId]}
                data={data}
                index={i}
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