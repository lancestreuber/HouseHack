// The overlay registry. To add a dataset:
//   1. (static data) add a build script in apps/web/scripts/data/ and list it in build-all.ts
//   2. add an OverlayDefinition file in this folder
//   3. add it to OVERLAYS below
// The layers panel, legend, tooltips and composite indicators all read from here.

import { codeViolationsOverlay, condemnedPropertiesOverlay, permitsActivityOverlay } from "./activity";
import { airQualityOverlay } from "./air-quality";
import { chasOverlay } from "./chas";
import { designationAreasOverlay, locationAffordabilityOverlay } from "./designations-lai";
import { imperviousOverlay, surfaceHeatOverlay, treeCanopyOverlay } from "./environment";
import { equityOverlay, holcOverlay, opportunityAtlasOverlay } from "./equity";
import { floodZonesOverlay } from "./flood-zones";
import { healthOutcomesOverlay, lifeExpectancyOverlay, shortageAreasOverlay } from "./health";
import { housingCostsOverlay, uspsVacancyOverlay } from "./housing-costs";
import { jobsOverlay } from "./jobs";
import { cityOwnedLandOverlay, taxDelinquentOverlay, treasurySalesOverlay } from "./land";
import { marketMvaOverlay, marketZipOverlay } from "./market";
import { landslideIncidentsOverlay, landslideSusceptibilityOverlay } from "./landslides";
import { leadServiceLinesOverlay } from "./lead-service-lines";
import { commerceDensityOverlay } from "./commerce-density";
import { parksOverlay, trailsOverlay } from "./parks";
import { AMENITY_OVERLAYS, PLACE_OVERLAYS } from "./places";
import { safetyOverlay, seriousCrashesOverlay } from "./safety";
import { schoolQualityOverlay } from "./school-quality";
import { sewerLinesOverlay } from "./sewer-lines";
import { slopeOverlay } from "./slope";
import { mineSubsidenceOverlay, minedOutAreasOverlay, tornadoPathsOverlay } from "./tornadoes-mines";
import { housingVouchersOverlay, subsidizedHousingOverlay } from "./subsidized-housing";
import { transitStopsOverlay } from "./transit-stops";
import type { Indicator, OverlayDefinition } from "./types";
import { weatherRiskOverlay } from "./weather-risk";
import { cityZoningOverlaysOverlay, rcoOverlay, suburbanZoningOverlay } from "./zoning-policy";

export const OVERLAYS: OverlayDefinition[] = [
  airQualityOverlay,
  weatherRiskOverlay,
  housingCostsOverlay,
  uspsVacancyOverlay,
  chasOverlay,
  locationAffordabilityOverlay,
  marketMvaOverlay,
  marketZipOverlay,
  codeViolationsOverlay,
  equityOverlay,
  opportunityAtlasOverlay,
  healthOutcomesOverlay,
  lifeExpectancyOverlay,
  safetyOverlay,
  jobsOverlay,
  housingVouchersOverlay,
  floodZonesOverlay,
  slopeOverlay,
  landslideSusceptibilityOverlay,
  landslideIncidentsOverlay,
  seriousCrashesOverlay,
  tornadoPathsOverlay,
  minedOutAreasOverlay,
  mineSubsidenceOverlay,
  leadServiceLinesOverlay,
  sewerLinesOverlay,
  transitStopsOverlay,
  ...PLACE_OVERLAYS,
  schoolQualityOverlay,
  subsidizedHousingOverlay,
  parksOverlay,
  trailsOverlay,
  ...AMENITY_OVERLAYS,
  commerceDensityOverlay,
  surfaceHeatOverlay,
  treeCanopyOverlay,
  imperviousOverlay,
  designationAreasOverlay,
  holcOverlay,
  cityZoningOverlaysOverlay,
  suburbanZoningOverlay,
  rcoOverlay,
  shortageAreasOverlay,
  permitsActivityOverlay,
  condemnedPropertiesOverlay,
  cityOwnedLandOverlay,
  treasurySalesOverlay,
  taxDelinquentOverlay,
];

export const HEAT_OVERLAYS = OVERLAYS.filter((o) => o.group === "heat");

// Stackable (checkbox) sections of the layers panel, in display order.
export const STACKABLE_GROUPS: { group: OverlayDefinition["group"]; title: string }[] = [
  { group: "hazard", title: "Hazards" },
  { group: "infrastructure", title: "Infrastructure" },
  { group: "places", title: "Places" },
  { group: "environment", title: "Environment" },
  { group: "policy", title: "Policy & designations" },
  { group: "development", title: "Development & conditions" },
  { group: "land", title: "Land & acquisition" },
];
export const overlaysInGroup = (group: OverlayDefinition["group"]) => OVERLAYS.filter((o) => o.group === group);

// Every normalized indicator the registry offers, for future composite scores
// (e.g. an "infrastructure quality" heatmap built from sewers, lead, transit...).
export function allIndicators(): (Indicator & { overlayId: string })[] {
  return OVERLAYS.flatMap((o) => (o.indicators ?? []).map((i) => ({ ...i, overlayId: o.id })));
}

export type { OverlayDefinition } from "./types";
