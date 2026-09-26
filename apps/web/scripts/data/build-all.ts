// Rebuilds every static map overlay in public/data/overlays/.
// Run from apps/web: `bun run data:overlays`. Add new datasets to this list.

import { buildActivity } from "./activity";
import { buildAirQuality } from "./air-quality";
import { buildAmenities } from "./amenities";
import { buildChas } from "./chas";
import { buildCityHazards } from "./city-hazards";
import { buildDesignations } from "./designations-lai";
import { buildEquity } from "./equity";
import { buildEverydayAccess } from "./everyday-access";
import { buildFloodZones } from "./flood-zones";
import { buildHealth } from "./health";
import { buildHousingCosts } from "./housing-costs";
import { buildHousingStability } from "./housing-stability";
import { buildJobs } from "./jobs";
import { buildLand } from "./land";
import { buildLandslides } from "./landslides";
import { buildLegalFeasibility } from "./legal-feasibility";
import { buildLeadServiceLines } from "./lead-service-lines";
import { buildMarket } from "./market";
import { buildParks } from "./parks";
import { buildPlaces } from "./places";
import { buildSafety } from "./safety";
import { buildSchoolQuality } from "./school-quality";
import { buildSubsidizedHousing } from "./subsidized-housing";
import { buildTornadoesAndMines } from "./tornadoes-mines";
import { buildTransitStops } from "./transit-stops";
import { buildVacancy } from "./vacancy";
import { buildWeatherRisk } from "./weather-risk";
import { buildZoningPolicy } from "./zoning-policy";

for (const build of [buildAirQuality, buildWeatherRisk, buildLeadServiceLines, buildFloodZones, buildLandslides, buildTransitStops, buildHousingCosts, buildSafety, buildPlaces, buildParks, buildAmenities, buildJobs, buildTornadoesAndMines, buildSubsidizedHousing, buildChas, buildDesignations, buildMarket, buildActivity, buildLand, buildEquity, buildSchoolQuality, buildZoningPolicy, buildHealth, buildEverydayAccess, buildHousingStability, buildLegalFeasibility, buildCityHazards, buildVacancy]) {
  await build();
}
