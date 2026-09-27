import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@HouseHack/ui/components/select";

import { PATHWAY_META, TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS, ZBA_OUTCOMES } from "./overlays/legal-matrix.generated";
import { PaneCollapseButton } from "./pane-collapse-button";
import { useParcelData } from "./pillars-panel";

// Legal pathway -> rough feasibility score, so four typologies can be
// compared at a glance without reading the pathway label on every tile.
// Higher = fewer approvals/hearings required to build that housing type here.
// "not_permitted" isn't a fixed number here -- see notPermittedScore below,
// it's the one pathway that isn't a single fact about *this* district.
export const PATHWAY_SCORE: Record<string, number | null> = {
  by_right: 100,
  za: 85,
  zbe_special_exception: 60,
  conditional_use: 40,
  per_plan: null,
  not_city_jurisdiction: null,
};

// Density-ordered residential bases (same ordering used in the site-fit use
// table): only used to judge how big a stretch a rezoning would be, never
// to decide permission itself -- that's DISTRICT_PATHWAYS' job.
const BASE_ORDER = ["R1D", "R1A", "R2", "R3", "RM"];
const baseOf = (zone: string) => zone.split("-")[0] ?? zone;
const PERMITTING_PATHWAYS = new Set(["by_right", "za", "conditional_use", "zbe_special_exception"]);

/** 1 = another district in the same zoning family (e.g. just a density-suffix
 * change) permits this typology; 0.5 = a one-step-away district on the
 * density ladder does; 0.2 = only a distant/unrelated district does;
 * 0 = no district anywhere permits it (not a realistic rezoning ask). */
function rezoningCloseness(zone: string, typologyId: string): number {
  const currentBase = baseOf(zone);
  const currentRank = BASE_ORDER.indexOf(currentBase);
  let best = 0;
  for (const [otherZone, pathways] of Object.entries(DISTRICT_PATHWAYS)) {
    if (!PERMITTING_PATHWAYS.has(pathways[typologyId] ?? "")) continue;
    const otherBase = baseOf(otherZone);
    if (otherBase === currentBase) return 1;
    const otherRank = BASE_ORDER.indexOf(otherBase);
    const closeness = currentRank === -1 || otherRank === -1 ? 0.2 : Math.abs(otherRank - currentRank) === 1 ? 0.5 : 0.2;
    best = Math.max(best, closeness);
  }
  return best;
}

/** Approval rate for Zoning Board relief (any type) in this district,
 * 2023-26 -- an approximation of "how this district treats requests to build
 * something the code doesn't otherwise allow here", not the exact rezoning
 * (map-amendment) approval rate specifically. Falls back to a neutral
 * estimate where there's no local ZBA data at all. */
function rezoningLikelihood(zone: string): number {
  const outcomes = ZBA_OUTCOMES[baseOf(zone)]?.ALL;
  if (!outcomes || outcomes.n === 0) return 0.7;
  return outcomes.approved / outcomes.n;
}

// Kept a tier below conditional_use (which is already a known, in-code
// process): "not permitted" always means *some* extra process is needed, so
// it should never show as a flat, indistinguishable 0 -- but it also
// shouldn't outrank a typology that's merely conditional today.
const NOT_PERMITTED_FLOOR = 5;
const NOT_PERMITTED_RANGE = 30;

function notPermittedScore(zone: string, typologyId: string): number {
  const closeness = rezoningCloseness(zone, typologyId);
  const likelihood = rezoningLikelihood(zone);
  return Math.round(NOT_PERMITTED_FLOOR + closeness * likelihood * NOT_PERMITTED_RANGE);
}

const DEFAULT_TYPOLOGY_IDS = ["single_detached", "two_unit", "three_unit", "multi_unit"];

function scoreColor(score: number | null) {
  if (score == null) return "#525252";
  if (score >= 70) return "#22c55e";
  if (score >= 45) return "#eab308";
  return "#ef4444";
}

function TypologyTile({
  typologyId,
  onTypologyChange,
  zoning,
}: {
  typologyId: string;
  onTypologyChange: (id: string) => void;
  zoning: string;
}) {
  const pathwayId = DISTRICT_PATHWAYS[zoning]?.[typologyId];
  const score =
    pathwayId === "not_permitted" ? notPermittedScore(zoning, typologyId) : pathwayId ? PATHWAY_SCORE[pathwayId] : undefined;
  const pathway = pathwayId ? PATHWAY_META[pathwayId] : undefined;
  const tooltip =
    pathwayId === "not_permitted"
      ? `${pathway?.label} -- rezoning closeness ${Math.round(rezoningCloseness(zoning, typologyId) * 100)}%, district relief approval rate ${Math.round(rezoningLikelihood(zoning) * 100)}%`
      : pathway?.label;

  return (
    <div className="flex min-w-[9rem] flex-1 flex-col gap-1 rounded border border-border/60 bg-background/60 p-2">
      <Select value={typologyId} onValueChange={(value) => value && onTypologyChange(value)}>
        <SelectTrigger size="sm" className="h-6 w-full border-none px-0 text-muted-foreground shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPOLOGIES.map(([id, label]) => (
            <SelectItem key={id} value={id}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-2xl font-semibold tabular-nums" style={{ color: scoreColor(score ?? null) }}>
        {score == null ? "—" : score}
      </span>
      <span
        className={score == null ? "truncate text-muted-foreground" : "truncate"}
        style={{ color: score == null ? undefined : scoreColor(score) }}
        title={tooltip}
      >
        {pathway?.label ?? "Unresolved in the code"}
      </span>
    </div>
  );
}

/** Bottom pane: side-by-side feasibility scores for a handful of housing
 * typologies on the selected parcel's zoning district. Each tile's typology
 * is independently swappable via its dropdown. */
export function TypologyPanel({
  pin,
  collapsed,
  onToggleCollapse,
}: {
  pin: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [typologyIds, setTypologyIds] = useState<string[]>(DEFAULT_TYPOLOGY_IDS);
  const { data, status } = useParcelData(pin);
  const zoning = data?.zoning ?? "";

  const setTypologyAt = (index: number, id: string) =>
    setTypologyIds((prev) => prev.map((cur, i) => (i === index ? id : cur)));

  const body = useMemo(() => {
    if (!pin) return <p className="text-muted-foreground">Select a parcel on the map to see typology scores.</p>;
    if (status === "loading") return <p className="text-muted-foreground">Loading…</p>;
    if (status === "missing" || !data)
      return <p className="text-muted-foreground">No zoning data for this parcel (city parcels only).</p>;
    return (
      <div className="flex h-full w-full gap-2">
        {typologyIds.map((id, i) => (
          <TypologyTile key={i} typologyId={id} zoning={zoning} onTypologyChange={(next) => setTypologyAt(i, next)} />
        ))}
      </div>
    );
  }, [pin, status, data, typologyIds, zoning]);

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden p-2 text-xs">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">Typology scores</span>
        <div className="flex items-center gap-2">
          {zoning && <span className="text-muted-foreground">Zoning {zoning}</span>}
          {onToggleCollapse && <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="typology scores" />}
        </div>
      </div>
      {!collapsed && <div className="min-h-0 flex-1 overflow-x-auto">{body}</div>}
    </div>
  );
}
