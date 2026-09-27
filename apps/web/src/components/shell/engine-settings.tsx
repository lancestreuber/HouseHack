import { Popover, PopoverContent, PopoverTrigger } from "@HouseHack/ui/components/popover";
import { Slider } from "@HouseHack/ui/components/slider";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";

import { OVERLAYS } from "../map/overlays";
import { setPillarWeights, usePillarWeights, type PillarWeights } from "../map/pillar-weights-store";

function RailGearTrigger({ children }: { children: ReactNode }) {
  return (
    <PopoverTrigger render={<button type="button" aria-label="Engine settings" title="Engine settings" className="relative flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground" />}>
      {children}
    </PopoverTrigger>
  );
}

/** The rail gear's panel: the only entry point to the scoring engine's
 * settings (pillar weights, presets) plus read-only engine/data version
 * facts. Replaces the old navbar Weights popover. */
export function EngineSettings() {
  const weights = usePillarWeights();
  return (
    <Popover>
      <RailGearTrigger>
        <Settings className="size-5" />
      </RailGearTrigger>
      <PopoverContent side="right" align="end" className="w-72 text-xs">
        <p className="font-semibold text-[13px] tracking-wide uppercase">Engine settings</p>
        <p className="mt-1 text-muted-foreground">Pillar weights</p>
        <div className="mt-2 space-y-3">
          {config.pillars.map((p) => {
            const id = p.id as PillarId;
            const value = weights[id] ?? p.weight;
            return (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>{p.label}</span>
                  <span className="tnum text-muted-foreground">{value.toFixed(2)}</span>
                </div>
                <Slider
                  value={[value]}
                  min={0}
                  max={3}
                  step={0.25}
                  onValueChange={(v) => setPillarWeights({ ...weights, [id]: Array.isArray(v) ? v[0]! : v })}
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
              onClick={() => setPillarWeights(preset as PillarWeights)}
              title={(config.preset_notes as Record<string, string>)[name]}
              className="rounded-md border border-border px-1.5 py-0.5 hover:bg-accent/60"
            >
              {name.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPillarWeights({})}
          className="mt-2 text-left text-muted-foreground underline hover:text-foreground"
        >
          Reset to defaults
        </button>
        <div className="mt-3 space-y-1 border-t border-border pt-2 text-muted-foreground">
          <p className="flex justify-between">
            <span>Scoring config</span>
            <span className="tnum">v{config.version}</span>
          </p>
          <p className="flex justify-between">
            <span>Map layers registered</span>
            <span className="tnum">{OVERLAYS.length}</span>
          </p>
          <p>Scoring is deterministic and client-side; the AI only explains, never scores.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
