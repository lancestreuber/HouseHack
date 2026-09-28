import { Button } from "@HouseHack/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@HouseHack/ui/components/dropdown-menu";
import { Input } from "@HouseHack/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@HouseHack/ui/components/select";
import { Skeleton } from "@HouseHack/ui/components/skeleton";
import { cn } from "@HouseHack/ui/lib/utils";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GripVertical, History, LayoutGrid, List as ListIcon, Map as MapIcon, MoreHorizontal, Plus, Search, Star } from "lucide-react";
import { type DragEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ListMenu, ListNameDialog } from "@/components/dashboard/list-menu";
import { type Outline, ParcelThumb } from "@/components/dashboard/parcel-thumb";
import { encodeWeights } from "@/components/map/pillar-weights-store";
import { OnboardingDialog, resumeStep } from "@/components/onboarding-dialog";
import { AUDIENCE_LABEL, PRESET_LABEL, presetWeights } from "@/lib/onboarding";
import { type Favorite, useFavorites, useListMutations, useLists, useMoveFavorite, useSetFavorite, useViewed } from "@/lib/user-parcels";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

type ViewMode = "grid" | "list";
type SortId = "custom" | "newest" | "oldest" | "pin" | "zoning";
const SORT_LABEL: Record<SortId, string> = { custom: "My order", newest: "Newest", oldest: "Oldest", pin: "PIN", zoning: "Zoning" };
const VIEW_KEY = "dashboard-view";
const DRAG_TYPE = "application/x-yinzone-parcel";
const ALL = "all";

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

/** A parcel card in any section. `when` is when it was added or last viewed. */
type Item = { pin: string; zoning: string | null; when: Date; position: number; views?: number };
/** Where a dragged parcel would land: a list (null = Favorites), before one card or at the end. */
type DropTarget = { listId: string | null; beforePin: string | null };

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function sortItems(items: Item[], sort: SortId) {
  const by: Record<SortId, (a: Item, b: Item) => number> = {
    custom: (a, b) => a.position - b.position,
    newest: (a, b) => b.when.getTime() - a.when.getTime(),
    oldest: (a, b) => a.when.getTime() - b.when.getTime(),
    pin: (a, b) => a.pin.localeCompare(b.pin),
    zoning: (a, b) => (a.zoning ?? "~").localeCompare(b.zoning ?? "~"),
  };
  return [...items].sort(by[sort]);
}

function ParcelCard({
  item,
  view,
  outline,
  weights,
  starred,
  listId,
  dropBefore,
  onToggleStar,
  onDragStart,
  onDragOver,
}: {
  item: Item;
  view: ViewMode;
  outline: Outline | undefined;
  weights?: string;
  starred: boolean;
  listId?: string | null;
  dropBefore: boolean;
  onToggleStar: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
}) {
  const meta = `${item.views && item.views > 1 ? `${item.views} views · ` : ""}${ago(item.when)}`;
  const link = { to: "/" as const, search: { pin: item.pin, w: weights } };
  const actions = (
    <span className="flex shrink-0 items-center">
      <button
        type="button"
        aria-pressed={starred}
        aria-label={starred ? "Remove from favorites" : "Add to favorites"}
        title={starred ? "Remove from favorites" : "Add to favorites"}
        onClick={onToggleStar}
        className={cn("rounded p-1 hover:bg-foreground/10", starred ? "text-yellow-400" : "text-muted-foreground")}
      >
        <Star className={cn("size-3.5", starred && "fill-current")} />
      </button>
      {starred && <ListMenu pin={item.pin} zoning={item.zoning} listId={listId ?? null} />}
    </span>
  );
  const handle = (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      aria-label={`Drag parcel ${item.pin} to a list`}
      title="Drag to a list"
      className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:cursor-grabbing"
    >
      <GripVertical className="size-3.5" />
    </button>
  );

  if (view === "list") {
    return (
      <li data-card onDragOver={onDragOver} className={cn("flex items-center gap-2 px-2 py-1.5", dropBefore && "shadow-[inset_0_2px_0_0_var(--brass)]")}>
        {handle}
        <Link {...link} className="shrink-0">
          <ParcelThumb outline={outline} width={96} height={60} className="w-20 rounded-sm" />
        </Link>
        <Link {...link} className="min-w-0 flex-1 hover:underline">
          <span className="tnum block truncate font-medium">Parcel {item.pin}</span>
          <span className="text-muted-foreground">Zoning {item.zoning ?? "unknown"}</span>
        </Link>
        <span className="tnum shrink-0 text-muted-foreground">{meta}</span>
        {actions}
      </li>
    );
  }
  return (
    <li
      data-card
      onDragOver={onDragOver}
      className={cn("overflow-hidden rounded-md border bg-background", dropBefore && "shadow-[inset_3px_0_0_0_var(--brass)]")}
    >
      <Link {...link} className="block">
        <ParcelThumb outline={outline} className="w-full" />
      </Link>
      <div className="flex items-start gap-1 p-1.5">
        {handle}
        <Link {...link} className="min-w-0 flex-1 hover:underline">
          <span className="tnum block truncate font-medium">Parcel {item.pin}</span>
          <span className="block truncate text-muted-foreground">
            Zoning {item.zoning ?? "unknown"} · {meta}
          </span>
        </Link>
        {actions}
      </div>
    </li>
  );
}

function Section({
  icon,
  title,
  count,
  action,
  dropActive,
  onDragOver,
  onDrop,
  onDragLeave,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  action?: ReactNode;
  dropActive?: boolean;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  children: ReactNode;
}) {
  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={cn("rounded-md border bg-card transition-shadow", dropActive && "ring-2 ring-brass")}
    >
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h2 className="flex min-w-0 items-center gap-1.5 font-medium">
          {icon}
          <span className="truncate">{title}</span>
          <span className="tnum font-normal text-muted-foreground">{count}</span>
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const profile = useQuery(orpc.me.profile.queryOptions());
  const favorites = useFavorites();
  const lists = useLists();
  const viewed = useViewed();
  const setFavorite = useSetFavorite();
  const move = useMoveFavorite();
  const listOps = useListMutations();
  const clearViewed = useMutation(
    orpc.me.clearViewed.mutationOptions({ onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.me.viewed.key() }) }),
  );

  const [editing, setEditing] = useState(false);
  // Closed this visit (skipped or dismissed), even before the profile refetch lands.
  const [dismissed, setDismissed] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [zoningFilter, setZoningFilter] = useState(ALL);
  const [sort, setSort] = useState<SortId>("custom");
  const [naming, setNaming] = useState<{ mode: "create" } | { mode: "rename"; id: string; name: string } | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  useEffect(() => setView(readView()), []);
  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Storage blocked: the choice just won't be remembered.
    }
  };

  const p = profile.data;
  const incomplete = profile.isSuccess && !p?.onboardedAt;
  const showOnboarding = editing || (incomplete && !dismissed && !p?.skippedAt);
  const weights = encodeWeights(presetWeights(p?.weightsPreset) ?? {});
  const favs: Favorite[] = favorites.data ?? [];
  const favoriteByPin = new Map(favs.map((f) => [f.pin, f]));

  const matches = (item: { pin: string; zoning: string | null }) => {
    const q = query.trim().toUpperCase();
    if (q && !item.pin.includes(q) && !(item.zoning ?? "").toUpperCase().includes(q)) return false;
    return zoningFilter === ALL || item.zoning === zoningFilter;
  };
  const favItems = (listId: string | null) =>
    sortItems(
      favs.filter((f) => f.listId === listId && matches(f)).map((f) => ({ pin: f.pin, zoning: f.zoning, when: new Date(f.createdAt), position: f.position })),
      sort,
    );
  const viewedItems = sortItems(
    (viewed.data ?? []).filter(matches).map((v) => ({ pin: v.pin, zoning: v.zoning, when: new Date(v.lastViewedAt), position: -new Date(v.lastViewedAt).getTime(), views: v.views })),
    sort === "custom" ? "newest" : sort,
  );

  const zonings = useMemo(
    () => [...new Set([...favs, ...(viewed.data ?? [])].map((x) => x.zoning).filter((z): z is string => Boolean(z)))].sort(),
    [favs, viewed.data],
  );
  const pins = useMemo(() => [...new Set([...favs.map((f) => f.pin), ...(viewed.data ?? []).map((v) => v.pin)])].sort().slice(0, 100), [favs, viewed.data]);
  const outlines = useQuery({
    ...orpc.parcels.getOutlines.queryOptions({ input: { pins } }),
    enabled: pins.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    placeholderData: keepPreviousData,
  });

  // Drag and drop: the handle carries the parcel; sections and cards are drop targets.
  const startDrag = (item: Item) => (e: DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ pin: item.pin, zoning: item.zoning }));
    e.dataTransfer.effectAllowed = "move";
    const card = (e.currentTarget as HTMLElement).closest("[data-card]");
    if (card) e.dataTransfer.setDragImage(card, 16, 16);
  };
  const overSection = (listId: string | null) => (e: DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (drop?.listId !== listId || drop.beforePin !== null) setDrop({ listId, beforePin: null });
  };
  const overCard = (listId: string | null, pin: string) => (e: DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (drop?.listId !== listId || drop.beforePin !== pin) setDrop({ listId, beforePin: pin });
  };
  const leaveSection = (e: DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) setDrop(null);
  };
  const dropInto = (listId: string | null) => (e: DragEvent) => {
    const raw = e.dataTransfer.getData(DRAG_TYPE);
    setDrop(null);
    if (!raw) return;
    e.preventDefault();
    const { pin, zoning } = JSON.parse(raw) as { pin: string; zoning: string | null };
    // Neighbours in the list's own order, without the dragged card.
    const ordered = favs.filter((f) => f.listId === listId && f.pin !== pin).sort((a, b) => a.position - b.position);
    const beforePin = sort === "custom" ? drop?.beforePin : null;
    const at = beforePin ? ordered.findIndex((f) => f.pin === beforePin) : -1;
    let position: number;
    if (at < 0) position = ordered.length ? ordered[ordered.length - 1]!.position + 1 : 0;
    else if (at === 0) position = ordered[0]!.position - 1;
    else position = (ordered[at - 1]!.position + ordered[at]!.position) / 2;
    const current = favoriteByPin.get(pin);
    if (current && current.listId === listId && current.position === position) return;
    move.mutate({ pin, zoning, listId, position });
  };

  const toggleStar = (item: Item) => setFavorite.mutate({ pin: item.pin, zoning: item.zoning, favorite: !favoriteByPin.has(item.pin) });

  const renderItems = (items: Item[], listId: string | null | undefined, empty: string) => {
    if (!favorites.data || (listId === undefined && !viewed.data)) return <Skeleton className="m-3 h-16" />;
    if (!items.length) return <p className={cn("m-2 rounded border border-dashed px-3 py-4 text-muted-foreground")}>{empty}</p>;
    return (
      <ul className={view === "grid" ? "grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-4" : "divide-y"}>
        {items.map((item) => (
          <ParcelCard
            key={item.pin}
            item={item}
            view={view}
            outline={outlines.data?.[item.pin]}
            weights={weights}
            starred={favoriteByPin.has(item.pin)}
            listId={favoriteByPin.get(item.pin)?.listId}
            dropBefore={listId !== undefined && drop?.listId === listId && drop.beforePin === item.pin}
            onToggleStar={() => toggleStar(item)}
            onDragStart={startDrag(item)}
            onDragOver={listId === undefined ? () => {} : overCard(listId, item.pin)}
          />
        ))}
      </ul>
    );
  };

  const listPins = (listId: string | null) => favs.filter((f) => f.listId === listId);
  const exportCsv = (name: string, listId: string | null) =>
    download(
      `${name.replace(/[^\w-]+/g, "-").toLowerCase()}.csv`,
      ["pin,zoning,added", ...listPins(listId).map((f) => `${f.pin},${f.zoning ?? ""},${new Date(f.createdAt).toISOString()}`)].join("\n"),
    );
  const listTools = (name: string, listId: string | null) => (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`${name} tools`} className="rounded p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
        <MoreHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => {
            void navigator.clipboard.writeText(listPins(listId).map((f) => f.pin).join("\n"));
            toast.success("PINs copied");
          }}
        >
          Copy PINs
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportCsv(name, listId)}>Download CSV</DropdownMenuItem>
        {listId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setNaming({ mode: "rename", id: listId, name })}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => listOps.remove.mutate({ id: listId })}>
              Delete list
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const favoriteSections: { id: string | null; name: string }[] = [{ id: null, name: "Favorites" }, ...(lists.data ?? [])];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6 text-xs">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{session?.user.name ? `${session.user.name}'s dashboard` : "Dashboard"}</h1>
          {p?.role ? (
            <p className="text-muted-foreground">
              {(p.audience && AUDIENCE_LABEL[p.audience]) ?? p.role.replace("_", " ")} ·{" "}
              {p.weightsPreset ? (PRESET_LABEL[p.weightsPreset] ?? p.weightsPreset) : "Default"} weights ·{" "}
              <button type="button" onClick={() => setEditing(true)} className="underline hover:text-foreground">
                Edit
              </button>
            </p>
          ) : profile.isPending ? (
            <Skeleton className="h-4 w-64" />
          ) : null}
        </div>
        <Button nativeButton={false} render={<Link to="/" search={{ w: weights }} />}>
          <MapIcon className="size-3.5" /> Open the explorer
        </Button>
      </header>

      {incomplete && !showOnboarding && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brass/40 bg-brass/10 px-3 py-2">
          <span>
            Finish setting up: step {resumeStep(p ?? null) + 1} of 3 is next. Your answers so far are saved.
          </span>
          <Button size="sm" onClick={() => setEditing(true)}>
            Resume setup
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by PIN or zoning" aria-label="Filter parcels" className="pl-7" />
        </div>
        <Select value={zoningFilter} onValueChange={(v) => setZoningFilter(String(v ?? ALL))}>
          <SelectTrigger size="sm" className="w-36" aria-label="Zoning district">
            <SelectValue>{zoningFilter === ALL ? "All zoning" : zoningFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All zoning</SelectItem>
            {zonings.map((z) => (
              <SelectItem key={z} value={z}>
                {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => v && setSort(v as SortId)}>
          <SelectTrigger size="sm" className="w-32" aria-label="Sort">
            <SelectValue>Sort: {SORT_LABEL[sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABEL) as SortId[]).map((id) => (
              <SelectItem key={id} value={id}>
                {SORT_LABEL[id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border" role="group" aria-label="Layout">
          {(
            [
              ["grid", LayoutGrid, "Grid"],
              ["list", ListIcon, "List"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              aria-label={`${label} view`}
              title={`${label} view`}
              onClick={() => changeView(id)}
              className={cn("p-1.5 text-muted-foreground hover:text-foreground", view === id && "bg-accent/60 text-foreground")}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setNaming({ mode: "create" })}>
          <Plus className="size-3.5" /> New list
        </Button>
      </div>
      {sort !== "custom" && <p className="text-muted-foreground">Sorted by {SORT_LABEL[sort].toLowerCase()}: dropped parcels go to the end of a list. Pick "My order" to arrange them.</p>}

      {favoriteSections.map((list) => {
        const items = favItems(list.id);
        return (
          <Section
            key={list.id ?? "favorites"}
            icon={<Star className="size-3.5" />}
            title={list.name}
            count={items.length}
            action={listTools(list.name, list.id)}
            dropActive={drop?.listId === list.id}
            onDragOver={overSection(list.id)}
            onDrop={dropInto(list.id)}
            onDragLeave={leaveSection}
          >
            {renderItems(items, list.id, list.id ? "Drag parcels here by their handles, or use the caret beside a star." : "Star a parcel in the explorer to keep it here.")}
          </Section>
        );
      })}

      <Section
        icon={<History className="size-3.5" />}
        title="Recently viewed"
        count={viewedItems.length}
        action={
          viewed.data?.length ? (
            <button type="button" onClick={() => clearViewed.mutate({})} className="text-muted-foreground hover:text-foreground">
              Clear
            </button>
          ) : undefined
        }
      >
        {renderItems(viewedItems, undefined, "Parcels you open in the explorer show up here.")}
      </Section>

      {pins.length > 0 && <p className="text-right text-[10px] text-muted-foreground">Map tiles © OpenStreetMap contributors</p>}

      <ListNameDialog
        open={naming != null}
        onOpenChange={(open) => !open && setNaming(null)}
        title={naming?.mode === "rename" ? "Rename list" : "New list"}
        initial={naming?.mode === "rename" ? naming.name : ""}
        submitLabel={naming?.mode === "rename" ? "Rename" : "Create"}
        onSubmit={(name) =>
          naming?.mode === "rename"
            ? listOps.rename.mutate({ id: naming.id, name })
            : listOps.create.mutate({ name }, { onError: (error) => toast.error(error.message) })
        }
      />
      {profile.isSuccess && (
        <OnboardingDialog
          open={showOnboarding}
          onClose={() => {
            setEditing(false);
            setDismissed(true);
          }}
          profile={p ?? null}
          name={session?.user.name}
        />
      )}
    </div>
  );
}
