import { AlertTriangle, ArrowLeft, MessageSquare } from "lucide-react";

import type { AreaReport, Tone } from "@/lib/typology-map/area-report";

import { askChat } from "../chat/chat-context-store";

const TONE_CLASS: Record<Tone, string> = {
  go: "bg-green-500",
  maybe: "bg-yellow-500",
  stop: "bg-red-500",
  unknown: "bg-neutral-400",
  warn: "bg-orange-500",
};

/** One rezoning area's report: homes, then the three public levers, then the equity guardrail. */
export function AreaReportCard({ report, onBack }: { report: AreaReport; onBack: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All areas
        </button>
        <button type="button" onClick={() => askChat("Which public levers line up in this rezoning area, and what would it take?")} className="flex items-center gap-1 hover:text-foreground">
          <MessageSquare className="size-3.5" /> Ask the chat
        </button>
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{report.title}</div>
        <div>{report.subtitle}</div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {report.sections
          .filter((s) => s.key !== "homes")
          .map((s) => (
            <div key={s.key} className="rounded border px-1.5 py-1">
              <div className="flex items-center gap-1">
                <span className={`size-2 shrink-0 rounded-full ${TONE_CLASS[s.tone]}`} />
                <span className="text-foreground">{s.title.split(":")[0]}</span>
              </div>
              <div className="leading-tight">{s.answer}</div>
            </div>
          ))}
      </div>
      {report.sections.map((s) => (
        <details key={s.key} open={s.key === "homes" || s.tone === "warn"} className="rounded border px-2 py-1">
          <summary className="cursor-pointer text-foreground">
            {s.tone === "warn" && <AlertTriangle className="mr-1 inline size-3.5 text-orange-500" />}
            {s.title}: <span className="text-muted-foreground">{s.answer}</span>
          </summary>
          <dl className="mt-1 space-y-1">
            {s.lines.map((l) => (
              <div key={l.id}>
                <dt className="text-foreground">{l.label}</dt>
                <dd title={l.source}>{l.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}
