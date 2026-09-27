import { TriangleAlert } from "lucide-react";

import { PaneCollapseButton } from "./pane-collapse-button";
import { type ParcelData, useParcelData, useTypologyFit } from "./pillars-panel";
import { fmtUsd, VERDICT_DOT, VERDICT_LABEL, type VerdictLevel } from "./verdict";

function AlertRow({ text, level }: { text: string; level: VerdictLevel }) {
  const cls =
    level === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : level === "unknown"
        ? "border-neutral-400/30 bg-neutral-400/10 text-neutral-400"
        : "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
  return (
    <div className={`flex items-start gap-1.5 rounded border px-2 py-1 ${cls}`}>
      <TriangleAlert className="mt-0.5 size-3 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

/** Alerts grouped per typology (one anchor each, so a typology card can
 * scroll straight to everything about it here). Each typology's verdict --
 * red/yellow/green/unknown, computed in packages/api/src/typology/site-fit.ts
 * from gates, hazards and physical site fit, never from the weighted pillar
 * score -- decides whether it shows up here at all (green = nothing to flag)
 * and what color its reasons render in. Exported (not just used below) so
 * the chat can cite the same alerts it sees on screen (parcel-context.ts). */
export function typologyAlerts(fit: NonNullable<ReturnType<typeof useTypologyFit>["data"]>) {
  return fit.typologies.filter((t) => t.verdict.level !== "green").map((t) => ({ ...t, notes: t.verdict.reasons }));
}

function AlertsContent({ pin, data }: { pin: string; data: ParcelData }) {
  const query = useTypologyFit(pin, data);

  if (query.isPending) return <p className="text-muted-foreground">Checking zoning and site fit…</p>;
  if (query.isError || !query.data) return <p className="text-muted-foreground">Couldn't load alerts for this parcel.</p>;

  const flagged = typologyAlerts(query.data);

  if (!flagged.length) {
    return <p className="text-muted-foreground">No alerts for this parcel right now.</p>;
  }

  return (
    <div className="space-y-2">
      {flagged.map((t) => (
        <section key={t.id} id={`alert-${t.id}`} className="scroll-mt-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className={`size-2 shrink-0 rounded-full ${VERDICT_DOT[t.verdict.level]}`} />
            <p className="font-medium">
              {t.label} <span className="text-muted-foreground">· {VERDICT_LABEL[t.verdict.level]}</span>
            </p>
          </div>
          {t.verdict.reasons.map((note) => (
            <AlertRow key={note} text={note} level={t.verdict.level} />
          ))}
          <p className="text-muted-foreground">
            Est. construction cost: {fmtUsd(t.cost.low)}–{fmtUsd(t.cost.high)} ({t.cost.units} unit{t.cost.units === 1 ? "" : "s"}, order of
            magnitude only -- not a pro forma).
          </p>
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
