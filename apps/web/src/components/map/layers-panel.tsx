import type { OverlayState } from "./overlay-controller";
import { selectedMetric } from "./overlay-controller";
import { HAZARD_OVERLAYS, HEAT_OVERLAYS, INFRA_OVERLAYS } from "./overlays";
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
    <div className="mt-1 space-y-1 rounded border border-border/60 bg-background/60 p-2">
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
          <div key={def.id}>
            <label className="flex items-center gap-1.5" title={def.description}>
              <input type="checkbox" checked={checked} onChange={() => toggle(def.id)} />
              {def.label}
              {checked && zoom < minZoom && <span className="text-muted-foreground">(zoom in to {minZoom}+)</span>}
              {checked && zoom >= minZoom && loadingIds.includes(def.id) && <LoadingBadge />}
            </label>
            {checked && <Legend def={def} state={state} />}
          </div>
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

  return (
    <div className="max-h-full w-64 overflow-y-auto rounded-md border bg-background/85 p-2 text-[11px] backdrop-blur">
      <p className="mb-1 font-medium">Heat overlay</p>
      <label className="flex items-center gap-1.5">
        <input type="radio" name="heat-overlay" checked={state.heatId === null} onChange={() => setHeat(null)} />
        None
      </label>
      {HEAT_OVERLAYS.map((def) => (
        <div key={def.id}>
          <label className="flex items-center gap-1.5" title={def.description}>
            <input type="radio" name="heat-overlay" checked={state.heatId === def.id} onChange={() => setHeat(def.id)} />
            {def.label}
            {state.heatId === def.id && loadingIds.includes(def.id) && <LoadingBadge />}
          </label>
          {state.heatId === def.id && (
            <>
              {def.metrics && (
                <select
                  className="mt-1 w-full rounded border bg-background px-1 py-0.5"
                  value={selectedMetric(def, state)?.id}
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
        </div>
      ))}

      <StackableSection
        title="Hazards"
        overlays={HAZARD_OVERLAYS}
        state={state}
        toggle={toggleStackable}
        zoom={zoom}
        loadingIds={loadingIds}
      />
      <StackableSection
        title="Infrastructure"
        overlays={INFRA_OVERLAYS}
        state={state}
        toggle={toggleStackable}
        zoom={zoom}
        loadingIds={loadingIds}
      />
    </div>
  );
}
