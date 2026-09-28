// Shared vocabulary for the onboarding flow: the four steps, the role cards,
// the five scoring pillars and the quick-bound jurisdictions. Pillar ids match
// the stitch mock's data-pillar attributes; PILLAR_TO_SCORE_ID maps them onto
// the app's existing scoring PillarId so onboarding answers can seed parcel
// scoring weights later.

import type { PillarId } from "@/lib/pillars/score";

export type OnboardingRole = "regulator" | "developer";
export type Priority = "low" | "medium" | "high";
export type OnboardingPillarId =
  | "demand"
  | "feasibility"
  | "affordability"
  | "opportunity"
  | "climate";

export const PILLAR_TO_SCORE_ID: Record<OnboardingPillarId, PillarId> = {
  demand: "demand",
  feasibility: "site",
  affordability: "afford",
  opportunity: "access",
  climate: "climate",
};

export const STEPS = [
  { path: "/onboarding", index: 1, label: "Role Identification" },
  { path: "/onboarding/priorities", index: 2, label: "Scoring Model Baseline" },
  { path: "/onboarding/location", index: 3, label: "Geographic Scope" },
  { path: "/onboarding/done", index: 4, label: "Workspace Ready" },
] as const;

export const ROLES: {
  id: OnboardingRole;
  label: string;
  description: string;
}[] = [
  {
    id: "regulator",
    label: "Zoning Regulator",
    description:
      "Review statutory compliance, evaluate variance petitions, and audit ordinance code §911.",
  },
  {
    id: "developer",
    label: "Developer",
    description:
      "Model parcel development feasibility, assess density maximums, and identify buildable footprints.",
  },
];

export const ROLE_LABEL: Record<OnboardingRole, string> = {
  regulator: "Zoning Regulator",
  developer: "Developer",
};

export const PILLARS: {
  id: OnboardingPillarId;
  label: string;
  code: string;
  description: string;
}[] = [
  {
    id: "demand",
    label: "Demand",
    code: "DEM-01",
    description:
      "Market absorption, population trajectory, and housing unit shortfall across target tract.",
  },
  {
    id: "feasibility",
    label: "Site Feasibility",
    code: "STE-02",
    description:
      "Parcel geometry, slope thresholds, utility easements, and buildable envelope constraints.",
  },
  {
    id: "affordability",
    label: "Affordability",
    code: "AFF-03",
    description: "Subsidized housing supply, AMI income brackets, and cost-burden distribution metrics.",
  },
  {
    id: "opportunity",
    label: "Access to Opportunity",
    code: "OPP-04",
    description:
      "Transit proximity, civic infrastructure, job shed density, and essential service walkability.",
  },
  {
    id: "climate",
    label: "Climate & Environment",
    code: "ENV-05",
    description: "Flood zone exposure, urban heat island intensity, steep slope hazards, and tree canopy.",
  },
];

export const PILLAR_LABEL: Record<OnboardingPillarId, string> = {
  demand: "Demand",
  feasibility: "Site Feasibility",
  affordability: "Affordability",
  opportunity: "Access to Opportunity",
  climate: "Climate & Environment",
};

/** Onboarding pillar id -> stored profile column. */
export const PRIORITY_COLUMN = {
  demand: "demandPriority",
  feasibility: "feasibilityPriority",
  affordability: "affordabilityPriority",
  opportunity: "opportunityPriority",
  climate: "climatePriority",
} as const;

/** What "Skip for now" persists on the priorities step. */
export const DEFAULT_PRIORITIES: Record<OnboardingPillarId, Priority> = {
  demand: "high",
  feasibility: "medium",
  affordability: "high",
  opportunity: "medium",
  climate: "medium",
};

export const JURISDICTIONS: {
  label: string;
  lat: number;
  lon: number;
  epsg: string;
  zoom: number;
}[] = [
  { label: "Pittsburgh, PA", lat: 40.4406, lon: -79.9959, epsg: "EPSG:2272", zoom: 11 },
  { label: "Allegheny County", lat: 40.465, lon: -79.98, epsg: "EPSG:2272", zoom: 9 },
  { label: "Cleveland, OH", lat: 41.4993, lon: -81.6944, epsg: "EPSG:3734", zoom: 11 },
  { label: "Philadelphia, PA", lat: 39.9526, lon: -75.1652, epsg: "EPSG:2271", zoom: 11 },
];

export const DEFAULT_JURISDICTION = JURISDICTIONS[0]!;

/** Structural view of the stored profile; only the fields the flow reads. */
export type OnboardingProfileState = {
  role?: OnboardingRole | null;
  demandPriority?: Priority | null;
  feasibilityPriority?: Priority | null;
  affordabilityPriority?: Priority | null;
  opportunityPriority?: Priority | null;
  climatePriority?: Priority | null;
  jurisdiction?: string | null;
  jurisdictionLat?: number | null;
  jurisdictionLon?: number | null;
} | null;

const PRIORITY_COLUMNS = [
  "demandPriority",
  "feasibilityPriority",
  "affordabilityPriority",
  "opportunityPriority",
  "climatePriority",
] as const;

export type OnboardingPath =
  | "/onboarding"
  | "/onboarding/priorities"
  | "/onboarding/location"
  | "/onboarding/done";

/** First step whose data is missing; drives resume-after-login. */
export function firstIncompleteStepPath(profile: OnboardingProfileState): OnboardingPath {
  if (!profile?.role) return "/onboarding";
  if (PRIORITY_COLUMNS.some((column) => profile[column] == null)) return "/onboarding/priorities";
  if (profile.jurisdiction == null) return "/onboarding/location";
  return "/onboarding/done";
}
