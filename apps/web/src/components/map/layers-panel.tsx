import { GlassSurface, SectionCard } from "@HouseHack/ui/components/glass";
import { Checkbox } from "@HouseHack/ui/components/checkbox";
import { RadioGroup, RadioGroupItem } from "@HouseHack/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@HouseHack/ui/components/select";

import type { OverlayState } from "./overlay-controller";
import { selectedMetric } from "./overlay-controller";
import { HEAT_OVERLAYS, overlaysInGroup, STACKABLE_GROUPS } from "./overlays";
import type { LegendItem, OverlayDefinition } from "./overlays/types";

const EVIDENCE_LABEL = {
  observed: "Observed evidence",
  assumption: "Assumption",
  policy: "Policy choice",
  value: "Value judgment",
} as const;

const TITLE_CLS = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

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
    <SectionCard className="mt-1 space-y-1 p-2">
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
        <span className="rounded-full border border-glass-border bg-glass-card px-1.5 text-[10px]">
          {EVIDENCE_LABEL[def.meta.evidence]}
        </span>
      </p>
      {def.meta.caveats.map((c) => (
        <p key={c} className="text-muted-foreground">
          ⚠ {c}
        </p>
      ))}
    </SectionCard>
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
      <p className={TITLE_CLS}>{title}</p>
      {overlays.map((def) => {
        const checked = state.infraIds.includes(def.id);
        const minZoom = minZoomOf(def);
        return (
          <div key={def.id}>
            <label className="flex items-center gap-1.5" title={def.description}>
              <Checkbox checked={checked} onCheckedChange={() => toggle(def.id)} />
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
    <GlassSurface edge="none" className="pointer-events-auto w-64 max-h-full text-[11px]">
      <div className="max-h-full space-y-1 overflow-y-auto p-2">
        <p className={TITLE_CLS}>Heat overlay</p>
        <RadioGroup value={state.heatId ?? "none"} onValueChange={(v) => setHeat(v === "none" ? null : v)}>
          <label className="flex items-center gap-1.5">
            <RadioGroupItem value="none" />
            None
          </label>
          {HEAT_OVERLAYS.map((def) => (
            <div key={def.id}>
              <label className="flex items-center gap-1.5" title={def.description}>
                <RadioGroupItem value={def.id} />
                {def.label}
                {state.heatId === def.id && loadingIds.includes(def.id) && <LoadingBadge />}
              </label>
              {state.heatId === def.id && (
                <>
                  {def.metrics && (
                    <Select
                      value={selectedMetric(def, state)?.id}
                      onValueChange={(value) => value && setMetric(def.id, value)}
                    >
                      <SelectTrigger size="sm" className="mt-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {def.metrics.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Legend def={def} state={state} />
                </>
              )}
            </div>
          ))}
        </RadioGroup>

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
    </GlassSurface>
  );
}