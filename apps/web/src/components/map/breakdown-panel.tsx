import { Info } from "lucide-react";
import { useMemo } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { type PillarId, scoreParcel } from "@/lib/pillars/score";

import { PaneCollapseButton } from "./pane-collapse-button";
import { formatRaw, fmtScore, INDICATORS, scoreColor, useParcelData } from "./pillars-panel";

/** Right-column pane, below Scores: the full indicator-level breakdown behind
 * every pillar score (e.g. "murder rate = 7.2 per 1,000"), not just the
 * rolled-up number -- with an anchor per pillar so a pillar card up top can
 * scroll straight to its section here. A pillar's own flags (hazard caps,
 * etc.) live in the Alerts pane, not inline here; the info icon jumps there. */
export function BreakdownPanel({
  pin,
  collapsed,
  onToggleCollapse,
  onSelectPillarAlert,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectPillarAlert?: (pillarId: PillarId) => void;
}) {
  const { data, status } = useParcelData(pin);
  const result = useMemo(() => (data ? scoreParcel(data.norm) : null), [data]);

  return (
    <div className="flex h-full w-full flex-col text-xs">
      <div className="flex items-center justify-between border-b p-2 font-medium">
        Breakdowns
        {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="breakdowns" />}
      </div>
      {!collapsed && (
      <div className="flex-1 space-y-3 overflow-y-auto p-2">
        {!pin && <p className="text-muted-foreground">Select a parcel to see its indicator breakdown.</p>}
        {pin && status === "loading" && <p className="text-muted-foreground">Loading…</p>}
        {pin && status === "missing" && (
          <p className="text-muted-foreground">No indicator data for this parcel (city parcels only).</p>
        )}
        {data &&
          result &&
          config.pillars.map((p) => {
            const pillarId = p.id as PillarId;
            const score = result.pillars[pillarId];
            const indicators = INDICATORS.filter((ind) => ind.pillar === pillarId);
            return (
              <section key={p.id} id={`breakdown-${p.id}`} className="scroll-mt-2 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1 font-medium">
                    {p.label}
                    {score.flags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onSelectPillarAlert?.(pillarId)}
                        aria-label={`${p.label}: see its flags in Alerts`}
                        title="See why, in Alerts"
                        className="rounded p-0.5 text-red-400 hover:bg-foreground/10"
                      >
                        <Info className="size-3" />
                      </button>
                    )}
                  </span>
                  <span className="tabular-nums" style={{ color: scoreColor(score.score) }}>
                    {fmtScore(score.score)}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {indicators.map((ind) => {
                    const raw = data.raw[ind.id];
                    const norm = data.norm[ind.id];
                    return (
                      <li key={ind.id} className="flex items-baseline justify-between gap-2 border-t border-border/40 py-0.5">
                        <span className={ind.weight === 0 ? "text-muted-foreground" : ""}>
                          {ind.label} = {formatRaw(raw, ind.unit)}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{norm == null ? "—" : `${norm}/100`}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
      </div>
      )}
    </div>
  );
}
