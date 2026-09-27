import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@HouseHack/ui/components/select";

import { Disclaimer } from "@/components/disclaimer";

import { PATHWAY_META, TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS, ZBA_OUTCOMES } from "./overlays/legal-matrix.generated";
import { PaneCollapseButton } from "./pane-collapse-button";
import { type ParcelData, ScoreBar, useParcelData, useTypologyFit } from "./pillars-panel";
import { fmtUsd, VERDICT_DOT, VERDICT_LABEL, type VerdictLevel } from "./verdict";

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

// Density-ordered residential bases (same ordering used in the site-fit use
// table): only used to judge how big a stretch a rezoning would be, never
// to decide permission itself -- that's DISTRICT_PATHWAYS' job.
const BASE_ORDER = ["R1D", "R1A", "R2", "R3", "RM"];
const baseOf = (zone: string) => zone.split("-")[0] ?? zone;
const PERMITTING_PATHWAYS = new Set(["by_right", "za", "conditional_use", "zbe_special_exception"]);

/** 1 = another district in the same zoning family (e.g. just a density-suffix
 * change) permits this typology; 0.5 = a one-step-away district on the
 * density ladder does; 0.2 = only a distant/unrelated district does;
 * 0 = no district anywhere permits it (not a realistic rezoning ask). */
export function rezoningCloseness(zone: string, typologyId: string): number {
  const currentBase = baseOf(zone);
  const currentRank = BASE_ORDER.indexOf(currentBase);
  let best = 0;
  for (const [otherZone, pathways] of Object.entries(DISTRICT_PATHWAYS)) {
    if (!PERMITTING_PATHWAYS.has(pathways[typologyId] ?? "")) continue;
    const otherBase = baseOf(otherZone);
    if (otherBase === currentBase) return 1;
    const otherRank = BASE_ORDER.indexOf(otherBase);
    const closeness = currentRank === -1 || otherRank === -1 ? 0.2 : Math.abs(otherRank - currentRank) === 1 ? 0.5 : 0.2;
    best = Math.max(best, closeness);
  }
  return best;
}

/** Approval rate for Zoning Board relief (any type) in this district,
 * 2023-26 -- an approximation of "how this district treats requests to build
 * something the code doesn't otherwise allow here", not the exact rezoning
 * (map-amendment) approval rate specifically. Falls back to a neutral
 * estimate where there's no local ZBA data at all. */
export function rezoningLikelihood(zone: string): number {
  const outcomes = ZBA_OUTCOMES[baseOf(zone)]?.ALL;
  if (!outcomes || outcomes.n === 0) return 0.7;
  return outcomes.approved / outcomes.n;
}

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

// This panel's 16 legal-feasibility typologies are far more granular than
// Jev's 5 site-fit categories; only map where there's a genuinely close
// correspondence, so we're never implying false precision for the rest
// (three_unit, community_home, interim_housing, etc. just show no fit line).
export const SITE_FIT_TYPOLOGY: Record<string, string> = {
  single_detached: "detached",
  single_attached: "attached",
  two_unit: "duplex",
  multi_unit: "apartment",
  elderly_limited: "elderly",
  elderly_general: "elderly",
};

// Short, plain-English names for the dropdown/tile face -- TYPOLOGIES'
// own labels (legal-feasibility.ts) are the full, precise zoning-code
// descriptions ("Multi-unit apartments (4+)"), which reads fine inside the
// dropdown's option list but is too long to be *the* name on a narrow tile.
export const SHORT_LABEL: Record<string, string> = {
  single_detached: "House",
  single_attached: "Rowhouse",
  two_unit: "Duplex",
  three_unit: "Triplex",
  multi_unit: "Apartments",
  elderly_limited: "Elderly housing (limited)",
  elderly_general: "Elderly housing (general)",
  assisted_living_a: "Assisted living (small)",
  assisted_living_b: "Assisted living (mid)",
  assisted_living_c: "Assisted living (large)",
  personal_care_small: "Personal care (small)",
  personal_care_large: "Personal care (large)",
  community_home: "Community home",
  multi_suite_limited: "Multi-suite (limited)",
  multi_suite_general: "Multi-suite (general)",
  interim_housing: "Interim housing",
};

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
  entriesById,
  onSelectTypology,
}: {
  typologyId: string;
  onTypologyChange: (id: string) => void;
  zoning: string;
  /** Jev's site-fit results plus the verdict/cost estimate computed from
   * them, keyed by its own (coarser) typology id -- see SITE_FIT_TYPOLOGY.
   * Undefined while loading or if there's no close-enough mapping. */
  entriesById?: Record<
    string,
    {
      fit: { fit: number; label: string; confidence: number; needsReview: boolean } | null;
      verdict: { level: VerdictLevel; reasons: string[] };
      cost: { low: number; high: number; units: number };
    }
  >;
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
  const entry = siteFitId ? entriesById?.[siteFitId] : undefined;
  const fit = entry?.fit;
  const canJumpToAlerts = Boolean(siteFitId && onSelectTypology);

  return (
    <div
      className={`flex min-w-[10rem] flex-1 flex-col gap-1 rounded border border-border/60 bg-background/60 p-2 ${canJumpToAlerts ? "cursor-pointer hover:border-border" : ""}`}
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
      <span className="text-2xl font-semibold tabular-nums" style={{ color: scoreColor(score ?? null) }}>
        {score == null ? "—" : score}
      </span>
      <span
        className={score == null ? "truncate text-muted-foreground" : "truncate"}
        style={{ color: score == null ? undefined : scoreColor(score) }}
        title={tooltip}
      >
        {pathway?.label ?? "Unresolved in the code"}
      </span>
      {entry && (
        <div className="space-y-0.5 border-t border-border/40 pt-1">
          <div
            className="flex items-center gap-1.5"
            title={entry.verdict.reasons.join(" ")}
            onClick={canJumpToAlerts ? (e) => e.stopPropagation() : undefined}
          >
            <span className={`size-2 shrink-0 rounded-full ${VERDICT_DOT[entry.verdict.level]}`} />
            <span className="truncate">{VERDICT_LABEL[entry.verdict.level]}</span>
          </div>
          {fit && (
            <>
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
            </>
          )}
          <p className="text-muted-foreground" title="Order-of-magnitude hard + site construction cost. Not a pro forma; excludes land, financing and soft costs.">
            Est. cost: {fmtUsd(entry.cost.low)}–{fmtUsd(entry.cost.high)}
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
  const entriesById = useMemo(() => {
    if (!query.data) return undefined;
    const map: Record<
      string,
      {
        fit: { fit: number; label: string; confidence: number; needsReview: boolean } | null;
        verdict: { level: VerdictLevel; reasons: string[] };
        cost: { low: number; high: number; units: number };
      }
    > = {};
    for (const t of query.data.typologies) map[t.id] = { fit: t.fit, verdict: t.verdict, cost: t.cost };
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
            onTypologyChange={(next) => onTypologyChange(i, next)}
            entriesById={entriesById}
            onSelectTypology={onSelectTypology}
          />
        ))}
      </div>
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
