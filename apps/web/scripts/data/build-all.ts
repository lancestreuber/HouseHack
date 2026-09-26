// Rebuilds every static map overlay in public/data/overlays/.
// Run from apps/web: `bun run data:overlays`. Add new datasets to this list.

import { buildAirQuality } from "./air-quality";
import { buildFloodZones } from "./flood-zones";
import { buildHousingCosts } from "./housing-costs";
import { buildLandslides } from "./landslides";
import { buildLeadServiceLines } from "./lead-service-lines";
import { buildTransitStops } from "./transit-stops";
import { buildWeatherRisk } from "./weather-risk";

for (const build of [buildAirQuality, buildWeatherRisk, buildLeadServiceLines, buildFloodZones, buildLandslides, buildTransitStops, buildHousingCosts]) {
  await build();
}
