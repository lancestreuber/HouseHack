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

import { Disclaimer } from "@/components/disclaimer";

import { PATHWAY_META, TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS } from "./overlays/legal-matrix.generated";
import { PaneCollapseButton } from "./pane-collapse-button";
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

function notPermittedScore(zone: string, typologyId: string): number {
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
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
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

function TypologyTile({
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
  /** Scrolls the Alerts pane to this card's typology, if it has one there. */
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

  return (
    <div
      className={`flex min-w-[10rem] flex-1 flex-col gap-1 rounded border bg-background/60 p-2 ${canJumpToAlerts ? "cursor-pointer" : ""}`}
      style={{ borderColor: `${VERDICT_COLOR[verdict.level]}99` }}
      onClick={canJumpToAlerts ? () => onSelectTypology?.(siteFitId!) : undefined}
      title={canJumpToAlerts ? "Jump to this typology's alerts" : undefined}
    >
      <div className="flex items-baseline gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Select value={typologyId} onValueChange={(value) => value && onTypologyChange(value)}>
          <SelectTrigger size="sm" className="h-6 flex-1 border-none px-0 font-medium shadow-none">
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
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{typologyId}</span>
      </div>
      <div title={verdict.reasons.map((r) => `${r.level.toUpperCase()}: ${r.text}`).join("\n")}>
        <p className="flex items-center gap-1.5 font-semibold" style={{ color: VERDICT_COLOR[verdict.level] }}>
          <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: VERDICT_COLOR[verdict.level] }} />
          {verdict.label}
        </p>
        {blockers.slice(0, 2).map((r) => (
          <p key={r.text} className="text-muted-foreground">
            <span style={{ color: VERDICT_COLOR[r.level] }}>•</span> {r.text}
          </p>
        ))}
        {blockers.length > 2 && <p className="text-muted-foreground">+{blockers.length - 2} more (hover)</p>}
      </div>
      <div className="flex items-baseline gap-1.5 border-t border-border/40 pt-1" title={tooltip}>
        <span className="font-semibold tabular-nums" style={{ color: scoreColor(score ?? null) }}>
          {score == null ? "—" : score}
        </span>
        <span className="truncate text-muted-foreground">{pathway?.label ?? "Unresolved in the code"}</span>
      </div>
      {fit && (
        <div className="space-y-0.5 border-t border-border/40 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <ScoreBar score={fit.fit * 100} />
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(fit.confidence * 100)}%</span>
          </div>
          <p className="text-muted-foreground">
            {fit.label}
            {fit.needsReview && <span className="text-yellow-400"> · needs review</span>}
          </p>
        </div>
      )}
    </div>
  );
}

function TypologyTiles({
  pin,
  data,
  zoning,
  typologyIds,
  onTypologyChange,
  onSelectTypology,
}: {
  pin: string;
  data: ParcelData;
  zoning: string;
  typologyIds: string[];
  onTypologyChange: (index: number, id: string) => void;
  onSelectTypology?: (siteFitId: string) => void;
}) {
  const query = useTypologyFit(pin, data);
  const fitsById = useMemo(() => {
    if (!query.data) return undefined;
    const map: FitsById = {};
    for (const t of query.data.typologies) map[t.id] = t.fit;
    return map;
  }, [query.data]);

  return (
    <>
      <p className="text-muted-foreground">
        {query.data?.facts.lot ?? "Checking lot size and shape…"}
      </p>
      <div className="flex h-full w-full gap-2">
        {typologyIds.map((id, i) => (
          <TypologyTile
            key={i}
            typologyId={id}
            zoning={zoning}
            values={data}
            onTypologyChange={(next) => onTypologyChange(i, next)}
            fitsById={fitsById}
            lotWidthFt={query.data?.lot.widthFt}
            onSelectTypology={onSelectTypology}
          />
        ))}
      </div>
      <p className="text-muted-foreground">{VERDICT_NOT_CHECKED}</p>
    </>
  );
}

/** Bottom pane: side-by-side feasibility scores for a handful of housing
 * typologies on the selected parcel's zoning district, plus (where a close
 * enough match exists) Jev's physical site-fit judgment for that typology.
 * Each tile's typology is independently swappable via its dropdown. */
export function TypologyPanel({
  pin,
  collapsed,
  onToggleCollapse,
  onSelectTypology,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectTypology?: (siteFitId: string) => void;
}) {
  const [typologyIds, setTypologyIds] = useState<string[]>(DEFAULT_TYPOLOGY_IDS);
  const { data, status } = useParcelData(pin);
  const zoning = data?.zoning ?? "";

  const setTypologyAt = (index: number, id: string) =>
    setTypologyIds((prev) => prev.map((cur, i) => (i === index ? id : cur)));

  const body = useMemo(() => {
    if (!pin) return <p className="text-muted-foreground">Select a parcel on the map to see typology scores.</p>;
    if (status === "loading") return <p className="text-muted-foreground">Loading…</p>;
    if (status === "missing" || !data)
      return <p className="text-muted-foreground">No zoning data for this parcel (city parcels only).</p>;
    return (
      <TypologyTiles
        pin={pin}
        data={data}
        zoning={zoning}
        typologyIds={typologyIds}
        onTypologyChange={setTypologyAt}
        onSelectTypology={onSelectTypology}
      />
    );
  }, [pin, status, data, typologyIds, zoning, onSelectTypology]);

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden p-2 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">Typology scores</span>
        <div className="flex items-center gap-2">
          {zoning && <span className="text-muted-foreground">Zoning {zoning}</span>}
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="typology scores" />}
        </div>
      </div>
      {!collapsed && <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-x-auto">{body}</div>}
      {!collapsed && <Disclaimer className="shrink-0" />}
    </div>
  );
}
