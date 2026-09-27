import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@HouseHack/ui/components/select";

import { PATHWAY_META, TYPOLOGIES } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS } from "./overlays/legal-matrix.generated";
import { PaneCollapseButton } from "./pane-collapse-button";
import { useParcelData } from "./pillars-panel";

// Legal pathway -> rough feasibility score, so four typologies can be
// compared at a glance without reading the pathway label on every tile.
// Higher = fewer approvals/hearings required to build that housing type here.
export const PATHWAY_SCORE: Record<string, number | null> = {
  by_right: 100,
  za: 85,
  zbe_special_exception: 60,
  conditional_use: 40,
  not_permitted: 0,
  per_plan: null,
  not_city_jurisdiction: null,
};

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
  const score = pathwayId ? PATHWAY_SCORE[pathwayId] : undefined;
  const pathway = pathwayId ? PATHWAY_META[pathwayId] : undefined;

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
      <span className="truncate text-muted-foreground" title={pathway?.label}>
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
