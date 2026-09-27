import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@HouseHack/ui/components/dropdown-menu";
import { Copy, MoreVertical, Star } from "lucide-react";
import { useEffect, useState } from "react";

import type { ChatContext } from "@HouseHack/api/chat/types";
import type { PillarId } from "@/lib/pillars/score";

import { ChatPane } from "../chat/chat-pane";
import { useParcelChatContext } from "../chat/parcel-context";
import { Disclaimer } from "../disclaimer";
import { AlertsTab } from "../map/alerts-panel";
import { BreakdownsTab } from "../map/breakdown-panel";
import { fmtScore, scoreColor, useParcelScore } from "../map/pillars-panel";
import { TypologyCards } from "../map/typology-panel";
import { toggleInspector } from "../shell/shell-store";

export type InspectorTab = "alerts" | "breakdowns" | "typology" | "chat";

function starKey(pin: string) {
  return `parcel-star:${pin}`;
}

const TABS: { id: InspectorTab; label: string }[] = [
  { id: "alerts", label: "Alerts" },
  { id: "breakdowns", label: "Breakdowns" },
  { id: "typology", label: "Typology" },
  { id: "chat", label: "Chat" },
];

/** Docked right inspector: parcel identity, overall viability headline and
 * the four analysis tabs. Collapsing hides the panel; the nav rail restores
 * it. */
export function Inspector({
  pin,
  weights,
  tab,
  onTab,
  onSelectPillar,
  onSelectTypology,
}: {
  pin: string | null;
  weights: Partial<Record<PillarId, number>>;
  tab: InspectorTab;
  onTab: (tab: InspectorTab) => void;
  onSelectPillar: (id: PillarId) => void;
  onSelectTypology: (siteFitId: string) => void;
}) {
  const score = useParcelScore(pin, weights);
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    setStarred(pin ? localStorage.getItem(starKey(pin)) === "1" : false);
  }, [pin]);

  const toggleStar = () => {
    if (!pin) return;
    const next = !starred;
    setStarred(next);
    localStorage.setItem(starKey(pin), next ? "1" : "0");
  };

  const chatContext: ChatContext | undefined = useParcelChatContext(pin) ?? undefined;

  return (
    <aside className="flex w-[390px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13px] uppercase tracking-wider text-muted-foreground tnum">
              {pin ?? "No parcel selected"}
            </span>
            {score.data && (
              <>
                <span className="text-[13px] text-faint">•</span>
                <span className="truncate text-[13px] text-faint">{score.data.zoning || "unknown"} Pittsburgh</span>
              </>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Inspector options"
                  title="Inspector options"
                  className="flex size-6 items-center justify-center rounded text-faint transition-colors hover:bg-popover hover:text-foreground"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover">
              <DropdownMenuItem onClick={toggleStar} disabled={!pin}>
                <Star className={`size-4 ${starred ? "fill-brass text-brass" : ""}`} />
                {starred ? "Unstar parcel" : "Star parcel"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!pin}
                onClick={() => pin && void navigator.clipboard.writeText(pin)}
              >
                <Copy className="size-4" />
                Copy PIN
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleInspector}>
                Collapse inspector
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-baseline justify-between pt-0.5">
          <span className="text-[13px] text-muted-foreground">Overall Viability Score</span>
          <span className="flex items-baseline gap-1">
            <span className="text-[36px] leading-none font-semibold text-foreground tnum" style={{ color: scoreColor(score.result?.overall ?? null) }}>
              {fmtScore(score.result?.overall ?? null)}
            </span>
            <span className="text-[13px] text-faint tnum">/100</span>
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-popover">
          <div
            className="h-full rounded-full bg-brass"
            style={{ width: `${score.result?.overall ?? 0}%` }}
          />
        </div>
      </div>

      <div className="shrink-0 border-b border-border bg-background/40 px-3 py-2">
        <div className="grid grid-cols-4 gap-0.5 rounded border border-border/70 bg-accent/50 p-0.5" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => onTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded px-1 py-1.5 text-[13px] transition-all ${
                tab === id ? "bg-[#222228] font-semibold text-foreground shadow-sm" : "font-normal text-faint hover:text-muted-foreground"
              }`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`min-h-0 flex-1 ${tab === "chat" ? "flex flex-col overflow-hidden" : "overflow-y-auto"}`}>
        {!pin && tab !== "chat" && (
          <p className="p-4 text-xs text-muted-foreground">Click a parcel on the map to see its scores &amp; considerations.</p>
        )}
        {pin && tab === "alerts" && score.data && <AlertsTab pin={pin} data={score.data} score={score} />}
        {pin && tab === "alerts" && !score.data && score.status === "loading" && (
          <p className="p-4 text-muted-foreground">Loading…</p>
        )}
        {pin && tab === "breakdowns" && <BreakdownsTab score={score} onSelectPillar={onSelectPillar} />}
        {pin && tab === "typology" && <TypologyCards pin={pin} onSelectTypology={onSelectTypology} />}
        {tab === "chat" && <ChatPane context={chatContext} />}
      </div>

      <div className="shrink-0 border-t border-border px-4 py-2.5">
        <Disclaimer />
      </div>
    </aside>
  );
}
