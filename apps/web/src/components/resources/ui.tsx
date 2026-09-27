import type { ReactNode } from "react";

// Building blocks for the /resources page: dense, hairline-bordered panels,
// monospace ids and small uppercase labels, so the page reads like the app's
// panes rather than a marketing site.

export const EVIDENCE_STYLE: Record<string, string> = {
  observed: "border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-500/10",
  modeled: "border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-500/10",
  assumption: "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  policy: "border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10",
  value: "border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10",
  code: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  model: "border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-500/10",
  llm: "border-fuchsia-500/40 text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/10",
};

export function Tag({ kind, children }: { kind: string; children?: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border px-1 font-mono text-[10px] uppercase leading-4 tracking-wide ${EVIDENCE_STYLE[kind] ?? "border-border text-muted-foreground"}`}
    >
      {children ?? kind}
    </span>
  );
}

export function Section({ id, code, title, lede, children }: { id: string; code: string; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 border-b border-border py-8 first:pt-4">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        §{code} · {id.replace(/-/g, " ")}
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {lede ? <div className="mt-1 max-w-3xl text-sm text-muted-foreground">{lede}</div> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function SubHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/80">{children}</h3>
      {right ? <div className="font-mono text-[10px] text-muted-foreground">{right}</div> : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-sm border border-border bg-foreground/[0.02] ${className}`}>{children}</div>;
}

// A formula with its variables explained underneath.
export function Equation({ label, lines, where, note }: { label: string; lines: string[]; where?: [string, ReactNode][]; note?: ReactNode }) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>
      <pre className="overflow-x-auto px-3 py-2 font-mono text-[12.5px] leading-6 text-foreground">{lines.join("\n")}</pre>
      {where?.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-border/60 px-3 py-2 text-xs">
          {where.map(([term, desc]) => (
            <div key={term} className="contents">
              <dt className="font-mono text-foreground/90">{term}</dt>
              <dd className="text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note ? <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">{note}</div> : null}
    </Panel>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="border-r border-border px-3 py-2 last:border-r-0">
      <div className="font-mono text-lg tabular-nums leading-6">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

// A compact table with a sticky header. Cells are nodes so callers control formatting.
export function DataTable({ head, rows, maxHeight, empty = "No rows match." }: { head: ReactNode[]; rows: ReactNode[][]; maxHeight?: string; empty?: string }) {
  return (
    <div className="overflow-auto rounded-sm border border-border" style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-background">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap border-b border-border px-2 py-1.5 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-2 py-3 text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="align-top odd:bg-foreground/[0.015] hover:bg-foreground/[0.04]">
                {row.map((cell, j) => (
                  <td key={j} className="border-b border-border/50 px-2 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Mono({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <span className={`font-mono text-[11px] ${dim ? "text-muted-foreground" : "text-foreground/90"}`}>{children}</span>;
}

export function ExtLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="break-words text-sky-700 underline decoration-sky-500/30 underline-offset-2 hover:decoration-sky-500 dark:text-sky-400">
      {children ?? href}
    </a>
  );
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// Renders the small subset of markdown used in the citation manifest:
// `code`, **bold**, [text](url) and bare URLs.
const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s)<>,;]+[^\s)<>,;.])/g;

export function Md({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [tok] = m;
    if (m[1]) out.push(<code key={at} className="rounded-sm bg-foreground/10 px-1 font-mono text-[11px]">{tok.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={at} className="font-semibold text-foreground">{tok.slice(2, -2)}</strong>);
    else if (m[3]) {
      const [, label, href] = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/) ?? [];
      out.push(<ExtLink key={at} href={href}>{label}</ExtLink>);
    } else out.push(<ExtLink key={at} href={tok}>{hostOf(tok)}</ExtLink>);
    last = at + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function FilterInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-7 w-full max-w-xs rounded-sm border border-border bg-background px-2 font-mono text-xs outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40"
    />
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${active ? "border-foreground/50 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
