import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@HouseHack/ui/components/popover";
import { Slider } from "@HouseHack/ui/components/slider";
import { SlidersHorizontal } from "lucide-react";

import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";

/** Global, navbar-level button + popover of one slider per pillar (spec:
 * PLAN.md C3/D5 -- "a weights button" in the top bar). Feeds
 * `scoreParcel`'s `overrides.pillars` via pillar-weights-store -- that
 * function is pure and synchronous specifically so every drag recomputes
 * the Overall score and every pillar card live (see score.ts). */
export function WeightsPopover({
  weights,
  onChange,
}: {
  weights: Partial<Record<PillarId, number>>;
  onChange: (next: Partial<Record<PillarId, number>>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
        <SlidersHorizontal className="size-3.5" />
        Weights
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-64 text-xs">
        <PopoverHeader>
          <PopoverTitle>Pillar weights</PopoverTitle>
        </PopoverHeader>
        <div className="space-y-3">
          {config.pillars.map((p) => {
            const id = p.id as PillarId;
            const value = weights[id] ?? p.weight;
            return (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>{p.label}</span>
                  <span className="tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
                </div>
                <Slider
                  value={[value]}
                  min={0}
                  max={3}
                  step={0.25}
                  onValueChange={(v) => onChange({ ...weights, [id]: Array.isArray(v) ? v[0]! : v })}
                />
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-muted-foreground">Presets are starting points; each is a different view of what matters.</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {Object.entries(config.presets).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange(preset as Partial<Record<PillarId, number>>)}
              title={(config.preset_notes as Record<string, string>)[name]}
              className="rounded border px-1.5 py-0.5 hover:bg-foreground/10"
            >
              {name.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({})}
          className="mt-2 text-left text-muted-foreground underline hover:text-foreground"
        >
          Reset to defaults
        </button>
      </PopoverContent>
    </Popover>
  );
}
