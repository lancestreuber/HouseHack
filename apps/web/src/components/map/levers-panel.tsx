import { CircleCheck, CircleHelp, CircleMinus, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@HouseHack/ui/components/select";

import { EASIEST, useLegalFor } from "./legal-for-store";
import type { LeverLine, LeverSection, LeverStatus, Levers, Tone } from "./levers";
import { TYPOLOGIES } from "./overlays/legal-feasibility";
import { PaneCollapseButton } from "./pane-collapse-button";
import { useParcelData } from "./pillars-panel";
import { SHORT_LABEL } from "./typology-meta";
import { useLevers } from "./use-levers";

const TONE: Record<Tone, { color: string; bg: string }> = {
  go: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  maybe: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  stop: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  unknown: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

const STATUS_ICON: Record<LeverStatus, { Icon: typeof CircleCheck; className: string; label: string }> = {
  yes: { Icon: CircleCheck, className: "text-emerald-400", label: "Applies" },
  no: { Icon: CircleMinus, className: "text-muted-foreground", label: "Doesn't apply" },
  flag: { Icon: TriangleAlert, className: "text-amber-400", label: "Applies with conditions" },
  unknown: { Icon: CircleHelp, className: "text-sky-400", label: "Unknown: not in our data" },
};

const SECTIONS = ["zoning", "incentives", "land"] as const;

function Item({ line }: { line: LeverLine }) {
  const { Icon, className, label } = STATUS_ICON[line.status];
  return (
    <li className="flex gap-1.5">
      <Icon className={`mt-0.5 size-3 shrink-0 ${className}`} aria-label={label} />
      <div className="min-w-0">
        <p>
          {line.sourceUrl ? (
            <a href={line.sourceUrl} target="_blank" rel="noreferrer" title={`Source: ${line.source}`} className="underline decoration-dotted underline-offset-2">
              {line.text}
            </a>
          ) : (
            line.text
          )}
        </p>
        {line.detail && <p className="text-muted-foreground">{line.detail}</p>}
      </div>
    </li>
  );
}

function Section({ section }: { section: LeverSection }) {
  const tone = TONE[section.tone];
  return (
    <section id={`lever-${section.key}`} className="rounded border p-2" style={{ borderColor: `${tone.color}55` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{section.lever}</p>
      <p className="font-medium">{section.question}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold" style={{ color: tone.color }}>
        <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: tone.color }} />
        {section.answer}
      </p>
      <p className="mt-0.5 text-muted-foreground">{section.explain}</p>
      {section.paths.map((path, i) => (
        <div key={path.title} className="mt-2 rounded p-2" style={{ background: tone.bg }}>
          <p className="font-medium">
            {section.paths.length > 1 && <span className="text-muted-foreground">Option {i + 1} · </span>}
            {path.title}
          </p>
          <dl className="mt-1 grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-0.5">
            {path.steps.map((step) => (
              <div key={step.label} className="contents">
                <dt className="text-muted-foreground">{step.label}</dt>
                <dd>{step.value}</dd>
              </div>
            ))}
          </dl>
          {path.sourceUrl && (
            <a href={path.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-[10px] text-muted-foreground underline decoration-dotted">
              Source: {path.source}
            </a>
          )}
        </div>
      ))}
      {section.items.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border/40 pt-1.5">
          {section.items.map((line) => (
            <Item key={line.id} line={line} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Summary({ levers }: { levers: Levers }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {SECTIONS.map((key) => {
        const s = levers[key];
        const tone = TONE[s.tone];
        return (
          <button
            key={key}
            type="button"
            onClick={() => document.getElementById(`lever-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded p-1.5 text-left hover:brightness-125"
            style={{ background: tone.bg, borderLeft: `3px solid ${tone.color}` }}
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.lever}</p>
            <p className="font-medium leading-tight" style={{ color: tone.color }}>
              {s.answer}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function LeversPanel({
  pin,
  collapsed,
  onToggleCollapse,
  typology,
  embedded,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Follow this housing type (e.g. the heatmap's) instead of offering a picker. */
  typology?: string;
  /** Inside another panel: no own frame or header. */
  embedded?: boolean;
}) {
  const legalFor = useLegalFor();
  const [picked, setPicked] = useState<string | null>(null);
  const typologyId = typology ?? picked ?? (legalFor !== EASIEST ? legalFor : "multi_unit");
  const { data, status } = useParcelData(pin);
  const { levers, isError } = useLevers(pin, status === "ready" && data ? data.zoning : null, typologyId);

  let body;
  if (!pin) body = <p className="text-muted-foreground">Select a parcel to see what the City could do there.</p>;
  else if (status === "missing") body = <p className="text-muted-foreground">No zoning data for this parcel (City parcels only).</p>;
  else if (isError) body = <p className="text-muted-foreground">Couldn't load the lever data.</p>;
  else if (!levers) body = <p className="text-muted-foreground">Loading…</p>;
  else
    body = (
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Government doesn't build housing; it steers where it gets built with three tools. For{" "}
          <span className="text-foreground">{levers.typology.toLowerCase()}</span> on this lot:
        </p>
        <Summary levers={levers} />
        {SECTIONS.map((key) => (
          <Section key={key} section={levers[key]} />
        ))}
        <p className="text-[10px] text-muted-foreground">
          Policy facts, not a score, and not legal advice. "Unknown" means not in our data, not that it's absent.
        </p>
      </div>
    );

  if (embedded) return body;

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden border-t p-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium" title="Zoning, incentives and public land: the tools government uses to steer where housing gets built.">
          What could the City do here?
        </span>
        <div className="flex items-center gap-1">
          <Select value={typologyId} onValueChange={(value) => value && setPicked(value)}>
            <SelectTrigger size="sm" className="h-6 max-w-[9rem] text-xs" aria-label="Housing type">
              <SelectValue>{SHORT_LABEL[typologyId] ?? typologyId}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TYPOLOGIES.map(([id, label]) => (
                <SelectItem key={id} value={id} title={label}>
                  {SHORT_LABEL[id] ?? label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="public levers" />}
        </div>
      </div>
      {!collapsed && <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>}
    </div>
  );
}
