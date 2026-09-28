import config from "@/lib/pillars/pillars.config.json";
import type { PillarWeights } from "@/components/map/pillar-weights-store";

// Shown at onboarding; the API folds these into two roles (zoning regulator, developer).
export const AUDIENCE_OPTIONS = [
  { id: "planner", label: "Municipal planners testing zoning and infrastructure scenarios" },
  { id: "cdc", label: "Community development corporations choosing projects that meet local needs" },
  { id: "developer", label: "Developers evaluating product type and likely market demand" },
  { id: "public", label: "Residents and public officials comparing alternative growth patterns" },
] as const;

export type AudienceId = (typeof AUDIENCE_OPTIONS)[number]["id"];

export const AUDIENCE_LABEL: Record<string, string> = {
  planner: "Municipal planner",
  cdc: "Community development corporation",
  developer: "Developer",
  public: "Resident or public official",
};

export const PRESET_LABEL: Record<string, string> = {
  equal: "Balanced",
  affordability_first: "Affordability first",
  family: "Families",
  older_adult: "Older adults",
  climate_first: "Climate first",
  market_first: "Market first",
};

export const PRESET_NOTE = config.preset_notes as Record<string, string>;

export function presetWeights(name: string | null | undefined): PillarWeights | undefined {
  return name ? (config.presets as Record<string, PillarWeights>)[name] : undefined;
}

// Same cap as the API's profile input.
export const CONTEXT_MAX = 1000;
