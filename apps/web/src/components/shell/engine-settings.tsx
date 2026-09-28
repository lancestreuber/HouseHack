import { Popover, PopoverContent, PopoverTrigger } from "@HouseHack/ui/components/popover";
import { Slider } from "@HouseHack/ui/components/slider";
import { Scale } from "lucide-react";
import type { ReactNode } from "react";

import config from "@/lib/pillars/pillars.config.json";
import type { PillarId } from "@/lib/pillars/score";

import { OVERLAYS } from "../map/overlays";
import { setPillarWeights, usePillarWeights, type PillarWeights } from "../map/pillar-weights-store";

function RailGearTrigger({ children }: { children: ReactNode }) {
  return (
    <PopoverTrigger render={<button type="button" aria-label="Scoring weights" title="Scoring weights" className="relative flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground" />}>
      {children}
    </PopoverTrigger>
  );
}

/** Pillar weight sliders, presets and read-only engine facts. Shown by the
 * rail's scale button and the header's "Adjust weights" button. */
export function WeightsPanel() {
  const weights = usePillarWeights();
  return (
    <>
      <p className="font-semibold text-[13px] tracking-wide uppercase">Scoring weights</p>
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
    </>
  );
}

/** The rail's scale button, opening the weights panel. */
export function EngineSettings() {
  return (
    <Popover>
      <RailGearTrigger>
        <Scale className="size-5" />
      </RailGearTrigger>
      <PopoverContent side="right" align="end" className="w-72 text-xs">
        <WeightsPanel />
      </PopoverContent>
    </Popover>
  );
}
