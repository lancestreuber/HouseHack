import { useEffect, useMemo, useState } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { phraseFor } from "@/lib/pillars/phrases";
import { type PillarId, type PillarScore, scoreParcel, type WeightOverrides, weightSensitivity } from "@/lib/pillars/score";

type Indicator = (typeof config.indicators)[number] & { sub?: string; unit?: string };
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
};

const INDICATORS = config.indicators as Indicator[];

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

type ParcelData = {
  zoning: string;
  norm: Record<string, number | null>;
  raw: Record<string, number | null>;
  quantiles?: Record<string, number[]>;
};

// Share of City parcels (at default weights) scoring below this value.
function percentileRank(q: number[] | undefined, v: number | null) {
  if (!q || v == null) return null;
  let i = 0;
  while (i < q.length && q[i] < v) i++;
  return Math.max(0, Math.min(100, i - 1));
}

function useParcelData(pin: string | null) {
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

function formatRaw(value: number | null, unit: string | undefined) {
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
    default:
      return String(value);
  }
}

function ordinal(n: number) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function scoreColor(score: number | null) {
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


const fmtScore = (s: number | null) => (s == null ? "—" : Math.round(s).toString());

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

function PillarCard({ id, score, data }: { id: PillarId; score: PillarScore; data: ParcelData }) {
  const [open, setOpen] = useState(false);
  const pillar = config.pillars.find((p) => p.id === id) as (typeof config.pillars)[number] & {
    subscores?: { id: string; label: string; description: string }[];
  };
  const contributions = new Map(score.contributions.map((c) => [c.indicator, c.share]));
  const groups = pillar.subscores ?? [{ id: "", label: "", description: "" }];
  return (
    <section className="rounded border border-border/60 bg-background/60">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full space-y-1 p-2 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">
            {open ? "▾" : "▸"} {pillar.label}
          </span>
          <span className="text-base font-semibold tabular-nums" style={{ color: scoreColor(score.score) }}>
            {fmtScore(score.score)}
          </span>
        </div>
        <ScoreBar score={score.score} />
        {phraseFor(id, score.score, data.norm) && <p className="text-foreground/90">{phraseFor(id, score.score, data.norm)}</p>}
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

const WEIGHTS_KEY = "pillars-weights-v1";
const DEFAULT_WEIGHTS = Object.fromEntries(config.pillars.map((p) => [p.id, p.weight])) as Record<PillarId, number>;

function loadWeights(): Record<PillarId, number> {
  try {
    const saved = JSON.parse(localStorage.getItem(WEIGHTS_KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...DEFAULT_WEIGHTS, ...saved };
  } catch {}
  return DEFAULT_WEIGHTS;
}

// Pillar weights as 0–5 ratings (the OECD Better Life Index pattern). Shown as
// percentages of the total. Weights are value judgments, so the panel says so.
function WeightsControl({ weights, onChange }: { weights: Record<PillarId, number>; onChange: (w: Record<PillarId, number>) => void }) {
  const [open, setOpen] = useState(false);
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const isDefault = config.pillars.every((p) => weights[p.id as PillarId] === DEFAULT_WEIGHTS[p.id as PillarId]);
  return (
    <section className="rounded border border-border/60 p-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full justify-between text-left">
        <span className="font-medium">
          {open ? "▾" : "▸"} Your priorities {isDefault ? "(equal weights)" : "(custom)"}
        </span>
        <span className="text-muted-foreground">value judgments</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {config.pillars.map((p) => {
            const id = p.id as PillarId;
            return (
              <label key={id} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2">
                <span className="truncate">{p.label}</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={weights[id]}
                  onChange={(e) => onChange({ ...weights, [id]: Number(e.target.value) })}
                  aria-label={`${p.label} weight`}
                />
                <span className="text-right tabular-nums text-muted-foreground">{Math.round((weights[id] / total) * 100)}%</span>
              </label>
            );
          })}
          <div className="flex flex-wrap gap-1 pt-1">
            {Object.entries(config.presets).map(([name, w]) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange({ ...DEFAULT_WEIGHTS, ...(w as Partial<Record<PillarId, number>>) })}
                className="rounded border px-1.5 py-0.5 hover:bg-foreground/10"
              >
                {name.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function PillarsPanel({ pin, onClose }: { pin: string; onClose: () => void }) {
  const { data, status } = useParcelData(pin);
  const [weights, setWeightsState] = useState<Record<PillarId, number>>(DEFAULT_WEIGHTS);
  useEffect(() => setWeightsState(loadWeights()), []);
  const setWeights = (w: Record<PillarId, number>) => {
    setWeightsState(w);
    try {
      localStorage.setItem(WEIGHTS_KEY, JSON.stringify(w));
    } catch {}
  };
  const overrides = useMemo<WeightOverrides>(() => ({ pillars: weights }), [weights]);
  const isDefault = config.pillars.every((p) => weights[p.id as PillarId] === DEFAULT_WEIGHTS[p.id as PillarId]);
  const result = useMemo(() => (data ? scoreParcel(data.norm, overrides) : null), [data, overrides]);
  const range = useMemo(() => {
    if (!result) return null;
    const r = weightSensitivity(result.pillars, overrides);
    // The spread comes from the pillar blend; apply the same zoning and availability multipliers.
    const m = (result.legal?.multiplier ?? 1) * (result.availability?.multiplier ?? 1);
    return r ? { p10: r.p10 * m, p90: r.p90 * m } : null;
  }, [result, overrides]);
  const rank = data && result ? percentileRank(data.quantiles?.overall, result.overall) : null;
  const overallPhrase =
    result?.availability && result.availability.multiplier < 1 ? result.availability.label : phraseFor("overall", rank);

  return (
    <aside className="flex h-full w-[22rem] shrink-0 flex-col border-l bg-background text-xs">
      <header className="flex items-start justify-between gap-2 border-b p-3">
        <div>
          <p className="text-muted-foreground">Parcel</p>
          <p className="font-mono text-sm">{pin}</p>
          {data && <p className="text-muted-foreground">Zoning {data.zoning || "unknown"}</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded px-2 py-1 hover:bg-foreground/10" aria-label="Close parcel panel">
          ✕
        </button>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {status === "loading" && <p className="text-muted-foreground">Loading scores…</p>}
        {status === "missing" && (
          <p className="text-muted-foreground">No pillar scores for this parcel. Scores cover City of Pittsburgh parcels only.</p>
        )}
        {data && result && (
          <>
            <WeightsControl weights={weights} onChange={setWeights} />
            <section className="rounded border border-border/60 p-2">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Overall</span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: scoreColor(result.overall) }}>
                  {fmtScore(result.overall)}
                </span>
              </div>
              <ScoreBar score={result.overall} />
              {result.overall == null && <p className="mt-1">Not enough data for an overall score.</p>}
              {config.pillars.some((p) => result.pillars[p.id as PillarId].score == null) && (
                <p className="mt-1 text-amber-400/90">
                  Not enough data for {config.pillars.filter((p) => result.pillars[p.id as PillarId].score == null).map((p) => p.label).join(", ")};
                  counted as a neutral 50.
                </p>
              )}
              {rank != null && (
                <p className="mt-1">
                  Better than <span className="font-semibold">{rank}%</span> of City parcels as a place to build
                  {isDefault ? "" : " (compared with scores at equal weights)"}.
                </p>
              )}
              {overallPhrase && <p className="mt-1">{overallPhrase}</p>}
              <p className="mt-1 text-muted-foreground">
                Weighted {config.overall.method} mean of the five pillars ({fmtScore(result.overallBeforeMultipliers)}),{" "}
                {isDefault ? "equal weights" : "your weights"}
                {result.legal && result.legal.multiplier < 1 ? `, × ${result.legal.multiplier} for zoning` : ""}
                {result.availability && result.availability.multiplier < 1 ? `, × ${result.availability.multiplier} for site availability` : ""}.
                {range && ` If the weights shifted a little: ${Math.round(range.p10)}–${Math.round(range.p90)}.`}
              </p>
            </section>
            {result.availability && result.availability.multiplier < 1 && (
              <section className="rounded border border-red-500/60 bg-red-500/10 p-2">
                <p className="font-medium">{result.availability.label}</p>
                <p className="text-muted-foreground">Overall score × {result.availability.multiplier}.</p>
                {result.availability.note && <p className="text-muted-foreground">{result.availability.note}</p>}
              </section>
            )}
            <section
              className={`rounded border p-2 ${result.legal && result.legal.multiplier < 0.6 ? "border-red-500/60 bg-red-500/10" : "border-border/60"}`}
            >
              <p className="font-medium">Zoning (current code)</p>
              <p>{result.legal ? result.legal.label : "Legal status unknown for this district"}</p>
              {result.legal && result.legal.multiplier < 1 && (
                <p className="text-muted-foreground">Overall score × {result.legal.multiplier}.</p>
              )}
              {result.legal?.note && <p className="text-muted-foreground">{result.legal.note}</p>}
              <p className="text-muted-foreground">
                Easiest pathway among detached, townhouse, two-unit, three-unit and multi-unit housing. Simplified reading of §911.02;
                verify with the Zoning Administrator.
              </p>
            </section>
            {config.pillars.map((p) => (
              <PillarCard key={p.id} id={p.id as PillarId} score={result.pillars[p.id as PillarId]} data={data} />
            ))}
            <p className="text-muted-foreground">
              All scores 0–100: 100 = a good place to build new housing, 0 = a poor one. Default weights and every rule are
              published in pillars.config.json (v{config.version}). Click a pillar for its calculations, and an indicator for its source.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
