import { useMemo } from "react";

import { scoreParcel, type WeightOverrides } from "@/lib/pillars/score";

import { PaneCollapseButton } from "./pane-collapse-button";
import { usePillarWeights } from "./pillar-weights-store";
import { type ParcelData, useParcelData } from "./pillars-panel";

/** Parcel-wide dealkillers: a hazard severe enough to multiply the whole
 * Overall score (not just one pillar, so a good neighborhood can't average it
 * away), and what's actually on the lot today (an occupied or large building,
 * an institution, a park or right-of-way) if that limits redevelopment.
 * Everything typology-specific -- verdict, pencil check, physical fit -- lives
 * in the bottom Typology panel instead; this pane never repeats it. */
function AlertsContent({ data }: { data: ParcelData }) {
  const weights = usePillarWeights();
  const overrides = useMemo<WeightOverrides>(() => ({ pillars: weights }), [weights]);
  const result = useMemo(() => scoreParcel(data.norm, overrides), [data, overrides]);
  const hasHazard = Boolean(result.hazard);
  const hasAvailability = Boolean(result.availability && result.availability.multiplier < 1);

  if (!hasHazard && !hasAvailability) {
    return <p className="text-muted-foreground">No parcel-wide alerts for this parcel right now.</p>;
  }

  return (
    <div className="space-y-2">
      {result.hazard && (
        <section className="rounded border border-red-500/60 bg-red-500/10 p-2">
          <p className="font-medium">Deal-killer site hazard</p>
          {result.hazard.flags.map((f) => (
            <p key={f}>{f}</p>
          ))}
          <p className="text-muted-foreground">Overall score × {result.hazard.multiplier}, so a good neighborhood can't average it away.</p>
        </section>
      )}
      {result.availability && result.availability.multiplier < 1 && (
        <section className="rounded border border-red-500/60 bg-red-500/10 p-2">
          <p className="font-medium">{result.availability.label}</p>
          <p className="text-muted-foreground">Overall score × {result.availability.multiplier}.</p>
          {result.availability.note && <p className="text-muted-foreground">{result.availability.note}</p>}
        </section>
      )}
    </div>
  );
}

export function AlertsPanel({
  pin,
  collapsed,
  onToggleCollapse,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { data, status } = useParcelData(pin);

  return (
    <div className="flex h-full w-full flex-col text-xs">
      <div className="flex items-center justify-between border-b p-2 font-medium">
        Alerts
        {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="alerts" />}
      </div>
      {!collapsed && (
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {!pin && <p className="text-muted-foreground">Select a parcel to see its alerts.</p>}
          {pin && status === "loading" && <p className="text-muted-foreground">Loading…</p>}
          {pin && status === "missing" && (
            <p className="text-muted-foreground">No indicator data for this parcel (city parcels only).</p>
          )}
          {pin && data && <AlertsContent data={data} />}
        </div>
      )}
    </div>
  );
}
