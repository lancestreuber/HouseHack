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
  Tent,
  Users,
  Warehouse,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { PATHWAY_META, TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS, ZBA_OUTCOMES } from "./overlays/legal-matrix.generated";
import { PaneCollapseButton } from "./pane-collapse-button";
import { type ParcelData, useParcelData, useTypologyFit } from "./pillars-panel";

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

function notPermittedScore(zone: string, typologyId: string): number {
  const closeness = rezoningCloseness(zone, typologyId);
  const likelihood = rezoningLikelihood(zone);
  return Math.round(NOT_PERMITTED_FLOOR + closeness * likelihood * NOT_PERMITTED_RANGE);
}

// This panel's 16 legal-feasibility typologies are far more granular than
// Jev's 5 site-fit categories; only map where there's a genuinely close
// correspondence, so we're never implying false precision for the rest
// (three_unit, community_home, interim_housing, etc. just show no fit line).
const SITE_FIT_TYPOLOGY: Record<string, string> = {
  single_detached: "detached",
  single_attached: "attached",
  two_unit: "duplex",
  multi_unit: "apartment",
  elderly_limited: "elderly",
  elderly_general: "elderly",
};

// Short, plain-English names for the tile face -- TYPOLOGIES'
// own labels (legal-feasibility.ts) are the full, precise zoning-code
// descriptions ("Multi-unit apartments (4+)"), which reads fine inside the
// dropdown's option list but is too long to be *the* name on a narrow tile.
const SHORT_LABEL: Record<string, string> = {
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

type Fit = { fit: number; label: string; confidence: number; needsReview: boolean };
type FitsById = Record<string, Fit | null>;

// One motion language for the whole panel: tiles glide to their new rank,
// numbers count, bars and colors ease, all on the same duration and curve.
const MOVE_MS = 600;
const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";
// How long to keep showing the previous parcel while Jev rates the new one,
// so scores and fits land together in a single reorder instead of two.
const FIT_WAIT_MS = 4000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a displayed number to its new value instead of snapping to it. If the
 * target changes mid-animation it continues from wherever it currently is. */
function useTweenedNumber(target: number | null): number | null {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  useEffect(() => {
    const from = currentRef.current;
    if (target == null || from == null || from === target || prefersReducedMotion()) {
      currentRef.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / MOVE_MS);
      const next = from + (target - from) * (1 - (1 - t) ** 4);
      currentRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

/** Site-fit bar. Animates with a GPU transform rather than width. */
function FitBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-foreground/10">
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

function TypologyTile({
  elementRef,
  typologyId,
  rank,
  zoning,
  fitsById,
  onSelectTypology,
}: {
  elementRef?: (el: HTMLDivElement | null) => void;
  typologyId: string;
  /** 1 = best on this parcel. */
  rank: number;
  zoning: string;
  /** Jev's site-fit results, keyed by its own (coarser) typology id -- see
   * SITE_FIT_TYPOLOGY. Undefined while loading or if Jev is unavailable. */
  fitsById?: FitsById;
  /** Scrolls the Alerts pane to this card's typology, if it has one there. */
  onSelectTypology?: (siteFitId: string) => void;
}) {
  const pathwayId = DISTRICT_PATHWAYS[zoning]?.[typologyId];
  const score = tileScore(zoning, typologyId) ?? null;
  const shownScore = useTweenedNumber(score);
  const Icon = TYPOLOGY_ICON[typologyId] ?? House;
  const fullLabel = TYPOLOGIES.find(([id]) => id === typologyId)?.[1] ?? typologyId;
  const pathway = pathwayId ? PATHWAY_META[pathwayId] : undefined;
  const tooltip =
    pathwayId === "not_permitted"
      ? `${pathway?.label} -- rezoning closeness ${Math.round(rezoningCloseness(zoning, typologyId) * 100)}%, district relief approval rate ${Math.round(rezoningLikelihood(zoning) * 100)}%`
      : pathway?.label;
  const siteFitId = SITE_FIT_TYPOLOGY[typologyId];
  const fit = siteFitId ? fitsById?.[siteFitId] : undefined;
  const canJumpToAlerts = Boolean(siteFitId && onSelectTypology);
  const color = shownScore == null ? undefined : scoreColor(shownScore);

  return (
    <div
      ref={elementRef}
      data-typology={typologyId}
      className={`relative flex w-44 shrink-0 flex-col gap-1 rounded border border-border/60 bg-background p-2 transition-colors ${canJumpToAlerts ? "cursor-pointer hover:border-border" : ""}`}
      onClick={canJumpToAlerts ? () => onSelectTypology?.(siteFitId!) : undefined}
      title={canJumpToAlerts ? "Jump to this typology's alerts" : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 tabular-nums text-muted-foreground" title={`Ranked #${rank} on this parcel`}>
          #{rank}
        </span>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium" title={fullLabel}>
          {SHORT_LABEL[typologyId] ?? fullLabel}
        </span>
        <span className="shrink-0 text-lg font-semibold leading-none tabular-nums" style={{ color }} data-score>
          {shownScore == null ? "—" : Math.round(shownScore)}
        </span>
      </div>
      <span className={score == null ? "truncate text-muted-foreground" : "truncate"} style={{ color }} title={tooltip}>
        {pathway?.label ?? "Unresolved in the code"}
      </span>
      {fit && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <FitBar value={fit.fit * 100} />
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(fit.confidence * 100)}%</span>
          </div>
          <p className="truncate text-muted-foreground" title={fit.label}>
            {fit.label}
            {fit.needsReview && <span className="text-yellow-400"> · needs review</span>}
          </p>
        </div>
      )}
    </div>
  );
}

/** What the tiles are currently showing. Swapped in one step once the next
 * parcel's scores *and* site fits are ready, so the tiles move exactly once. */
type Snapshot = { pin: string; data: ParcelData; fits: FitsById | undefined; lot: string | undefined };

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
    onSettle({ pin, data, fits, lot: query.data?.facts.lot });
  }, [pin, data, query.status, query.data, onSettle]);
  useEffect(() => {
    const timer = setTimeout(() => onSettle({ pin, data, fits: undefined, lot: undefined }, true), FIT_WAIT_MS);
    return () => clearTimeout(timer);
  }, [pin, data, onSettle]);
  return null;
}

const STEP = 0.2;

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
  onSelectTypology?: (siteFitId: string) => void;
}) {
  const zoning = snapshot.data.zoning ?? "";
  const { fits } = snapshot;

  // Best to worst: tile score, then Jev's site fit as a tie-breaker, then the
  // type's catalogue order so equal tiles keep a stable order. Unscored last.
  const ranked = useMemo(() => {
    const fitOf = (id: string) => {
      const siteFitId = SITE_FIT_TYPOLOGY[id];
      return (siteFitId ? fits?.[siteFitId]?.fit : undefined) ?? -1;
    };
    return TYPOLOGIES.map(([id], slot) => ({ id, slot, score: tileScore(zoning, id) ?? -1, fit: fitOf(id) })).sort(
      (a, b) => b.score - a.score || b.fit - a.fit || a.slot - b.slot,
    );
  }, [zoning, fits]);

  // FLIP: after React reorders the tiles, each one is drawn back at where it
  // was and glides to its new slot. Positions come from offsetLeft (layout,
  // unaffected by scrolling or in-flight transforms), and a glide that's
  // interrupted by another parcel click continues from where the tile
  // visibly is instead of snapping. Off-screen tiles glide too.
  const tileEls = useRef(new Map<string, HTMLDivElement>());
  const lastOffsets = useRef(new Map<string, number>());
  const orderKey = ranked.map((r) => r.id).join();
  useLayoutEffect(() => {
    const reduceMotion = prefersReducedMotion();
    for (const [id, el] of tileEls.current) {
      const next = el.offsetLeft;
      const prev = lastOffsets.current.get(id);
      lastOffsets.current.set(id, next);
      if (prev == null) continue;
      const transform = getComputedStyle(el).transform;
      const inFlight = transform && transform !== "none" ? new DOMMatrixReadOnly(transform).m41 : 0;
      for (const animation of el.getAnimations()) animation.cancel();
      const dx = prev + inFlight - next;
      if (reduceMotion || Math.abs(dx) < 1) continue;
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
    }
  }, [orderKey]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 2;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

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
          className={`relative flex h-full w-max gap-2 transition-opacity duration-300 ${updating ? "opacity-60 delay-150" : "opacity-100 delay-0"}`}
        >
          {ranked.map(({ id }, rank) => (
            <TypologyTile
              key={id}
              elementRef={(el) => {
                if (el) tileEls.current.set(id, el);
                else tileEls.current.delete(id);
              }}
              typologyId={id}
              rank={rank + 1}
              zoning={zoning}
              fitsById={fits}
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

/** Bottom pane: every housing type ranked for the selected parcel, as a
 * horizontal slider. Each tile shows the legal-pathway score for its zoning
 * district plus (where a close enough match exists) Jev's physical site fit.
 * Changing parcels keeps the tiles in place and glides them to their new rank. */
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
  else
    body = <TypologyTrack snapshot={snapshot} updating={updating} onSelectTypology={onSelectTypology} />;

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
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="typology scores" />}
        </div>
      </div>
      {!collapsed && <div className="flex min-h-0 flex-1 flex-col gap-2">{body}</div>}
    </div>
  );
}
