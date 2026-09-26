// Rebuilds every static map overlay in public/data/overlays/.
// Run from apps/web: `bun run data:overlays`. Add new datasets to this list.

import { buildAirQuality } from "./air-quality";
import { buildAmenities } from "./amenities";
import { buildChas } from "./chas";
import { buildFloodZones } from "./flood-zones";
import { buildHousingCosts } from "./housing-costs";
import { buildJobs } from "./jobs";
import { buildLandslides } from "./landslides";
import { buildLeadServiceLines } from "./lead-service-lines";
import { buildParks } from "./parks";
import { buildPlaces } from "./places";
import { buildSafety } from "./safety";
import { buildSubsidizedHousing } from "./subsidized-housing";
import { buildTornadoesAndMines } from "./tornadoes-mines";
import { buildTransitStops } from "./transit-stops";
import { buildWeatherRisk } from "./weather-risk";

for (const build of [buildAirQuality, buildWeatherRisk, buildLeadServiceLines, buildFloodZones, buildLandslides, buildTransitStops, buildHousingCosts, buildSafety, buildPlaces, buildParks, buildAmenities, buildJobs, buildTornadoesAndMines, buildSubsidizedHousing, buildChas]) {
  await build();
}
