import type { ChatFact } from "@HouseHack/api/chat/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@HouseHack/ui/components/tooltip";

const KIND_LABEL: Record<ChatFact["kind"], string> = {
  evidence: "Evidence",
  observed: "Observed",
  assumption: "Assumption",
  policy: "Policy",
  value: "Value judgment",
  definition: "Definition",
};

/** Short chip label: the fact's own name ("Transit", "Duplex") when it has one. */
function chipLabel(fact: ChatFact): string {
  if (fact.kind === "definition") return "Definition";
  const head = fact.text.split(":")[0]?.trim() ?? "";
  return head && head.length <= 24 ? head : fact.source;
}

export function FactChip({ fact }: { fact: ChatFact }) {
  const external = /^https?:\/\//.test(fact.source_url);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={fact.source_url}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="inline-flex h-6 max-w-[14rem] items-center gap-1 truncate rounded-full border border-glass-border bg-glass-card px-2.5 align-middle text-[12px] leading-none text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        }
      >
        {chipLabel(fact)}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-[13px] leading-5">
        <p>{fact.text}</p>
        <p className="mt-1.5 text-[12px] opacity-70">
          {KIND_LABEL[fact.kind]} · {fact.source}
          {fact.as_of ? ` · as of ${fact.as_of}` : ""}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
