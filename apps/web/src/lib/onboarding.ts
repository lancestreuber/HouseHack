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

// One sentence each, kept to a similar length so the onboarding cards line up.
export const PRESET_HINT: Record<string, string> = {
  equal: "Weighs all five pillars equally, a neutral place to start before you adjust.",
  affordability_first: "Weighs unmet need highest, favoring places where low-income renters are burdened.",
  family: "Weighs access to schools, groceries and daily needs highest, then site safety.",
  older_adult: "Weighs nearby health care and services highest, then safe sites and clean air.",
  climate_first: "Weighs low-carbon, walkable places with clean air and tree canopy highest.",
  market_first: "Weighs strong demand highest, which steers new homes away from disinvested areas.",
};

export function presetWeights(name: string | null | undefined): PillarWeights | undefined {
  return name ? (config.presets as Record<string, PillarWeights>)[name] : undefined;
}

// Same cap as the API's profile input.
export const CONTEXT_MAX = 1000;
