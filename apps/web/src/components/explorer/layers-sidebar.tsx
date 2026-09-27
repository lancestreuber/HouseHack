import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Flame,
  HardHat,
  LandPlot,
  Layers,
  Leaf,
  Landmark,
  MapPin,
  Mountain,
  PanelRightClose,
  Scale,
  Search,
  Video,
  Wrench,
} from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import config from "@/lib/pillars/pillars.config.json";

import { selectedMetric, type OverlayState } from "../map/overlay-controller";
import { setOverlayState, useOverlayView } from "../map/overlay-store";
import { HEAT_OVERLAYS, overlaysInGroup, PILLAR_OVERLAYS, STACKABLE_GROUPS } from "../map/overlays";
import type { LegendItem, OverlayDefinition } from "../map/overlays/types";
import { toggleSidebar } from "../shell/shell-store";

const EVIDENCE_LABEL = {
  observed: "Observed evidence",
  assumption: "Assumption",
  policy: "Policy choice",
  value: "Value judgment",
} as const;

function Swatch({ item }: { item: LegendItem }) {
  const shape = item.shape ?? "fill";
  if (shape === "dot") {
    return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />;
  }
  if (shape === "line" || shape === "dashed-line") {
    return (
      <span
        className="inline-block h-0 w-4 shrink-0 border-t-2"
        style={{ borderColor: item.color, borderStyle: shape === "dashed-line" ? "dashed" : "solid" }}
      />
    );
  }
  return <span className="inline-block h-2.5 w-4 shrink-0 rounded-sm" style={{ background: item.color }} />;
}

function Legend({ def, state }: { def: OverlayDefinition; state: OverlayState }) {
  const metric = selectedMetric(def, state);
  return (
    <div className="space-y-1">
      <ul className="space-y-0.5">
        {def.legend(metric).map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <Swatch item={item} />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">{def.meta.geography}</p>
      <p className="text-muted-foreground">
        <a href={def.meta.sourceUrl} target="_blank" rel="noreferrer" className="underline">
          {def.meta.source}
        </a>{" "}
        · {def.meta.asOf}
      </p>
      <p>
        <span className="rounded bg-foreground/10 px-1">{EVIDENCE_LABEL[def.meta.evidence]}</span>
      </p>
      {def.meta.caveats.map((c) => (
        <p key={c} className="text-muted-foreground">
          ⚠ {c}
        </p>
      ))}
    </div>
  );
}

// How long the pointer can be off both the row and the flyout before it closes,
// so it survives the short trip across the gap between them.
const CLOSE_DELAY_MS = 150;

// A row in the sidebar. When `active`, hovering it opens its details in a
// flyout to the right instead of expanding the list. The flyout stays open
// while the pointer is on it (or a select inside it is open).
function HoverRow({ active, row, details }: { active: boolean; row: ReactNode; details: () => ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const open = () => {
    cancelClose();
    if (active && rowRef.current) setAnchor(rowRef.current.getBoundingClientRect());
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      // A native <select> dropdown takes the pointer outside the flyout; keep it open until the select is done.
      if (document.activeElement?.tagName === "SELECT" && flyoutRef.current?.contains(document.activeElement)) return;
      setAnchor(null);
    }, CLOSE_DELAY_MS);
  };

  // Selecting a row while hovering it opens its flyout straight away.
  useEffect(() => {
    if (!active) setAnchor(null);
    else if (hovered.current && rowRef.current) setAnchor(rowRef.current.getBoundingClientRect());
  }, [active]);
  useEffect(() => cancelClose, []);

  // Line the flyout up with the row, nudged up if it would run off the bottom.
  useLayoutEffect(() => {
    const el = flyoutRef.current;
    if (!anchor || !el) return;
    const want = { left: anchor.right + 6, top: Math.max(8, Math.min(anchor.top, window.innerHeight - el.offsetHeight - 8)) };
    el.style.left = `${want.left}px`;
    el.style.top = `${want.top}px`;
    const got = el.getBoundingClientRect();
    setPos({ left: 2 * want.left - got.left, top: 2 * want.top - got.top });
  }, [anchor]);

  return (
    <div
      ref={rowRef}
      onMouseEnter={() => {
        hovered.current = true;
        open();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        scheduleClose();
      }}
    >
      {row}
      {anchor &&
        createPortal(
          <div
            ref={flyoutRef}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onChange={() => (document.activeElement as HTMLElement | null)?.blur()}
            className="fixed z-50 max-h-[calc(100vh-16px)] w-72 overflow-y-auto rounded-lg border border-border bg-popover/95 p-2 text-[11px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur"
            style={pos}
          >
            {details()}
          </div>,
          document.body,
        )}
    </div>
  );
}

function LoadingBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" aria-live="polite">
      <span className="inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
      loading
    </span>
  );
}

function minZoomOf(def: OverlayDefinition) {
  return "minZoom" in def.source ? (def.source.minZoom ?? 0) : 0;
}

type Section = {
  id: string;
  title: string;
  icon: ReactNode;
  /** "single": one choropleth at a time across pillar + heat sections. */
  kind: "single" | "stack";
  defs: OverlayDefinition[];
};

const SECTIONS: Section[] = [
  { id: "pillar", title: "Pillar Scores", icon: <BarChart3 className="size-4" />, kind: "single", defs: PILLAR_OVERLAYS },
  { id: "heat", title: "Heat Overlays", icon: <Flame className="size-4" />, kind: "single", defs: HEAT_OVERLAYS },
  ...STACKABLE_GROUPS.map(({ group, title }) => ({
    id: group,
    title,
    icon: (
      {
        hazard: <Mountain className="size-4" />,
        infrastructure: <Wrench className="size-4" />,
        places: <MapPin className="size-4" />,
        environment: <Leaf className="size-4" />,
        policy: <Landmark className="size-4" />,
        development: <HardHat className="size-4" />,
        land: <LandPlot className="size-4" />,
        legal: <Scale className="size-4" />,
        cameras: <Video className="size-4" />,
      } as Record<string, ReactNode>
    )[group],
    kind: "stack" as const,
    defs: overlaysInGroup(group),
  })),
];

/** Docked left tray: the overlay registry as accordion groups, with a filter,
 * an active-layer summary and the engine sync footer. Pillar scores and heat
 * overlays stay single-active (one choropleth at a time); every other group
 * stacks. */
export function LayersSidebar() {
  const { state, zoom, loadingIds } = useOverlayView();
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const setHeat = (heatId: string | null) => setOverlayState({ ...state, heatId });
  const setMetric = (overlayId: string, metricId: string) =>
    setOverlayState({ ...state, metricByOverlay: { ...state.metricByOverlay, [overlayId]: metricId } });
  const toggleStackable = (id: string) =>
    setOverlayState({
      ...state,
      infraIds: state.infraIds.includes(id) ? state.infraIds.filter((x) => x !== id) : [...state.infraIds, id],
    });

  const q = filter.trim().toLowerCase();
  const activeCount = (state.heatId ? 1 : 0) + state.infraIds.length;

  const row = (def: OverlayDefinition, kind: "single" | "stack") => {
    const active = kind === "single" ? state.heatId === def.id : state.infraIds.includes(def.id);
    const metric = selectedMetric(def, state);
    const minZoom = minZoomOf(def);
    return (
      <HoverRow
        key={def.id}
        active={active}
        row={
          <label
            className={`relative flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors ${
              active ? "bg-accent/70" : "hover:bg-accent/40"
            }`}
            title={active ? undefined : def.description}
          >
            {active && <span className="absolute top-1 bottom-1 left-0 w-[2px] rounded-r bg-brass" aria-hidden />}
            <span className="flex min-w-0 items-center gap-2.5 pl-1">
              <input
                type="checkbox"
                checked={active}
                onChange={() => (kind === "single" ? setHeat(active ? null : def.id) : toggleStackable(def.id))}
                className="size-3.5 shrink-0 cursor-pointer rounded border-border bg-card accent-brass"
              />
              <span className={`truncate text-[13px] ${active ? "text-foreground" : "text-muted-foreground"}`}>{def.label}</span>
            </span>
            {active && <span className="size-1.5 shrink-0 rounded-full bg-brass" aria-hidden />}
          </label>
        }
        details={() => (
          <>
            <p className="mb-1 font-medium">{def.label}</p>
            {kind === "stack" && zoom < minZoom && (
              <p className="mb-1 text-warn">Zoom in to {minZoom}+ to load this layer.</p>
            )}
            {kind === "stack" && zoom >= minZoom && loadingIds.includes(def.id) && <LoadingBadge />}
            {kind === "single" && loadingIds.includes(def.id) && <LoadingBadge />}
            <p className="mb-1 text-muted-foreground">{def.description}</p>
            {kind === "single" && def.metrics && (
              <select
                className="mb-1 w-full rounded border border-border bg-background px-1 py-0.5"
                value={metric?.id}
                onChange={(e) => setMetric(def.id, e.target.value)}
              >
                {def.metrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <Legend def={def} state={state} />
          </>
        )}
      />
    );
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-3.5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded border border-border bg-popover text-brass">
            <Layers className="size-3.5" />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Data Layers</span>
            <span className="text-[13px] text-faint tnum">PA-S</span>
          </span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Hide layers sidebar"
          title="Hide layers sidebar"
          className="flex size-7 items-center justify-center rounded text-faint transition-colors hover:bg-popover hover:text-foreground"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="flex shrink-0 flex-col gap-2 p-3">
        <div className="relative flex w-full items-center">
          <Search className="pointer-events-none absolute left-2.5 size-4 text-faint" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter layers..."
            aria-label="Filter layers"
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-[13px] text-foreground transition-colors placeholder:text-faint focus:border-brass focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2 text-[11px] text-faint tnum">/</span>
        </div>
        <div className="flex items-center justify-between px-0.5 text-[13px]">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brass" aria-hidden />
            <span className="text-foreground tnum">{activeCount} active layer{activeCount === 1 ? "" : "s"}</span>
          </span>
          <button
            type="button"
            onClick={() => setOverlayState({ ...state, heatId: null, infraIds: [] })}
            className="text-faint transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="flex-1 divide-y divide-border/50 overflow-y-auto">
        {SECTIONS.map((section) => {
          const defs = q ? section.defs.filter((d) => d.label.toLowerCase().includes(q)) : section.defs;
          if (q && !defs.length) return null;
          const activeIn =
            section.kind === "single"
              ? section.defs.some((d) => d.id === state.heatId)
                ? 1
                : 0
              : section.defs.filter((d) => state.infraIds.includes(d.id)).length;
          const isOpen = open[section.id] ?? (q ? true : activeIn > 0);
          return (
            <div key={section.id} className={activeIn > 0 ? "bg-background/40" : undefined}>
              <button
                type="button"
                onClick={() => setOpen((cur) => ({ ...cur, [section.id]: !isOpen }))}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-accent/40"
              >
                <span className="flex items-center gap-2">
                  <span className={activeIn > 0 ? "text-brass" : "text-faint"}>{section.icon}</span>
                  <span className={`text-[13px] font-semibold ${activeIn > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {section.title}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  {activeIn > 0 ? (
                    <span className="rounded border border-brass/30 bg-popover px-1.5 py-0.5 text-[11px] text-brass tnum">
                      {activeIn} active • {section.defs.length}
                    </span>
                  ) : (
                    <span className="text-[11px] text-faint tnum">
                      0/{section.defs.length}
                    </span>
                  )}
                  {isOpen ? <ChevronUp className="size-4 text-faint" /> : <ChevronDown className="size-4 text-faint" />}
                </span>
              </button>
              {isOpen && <div className="flex flex-col gap-0.5 px-1.5 py-1">{defs.map((def) => row(def, section.kind))}</div>}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background p-3">
        <span className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-brass" aria-hidden />
          <span className="text-[13px] text-faint tnum">Spatial engine synced</span>
        </span>
        <span className="text-[11px] text-faint tnum">v{config.version}</span>
      </div>
    </aside>
  );
}
