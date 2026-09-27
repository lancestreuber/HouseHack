import { useMemo, useState } from "react";

import { usePencilAssumptions } from "@/lib/pillars/pencil-assumptions";
import type { IndicatorValues } from "@/lib/pillars/score";
import { VERDICT_COLOR, VERDICT_NOT_CHECKED } from "@/lib/pillars/verdict";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@HouseHack/ui/components/select";

import { PATHWAY_META, TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS } from "./overlays/legal-matrix.generated";
import { type ParcelData, ScoreBar, useParcelData, useTypologyFit } from "./pillars-panel";
import { type FitsById, rezoningCloseness, rezoningLikelihood, SHORT_LABEL, SITE_FIT_TYPOLOGY, verdictFor } from "./typology-meta";

// Legal pathway -> rough feasibility score, so four typologies can be
// compared at a glance without reading the pathway label on every tile.
// Higher = fewer approvals/hearings required to build that housing type here.
// "not_permitted" isn't a fixed number here -- see notPermittedScore below,
// it's the one pathway that isn't a single fact about *this* district.
export const PATHWAY_SCORE: Record<string, number | null> = {
  by_right: 100,
  za: 85,
  zbe_special_exception: 60,
  conditional_use: 40,
  per_plan: null,
  not_city_jurisdiction: null,
};

// Kept a tier below conditional_use (which is already a known, in-code
// process): "not permitted" always means *some* extra process is needed, so
// it should never show as a flat, indistinguishable 0 -- but it also
// shouldn't outrank a typology that's merely conditional today.
const NOT_PERMITTED_FLOOR = 5;
const NOT_PERMITTED_RANGE = 30;

export function notPermittedScore(zone: string, typologyId: string): number {
  const closeness = rezoningCloseness(zone, typologyId);
  const likelihood = rezoningLikelihood(zone);
  return Math.round(NOT_PERMITTED_FLOOR + closeness * likelihood * NOT_PERMITTED_RANGE);
}

const DEFAULT_TYPOLOGY_IDS = ["single_detached", "two_unit", "three_unit", "multi_unit"];

// Hex -> [hue, saturation%, lightness%], so the two endpoint colors below
// can be interpolated in HSL space (a straight RGB lerp between these two
// particular reds/greens middles out to a muddy olive, since neither is
// fully saturated; HSL's hue sweeps through orange/yellow/lime instead).
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6) : 0;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

const SCORE_COLOR_LOW = hexToHsl("#ef4444");
const SCORE_COLOR_HIGH = hexToHsl("#22c55e");

function scoreColor(score: number | null) {
  if (score == null) return "#525252";
  const t = Math.max(0, Math.min(1, score / 100));
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const h = lerp(SCORE_COLOR_LOW[0], SCORE_COLOR_HIGH[0]);
  const s = lerp(SCORE_COLOR_LOW[1], SCORE_COLOR_HIGH[1]);
  const l = lerp(SCORE_COLOR_LOW[2], SCORE_COLOR_HIGH[2]);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function TypologyCard({
  typologyId,
  onTypologyChange,
  zoning,
  values,
  fitsById,
  lotWidthFt,
  onSelectTypology,
}: {
  typologyId: string;
  onTypologyChange: (id: string) => void;
  zoning: string;
  /** Parcel indicators: normalized for the hazard checks, raw for the pencil check's dollar values. */
  values: { norm: IndicatorValues; raw: IndicatorValues };
  /** Jev's site-fit results, keyed by its own (coarser) typology id -- see
   * SITE_FIT_TYPOLOGY. Undefined while loading or if Jev is unavailable. */
  fitsById?: FitsById;
  /** Lot width in feet, for the side-setback check; undefined while loading. */
  lotWidthFt?: number | null;
  /** Switches the inspector to the Alerts tab, scrolled to this card's typology. */
  onSelectTypology?: (siteFitId: string) => void;
}) {
  const pathwayId = DISTRICT_PATHWAYS[zoning]?.[typologyId];
  const score =
    pathwayId === "not_permitted" ? notPermittedScore(zoning, typologyId) : pathwayId ? PATHWAY_SCORE[pathwayId] : undefined;
  const pathway = pathwayId ? PATHWAY_META[pathwayId] : undefined;
  const tooltip =
    pathwayId === "not_permitted"
      ? `${pathway?.label} -- rezoning closeness ${Math.round(rezoningCloseness(zoning, typologyId) * 100)}%, district relief approval rate ${Math.round(rezoningLikelihood(zoning) * 100)}%`
      : pathway?.label;
  const siteFitId = SITE_FIT_TYPOLOGY[typologyId];
  const fit = siteFitId ? fitsById?.[siteFitId] : undefined;
  const canJumpToAlerts = Boolean(siteFitId && onSelectTypology);
  const pencil = usePencilAssumptions();
  const verdict = verdictFor(zoning, typologyId, values, { fitsById, lotWidthFt, pencil });
  const blockers = verdict.reasons.filter((r) => r.level !== "green");
  const reliefOdds = pathwayId === "not_permitted" ? Math.round(rezoningCloseness(zoning, typologyId) * rezoningLikelihood(zoning) * 100) : null;

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border border-border bg-background/60 p-3 ${canJumpToAlerts ? "cursor-pointer" : ""}`}
      onClick={canJumpToAlerts ? () => onSelectTypology?.(siteFitId!) : undefined}
      title={canJumpToAlerts ? "Jump to this typology's alerts" : undefined}
    >
      <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: VERDICT_COLOR[verdict.level] }} aria-hidden />
          <Select value={typologyId} onValueChange={(value) => value && onTypologyChange(value)}>
            <SelectTrigger size="sm" className="h-6 min-w-0 flex-1 border-none px-0 text-[15px] font-semibold shadow-none">
              <SelectValue>{SHORT_LABEL[typologyId] ?? typologyId}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TYPOLOGIES.map(([id, label]) => (
                <SelectItem key={id} value={id} title={label}>
                  {SHORT_LABEL[id] ?? label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="shrink-0 text-[13px] font-semibold tnum" style={{ color: scoreColor(score ?? null) }}>
          {score == null ? "—" : score} / 100
        </span>
      </div>
      <div className="flex items-center justify-between text-[13px]" title={verdict.reasons.map((r) => `${r.level.toUpperCase()}: ${r.text}`).join("\n")}>
        <span style={{ color: VERDICT_COLOR[verdict.level] }}>{verdict.label}</span>
        <span className="text-faint tnum">
          {reliefOdds != null ? `Relief odds: ${reliefOdds}%` : fit ? `Fit confidence: ${Math.round(fit.confidence * 100)}%` : ""}
        </span>
      </div>
      {blockers.slice(0, 2).map((r) => (
        <p key={r.text} className="text-[13px] text-muted-foreground">
          <span style={{ color: VERDICT_COLOR[r.level] }}>•</span> {r.text.split(/[;:]/)[0]}
        </p>
      ))}
      {blockers.length > 2 && <p className="text-[13px] text-muted-foreground">+{blockers.length - 2} more (hover)</p>}
      <div className="mt-1" title={tooltip}>
        <div className="h-1 w-full overflow-hidden rounded-full bg-popover">
          <div className="h-full rounded-full" style={{ width: `${score ?? 0}%`, background: scoreColor(score ?? null) }} />
        </div>
        <p className="mt-1 truncate text-[13px] text-muted-foreground">{pathway?.label ?? "Unresolved in the code"}</p>
      </div>
      {fit && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <ScoreBar score={fit.fit * 100} />
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(fit.confidence * 100)}%</span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {fit.label}
            {fit.needsReview && <span className="text-warn"> · needs review</span>}
          </p>
        </div>
      )}
    </div>
  );
}

/** Inspector Typology tab: stacked feasibility cards for four housing types,
 * each independently swappable across all 16 registered typologies. */
export function TypologyCards({
  pin,
  onSelectTypology,
}: {
  pin: string;
  onSelectTypology?: (siteFitId: string) => void;
}) {
  const [typologyIds, setTypologyIds] = useState<string[]>(DEFAULT_TYPOLOGY_IDS);
  const { data, status } = useParcelData(pin);
  const zoning = data?.zoning ?? "";
  const query = useTypologyFit(pin, data);
  const fitsById = useMemo(() => {
    if (!query.data) return undefined;
    const map: FitsById = {};
    for (const t of query.data.typologies) map[t.id] = t.fit;
    return map;
  }, [query.data]);

  const setTypologyAt = (index: number, id: string) =>
    setTypologyIds((prev) => prev.map((cur, i) => (i === index ? id : cur)));

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-wide text-foreground uppercase">Typology feasibility</span>
        <span className="text-[11px] text-faint">By allowable density</span>
      </div>
      {!data && status === "loading" && <p className="text-muted-foreground">Loading…</p>}
      {status === "missing" && <p className="text-muted-foreground">No zoning data for this parcel (city parcels only).</p>}
      {data && (
        <>
          <p className="text-[13px] text-muted-foreground">{query.data?.facts.lot ?? "Checking lot size and shape…"}</p>
          <div className="flex flex-col gap-2.5">
            {typologyIds.map((id, i) => (
              <TypologyCard
                key={i}
                typologyId={id}
                zoning={zoning}
                values={data as ParcelData}
                onTypologyChange={(next) => setTypologyAt(i, next)}
                fitsById={fitsById}
                lotWidthFt={query.data?.lot.widthFt}
                onSelectTypology={onSelectTypology}
              />
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">{VERDICT_NOT_CHECKED}</p>
        </>
      )}
    </div>
  );
}
