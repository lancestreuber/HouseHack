import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@HouseHack/ui/lib/utils";

import { PaneCollapseButton } from "./pane-collapse-button";
import { useParcelData } from "./pillars-panel";

function starKey(pin: string) {
  return `parcel-star:${pin}`;
}

/** Slim bar above the map: shows the currently selected parcel (falling back
 * to its PIN -- the underlying parcel data has no street address field), a
 * star to bookmark it, and a cancel button to deselect it (every sidebar
 * goes back to its empty "select a parcel" state). Starred state is
 * local-only (no backend for it yet). */
export function ParcelTab({
  pin,
  collapsed,
  onToggleCollapse,
  onClear,
}: {
  pin: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClear: () => void;
}) {
  const [starred, setStarred] = useState(false);
  const { data } = useParcelData(pin);

  useEffect(() => {
    setStarred(pin ? localStorage.getItem(starKey(pin)) === "1" : false);
  }, [pin]);

  const toggleStar = () => {
    if (!pin) return;
    const next = !starred;
    setStarred(next);
    localStorage.setItem(starKey(pin), next ? "1" : "0");
  };

  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-background px-3 py-1.5 text-xs">
      <span className="flex items-baseline gap-2">
        <span className="font-medium">{pin ? `Parcel ${pin}` : "Select a parcel"}</span>
        {pin && data && <span className="text-muted-foreground">Zoning {data.zoning || "unknown"}</span>}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleStar}
          disabled={!pin}
          aria-pressed={starred}
          aria-label="Star this parcel"
          className={cn(
            "rounded p-1 hover:bg-foreground/10 disabled:opacity-30",
            starred ? "text-yellow-400" : "text-muted-foreground",
          )}
        >
          <Star className={cn("size-3.5", starred && "fill-current")} />
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!pin}
          aria-label="Deselect this parcel"
          title="Deselect this parcel"
          className="rounded p-1 text-muted-foreground hover:bg-foreground/10 disabled:opacity-30"
        >
          <X className="size-3.5" />
        </button>
        <PaneCollapseButton collapsed={collapsed} onClick={onToggleCollapse} label="the map" />
      </div>
    </div>
  );
}
