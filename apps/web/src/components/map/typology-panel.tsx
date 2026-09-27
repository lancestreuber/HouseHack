import {
  Armchair,
  BedSingle,
  ChevronLeft,
  ChevronRight,
  Building,
  Building2,
  HandHeart,
  HeartHandshake,
  Hotel,
  House,
  HousePlus,
  type LucideIcon,
  MapPin,
  Tent,
  Users,
  Warehouse,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@HouseHack/ui/components/popover";

import config from "@/lib/pillars/pillars.config.json";
import { COST_PRESETS, DEFAULT_PENCIL } from "@/lib/pillars/pencil";
import { setPencilAssumptions, usePencilAssumptions } from "@/lib/pillars/pencil-assumptions";
import { scoreParcel } from "@/lib/pillars/score";
import { VERDICT_COLOR } from "@/lib/pillars/verdict";

import { Disclaimer } from "@/components/disclaimer";
import { openScenario } from "@/components/scenario/scenario-store";

import { TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS, ZBA_OUTCOMES } from "./overlays/legal-matrix.generated";
import { PaneCollapseButton } from "./pane-collapse-button";
import { usePillarWeights } from "./pillar-weights-store";
import { type ParcelData, useParcelData, useTypologyFit } from "./pillars-panel";
import { type FitsById, legalLevelFor, SHORT_LABEL, SITE_FIT_TYPOLOGY, verdictFor } from "./typology-meta";

// The five mainstream types the "Overall for this type" stat covers (the
// only ones with a legal level in pillars.config.json's zoning multiplier).
// The other 11 (assisted living, personal care, ...) don't get this stat --
// same limitation as the legal gate itself.
const MAIN_TYPOLOGIES = new Set(config.legal.typologies as string[]);

/** The parcel's Overall pillar-blend score, recomputed using this specific
 * typology's own zoning factor instead of the easiest-of-five default --
 * the same number scenario-card.tsx shows as "Overall score for a {type}".
 * Null for typologies outside the five mainstream ones. */
function overallForTypology(data: ParcelData, weights: ReturnType<typeof usePillarWeights>, typologyId: string): number | null {
  if (!MAIN_TYPOLOGIES.has(typologyId)) return null;
  const legalLevel = legalLevelFor(data.zoning, typologyId, data.norm.site_legal_pathway);
  return scoreParcel(data.norm, { pillars: weights, legalLevel }).overall;
}

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
function rezoningCloseness(zone: string, typologyId: string): number {
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
function rezoningLikelihood(zone: string): number {
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

// Lucide icon per typology (https://lucide.dev), shown next to the tile name.
const TYPOLOGY_ICON: Record<string, LucideIcon> = {
  single_detached: House,
  single_attached: Warehouse,
  two_unit: HousePlus,
  three_unit: Building,
  multi_unit: Building2,
  elderly_limited: Armchair,
  elderly_general: Hotel,
  assisted_living_a: HeartHandshake,
  assisted_living_b: HeartHandshake,
  assisted_living_c: HeartHandshake,
  personal_care_small: HandHeart,
  personal_care_large: HandHeart,
  community_home: Users,
  multi_suite_limited: BedSingle,
  multi_suite_general: BedSingle,
  interim_housing: Tent,
};

/** The tile's headline number: the legal-pathway score for this typology in
 * this district (undefined when the code doesn't resolve it). */
function tileScore(zoning: string, typologyId: string): number | null | undefined {
  const pathwayId = DISTRICT_PATHWAYS[zoning]?.[typologyId];
  return pathwayId === "not_permitted" ? notPermittedScore(zoning, typologyId) : pathwayId ? PATHWAY_SCORE[pathwayId] : undefined;
}

// One motion language for the whole panel: tiles glide to their new rank,
// numbers count, bars and colors ease, all on the same duration and curve.
const MOVE_MS = 600;
const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";
// How long to keep showing the previous parcel while Jev rates the new one,
// so scores and fits land together in a single reorder instead of two.
const FIT_WAIT_MS = 4000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a number to its new value, handing each frame to `write` to put on
 * screen directly (no React re-render per frame). If the target changes
 * mid-animation it continues from wherever it currently is. */
function useNumberTween(target: number | null, write: (value: number | null) => void) {
  const currentRef = useRef(target);
  const writeRef = useRef(write);
  writeRef.current = write;
  // Layout effect: runs before paint, so the frame React just rendered (with
  // the final value) is replaced by the starting value and never flashes.
  useLayoutEffect(() => {
    const from = currentRef.current;
    if (target == null || from == null || from === target || prefersReducedMotion()) {
      currentRef.current = target;
      writeRef.current(target);
      return;
    }
    writeRef.current(from);
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      // rAF timestamps can predate `start` slightly; clamp so the ease never overshoots.
      const t = Math.min(1, Math.max(0, (now - start) / MOVE_MS));
      const next = from + (target - from) * (1 - (1 - t) ** 4);
      currentRef.current = next;
      writeRef.current(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);
}

/** Site-fit bar. Animates with a GPU transform rather than width. */
function FitBar({ value, className = "h-1.5" }: { value: number; className?: string }) {
  return (
    <div className={`${className} w-full overflow-hidden rounded bg-foreground/10`}>
      <div
        className="h-full w-full origin-left rounded"
        style={{
          transform: `scaleX(${Math.max(0, Math.min(1, value / 100))})`,
          background: scoreColor(value),
          transition: `transform ${MOVE_MS}ms ${EASE_OUT}, background-color ${MOVE_MS}ms ${EASE_OUT}`,
        }}
      />
    </div>
  );
}

// Jev's four fit levels, best first, for the distribution chart.
const FIT_LEVELS_BEST_FIRST = ["Comfortable", "Minor compromises", "Major compromises", "Cannot fit"];

/** How Jev's rating is spread across the four fit levels (bars only; exact
 * odds on hover). Sized in em of the chart's own font, and its rows spread
 * out to fill whatever height the card gives the chart. */
function FitDistribution({ probabilities }: { probabilities: number[] }) {
  const bestFirst = [...probabilities].reverse();
  return (
    <div className="flex h-full flex-col justify-evenly" role="img" aria-label="How Jev's rating is spread across the fit levels">
      {FIT_LEVELS_BEST_FIRST.map((label, i) => {
        const p = bestFirst[i] ?? 0;
        return (
          <div key={label} className="flex items-center gap-[0.6em]" title={`${label}: ${Math.round(p * 100)}% likely`}>
            <span className="w-[9.5em] shrink-0 truncate leading-none text-muted-foreground" style={{ opacity: "var(--chart-label-o, 1)" }}>
              {label}
            </span>
            <div className="h-[0.35em] flex-1 overflow-hidden rounded bg-foreground/10">
              <div
                className="h-full w-full origin-left rounded bg-foreground/40"
                style={{ transform: `scaleX(${p})`, transition: `transform ${MOVE_MS}ms ${EASE_OUT}` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Card sizing. Cards stay one fixed size: the full card shows when the pane
// is tall enough for it, the compact card when it isn't. Every card in the
// row stretches to match the tallest one (default flex align-items:
// stretch), so a typology with more blocker text never leaves the row
// visibly uneven -- it just grows every card together.
const BASE_FONT_PX = 12;
// Natural height of a full card (refined by measurement once one is on screen).
const DEFAULT_CARD_PX = 110;

function TypologyTile({
  elementRef,
  typologyId,
  zoning,
  values,
  fitsById,
  lotWidthFt,
  compact,
  onSelectTypology,
}: {
  elementRef?: (el: HTMLDivElement | null) => void;
  typologyId: string;
  zoning: string;
  /** Parcel indicators: normalized for the hazard checks, raw for the pencil check's dollar values. */
  values: ParcelData;
  /** Jev's site-fit results, keyed by its own (coarser) typology id -- see
   * SITE_FIT_TYPOLOGY. Undefined while loading or if Jev is unavailable. */
  fitsById?: FitsById;
  /** Lot width in feet, for the side-setback check; undefined while loading. */
  lotWidthFt?: number | null;
  /** True when the pane is too short for the full card. */
  compact: boolean;
  /** Scrolls the Alerts pane to this card's full verdict reasons. */
  onSelectTypology?: (typologyId: string) => void;
}) {
  const score = tileScore(zoning, typologyId) ?? null;
  // The score counts to its new value and its color eases with it, written
  // straight to the card each frame; React only renders the final values.
  const cardRef = useRef<HTMLDivElement | null>(null);
  useNumberTween(score, (value) => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--score-color", value == null ? "" : scoreColor(value));
    const text = card.querySelector<HTMLElement>("[data-score]");
    if (text) text.textContent = value == null ? "—" : String(Math.round(value));
  });
  const Icon = TYPOLOGY_ICON[typologyId] ?? House;
  const fullLabel = TYPOLOGIES.find(([id]) => id === typologyId)?.[1] ?? typologyId;
  const name = SHORT_LABEL[typologyId] ?? fullLabel;
  const siteFitId = SITE_FIT_TYPOLOGY[typologyId];
  const fit = siteFitId ? fitsById?.[siteFitId] : undefined;
  const color = score == null ? undefined : "var(--score-color)";
  const [expanded, setExpanded] = useState(false);

  // The verdict/pencil check: can this actually be built, and does it pencil?
  // Never derived from the tile's own legal-pathway score, so it can't be
  // averaged away -- see lib/pillars/verdict.ts.
  const pencil = usePencilAssumptions();
  const verdict = verdictFor(zoning, typologyId, values, { fitsById, lotWidthFt, pencil });
  // All reasons, not just blockers: verdictFor already includes the green
  // ("pro") facts too (e.g. "Allowed by right"), not only red/yellow cons.
  const weights = usePillarWeights();
  const overall = overallForTypology(values, weights, typologyId);

  const scoreText = score == null ? "—" : Math.round(score);
  const canJumpToAlerts = Boolean(onSelectTypology);
  // Short form of the level label for the tile -- the full wording
  // ("Possible, with extra approvals or site cost") is still what Alerts and
  // the chat use; this is just the headline word for a small card.
  const shortVerdictLabel = verdict.level === "green" ? "By right" : verdict.level === "yellow" ? "Possible" : verdict.label;
  const verdictBlock = (
    <div title={canJumpToAlerts ? "See why, in Alerts" : undefined}>
      <p className="flex items-center gap-1.5 font-semibold" style={{ color: VERDICT_COLOR[verdict.level] }}>
        <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: VERDICT_COLOR[verdict.level] }} />
        {shortVerdictLabel}
      </p>
      {verdict.reasons.slice(0, 3).map((r) => (
        <p key={r.text}>
          <span style={{ color: VERDICT_COLOR[r.level] }}>•</span> <span className="text-muted-foreground">{r.text.split(/[;:]/)[0]}</span>
        </p>
      ))}
      {verdict.reasons.length > 3 && <p className="text-muted-foreground">+{verdict.reasons.length - 3} more (hover)</p>}
    </div>
  );
  const scenarioButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openScenario(typologyId);
      }}
      className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-foreground/10 py-1 font-medium hover:bg-foreground/20"
    >
      <MapPin className="size-3" aria-hidden /> Scenario
    </button>
  );
  // Jev's fit bar, confidence and the probability chart are hidden until the
  // score number is clicked -- they're a model's opinion, not the tile's
  // headline fact, and stayed too small to read at typical pane heights.
  const scoreButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
      aria-expanded={expanded}
      aria-label={expanded ? "Hide Jev's site-fit rating" : "Show Jev's site-fit rating"}
      title="Click for Jev's physical site-fit rating"
      className="shrink-0 text-2xl font-bold leading-none tabular-nums hover:underline"
      style={{ color }}
      data-score
    >
      {scoreText}
    </button>
  );
  const jevDetail = expanded && (
    <div className="space-y-0.5 border-t border-border/40 pt-1">
      {fit ? (
        <>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-muted-foreground">Jev</span>
            <div className="flex-1" title={fit.label}>
              <FitBar value={fit.fit * 100} />
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(fit.confidence * 100)}%</span>
          </div>
          <p className="text-muted-foreground">
            {fit.label}
            {fit.needsReview && <span className="text-yellow-400"> · needs review</span>}
          </p>
          {fit.probabilities?.length ? <FitDistribution probabilities={fit.probabilities} /> : null}
        </>
      ) : (
        <p className="text-muted-foreground">Jev doesn't rate this housing type.</p>
      )}
    </div>
  );
  const shared = {
    ref: (el: HTMLDivElement | null) => {
      cardRef.current = el;
      elementRef?.(el);
    },
    "data-typology": typologyId,
    "data-density": compact ? "compact" : "full",
    onClick: canJumpToAlerts ? () => onSelectTypology?.(typologyId) : undefined,
    title: canJumpToAlerts ? "Jump to this typology's alerts" : undefined,
  };
  const cardBase = `relative flex shrink-0 flex-col rounded border border-border/60 bg-background transition-colors ${canJumpToAlerts ? "cursor-pointer hover:border-border" : ""}`;

  if (compact) {
    return (
      <div
        {...shared}
        className={`${cardBase} w-48 gap-1 px-2 py-1.5`}
        style={{ "--score-color": score == null ? undefined : scoreColor(score) } as CSSProperties}
      >
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium" title={fullLabel}>
            {name}
          </span>
          {scoreButton}
        </div>
        {overall != null && (
          <p className="text-muted-foreground">
            Overall <span style={{ color: scoreColor(overall) }}>{Math.round(overall)}</span> for this type
          </p>
        )}
        {verdictBlock}
        {jevDetail}
        {scenarioButton}
      </div>
    );
  }

  // Full card.
  return (
    <div
      {...shared}
      className={`${cardBase} h-full w-[14rem] justify-between gap-1 p-2`}
      style={{ "--score-color": score == null ? undefined : scoreColor(score) } as CSSProperties}
    >
      <div className="flex flex-col gap-0.5" data-top>
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium" title={fullLabel}>
            {name}
          </span>
          {scoreButton}
        </div>
        {overall != null && (
          <p className="text-muted-foreground">
            Overall <span className="tabular-nums" style={{ color: scoreColor(overall) }}>{Math.round(overall)}</span> for this type
          </p>
        )}
      </div>
      <div className="flex flex-col gap-0.5" data-bottom>
        {verdictBlock}
        {jevDetail}
        {scenarioButton}
      </div>
    </div>
  );
}

/** What the tiles are currently showing. Swapped in one step once the next
 * parcel's scores *and* site fits are ready, so the tiles move exactly once. */
type Snapshot = { pin: string; data: ParcelData; fits: FitsById | undefined; lot: string | undefined; lotWidthFt: number | null | undefined };

/** Invisible: fetches Jev's fits for the newly selected parcel and hands the
 * finished snapshot up. Falls back to scores-only if Jev is slow. */
function FitSettler({
  pin,
  data,
  onSettle,
}: {
  pin: string;
  data: ParcelData;
  onSettle: (next: Snapshot, partial?: boolean) => void;
}) {
  const query = useTypologyFit(pin, data);
  useEffect(() => {
    if (query.status === "pending") return;
    const fits: FitsById | undefined = query.data
      ? Object.fromEntries(query.data.typologies.map((t) => [t.id, t.fit]))
      : undefined;
    onSettle({ pin, data, fits, lot: query.data?.facts.lot, lotWidthFt: query.data?.lot.widthFt });
  }, [pin, data, query.status, query.data, onSettle]);
  useEffect(() => {
    const timer = setTimeout(() => onSettle({ pin, data, fits: undefined, lot: undefined, lotWidthFt: undefined }, true), FIT_WAIT_MS);
    return () => clearTimeout(timer);
  }, [pin, data, onSettle]);
  return null;
}

const STEP = 0.2;

// Worst-first rank of a verdict level, so the ranked track always puts a
// dealkiller (red) behind anything that isn't one, no matter how high that
// typology's own legal-pathway score happens to read.
const VERDICT_RANK: Record<string, number> = { green: 0, unknown: 1, yellow: 2, red: 3 };

/** Horizontal, ranked track of every housing type. Vertical mouse wheels
 * scroll it sideways (eased, not stepped), arrows page through it, and the
 * edges fade where there's more to see. */
function TypologyTrack({
  snapshot,
  updating,
  onSelectTypology,
}: {
  snapshot: Snapshot;
  updating: boolean;
  onSelectTypology?: (typologyId: string) => void;
}) {
  const zoning = snapshot.data.zoning ?? "";
  const { fits, lotWidthFt } = snapshot;
  const pencil = usePencilAssumptions();

  // Best to worst: the verdict (a dealkiller always sinks to the bottom),
  // then tile score, then Jev's site fit as a tie-breaker, then the type's
  // catalogue order so equal tiles keep a stable order. Unscored last.
  const ranked = useMemo(() => {
    const fitOf = (id: string) => {
      const siteFitId = SITE_FIT_TYPOLOGY[id];
      return (siteFitId ? fits?.[siteFitId]?.fit : undefined) ?? -1;
    };
    return TYPOLOGIES.map(([id], slot) => ({
      id,
      slot,
      verdictRank: VERDICT_RANK[verdictFor(zoning, id, snapshot.data, { fitsById: fits, lotWidthFt, pencil }).level] ?? 1,
      score: tileScore(zoning, id) ?? -1,
      fit: fitOf(id),
    })).sort((a, b) => a.verdictRank - b.verdictRank || b.score - a.score || b.fit - a.fit || a.slot - b.slot);
  }, [zoning, fits, lotWidthFt, pencil, snapshot.data]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const cardPx = useRef(DEFAULT_CARD_PX);

  // Fits the cards to the pane height: switches to the compact layout once
  // the full card's own natural (top + bottom section) height no longer
  // fits. `measure` re-reads that natural height; only needed when a card's
  // content changes, so a pane drag never forces an extra layout pass.
  const fitCards = useCallback((measure: boolean) => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;
    const card = measure ? track.querySelector<HTMLElement>('[data-density="full"]') : null;
    if (card) {
      // Top + bottom sections plus padding and the gap between them.
      const top = card.querySelector<HTMLElement>("[data-top]")?.offsetHeight ?? 0;
      const bottom = card.querySelector<HTMLElement>("[data-bottom]")?.offsetHeight ?? 0;
      cardPx.current = top + bottom + 1.5 * BASE_FONT_PX;
    }
    const available = scroller.clientHeight - 6; // bottom padding + border
    // A little hysteresis so the layout can't flicker at the boundary.
    const nextCompact = compactRef.current ? available < cardPx.current + 4 : available < cardPx.current;
    if (nextCompact !== compactRef.current) {
      compactRef.current = nextCompact;
      setCompact(nextCompact);
    }
  }, []);

  // FLIP: after React reorders the tiles, each one is drawn back where it was
  // and glides to its new slot. Start positions come from the old rank x the
  // current card stride, so resizing the pane between reorders can't skew
  // them; a glide interrupted by another click continues from where the tile
  // visibly is instead of snapping. Off-screen tiles glide too.
  const tileEls = useRef(new Map<string, HTMLDivElement>());
  const lastIndex = useRef(new Map<string, number>());
  const orderKey = ranked.map((r) => r.id).join();
  const lastOrderKey = useRef(orderKey);
  useLayoutEffect(() => {
    fitCards(true);
    const reordered = lastOrderKey.current !== orderKey;
    lastOrderKey.current = orderKey;
    const els = ranked.map(({ id }) => tileEls.current.get(id));
    const origin = els[0]?.offsetLeft ?? 0;
    const stride = els[0] && els[1] ? els[1].offsetLeft - els[0].offsetLeft : 0;
    const reduceMotion = prefersReducedMotion();
    ranked.forEach(({ id }, index) => {
      const el = tileEls.current.get(id);
      const prevIndex = lastIndex.current.get(id);
      lastIndex.current.set(id, index);
      if (!el || !reordered || prevIndex == null) return;
      const transform = getComputedStyle(el).transform;
      const inFlight = transform && transform !== "none" ? new DOMMatrixReadOnly(transform).m41 : 0;
      for (const animation of el.getAnimations()) animation.cancel();
      const dx = origin + prevIndex * stride + inFlight - el.offsetLeft;
      if (reduceMotion || Math.abs(dx) < 1) return;
      // Tiles climbing the ranking pass over the ones dropping, lifted by a
      // shadow that fades as they land.
      const climbing = dx > 0;
      el.style.zIndex = climbing ? "2" : "1";
      const lift = climbing ? "0 6px 16px rgb(0 0 0 / 0.35)" : "0 0 0 rgb(0 0 0 / 0)";
      const glide = el.animate(
        [
          { transform: `translateX(${dx}px)`, boxShadow: lift },
          { transform: "translateX(0)", boxShadow: "0 0 0 rgb(0 0 0 / 0)" },
        ],
        { duration: MOVE_MS, easing: EASE_OUT },
      );
      glide.onfinish = () => (el.style.zIndex = "");
    });
  });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 2;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    // The pane's own size drives the card scale; the track's width (which the
    // scale itself changes) only affects the scroll edges.
    const paneObserver = new ResizeObserver(() => {
      fitCards(false);
      update();
    });
    const trackObserver = new ResizeObserver(update);
    update();
    el.addEventListener("scroll", update, { passive: true });
    paneObserver.observe(el);
    if (trackRef.current) trackObserver.observe(trackRef.current);
    return () => {
      el.removeEventListener("scroll", update);
      paneObserver.disconnect();
      trackObserver.disconnect();
    };
  }, [fitCards]);

  // Vertical wheel -> eased horizontal scroll. Horizontal trackpad swipes and
  // pinch-zoom are left to the browser.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let target = el.scrollLeft;
    let frame = 0;
    const step = () => {
      const diff = target - el.scrollLeft;
      if (Math.abs(diff) < 1) {
        el.scrollLeft = target;
        frame = 0;
        return;
      }
      el.scrollLeft += Math.sign(diff) * Math.max(1, Math.abs(diff) * STEP);
      frame = requestAnimationFrame(step);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      e.preventDefault();
      const base = frame ? target : el.scrollLeft;
      target = Math.max(0, Math.min(max, base + e.deltaY * (e.deltaMode === 1 ? 40 : 1)));
      if (prefersReducedMotion()) {
        el.scrollLeft = target;
        return;
      }
      if (!frame) frame = requestAnimationFrame(step);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, []);

  // A new parcel starts the track back at #1.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && el.scrollLeft > 0) el.scrollTo({ left: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [snapshot.pin]);

  const page = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const edgeButton = "absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/90 p-1 shadow-sm transition-opacity duration-200 hover:bg-background";

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Housing types ranked for this parcel"
        className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin] focus-visible:outline-none"
      >
        <div
          ref={trackRef}
          className={`relative flex h-full w-max items-stretch gap-2 transition-opacity duration-300 ${updating ? "opacity-60 delay-150" : "opacity-100 delay-0"}`}
        >
          {ranked.map(({ id }) => (
            <TypologyTile
              key={id}
              elementRef={(el) => {
                if (el) tileEls.current.set(id, el);
                else tileEls.current.delete(id);
              }}
              typologyId={id}
              zoning={zoning}
              values={snapshot.data}
              fitsById={fits}
              lotWidthFt={lotWidthFt}
              compact={compact}
              onSelectTypology={onSelectTypology}
            />
          ))}
        </div>
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${edges.left ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${edges.right ? "opacity-100" : "opacity-0"}`}
      />
      <button
        type="button"
        aria-label="Scroll housing types left"
        onClick={() => page(-1)}
        className={`${edgeButton} left-1 ${edges.left ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll housing types right"
        onClick={() => page(1)}
        className={`${edgeButton} right-1 ${edges.right ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** Pop-out editor for the two assumptions that move the pencil check most
 * (SME: the tool should do the pro-forma work, and user-typed assumptions
 * help if they're clear). Shared across all tiles via pencil-assumptions.ts. */
function PencilAssumptionsPopover() {
  const a = usePencilAssumptions();
  const [open, setOpen] = useState(false);
  const pencil = config.pencil;
  const presets = [
    ["low", "Production builder"],
    ["mid", "Typical infill"],
    ["high", "Small builder"],
  ] as const;
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-muted-foreground hover:text-foreground">
        Pencil assumptions
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-72 text-xs">
        <PopoverHeader>
          <PopoverTitle>Does it pencil?</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-wrap items-center gap-1">
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
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-muted-foreground underline">
          {open ? "Hide" : "How this is worked out"}
        </button>
        {open && (
          <div className="mt-1 space-y-1 text-muted-foreground">
            <p>
              Cost per unit = unit size × construction $/sf × (1 + {Math.round(pencil.soft_cost_pct * 100)}% soft costs) + site work per building ÷ units, +
              extra on a mostly steep lot. Value must beat cost by {Math.round(pencil.margin_pct * 100)}%. Houses use nearby sale prices (close to an
              appraiser's comps); 2+ units use nearby rent × {pencil.rent_multiplier}. Value covering at least {Math.round(pencil.subsidy_floor * 100)}% of
              cost reads as "needs subsidy"; less doesn't pencil. For scale, URA's gap caps are ${pencil.subsidy_cap_per_unit.sale.toLocaleString()} per
              for-sale unit and ${pencil.subsidy_cap_per_unit.rent.toLocaleString()} per rental unit. {pencil.subsidy_cap_note}
            </p>
            <p>{pencil.value_bias}</p>
            <p>{pencil.not_priced}</p>
            <p>{pencil.cost_per_sf.note}</p>
            <p>{pencil.typologies_note}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Bottom pane: every housing type ranked for the selected parcel, as a
 * horizontal slider. Each tile is an overview -- score, Jev's fit bar and
 * confidence, and a one-line verdict summary -- and clicking it (or its
 * "Scenario" button) opens the full detail elsewhere: the verdict's full
 * reasons (dealkillers, pencil check) in the Alerts pane, or the scenario
 * card. Changing parcels keeps the tiles in place and glides them to their
 * new rank. */
export function TypologyPanel({
  pin,
  collapsed,
  onToggleCollapse,
  onSelectTypology,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectTypology?: (typologyId: string) => void;
}) {
  const parcel = useParcelData(pin);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // A timed-out "partial" snapshot never replaces a finished one for the same parcel.
  const settle = useCallback((next: Snapshot, partial?: boolean) => {
    setSnapshot((prev) => (partial && prev?.pin === next.pin ? prev : next));
  }, []);

  useEffect(() => {
    if (!pin || parcel.status === "missing") setSnapshot(null);
  }, [pin, parcel.status]);

  const ready = parcel.status === "ready" && parcel.pin === pin ? parcel.data : null;
  const updating = Boolean(pin) && snapshot?.pin !== pin && parcel.status !== "missing";

  let body: ReactNode;
  if (!pin) body = <p className="text-muted-foreground">Select a parcel on the map to see typology scores.</p>;
  else if (parcel.status === "missing")
    body = <p className="text-muted-foreground">No zoning data for this parcel (city parcels only).</p>;
  else if (!snapshot) body = <p className="text-muted-foreground">Loading…</p>;
  else body = <TypologyTrack snapshot={snapshot} updating={updating} onSelectTypology={onSelectTypology} />;

  return (
    <div className="flex h-full w-full flex-col gap-1.5 overflow-hidden p-2 text-xs">
      {pin && ready && <FitSettler key={pin} pin={pin} data={ready} onSettle={settle} />}
      <div className="flex items-baseline justify-between gap-3">
        <span className="shrink-0 font-medium">Typology scores</span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground" title={snapshot?.lot}>
          {snapshot?.lot ?? ""}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`text-muted-foreground transition-opacity duration-300 ${updating && snapshot ? "opacity-100 delay-150" : "opacity-0"}`}
            aria-live="polite"
          >
            Updating…
          </span>
          {snapshot?.data.zoning && <span className="text-muted-foreground">Zoning {snapshot.data.zoning}</span>}
          {!collapsed && <PencilAssumptionsPopover />}
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="typology scores" />}
        </div>
      </div>
      {!collapsed && <div className="flex min-h-0 flex-1 flex-col gap-2">{body}</div>}
      {!collapsed && <Disclaimer className="shrink-0" />}
    </div>
  );
}
