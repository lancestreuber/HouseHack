import { useNavigate } from "@tanstack/react-router";
import { Star, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@HouseHack/ui/lib/utils";

import { useFavorites, useRecordView, useSetFavorite, useSignedIn } from "@/lib/user-parcels";

import { ListMenu } from "../dashboard/list-menu";
import { PaneCollapseButton } from "./pane-collapse-button";
import { useParcelData } from "./pillars-panel";

/** Slim bar above the map: shows the currently selected parcel (falling back
 * to its PIN -- the underlying parcel data has no street address field), a
 * star to bookmark it, and a cancel button to deselect it (every sidebar
 * goes back to its empty "select a parcel" state). Stars and views are saved
 * to the signed-in user's dashboard. */
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
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const { pin: loadedPin, data, status } = useParcelData(pin);
  const current = loadedPin === pin;
  // undefined while loading; null once we know there's no zoning for this parcel.
  const zoning = !current ? undefined : status === "ready" ? (data?.zoning ?? null) : status === "missing" || status === "outside" ? null : undefined;
  useRecordView(pin, zoning);

  const favorites = useFavorites();
  const setFavorite = useSetFavorite();
  const pending = setFavorite.isPending ? setFavorite.variables : undefined;
  const favorite = pin ? favorites.data?.find((f) => f.pin === pin) : undefined;
  const starred = pin != null && (pending?.pin === pin ? pending.favorite : favorite != null);

  const toggleStar = () => {
    if (!pin) return;
    if (!signedIn) {
      toast("Sign in to save favorite parcels", { action: { label: "Sign in", onClick: () => navigate({ to: "/login" }) } });
      return;
    }
    setFavorite.mutate({ pin, zoning: zoning ?? null, favorite: !starred });
  };

  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-background px-3 py-1.5 text-xs">
      <span className="flex items-baseline gap-2">
        <span className="font-medium">{pin ? (favorite?.nickname ?? `Parcel ${pin}`) : "Select a parcel"}</span>
        {pin && favorite?.nickname && <span className="tnum text-muted-foreground">{pin}</span>}
        {pin && current && data && <span className="text-muted-foreground">Zoning {data.zoning || "unknown"}</span>}
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
        {pin && starred && favorite && <ListMenu pin={pin} zoning={favorite.zoning} listId={favorite.listId} nickname={favorite.nickname} />}
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
