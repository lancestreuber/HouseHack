import { Checkbox } from "@HouseHack/ui/components/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@HouseHack/ui/components/select";
import { Slider } from "@HouseHack/ui/components/slider";
import { Info, Loader2, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";
import { areaReport } from "@/lib/typology-map/area-report";
import { CAPACITY_ASSUMPTIONS, TARGET_ZONES } from "@/lib/typology-map/capacity";
import {
  BORDER_FT,
  type Cluster,
  EASE_WEIGHTS,
  EASY_REZONING,
  HAZARD_KNOBS,
  HEAT_TYPOLOGIES,
  type HazardKnob,
  type HeatParams,
  type HeatTypology,
  LOCATION_INCENTIVES,
  mostlyStressed,
} from "@/lib/typology-map/engine";
import { computeLeverMatrix, focusHeatCluster, setHeatEnabled, setHeatParams, useHeat } from "@/lib/typology-map/heatmap-store";

import { AreaReportCard } from "./area-report-card";
import { LeversPanel } from "./levers-panel";
import { DISTRICT_PATHWAYS } from "./overlays/legal-matrix.generated";
import { usePillarWeights } from "./pillar-weights-store";
import { SHORT_LABEL } from "./typology-meta";

const HAZARD_LABEL: Record<HazardKnob, string> = { floodway: "Floodway", floodplain: "Floodplain", steepSlope: "Steep slope", landslide: "Landslides", undermined: "Mines" };
const PERMITS = new Set(["by_right", "za"]);
const MODES: { id: HeatParams["zoning"]; label: string; tip: string }[] = [
  { id: "current", label: "Today", tip: "Where this type fits under today's zoning." },
  { id: "ignore", label: "No zoning", tip: "Where it would fit if zoning allowed it everywhere." },
  { id: "delta", label: "Rezoning", tip: "Only the great-fit parcels a rezoning would unlock, grouped into areas." },
];
const RANK_LABEL: Record<HeatParams["rezone"]["rankBy"], string> = { levers: "Most levers", balanced: "Homes × ease", ease: "Easiest", homes: "Most homes" };
const LEVER_TIP = `Levers in reach, out of 3. Zoning: an easy rezoning (ease ${EASY_REZONING * 100}+). Land: City lots for sale, in transfer or pending. $: a location incentive that helps this type (QCT/DDA tax-credit boost for apartments; Opportunity Zone for any type).`;
const EASE_TIP = `Ease of rezoning, 0–100: ${EASE_WEIGHTS.step * 100}% how small the district change is, ${EASE_WEIGHTS.borders * 100}% whether the area is within ${BORDER_FT} ft of the target district, ${EASE_WEIGHTS.approval * 100}% the district's Zoning Board approval rate. Weights are value judgments.`;
const FOOTNOTE = `Decision support, not zoning or financial advice. ${CAPACITY_ASSUMPTIONS.note} Soils, contamination and utilities are not checked.`;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;
const targetLabel = (t: string) => (t === "auto" ? "Smallest change" : t);

function Tip({ text }: { text: string }) {
  return (
    <span title={text} aria-label={text} className="cursor-help">
      <Info className="inline size-3 align-[-2px] opacity-60" />
    </span>
  );
}

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before == null || before === now) return null;
  const d = now - before;
  return <span className={d > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}> ({d > 0 ? "+" : ""}{fmt(d)})</span>;
}

function Fold({ title, children, defaultOpen }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-t pt-1.5">
      <summary className="cursor-pointer list-none text-foreground">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
        {title}
      </summary>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </details>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span>{children}</span>
    </label>
  );
}

function Knob({ label, value, display, min, max, step, onChange }: { label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0]! : v)} />
    </div>
  );
}

function Pick<T extends string>({ label, value, options, onChange, width = "w-36" }: { label: ReactNode; value: T; options: [T, string][]; onChange: (v: T) => void; width?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v as T)}>
        <SelectTrigger size="sm" className={width}>
          <SelectValue>{options.find(([id]) => id === value)?.[1] ?? value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(([id, text]) => (
            <SelectItem key={id} value={id}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Three pips: zoning, land, $ (filled = in reach). */
function LeverPips({ c }: { c: Cluster }) {
  const pip = (on: boolean, label: string) => (
    <span className={`rounded px-1 ${on ? "bg-purple-500/25 text-foreground" : "text-muted-foreground/50 line-through"}`}>{label}</span>
  );
  return (
    <span className="inline-flex gap-0.5" title={LEVER_TIP}>
      {pip(c.access.zoning, "zoning")}
      {pip(c.access.land, "land")}
      {pip(c.access.incentive, "$")}
    </span>
  );
}

function AreaRow({ c, focused, onPick }: { c: Cluster; focused: boolean; onPick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onPick} className={`w-full rounded border px-2 py-1 text-left hover:bg-muted ${focused ? "border-purple-500" : ""}`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-foreground">
            #{c.id} +{fmt(c.homes)} homes
          </span>
          <LeverPips c={c} />
        </div>
        <div className="flex justify-between gap-1">
          <span>
            {c.zones.join("/")} → {c.target} · {c.acres.toFixed(1)} ac
          </span>
          <span title={EASE_TIP}>
            ease {Math.round(c.ease * 100)}
            {mostlyStressed(c.levers) ? " ⚠" : ""}
          </span>
        </div>
      </button>
    </li>
  );
}

function LeverMatrix({ onPick }: { onPick: (t: HeatTypology) => void }) {
  const { matrix, matrixStatus, matrixParams, params } = useHeat();
  const stale = matrixParams != null && JSON.stringify({ ...matrixParams, typology: 0, zoning: 0 }) !== JSON.stringify({ ...params, typology: 0, zoning: 0 });
  return (
    <div className="space-y-1.5">
      <button type="button" onClick={computeLeverMatrix} disabled={matrixStatus === "running"} className="rounded border px-2 py-0.5 hover:bg-muted disabled:opacity-50">
        {matrixStatus === "running" ? (
          <>
            <Loader2 className="mr-1 inline size-3 animate-spin" />
            Running all 5 types…
          </>
        ) : matrix ? (
          stale ? "Settings changed: re-run" : "Re-run"
        ) : (
          "Compare all housing types"
        )}
      </button>
      {matrix && (
        <table className="w-full text-right tabular-nums">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-normal">Type</th>
              <th className="font-normal" title="Rezoning areas / new homes">Areas</th>
              <th className="font-normal" title="Areas with each lever in reach">Z · L · $</th>
              <th className="font-normal" title="Areas with all three levers, and their new homes">All 3</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.typology} className={`cursor-pointer hover:bg-muted ${row.typology === params.typology ? "text-foreground" : ""}`} onClick={() => onPick(row.typology)}>
                <td className="text-left">{SHORT_LABEL[row.typology]}</td>
                <td>{fmt(row.areas)}</td>
                <td>
                  {fmt(row.withLever.zoning)} · {fmt(row.withLever.land)} · {fmt(row.withLever.incentive)}
                </td>
                <td>
                  {fmt(row.byLevers[3]?.areas ?? 0)} <span className="text-muted-foreground">(+{fmt(row.byLevers[3]?.homes ?? 0)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        $ differs by type: {HEAT_TYPOLOGIES.map((t) => `${SHORT_LABEL[t]} ${LOCATION_INCENTIVES[t]?.join("/").toUpperCase()}`).join("; ")}. City-wide programs (URA gap financing) apply everywhere, so they aren't
        location levers.
      </p>
    </div>
  );
}

/** "Where to build": the map colors, the rezoning areas that matter most, and everything else folded away. */
export function HeatmapPanel({
  onClose,
  onFlyTo,
  selectedPin,
}: {
  onClose: () => void;
  onFlyTo: (bounds: [[number, number], [number, number]]) => void;
  selectedPin: string | null;
}) {
  const heat = useHeat();
  const { params, result, previous, status } = heat;
  const myWeights = usePillarWeights();
  const [showAll, setShowAll] = useState(false);

  // Location scores use the app's pillar weights (set from the rail), not a separate picker.
  useEffect(() => {
    const weights = Object.fromEntries(config.pillars.map((p) => [p.id, myWeights[p.id as PillarId] ?? p.weight])) as Record<PillarId, number>;
    setHeatParams((prev) => ({ ...prev, weights }));
  }, [myWeights]);

  const update = (patch: Partial<HeatParams>) => setHeatParams((prev) => ({ ...prev, ...patch }));
  const updateIgnore = (patch: Partial<HeatParams["ignore"]>) => setHeatParams((prev) => ({ ...prev, ignore: { ...prev.ignore, ...patch } }));
  const updateRezone = (patch: Partial<HeatParams["rezone"]>) => setHeatParams((prev) => ({ ...prev, rezone: { ...prev.rezone, ...patch } }));

  const targets = TARGET_ZONES.filter((z) => PERMITS.has(DISTRICT_PATHWAYS[z]?.[params.typology] ?? ""));
  const setTypology = (typology: HeatTypology) => {
    const allowed = TARGET_ZONES.filter((z) => PERMITS.has(DISTRICT_PATHWAYS[z]?.[typology] ?? ""));
    const current = params.rezone.target;
    const target = current === "auto" || allowed.includes(current) ? current : "auto";
    setHeatParams((prev) => ({ ...prev, typology, rezone: { ...prev.rezone, target } }));
  };

  const flyToCluster = (id: number) => {
    const c = result?.clusters.find((x) => x.id === id);
    if (!c) return;
    focusHeatCluster(id);
    const xs = c.hull.map((p) => p[0]);
    const ys = c.hull.map((p) => p[1]);
    onFlyTo([
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ]);
  };

  const s = result?.summary;
  const focused = heat.focusCluster != null ? result?.clusters.find((c) => c.id === heat.focusCluster) : undefined;
  // Picking an area (here or on the map) brings its report into view.
  useEffect(() => {
    if (heat.focusCluster == null) return;
    // Scroll only the panel's own scroller; scrollIntoView would also shift the map pane.
    const report = document.getElementById("heat-area-report");
    const scroller = report?.closest(".overflow-y-auto");
    if (report && scroller) scroller.scrollTo({ top: report.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8, behavior: "smooth" });
  }, [heat.focusCluster]);
  const busy = status === "loading" || status === "running";
  const areas = result?.clusters.slice(0, showAll ? 30 : 6) ?? [];

  return (
    <div className="w-80 space-y-2 rounded-md border bg-background/95 p-3 text-xs text-muted-foreground shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Where to build</span>
        <Select value={params.typology} onValueChange={(v) => v && setTypology(v as HeatTypology)}>
          <SelectTrigger size="sm" className="flex-1" aria-label="Housing type">
            <SelectValue>{SHORT_LABEL[params.typology]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {HEAT_TYPOLOGIES.map((t) => (
              <SelectItem key={t} value={t}>
                {SHORT_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {busy && <Loader2 className="size-3.5 animate-spin" aria-label="Running" />}
        <button
          type="button"
          onClick={() => {
            setHeatEnabled(false);
            onClose();
          }}
          title="Close"
          className="rounded p-1 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex overflow-hidden rounded-md border">
        {MODES.map((mode, k) => (
          <button
            key={mode.id}
            type="button"
            title={mode.tip}
            onClick={() => update({ zoning: mode.id })}
            className={`flex-1 px-1.5 py-1 ${k > 0 ? "border-l" : ""} ${params.zoning === mode.id ? "bg-foreground text-background" : ""}`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {result.legend
            .filter((e) => e.key !== "same")
            .map((e) => (
              <span key={e.key} className="inline-flex items-center gap-1">
                <span className="inline-block size-2 rounded-full border" style={{ background: e.color }} />
                {e.label} <span className="tabular-nums text-foreground">{fmt(e.count)}</span>
              </span>
            ))}
        </div>
      )}
      {status === "loading" && <p>Loading citywide parcel facts (about 3 MB)…</p>}
      {status === "error" && <p className="text-red-600">Heatmap failed: {heat.error}</p>}

      {focused ? (
        <AreaReportCard report={areaReport(focused, params)} onBack={() => focusHeatCluster(null)} />
      ) : (
        s && (
          <div className="space-y-1.5">
            <p className="text-foreground">
              Rezoning the top {Math.min(10, result.clusters.length)} areas ({s.top10.acres.toFixed(0)} acres) unlocks <b>+{fmt(s.top10.homes)} homes</b>
              <Delta now={s.top10.homes} before={previous?.top10.homes} />, {fmt(s.top10.affordable)} affordable.{" "}
              <span className="text-muted-foreground">
                {fmt(s.byLevers[3]?.areas ?? 0)} of {fmt(result.clusters.length)} areas have all 3 levers <Tip text={LEVER_TIP} />
              </span>
            </p>
            <ol className="space-y-1">
              {areas.map((c) => (
                <AreaRow key={c.id} c={c} focused={heat.focusCluster === c.id} onPick={() => flyToCluster(c.id)} />
              ))}
            </ol>
            {result.clusters.length > 6 && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="hover:text-foreground">
                {showAll ? "Show fewer" : `Show more (${fmt(result.clusters.length)} areas)`}
              </button>
            )}
          </div>
        )
      )}

      <Fold title="Levers × housing types">
        <LeverMatrix onPick={setTypology} />
      </Fold>

      {selectedPin && (
        <Fold title="Selected parcel: what could the City do?">
          <LeversPanel pin={selectedPin} typology={params.typology} />
        </Fold>
      )}

      <Fold title="Settings">
        <Pick label="Rank areas by" value={params.rezone.rankBy} options={Object.entries(RANK_LABEL) as [HeatParams["rezone"]["rankBy"], string][]} onChange={(rankBy) => updateRezone({ rankBy })} />
        <Pick
          label={
            <>
              Levers in reach <Tip text={LEVER_TIP} />
            </>
          }
          value={String(params.rezone.minLevers)}
          options={[
            ["0", "Any"],
            ["1", "1+"],
            ["2", "2+"],
            ["3", "All 3"],
          ]}
          onChange={(v) => updateRezone({ minLevers: Number(v) })}
        />
        <Knob label="Affordable share of new homes" value={params.rezone.affordableShare} display={pct(params.rezone.affordableShare)} min={0} max={1} step={0.05} onChange={(affordableShare) => updateRezone({ affordableShare })} />
        <Pick label="Rezone to" value={params.rezone.target} options={["auto", ...targets].map((z) => [z, targetLabel(z)])} onChange={(target) => updateRezone({ target })} />
        <Knob label="Group parcels within" value={params.rezone.joinFt} display={`${params.rezone.joinFt} ft`} min={25} max={500} step={25} onChange={(joinFt) => updateRezone({ joinFt })} />
        <Knob label="Smallest area" value={params.rezone.minHomes} display={`${params.rezone.minHomes} homes`} min={1} max={200} step={1} onChange={(minHomes) => updateRezone({ minHomes })} />
        <Knob label="Green = top" value={params.tiers.green} display={pct(params.tiers.green)} min={0.05} max={0.6} step={0.05} onChange={(green) => update({ tiers: { ...params.tiers, green } })} />
        <Knob label="Red = bottom" value={params.tiers.red} display={pct(params.tiers.red)} min={0} max={0.6} step={0.05} onChange={(red) => update({ tiers: { ...params.tiers, red } })} />
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(HAZARD_KNOBS) as HazardKnob[]).map((k) => (
            <Check key={k} checked={!params.ignore[k]} onChange={(v) => updateIgnore({ [k]: !v })}>
              {HAZARD_LABEL[k]}
            </Check>
          ))}
          <Check checked={!params.ignore.setbacks} onChange={(v) => updateIgnore({ setbacks: !v })}>
            Setbacks
          </Check>
          <Check checked={!params.ignore.pencil} onChange={(v) => updateIgnore({ pencil: !v })}>
            Pencil check
          </Check>
          <Check checked={!params.ignore.availability} onChange={(v) => updateIgnore({ availability: !v })}>
            What's there
          </Check>
          <Check checked={params.subsidy} onChange={(v) => update({ subsidy: v })}>
            Subsidy available
          </Check>
          <Check checked={params.strict} onChange={(v) => update({ strict: v })}>
            Strict colors
          </Check>
        </div>
        <Check checked={params.rezone.vacantOnly} onChange={(v) => updateRezone({ vacantOnly: v })}>
          Vacant land and parking only
        </Check>
        <Check checked={params.rezone.excludeStressed} onChange={(v) => updateRezone({ excludeStressed: v })}>
          Skip mostly Transitional/Stressed markets <Tip text="MVA 2021 market types G–J. A value judgment: see the equity guardrail in each area report." />
        </Check>
        <Check checked={params.rezone.requireCityLand} onChange={(v) => updateRezone({ requireCityLand: v })}>
          Must have City land
        </Check>
        <Check checked={params.rezone.requireIncentive} onChange={(v) => updateRezone({ requireIncentive: v })}>
          Must have a location incentive
        </Check>
        <Check checked={params.rezone.includeYellow} onChange={(v) => updateRezone({ includeYellow: v })}>
          Include yellow parcels
        </Check>
        <Check checked={params.rezone.hearingsLocked} onChange={(v) => updateRezone({ hearingsLocked: v })}>
          Count hearings as locked
        </Check>
        <Check checked={params.rezone.sameDistrict} onChange={(v) => updateRezone({ sameDistrict: v })}>
          One district per area
        </Check>
      </Fold>

      <p className="border-t pt-1.5">
        Rough estimates; decision support only. <Tip text={FOOTNOTE} />
        {s && <span className="float-right">{(s.ms / 1000).toFixed(1)} s</span>}
      </p>
    </div>
  );
}
