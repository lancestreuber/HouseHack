import { Button } from "@HouseHack/ui/components/button";
import { Skeleton } from "@HouseHack/ui/components/skeleton";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { History, Map as MapIcon, Star } from "lucide-react";
import type { ReactNode } from "react";

import { TYPOLOGIES } from "@/components/map/overlays/legal-feasibility";
import { encodeWeights } from "@/components/map/pillar-weights-store";
import { PRESET_LABEL, presetWeights, ROLE_LABEL } from "@/lib/onboarding";
import { useFavorites, useSetFavorite, useViewed } from "@/lib/user-parcels";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

const TYPOLOGY_LABEL = Object.fromEntries(TYPOLOGIES);
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function ago(date: Date | string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return "just now";
}

type ParcelRow = { pin: string; zoning: string | null; when: Date | string; extra?: string };

function Section({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md border bg-card">
      <header className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="flex items-center gap-1.5 font-medium">
          {icon}
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function ParcelList({ rows, empty, weights, favorites }: { rows: ParcelRow[] | undefined; empty: string; weights?: string; favorites: Set<string> }) {
  const setFavorite = useSetFavorite();
  if (!rows) return <Skeleton className="m-3 h-16" />;
  if (!rows.length) return <p className="px-3 py-4 text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {rows.map((row) => {
        const starred = favorites.has(row.pin);
        return (
          <li key={row.pin} className="flex items-center gap-2 px-3 py-1.5">
            <Link to="/" search={{ pin: row.pin, w: weights }} className="min-w-0 flex-1 hover:underline">
              <span className="tnum font-medium">Parcel {row.pin}</span>
              <span className="ml-2 text-muted-foreground">Zoning {row.zoning ?? "unknown"}</span>
            </Link>
            <span className="tnum shrink-0 text-muted-foreground">
              {row.extra ? `${row.extra} · ` : ""}
              {ago(row.when)}
            </span>
            <button
              type="button"
              aria-pressed={starred}
              aria-label={starred ? "Remove from favorites" : "Add to favorites"}
              title={starred ? "Remove from favorites" : "Add to favorites"}
              onClick={() => setFavorite.mutate({ pin: row.pin, zoning: row.zoning, favorite: !starred })}
              className={cn("rounded p-1 hover:bg-foreground/10", starred ? "text-yellow-400" : "text-muted-foreground")}
            >
              <Star className={cn("size-3.5", starred && "fill-current")} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const profile = useQuery(orpc.me.profile.queryOptions());
  const favorites = useFavorites();
  const viewed = useViewed();
  const clearViewed = useMutation(
    orpc.me.clearViewed.mutationOptions({ onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.me.viewed.key() }) }),
  );

  if (profile.isSuccess && profile.data === null) return <Navigate to="/onboarding" />;

  const p = profile.data;
  const weights = encodeWeights(presetWeights(p?.weightsPreset) ?? {});
  const favoritePins = new Set(favorites.data?.map((f) => f.pin));

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6 text-xs">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{session?.user.name ? `${session.user.name}'s dashboard` : "Dashboard"}</h1>
          {p ? (
            <p className="text-muted-foreground">
              {ROLE_LABEL[p.role] ?? p.role} · {p.typology ? (TYPOLOGY_LABEL[p.typology] ?? p.typology) : "Any housing type"} ·{" "}
              {p.weightsPreset ? (PRESET_LABEL[p.weightsPreset] ?? p.weightsPreset) : "Default"} weights ·{" "}
              <Link to="/onboarding" className="underline hover:text-foreground">
                Edit
              </Link>
            </p>
          ) : (
            <Skeleton className="h-4 w-64" />
          )}
        </div>
        <Button render={<Link to="/" search={{ w: weights }} />}>
          <MapIcon className="size-3.5" /> Open the explorer
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={<Star className="size-3.5" />} title="Favorite parcels">
          <ParcelList
            rows={favorites.data?.map((f) => ({ pin: f.pin, zoning: f.zoning, when: f.createdAt }))}
            empty="Star a parcel in the explorer to keep it here."
            weights={weights}
            favorites={favoritePins}
          />
        </Section>
        <Section
          icon={<History className="size-3.5" />}
          title="Recently viewed"
          action={
            viewed.data?.length ? (
              <button type="button" onClick={() => clearViewed.mutate({})} className="text-muted-foreground hover:text-foreground">
                Clear
              </button>
            ) : undefined
          }
        >
          <ParcelList
            rows={viewed.data?.map((v) => ({ pin: v.pin, zoning: v.zoning, when: v.lastViewedAt, extra: v.views > 1 ? `${v.views} views` : undefined }))}
            empty="Parcels you open in the explorer show up here."
            weights={weights}
            favorites={favoritePins}
          />
        </Section>
      </div>
      <p className="text-muted-foreground">Decision support only; nothing here is legal, financial or zoning advice.</p>
    </div>
  );
}
