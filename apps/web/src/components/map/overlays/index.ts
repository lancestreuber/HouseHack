// The overlay registry. To add a dataset:
//   1. (static data) add a build script in apps/web/scripts/data/ and list it in build-all.ts
//   2. add an OverlayDefinition file in this folder
//   3. add it to OVERLAYS below
// The layers panel, legend, tooltips and composite indicators all read from here.

import { airQualityOverlay } from "./air-quality";
import { floodZonesOverlay } from "./flood-zones";
import { housingCostsOverlay, uspsVacancyOverlay } from "./housing-costs";
import { landslideIncidentsOverlay, landslideSusceptibilityOverlay } from "./landslides";
import { leadServiceLinesOverlay } from "./lead-service-lines";
import { sewerLinesOverlay } from "./sewer-lines";
import { slopeOverlay } from "./slope";
import { transitStopsOverlay } from "./transit-stops";
import type { Indicator, OverlayDefinition } from "./types";
import { weatherRiskOverlay } from "./weather-risk";

export const OVERLAYS: OverlayDefinition[] = [
  airQualityOverlay,
  weatherRiskOverlay,
  housingCostsOverlay,
  uspsVacancyOverlay,
  floodZonesOverlay,
  slopeOverlay,
  landslideSusceptibilityOverlay,
  landslideIncidentsOverlay,
  leadServiceLinesOverlay,
  sewerLinesOverlay,
  transitStopsOverlay,
];

export const HEAT_OVERLAYS = OVERLAYS.filter((o) => o.group === "heat");
export const HAZARD_OVERLAYS = OVERLAYS.filter((o) => o.group === "hazard");
export const INFRA_OVERLAYS = OVERLAYS.filter((o) => o.group === "infrastructure");

// Every normalized indicator the registry offers, for future composite scores
// (e.g. an "infrastructure quality" heatmap built from sewers, lead, transit...).
export function allIndicators(): (Indicator & { overlayId: string })[] {
  return OVERLAYS.flatMap((o) => (o.indicators ?? []).map((i) => ({ ...i, overlayId: o.id })));
}

export type { OverlayDefinition } from "./types";
