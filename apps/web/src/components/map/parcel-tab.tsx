import { Star } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@HouseHack/ui/lib/utils";

function starKey(pin: string) {
  return `parcel-star:${pin}`;
}

/** Slim bar above the map: shows the currently selected parcel (falling back
 * to its PIN -- the underlying parcel data has no street address field) and
 * a star to bookmark it. Starred state is local-only (no backend for it yet). */
export function ParcelTab({ pin }: { pin: string | null }) {
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

  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-background px-3 py-1.5 text-xs">
      <span className="font-medium">{pin ? `Parcel ${pin}` : "Select a parcel"}</span>
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
    </div>
  );
}
