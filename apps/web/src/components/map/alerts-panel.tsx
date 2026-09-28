import { CircleCheck, TriangleAlert, Users } from "lucide-react";
import { useMemo } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { usePencilAssumptions } from "@/lib/pillars/pencil-assumptions";
import { type PillarId, scoreParcel, type WeightOverrides } from "@/lib/pillars/score";
import { VERDICT_COLOR, VERDICT_LABEL, type VerdictLevel } from "@/lib/pillars/verdict";

import { TYPOLOGIES } from "./overlays/legal-feasibility";
import { useLegalFor } from "./legal-for-store";
import { PaneCollapseButton } from "./pane-collapse-button";
import { usePillarWeights } from "./pillar-weights-store";
import { type ParcelData, useParcelData, useTypologyFit } from "./pillars-panel";
import { type ImpactItem, typologyImpact } from "./typology-impact";
import { type FitsById, SHORT_LABEL, verdictFor } from "./typology-meta";
import { OutsideCityNotice } from "./outside-city-notice";

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

function ImpactRow({ item }: { item: ImpactItem }) {
  const helps = item.effect === "helps";
  const Icon = helps ? CircleCheck : TriangleAlert;
  const cls = helps ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400" : "border-yellow-400/30 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400";
  return (
    <div className={`flex items-start gap-1.5 rounded border px-2 py-1 ${cls}`}>
      <Icon className="mt-0.5 size-3 shrink-0" />
      <span>{item.text}</span>
    </div>
  );
}

const MAINSTREAM = new Set(config.legal.typologies as string[]);

/** Every typology's verdict reasons (when not green) and who building it here
 * helps (green) or may harm (yellow), one anchored section each
 * (`alert-${typologyId}`) so a bottom-panel tile can scroll straight to its
 * own detail. The five mainstream types and the type picked in the Parcel
 * Score panel start open. */
function TypologyAlerts({ pin, data }: { pin: string; data: ParcelData }) {
  const query = useTypologyFit(pin, data);
  const pencil = usePencilAssumptions();
  const legalFor = useLegalFor();
  const fitsById = useMemo(() => {
    if (!query.data) return undefined;
    const map: FitsById = {};
    for (const t of query.data.typologies) map[t.id] = t.fit;
    return map;
  }, [query.data]);
  const lotWidthFt = query.data?.lot.widthFt;

  const rows = TYPOLOGIES.map(([id, label]) => ({
    id,
    label: SHORT_LABEL[id] ?? label,
    verdict: verdictFor(data.zoning, id, data, { fitsById, lotWidthFt, pencil }),
    impact: typologyImpact(id, data),
  })).filter((t) => t.verdict.level !== "green" || t.impact.length);

  if (!rows.length) {
    return <p className="text-muted-foreground">No housing-type alerts for this parcel right now.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="size-3 shrink-0" /> Per housing type: what stands in the way, who it helps (green) and who it may harm (yellow).
      </p>
      {rows.map((t) => (
        <details key={t.id} id={`alert-${t.id}`} open={MAINSTREAM.has(t.id) || t.id === legalFor} className="scroll-mt-2 space-y-1">
          <summary className="flex cursor-pointer items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: VERDICT_COLOR[t.verdict.level] }} />
            <span className="font-medium">
              {t.label} <span className="text-muted-foreground">· {VERDICT_LABEL[t.verdict.level]}</span>
            </span>
          </summary>
          <div className="mt-1 space-y-1">
            {t.verdict.level !== "green" && t.verdict.reasons.map((r) => <AlertRow key={r.text} text={r.text} level={r.level} />)}
            {t.impact.filter((i) => i.effect === "helps").map((i) => <ImpactRow key={i.key} item={i} />)}
            {t.impact.filter((i) => i.effect === "harms").map((i) => <ImpactRow key={i.key} item={i} />)}
          </div>
        </details>
      ))}
    </div>
  );
}

/** Parcel-wide dealkillers: a hazard severe enough to multiply the whole
 * Overall score (not just one pillar, so a good neighborhood can't average it
 * away), and what's actually on the lot today (an occupied or large building,
 * an institution, a park or right-of-way) if that limits redevelopment. */
function ParcelAlerts({ data }: { data: ParcelData }) {
  const weights = usePillarWeights();
  const overrides = useMemo<WeightOverrides>(() => ({ pillars: weights }), [weights]);
  const result = useMemo(() => scoreParcel(data.norm, overrides), [data, overrides]);

  if (!result.hazard && !(result.availability && result.availability.multiplier < 1)) return null;

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

/** Every pillar's own flags (from its gates in pillars.config.json, e.g. "half
 * the lot is in the FEMA floodway"), one anchored section each
 * (`pillar-alert-${pillarId}`) so the Breakdown pane's info icon can scroll
 * straight to it -- the flags themselves no longer show inline there.
 * Computed the same way (default weights, no overrides) so the numbers never
 * disagree with what the icon points at. */
function PillarAlerts({ data }: { data: ParcelData }) {
  const result = useMemo(() => scoreParcel(data.norm), [data]);
  const flagged = config.pillars
    .map((p) => ({ id: p.id as PillarId, label: p.label, flags: result.pillars[p.id as PillarId].flags }))
    .filter((p) => p.flags.length > 0);

  if (!flagged.length) return null;

  return (
    <div className="space-y-2">
      {flagged.map((p) => (
        <section key={p.id} id={`pillar-alert-${p.id}`} className="scroll-mt-2 space-y-1">
          <p className="font-medium">{p.label}</p>
          {p.flags.map((f) => (
            <AlertRow key={f.text} text={f.capped ? `${f.text} (pillar capped)` : f.text} level="red" />
          ))}
        </section>
      ))}
    </div>
  );
}

function AlertsContent({ pin, data }: { pin: string; data: ParcelData }) {
  return (
    <div className="space-y-3">
      <ParcelAlerts data={data} />
      <PillarAlerts data={data} />
      <TypologyAlerts pin={pin} data={data} />
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
  const { data, status, scope } = useParcelData(pin);

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
          {pin && status === "outside" && <OutsideCityNotice scope={scope} compact />}
          {pin && status === "missing" && (
            <p className="text-muted-foreground">No indicator data for this City parcel.</p>
          )}
          {pin && data && <AlertsContent pin={pin} data={data} />}
        </div>
      )}
    </div>
  );
}
