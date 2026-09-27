import { ArrowLeft, MessageSquare } from "lucide-react";

import type { AreaReport, Tone } from "@/lib/typology-map/area-report";

import { askChat } from "../chat/chat-context-store";

/** Status dot per tone; shared with the levers list. */
export const TONE_DOT: Record<Tone, string> = {
  go: "bg-green-500",
  maybe: "bg-yellow-500",
  stop: "bg-red-500",
  unknown: "bg-neutral-400",
  warn: "bg-orange-500",
};

/** One rezoning area's report: homes, then the three public levers, then the equity guardrail. */
export function AreaReportCard({ report, onBack }: { report: AreaReport; onBack: () => void }) {
  return (
    <div id="heat-area-report" className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All areas
        </button>
        <button type="button" onClick={() => askChat("Which public levers line up in this rezoning area, and what would it take?")} className="flex items-center gap-1 hover:text-foreground">
          <MessageSquare className="size-3.5" /> Ask the chat
        </button>
      </div>
      <p>
        <span className="text-sm font-medium text-foreground">{report.title}</span> {report.subtitle}
      </p>
      {report.sections.map((s) => (
        <details key={s.key} open={s.key === "homes" || s.tone === "warn"}>
          <summary className="cursor-pointer text-foreground">
            <span className={`mr-1.5 inline-block size-2 rounded-full ${TONE_DOT[s.tone]}`} />
            {s.title}: <span className="text-muted-foreground">{s.answer}</span>
          </summary>
          <dl className="mt-1 space-y-1 pl-3.5">
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
