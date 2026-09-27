import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { OverlayState } from "./overlay-controller";
import { selectedMetric } from "./overlay-controller";
import { HEAT_OVERLAYS, overlaysInGroup, PILLAR_OVERLAYS, STACKABLE_GROUPS } from "./overlays";
import type { LegendItem, OverlayDefinition } from "./overlays/types";

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

// A row in the layers panel. When `active` (the selected radio or a checked
// box), hovering it opens its details in a flyout to the right instead of
// expanding the list. The flyout stays open while the pointer is on it (or a
// select inside it is open) and closes as soon as the pointer leaves both.
function HoverRow({ active, row, details }: { active: boolean; row: ReactNode; details: () => ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [top, setTop] = useState(0);

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
    if (!anchor || !flyoutRef.current) return;
    const height = flyoutRef.current.offsetHeight;
    setTop(Math.max(8, Math.min(anchor.top, window.innerHeight - height - 8)));
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
            className="fixed z-50 max-h-[calc(100vh-16px)] w-72 overflow-y-auto rounded-md border bg-background/95 p-2 text-[11px] shadow-lg backdrop-blur"
            style={{ left: anchor.right + 6, top }}
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

// Checkbox list for stackable groups (hazards, infrastructure).
function StackableSection({
  title,
  overlays,
  state,
  toggle,
  zoom,
  loadingIds,
}: {
  title: string;
  overlays: OverlayDefinition[];
  state: OverlayState;
  toggle: (id: string) => void;
  zoom: number;
  loadingIds: string[];
}) {
  if (!overlays.length) return null;
  return (
    <>
      <p className="mt-2 mb-1 font-medium">{title}</p>
      {overlays.map((def) => {
        const checked = state.infraIds.includes(def.id);
        const minZoom = minZoomOf(def);
        return (
          <HoverRow
            key={def.id}
            active={checked}
            row={
              <label className="flex items-center gap-1.5" title={checked ? undefined : def.description}>
                <input type="checkbox" checked={checked} onChange={() => toggle(def.id)} />
                {def.label}
                {checked && zoom < minZoom && <span className="text-muted-foreground">(zoom in to {minZoom}+)</span>}
                {checked && zoom >= minZoom && loadingIds.includes(def.id) && <LoadingBadge />}
              </label>
            }
            details={() => (
              <>
                <p className="mb-1 font-medium">{def.label}</p>
                <p className="mb-1 text-muted-foreground">{def.description}</p>
                <Legend def={def} state={state} />
              </>
            )}
          />
        );
      })}
    </>
  );
}

type Props = {
  state: OverlayState;
  onChange: (next: OverlayState) => void;
  zoom: number;
  loadingIds: string[];
};

export function LayersPanel({ state, onChange, zoom, loadingIds }: Props) {
  const setHeat = (heatId: string | null) => onChange({ ...state, heatId });
  const setMetric = (overlayId: string, metricId: string) =>
    onChange({ ...state, metricByOverlay: { ...state.metricByOverlay, [overlayId]: metricId } });
  const toggleStackable = (id: string) =>
    onChange({
      ...state,
      infraIds: state.infraIds.includes(id) ? state.infraIds.filter((x) => x !== id) : [...state.infraIds, id],
    });

  // Pillar scores and heat overlays share one radio group: one choropleth at a time.
  // Details (metric picker, legend, caveats) open in a hover flyout, so selecting never shifts the list.
  const heatOption = (def: OverlayDefinition) => {
    const active = state.heatId === def.id;
    const metric = selectedMetric(def, state);
    return (
      <HoverRow
        key={def.id}
        active={active}
        row={
          <label className="flex items-center gap-1.5" title={active ? undefined : def.description}>
            <input type="radio" name="heat-overlay" checked={active} onChange={() => setHeat(def.id)} />
            {def.label}
            {active && metric && <span className="truncate text-muted-foreground">· {metric.label}</span>}
            {active && loadingIds.includes(def.id) && <LoadingBadge />}
          </label>
        }
        details={() => (
          <>
            <p className="mb-1 font-medium">{def.label}</p>
            <p className="mb-1 text-muted-foreground">{def.description}</p>
            {def.metrics && (
              <select
                className="mb-1 w-full rounded border bg-background px-1 py-0.5"
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
    <div className="max-h-full w-64 overflow-y-auto rounded-md border bg-background/85 p-2 text-[11px] backdrop-blur">
      <p className="mb-1 font-medium">Pillar scores</p>
      <label className="flex items-center gap-1.5">
        <input type="radio" name="heat-overlay" checked={state.heatId === null} onChange={() => setHeat(null)} />
        None
      </label>
      {PILLAR_OVERLAYS.map(heatOption)}

      <p className="mt-2 mb-1 font-medium">Heat overlay</p>
      {HEAT_OVERLAYS.map(heatOption)}

      {STACKABLE_GROUPS.map(({ group, title }) => (
        <StackableSection
          key={group}
          title={title}
          overlays={overlaysInGroup(group)}
          state={state}
          toggle={toggleStackable}
          zoom={zoom}
          loadingIds={loadingIds}
        />
      ))}
    </div>
  );
}
