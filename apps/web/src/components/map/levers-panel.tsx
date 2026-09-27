import { CircleCheck, CircleHelp, CircleMinus, TriangleAlert } from "lucide-react";

import { TONE_DOT } from "./area-report-card";
import type { LeverLine, LeverSection, LeverStatus } from "./levers";
import { useParcelData } from "./pillars-panel";
import { useLevers } from "./use-levers";

const STATUS_ICON: Record<LeverStatus, { Icon: typeof CircleCheck; className: string; label: string }> = {
  yes: { Icon: CircleCheck, className: "text-emerald-500", label: "Applies" },
  no: { Icon: CircleMinus, className: "text-muted-foreground", label: "Doesn't apply" },
  flag: { Icon: TriangleAlert, className: "text-amber-500", label: "Applies with conditions" },
  unknown: { Icon: CircleHelp, className: "text-sky-500", label: "Unknown: not in our data" },
};

const SECTIONS = ["zoning", "incentives", "land"] as const;

function Item({ line }: { line: LeverLine }) {
  const { Icon, className, label } = STATUS_ICON[line.status];
  return (
    <li className="flex gap-1.5">
      <Icon className={`mt-0.5 size-3 shrink-0 ${className}`} aria-label={label} />
      <span>
        {line.sourceUrl ? (
          <a href={line.sourceUrl} target="_blank" rel="noreferrer" title={`Source: ${line.source}`} className="underline decoration-dotted underline-offset-2">
            {line.text}
          </a>
        ) : (
          line.text
        )}
        {line.detail && <span className="block text-muted-foreground">{line.detail}</span>}
      </span>
    </li>
  );
}

/** One lever, same shape as an area report section: dot + answer, then the details. */
function Section({ section }: { section: LeverSection }) {
  return (
    <details open={section.tone === "go"}>
      <summary className="cursor-pointer text-foreground" title={section.question}>
        <span className={`mr-1.5 inline-block size-2 rounded-full ${TONE_DOT[section.tone]}`} />
        {section.lever}: <span className="text-muted-foreground">{section.answer}</span>
      </summary>
      <div className="mt-1 space-y-1 pl-3.5">
        <p>{section.explain}</p>
        {section.paths.map((path) => (
          <div key={path.title}>
            <p className="text-foreground">{path.title}</p>
            {path.steps.map((step) => (
              <p key={step.label}>
                {step.label}: {step.value}
              </p>
            ))}
            {path.sourceUrl && (
              <a href={path.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted">
                Source: {path.source}
              </a>
            )}
          </div>
        ))}
        {section.items.length > 0 && (
          <ul className="space-y-1">
            {section.items.map((line) => (
              <Item key={line.id} line={line} />
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

/** What the City could do on the selected parcel for one housing type: zoning, incentives, public land. */
export function LeversPanel({ pin, typology }: { pin: string; typology: string }) {
  const { data, status } = useParcelData(pin);
  const { levers, isError } = useLevers(pin, status === "ready" && data ? data.zoning : null, typology);

  if (status === "missing") return <p>No zoning data for this parcel (City parcels only).</p>;
  if (isError) return <p>Couldn't load the lever data.</p>;
  if (!levers) return <p>Loading…</p>;
  return (
    <>
      {SECTIONS.map((key) => (
        <Section key={key} section={levers[key]} />
      ))}
      <p>Policy facts, not a score, and not legal advice. "Unknown" means not in our data, not that it's absent.</p>
    </>
  );
}
