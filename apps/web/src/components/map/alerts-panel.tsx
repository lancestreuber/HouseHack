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

// Below this, the fit rubric is in its bottom half ("Cannot fit" / "Fits
// only with major compromises") -- worth flagging on its own, independent of
// confidence or legality.
const POOR_FIT_THRESHOLD = 0.5;

/** Alerts that need a person's attention before trusting a typology's
 * numbers at face value: it's legally blocked but could be rezoned, its
 * physical fit came back poor, or the rating was too uncertain to lean on.
 * Grouped per typology (one anchor each) rather than per alert type, so a
 * typology card can scroll straight to everything about it here. */
function AlertsContent({ pin, data }: { pin: string; data: ParcelData }) {
  const query = useTypologyFit(pin, data);

  if (query.isPending) return <p className="text-muted-foreground">Checking zoning and site fit…</p>;
  if (query.isError || !query.data) return <p className="text-muted-foreground">Couldn't load alerts for this parcel.</p>;

  const flagged = query.data.typologies
    .map((t) => {
      const notes: string[] = [];
      // Full reason text, not a shortened re-derivation: it already names the
      // exact district(s) a rezoning would need to go to, plus the code cite.
      if (t.gate.rezoningTo?.length) notes.push(t.gate.reason);
      if (t.fit && t.fit.fit < POOR_FIT_THRESHOLD) {
        notes.push(`Physical fit: ${t.fit.label.toLowerCase()} -- ${query.data.facts.hazards}`);
      }
      if (t.fit?.needsReview) notes.push("Site-fit rating has low confidence, needs human review.");
      return { ...t, notes };
    })
    .filter((t) => t.notes.length > 0);

  if (!flagged.length) {
    return <p className="text-muted-foreground">No alerts for this parcel right now.</p>;
  }

  return (
    <div className="space-y-2">
      {flagged.map((t) => (
        <section key={t.id} id={`alert-${t.id}`} className="scroll-mt-2 space-y-1">
          <p className="font-medium">{t.label}</p>
          {t.notes.map((note) => (
            <AlertRow key={note} text={note} />
          ))}
        </section>
      ))}
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
