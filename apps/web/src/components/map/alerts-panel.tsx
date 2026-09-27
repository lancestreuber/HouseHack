import type { ParcelScoreView, ParcelData } from "./pillars-panel";
import { useTypologyFit } from "./pillars-panel";

// Below this, the fit rubric is in its bottom half ("Cannot fit" / "Fits
// only with major compromises") -- worth flagging on its own, independent of
// confidence or legality.
const POOR_FIT_THRESHOLD = 0.5;

/** Alerts that need a person's attention before trusting a typology's
 * numbers at face value: it's legally blocked but could be rezoned, its
 * physical fit came back poor, or the rating was too uncertain to lean on.
 * Grouped per typology (one anchor each) rather than per alert type, so a
 * typology card can scroll straight to everything about it here. */
export function typologyAlerts(fit: NonNullable<ReturnType<typeof useTypologyFit>["data"]>) {
  return fit.typologies
    .map((t) => {
      const notes: string[] = [];
      // Full reason text, not a shortened re-derivation: it already names the
      // exact district(s) a rezoning would need to go to, plus the code cite.
      if (t.gate.rezoningTo?.length) notes.push(t.gate.reason);
      if (t.fit && t.fit.fit < POOR_FIT_THRESHOLD) {
        notes.push(`Physical fit: ${t.fit.label.toLowerCase()} -- ${fit.facts.hazards}`);
      }
      if (t.fit?.needsReview) notes.push("Site-fit rating has low confidence, needs human review.");
      return { ...t, notes };
    })
    .filter((t) => t.notes.length > 0);
}

export type AlertSeverity = "critical" | "overlay" | "advisory";

export type AlertCard = {
  severity: AlertSeverity;
  title: string;
  body: string;
  anchor?: string;
};

const SEVERITY_STYLE: Record<AlertSeverity, { card: string; dot: string; title: string; body: string; chip: string; label: string }> = {
  critical: {
    card: "border-critical/25 bg-critical/10",
    dot: "bg-critical",
    title: "text-[#ffdad6]",
    body: "text-[#ffdad6]/80",
    chip: "bg-critical/15 text-critical",
    label: "Critical",
  },
  overlay: {
    card: "border-brass/25 bg-brass/10",
    dot: "bg-brass",
    title: "text-foreground",
    body: "text-muted-foreground",
    chip: "bg-brass/15 text-brass",
    label: "Overlay",
  },
  advisory: {
    card: "border-border bg-popover",
    dot: "bg-faint",
    title: "text-muted-foreground",
    body: "text-faint",
    chip: "bg-accent text-faint",
    label: "Advisory",
  },
};

/** Severity mapping: deal-killer hazards and poor physical fit are Critical,
 * zoning/overlay restrictions are Overlay, confidence and review notes are
 * Advisory. */
export function buildAlertCards(fit: NonNullable<ReturnType<typeof useTypologyFit>["data"]>, score: ParcelScoreView): AlertCard[] {
  const cards: AlertCard[] = [];
  if (score.result?.hazard) {
    for (const flag of score.result.hazard.flags) {
      cards.push({ severity: "critical", title: "Deal-killer site hazard", body: flag });
    }
  }
  for (const t of typologyAlerts(fit)) {
    if (t.gate.rezoningTo?.length) {
      cards.push({ severity: "overlay", title: `Zoning restriction · ${t.label}`, body: t.gate.reason, anchor: t.id });
    }
    if (t.fit && t.fit.fit < POOR_FIT_THRESHOLD) {
      cards.push({
        severity: "critical",
        title: `Physical fit · ${t.label}`,
        body: `Physical fit: ${t.fit.label.toLowerCase()} -- ${fit.facts.hazards}`,
        anchor: t.id,
      });
    }
    if (t.fit?.needsReview) {
      cards.push({
        severity: "advisory",
        title: `Review needed · ${t.label}`,
        body: "Site-fit rating has low confidence, needs human review.",
        anchor: t.id,
      });
    }
  }
  return cards;
}

function Card({ card }: { card: AlertCard }) {
  const s = SEVERITY_STYLE[card.severity];
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border p-3 ${s.card}`}>
      <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${s.dot}`} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] font-semibold ${s.title}`}>{card.title}</span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${s.chip}`}>{s.label}</span>
        </div>
        <p className={`text-[13px] leading-snug ${s.body}`}>{card.body}</p>
      </div>
    </div>
  );
}

/** Inspector Alerts tab: constraint cards in the console's severity language.
 * Anchors per typology let typology cards scroll straight here. */
export function AlertsTab({ pin, data, score }: { pin: string; data: ParcelData; score: ParcelScoreView }) {
  const query = useTypologyFit(pin, data);

  if (query.isPending) return <p className="text-muted-foreground">Checking zoning and site fit…</p>;
  if (query.isError || !query.data) return <p className="text-muted-foreground">Couldn't load alerts for this parcel.</p>;

  const cards = buildAlertCards(query.data, score);
  const criticals = cards.filter((c) => c.severity !== "advisory").length;
  // One scroll anchor per typology, on its first card only.
  const anchored = new Set<string>();

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-wide text-foreground uppercase">Active constraints</span>
        <span className="text-[11px] text-faint tnum">{criticals} critical notice{criticals === 1 ? "" : "s"}</span>
      </div>
      {cards.length === 0 && <p className="text-muted-foreground">No alerts for this parcel right now.</p>}
      {cards.map((card, i) => {
        const anchor = card.anchor && !anchored.has(card.anchor) ? card.anchor : undefined;
        if (anchor) anchored.add(anchor);
        return (
          <div key={`${card.anchor ?? "card"}-${i}`} id={anchor ? `alert-${anchor}` : undefined} className="scroll-mt-2">
            <Card card={card} />
          </div>
        );
      })}
    </div>
  );
}
