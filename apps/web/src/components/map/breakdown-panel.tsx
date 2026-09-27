import { TriangleAlert } from "lucide-react";

import config from "@/lib/pillars/pillars.config.json";
import { type PillarId } from "@/lib/pillars/score";

import {
  BuildVerdicts,
  formatRaw,
  fmtScore,
  INDICATORS,
  type ParcelScoreView,
  PencilSection,
  OverallScoreCard,
  PillarCards,
  scoreColor,
  useTypologyFit,
} from "./pillars-panel";

function FlagRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 rounded border border-red-400/30 bg-red-400/10 px-2 py-1 text-red-400">
      <TriangleAlert className="mt-0.5 size-3 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

const fmtFt = (v: number | null | undefined) => (v == null ? "unknown" : `${Math.round(v).toLocaleString("en-US")} ft`);
const fmtSf = (v: number | null | undefined) => (v == null ? "unknown" : `${Math.round(v).toLocaleString("en-US")} sq ft`);

/** Zoning-standards readout: only the lot and legal facts the data actually
 * provides; anything missing reads "unknown", never "fails". */
export function StandardsTable({ score }: { score: ParcelScoreView }) {
  const { data, result } = score;
  const fit = useTypologyFit(score.pin, data);
  if (!data) return null;
  const lot = fit.data?.lot;
  const zoning = fit.data?.zoning;
  const steep = data.raw.site_steep_slope_share;
  const rows: [string, string][] = [
    ["Zoning district", data.zoning || "unknown"],
    ["Lot footprint", fmtSf(lot?.areaSf)],
    ["Frontage width", fmtFt(lot?.widthFt)],
    ["Lot depth", fmtFt(lot?.depthFt)],
    ["District minimum lot size", fmtSf(zoning?.minLotSf)],
    ["Steep-slope share of lot", steep == null ? "unknown" : `${Math.round(steep * 100)}%`],
    ["Legal pathway (easiest type)", result?.legal?.label ?? "unknown"],
  ];
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-wide text-foreground uppercase">Zoning standards</span>
        <span className="text-[11px] text-faint">{data.zoning ? `${data.zoning} base standards` : "district unknown"}</span>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-background/60 px-3.5 py-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2 text-[13px]">
            <span className="text-faint">{label}</span>
            <span className={`font-semibold tnum ${value === "unknown" ? "text-faint" : "text-foreground"}`}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Indicator-level breakdown behind every pillar score (e.g. "murder rate =
 * 7.2 per 1,000"), with an anchor per pillar so a pillar card can scroll
 * straight to its section. */
export function IndicatorBreakdowns({ score }: { score: ParcelScoreView }) {
  const { data, result } = score;
  if (!data || !result) return null;
  return (
    <>
      {config.pillars.map((p) => {
        const pillarId = p.id as PillarId;
        const pillarScore = result.pillars[pillarId];
        const indicators = INDICATORS.filter((ind) => ind.pillar === pillarId);
        return (
          <section key={p.id} id={`breakdown-${p.id}`} className="scroll-mt-2 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{p.label}</span>
              <span className="tabular-nums" style={{ color: scoreColor(pillarScore.score) }}>
                {fmtScore(pillarScore.score)}
              </span>
            </div>
            {pillarScore.flags.map((f) => (
              <FlagRow key={f.text} text={f.capped ? `${f.text} (pillar capped)` : f.text} />
            ))}
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
    </>
  );
}

/** Inspector Breakdowns tab: overall score card, zoning standards, pillar
 * cards, build verdicts, pencil test and the indicator breakdowns, stacked in
 * one scroll. */
export function BreakdownsTab({ score, onSelectPillar }: { score: ParcelScoreView; onSelectPillar?: (id: PillarId) => void }) {
  const { data, status, pin } = score;
  if (!pin) return null;
  if (status === "loading") return <p className="p-4 text-muted-foreground">Loading scores…</p>;
  if (status === "missing" || !data)
    return <p className="p-4 text-muted-foreground">No pillar scores for this parcel. Scores cover City of Pittsburgh parcels only.</p>;
  return (
    <div className="flex flex-col gap-3.5 p-4">
      <OverallScoreCard score={score} />
      <StandardsTable score={score} />
      <PillarCards score={score} onSelectPillar={onSelectPillar} />
      <BuildVerdicts pin={pin} data={data} />
      <PencilSection data={data} />
      <IndicatorBreakdowns score={score} />
    </div>
  );
}
