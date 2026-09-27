import { Checkbox } from "@HouseHack/ui/components/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@HouseHack/ui/components/select";
import { Slider } from "@HouseHack/ui/components/slider";
import { Loader2, RotateCw, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";
import { CAPACITY_ASSUMPTIONS, TARGET_ZONES } from "@/lib/typology-map/capacity";
import { BORDER_FT, type Cluster, EASE_WEIGHTS, HAZARD_KNOBS, HEAT_TYPOLOGIES, type HazardKnob, type HeatParams, type HeatTypology, mostlyStressed } from "@/lib/typology-map/engine";
import { areaReport } from "@/lib/typology-map/area-report";
import { focusHeatCluster, rerunHeat, setHeatEnabled, setHeatParams, useHeat } from "@/lib/typology-map/heatmap-store";

import { AreaReportCard } from "./area-report-card";
import { LeversPanel } from "./levers-panel";

import { DISTRICT_PATHWAYS } from "./overlays/legal-matrix.generated";
import { usePillarWeights } from "./pillar-weights-store";
import { SHORT_LABEL } from "./typology-meta";

const HAZARD_LABEL: Record<HazardKnob, string> = {
  floodway: "Floodway",
  floodplain: "Floodplain",
  steepSlope: "Steep slope",
  landslide: "Landslides",
  undermined: "Mines",
};

const PRESET_LABEL: Record<string, string> = {
  affordability_first: "Affordability first",
  equal: "Equal",
  family: "Families",
  older_adult: "Older adults",
  climate_first: "Climate first",
  market_first: "Market first",
  mine: "My weights (navbar)",
};

const PERMITS = new Set(["by_right", "za"]);
const MODES: { id: HeatParams["zoning"]; label: string }[] = [
  { id: "current", label: "Today's zoning" },
  { id: "ignore", label: "Ignore zoning" },
  { id: "delta", label: "Rezoning delta" },
];
const RANK_LABEL: Record<HeatParams["rezone"]["rankBy"], string> = { balanced: "Homes × ease", ease: "Easiest first", homes: "Most homes" };
const targetLabel = (t: string) => (t === "auto" ? "Smallest change" : t);

function easeNote(c: Cluster) {
  const step = c.easeParts.step === 1 ? "density change only" : c.easeParts.step === 0.5 ? "one district step" : "big district jump";
  const border = c.easeParts.borders ? `extends a neighboring ${c.target.split("-")[0]} district` : `no ${c.target.split("-")[0]} district next door`;
  return `${step} · ${border} · ZBA approves ${Math.round(c.easeParts.approval * 100)}% here`;
}

function leverNote(c: Cluster) {
  const l = c.levers;
  if (!l.known) return null;
  const city = l.cityForSale + l.cityTransfer + l.cityPending;
  const parts = [
    city ? `${city} City lot${city > 1 ? "s" : ""}` : null,
    l.anyIncentive ? `${l.anyIncentive} in QCT/DDA/OZ` : null,
    l.delinquent ? `${l.delinquent} tax-delinquent` : null,
    mostlyStressed(l) ? "⚠ mostly Transitional/Stressed market" : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "no City land or federal designation";
}
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before == null || before === now) return null;
  const d = now - before;
  return <span className={d > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}> ({d > 0 ? "+" : ""}{fmt(d)})</span>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 border-t pt-2">
      <div className="font-medium text-foreground">{title}</div>
      {children}
    </div>
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
        <span className="tabular-nums text-muted-foreground">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0]! : v)} />
    </div>
  );
}

/** Knobs and results for the typology heatmap and rezoning explorer. Every change re-runs the engine citywide. */
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
  const [weightsChoice, setWeightsChoice] = useState("affordability_first");

  useEffect(() => {
    const preset = weightsChoice === "mine" ? null : (config.presets as Record<string, Record<PillarId, number>>)[weightsChoice];
    const weights = Object.fromEntries(config.pillars.map((p) => [p.id, preset ? preset[p.id as PillarId] : (myWeights[p.id as PillarId] ?? p.weight)])) as Record<PillarId, number>;
    setHeatParams((prev) => ({ ...prev, weights }));
  }, [weightsChoice, myWeights]);

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

  return (
    <div className="w-80 space-y-2 rounded-md border bg-background/95 p-3 text-xs text-muted-foreground shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">Where to build: {SHORT_LABEL[params.typology]}</div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={rerunHeat} title="Re-run" className="rounded p-1 hover:text-foreground">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setHeatEnabled(false);
              onClose();
            }}
            title="Close heatmap"
            className="rounded p-1 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={params.typology} onValueChange={(v) => v && setTypology(v as HeatTypology)}>
          <SelectTrigger size="sm" aria-label="Housing type">
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
        <Select value={weightsChoice} onValueChange={(v) => v && setWeightsChoice(v)}>
          <SelectTrigger size="sm" aria-label="Location weights">
            <SelectValue>{PRESET_LABEL[weightsChoice] ?? weightsChoice}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[...Object.keys(config.presets), "mine"].map((p) => (
              <SelectItem key={p} value={p}>
                {PRESET_LABEL[p] ?? p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex overflow-hidden rounded-md border">
        {MODES.map((mode, k) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => update({ zoning: mode.id })}
            className={`flex-1 px-1.5 py-1 ${k > 0 ? "border-l" : ""} ${params.zoning === mode.id ? "bg-foreground text-background" : ""}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {params.zoning === "delta" && (
        <p>Bright green: great-fit parcels that only a rezoning makes available, grouped into the areas below. Grey: already buildable today. Everything else is hidden.</p>
      )}

      {result && (
        <div className="grid grid-cols-4 gap-1 text-center">
          {result.legend.map((e) => (
            <div key={e.key} className="rounded border px-1 py-0.5">
              <div className="mx-auto mb-0.5 h-1.5 w-6 rounded border" style={{ background: e.color }} />
              <div className="tabular-nums text-foreground">{fmt(e.count)}</div>
              <div className="leading-tight">{e.label}</div>
            </div>
          ))}
        </div>
      )}
      {focused && (
        <div id="heat-area-report" className="scroll-mt-2 rounded-md border border-purple-500 p-2">
          <AreaReportCard report={areaReport(focused, params)} onBack={() => focusHeatCluster(null)} />
        </div>
      )}
      {selectedPin && (
        <details className="rounded-md border px-2 py-1">
          <summary className="cursor-pointer text-foreground">Selected parcel: what could the City do here?</summary>
          <div className="mt-1">
            <LeversPanel pin={selectedPin} typology={params.typology} embedded />
          </div>
        </details>
      )}
      {status === "loading" && <p>Loading citywide parcel facts (about 3 MB)…</p>}
      {status === "error" && <p className="text-red-600">Heatmap failed: {heat.error}</p>}

      <Section title="Checks that count">
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(HAZARD_KNOBS) as HazardKnob[]).map((k) => (
            <Check key={k} checked={!params.ignore[k]} onChange={(v) => updateIgnore({ [k]: !v })}>
              {HAZARD_LABEL[k]}
            </Check>
          ))}
          <Check checked={!params.ignore.setbacks} onChange={(v) => updateIgnore({ setbacks: !v })}>
            Side setbacks
          </Check>
          <Check checked={!params.ignore.pencil} onChange={(v) => updateIgnore({ pencil: !v })}>
            Pencil check
          </Check>
          <Check checked={!params.ignore.availability} onChange={(v) => updateIgnore({ availability: !v })}>
            What's there now
          </Check>
          <Check checked={params.subsidy} onChange={(v) => update({ subsidy: v })}>
            Subsidy available
          </Check>
        </div>
        <Check checked={params.strict} onChange={(v) => update({ strict: v })}>
          Strict: any yellow check caps a parcel at yellow
        </Check>
        <Knob label="Green = top" value={params.tiers.green} display={pct(params.tiers.green)} min={0.05} max={0.6} step={0.05} onChange={(green) => update({ tiers: { ...params.tiers, green } })} />
        <Knob label="Red = bottom" value={params.tiers.red} display={pct(params.tiers.red)} min={0} max={0.6} step={0.05} onChange={(red) => update({ tiers: { ...params.tiers, red } })} />
        <p>Colors rank location scores (your weights) citywide; deal-killers turn a parcel red regardless. Unchecked hazards count as absent.</p>
      </Section>

      <Section title="Rezoning explorer">
        <p>Parcels where zoning is the only thing in the way: green (or yellow, if allowed) with zoning ignored, but not permitted today.</p>
        <div className="flex items-center justify-between gap-2">
          <span>Rezone to</span>
          <Select value={params.rezone.target} onValueChange={(v) => v && updateRezone({ target: v })}>
            <SelectTrigger size="sm" className="w-36" aria-label="Rezone to district">
              <SelectValue>{targetLabel(params.rezone.target)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {["auto", ...targets].map((z) => (
                <SelectItem key={z} value={z}>
                  {targetLabel(z)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Rank areas by</span>
          <Select value={params.rezone.rankBy} onValueChange={(v) => v && updateRezone({ rankBy: v as HeatParams["rezone"]["rankBy"] })}>
            <SelectTrigger size="sm" className="w-36" aria-label="Rank rezoning areas by">
              <SelectValue>{RANK_LABEL[params.rezone.rankBy]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RANK_LABEL) as HeatParams["rezone"]["rankBy"][]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RANK_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p>
          Ease of rezoning (0–100) = {EASE_WEIGHTS.step * 100}% how small the district change is + {EASE_WEIGHTS.borders * 100}% whether the area is within {BORDER_FT} ft of the
          target district, so the rezoning extends a neighbor (Council adopted 42 of 49 site rezonings since 2015) + {EASE_WEIGHTS.approval * 100}% the district's Zoning Board relief approval
          rate. The weights are value judgments.
        </p>
        <Knob label="Affordable share of new homes" value={params.rezone.affordableShare} display={pct(params.rezone.affordableShare)} min={0} max={1} step={0.05} onChange={(affordableShare) => updateRezone({ affordableShare })} />
        <Knob label="Group parcels within" value={params.rezone.joinFt} display={`${params.rezone.joinFt} ft`} min={25} max={500} step={25} onChange={(joinFt) => updateRezone({ joinFt })} />
        <Knob label="Smallest area worth showing" value={params.rezone.minHomes} display={`${params.rezone.minHomes} homes`} min={1} max={200} step={1} onChange={(minHomes) => updateRezone({ minHomes })} />
        <div className="grid grid-cols-1 gap-1">
          <div className="pt-1 text-foreground">Line up the levers</div>
          <Check checked={params.rezone.requireCityLand} onChange={(v) => updateRezone({ requireCityLand: v })}>
            Only areas with City land (for sale, in transfer or pending)
          </Check>
          <Check checked={params.rezone.requireIncentive} onChange={(v) => updateRezone({ requireIncentive: v })}>
            Only areas in a QCT, DDA or Opportunity Zone
          </Check>
          <Check checked={params.rezone.excludeStressed} onChange={(v) => updateRezone({ excludeStressed: v })}>
            Skip areas mostly in Transitional/Stressed markets (a value judgment)
          </Check>
          <div className="pt-1 text-foreground">Which parcels count</div>
          <Check checked={params.rezone.vacantOnly} onChange={(v) => updateRezone({ vacantOnly: v })}>
            Vacant land and parking only (no one displaced)
          </Check>
          <Check checked={params.rezone.includeYellow} onChange={(v) => updateRezone({ includeYellow: v })}>
            Include yellow parcels
          </Check>
          <Check checked={params.rezone.hearingsLocked} onChange={(v) => updateRezone({ hearingsLocked: v })}>
            Count hearings (special exception, conditional use) as locked
          </Check>
          <Check checked={params.rezone.sameDistrict} onChange={(v) => updateRezone({ sameDistrict: v })}>
            One district per area (one map amendment each)
          </Check>
        </div>

        {s && (
          <div className="space-y-1 rounded border p-2 text-foreground">
            <div>
              Rezoning the top {Math.min(10, result.clusters.length)} areas ({s.top10.acres.toFixed(0)} acres){" "}
              {params.rezone.target === "auto" ? "with the smallest change each" : `to ${params.rezone.target}`} unlocks{" "}
              <b>+{fmt(s.top10.homes)} homes</b>
              <Delta now={s.top10.homes} before={previous?.top10.homes} />, <b>{fmt(s.top10.affordable)} affordable</b> at {pct(params.rezone.affordableShare)}.
            </div>
            <div className="text-muted-foreground">
              All {fmt(result.clusters.length)} areas: +{fmt(s.homesUnlocked)} homes
              <Delta now={s.homesUnlocked} before={previous?.homesUnlocked} /> on {fmt(s.lockedParcels)} locked parcels ({s.acresLocked.toFixed(0)} acres). Green parcels
              today could hold about {fmt(s.homesGreenToday)}
              <Delta now={s.homesGreenToday} before={previous?.homesGreenToday} /> homes ({SHORT_LABEL[params.typology].toLowerCase()}).{" "}
              {fmt(s.aligned)} areas have zoning, City land and a federal incentive lined up. Click an area for its report.
            </div>
          </div>
        )}
        {result && result.clusters.length > 0 && (
          <ol className="max-h-48 space-y-1 overflow-y-auto">
            {result.clusters.slice(0, 25).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => flyToCluster(c.id)}
                  className={`w-full rounded border px-2 py-1 text-left hover:bg-muted ${heat.focusCluster === c.id ? "border-purple-500" : ""}`}
                >
                  <span className="text-foreground">
                    #{c.id} +{fmt(c.homes)} homes · ease {Math.round(c.ease * 100)}
                  </span>{" "}
                  ({fmt(c.affordableHomes)} affordable) · {c.acres.toFixed(1)} ac · {c.parcels.length} parcels, {c.vacant} vacant · {c.zones.join("/")} → {c.target}
                  <span className="block">{easeNote(c)}</span>
                  {leverNote(c) && <span className="block text-foreground/80">{leverNote(c)}</span>}
                </button>
              </li>
            ))}
          </ol>
        )}
        {s && <p>Ran citywide in {(s.ms / 1000).toFixed(1)} s.</p>}
      </Section>

      <p className="border-t pt-2">
        Decision support, not zoning or financial advice. Home counts are rough envelope estimates: {CAPACITY_ASSUMPTIONS.note} The affordable share is your assumption (the IZ overlay and the
        proposed bonus use 10%). Soils, contamination and utilities are not checked.
      </p>
    </div>
  );
}
