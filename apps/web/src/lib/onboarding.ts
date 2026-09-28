import config from "@/lib/pillars/pillars.config.json";
import type { PillarWeights } from "@/components/map/pillar-weights-store";

export const ROLE_OPTIONS = [
  { id: "resident", label: "Resident", hint: "Curious what could be built in my neighborhood" },
  { id: "developer", label: "Developer", hint: "Looking for sites that pencil" },
  { id: "nonprofit", label: "Nonprofit / CDC", hint: "Planning affordable or mission-driven projects" },
  { id: "city_staff", label: "City or agency staff", hint: "Weighing zoning, land and incentive levers" },
  { id: "advocate", label: "Advocate / organizer", hint: "Making the case for housing where it's needed" },
  { id: "researcher", label: "Researcher / student", hint: "Studying housing, equity or climate" },
] as const;

export type RoleId = (typeof ROLE_OPTIONS)[number]["id"];

export const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.id, r.label]));

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
