import { TriangleAlert } from "lucide-react";

import { PaneCollapseButton } from "./pane-collapse-button";
import { type ParcelData, useParcelData, useTypologyFit } from "./pillars-panel";

function AlertRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 rounded border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-yellow-400">
      <TriangleAlert className="mt-0.5 size-3 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

/** Alerts that need a person's attention before trusting a typology's
 * numbers at face value: it's legally blocked but could be rezoned, or the
 * model's site-fit rating came back too uncertain to lean on. */
function AlertsContent({ pin, data }: { pin: string; data: ParcelData }) {
  const query = useTypologyFit(pin, data);

  if (query.isPending) return <p className="text-muted-foreground">Checking zoning and site fit…</p>;
  if (query.isError || !query.data) return <p className="text-muted-foreground">Couldn't load alerts for this parcel.</p>;

  const rezoning = query.data.typologies.filter((t) => t.gate.rezoningTo?.length);
  const needsReview = query.data.typologies.filter((t) => t.fit?.needsReview);

  if (!rezoning.length && !needsReview.length) {
    return <p className="text-muted-foreground">No alerts for this parcel right now.</p>;
  }

  return (
    <div className="space-y-2">
      {rezoning.length > 0 && (
        <section className="space-y-1">
          <p className="font-medium">Would need rezoning</p>
          {rezoning.map((t) => (
            <AlertRow
              key={t.id}
              text={`${t.label}: not permitted here; would need rezoning to ${t.gate.rezoningTo?.join(", ")}.`}
            />
          ))}
        </section>
      )}
      {needsReview.length > 0 && (
        <section className="space-y-1">
          <p className="font-medium">Low-confidence ratings</p>
          {needsReview.map((t) => (
            <AlertRow key={t.id} text={`${t.label}: site-fit rating has low confidence, needs human review.`} />
          ))}
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
          {pin && data && <AlertsContent pin={pin} data={data} />}
        </div>
      )}
    </div>
  );
}
