import { PaneCollapseButton } from "./pane-collapse-button";

/** Every typology-specific fact -- verdict, dealkillers, cost, physical fit --
 * now lives entirely in the bottom Typology panel (typology-panel.tsx), so a
 * typology's red/yellow verdict and a parcel's pillar scores are never split
 * across two panes that could disagree. This pane is kept for non-typology
 * alerts if any get added later. */
export function AlertsPanel({
  pin,
  collapsed,
  onToggleCollapse,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col text-xs">
      <div className="flex items-center justify-between border-b p-2 font-medium">
        Alerts
        {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="alerts" />}
      </div>
      {!collapsed && (
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          <p className="text-muted-foreground">
            {pin
              ? "Housing-type verdicts, dealkillers and cost estimates are shown on each typology tile in the bottom panel."
              : "Select a parcel to see it explained on the typology tiles below."}
          </p>
        </div>
      )}
    </div>
  );
}
