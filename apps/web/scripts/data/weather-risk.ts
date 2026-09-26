// FEMA National Risk Index (census tracts) weather-hazard ratings for Allegheny County.

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const LAYER =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0";

// NRI hazard prefix -> property name in our file.
const HAZARDS: Record<string, string> = {
  IFLD: "inland_flood",
  HWAV: "heat_wave",
  CWAV: "cold_wave",
  WNTW: "winter_weather",
  SWND: "strong_wind",
  LNDS: "landslide",
  ISTM: "ice_storm",
  TRND: "tornado",
};

export async function buildWeatherRisk() {
  const prefixes = Object.keys(HAZARDS);
  const features = await fetchAllGeoJSON(LAYER, {
    where: "STCOFIPS = '42003'",
    outFields: ["TRACTFIPS", "NRI_VER", ...prefixes.flatMap((p) => [`${p}_RISKR`, `${p}_RISKS`])],
    maxAllowableOffset: 0.00005,
  });
  let version: unknown;
  for (const f of features) {
    const p = f.properties;
    version = p.NRI_VER;
    f.properties = { geoid: p.TRACTFIPS };
    for (const [prefix, name] of Object.entries(HAZARDS)) {
      f.properties[name] = p[`${prefix}_RISKR`];
      f.properties[`${name}_score`] = p[`${prefix}_RISKS`];
    }
  }
  await writeOverlay("weather-risk.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: LAYER, dataset: `FEMA National Risk Index (${version})`, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildWeatherRisk();
