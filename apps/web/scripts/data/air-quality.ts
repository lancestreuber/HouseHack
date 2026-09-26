// EPA EJScreen v2.32 block-group air indicators for Allegheny County.
// EPA took the official EJScreen offline in 2025; this is the public mirror run
// by the Public Environmental Data Partners (PEDP). Cite it as such.

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const LAYER =
  "https://services2.arcgis.com/w4yiQqB14ZaAGzJq/arcgis/rest/services/EJScreenStatePercentilesBlockGroup/FeatureServer/0";

// Raw value and Pennsylvania state percentile for each air indicator.
const FIELDS = ["PM25", "OZONE", "DSLPM", "NO2", "PTRAF", "RSEI_AIR"];

export async function buildAirQuality() {
  const features = await fetchAllGeoJSON(LAYER, {
    where: "ID LIKE '42003%'",
    outFields: ["ID", ...FIELDS, ...FIELDS.map((f) => `P_${f}`)],
    maxAllowableOffset: 0.00005,
  });
  for (const f of features) {
    const p = f.properties;
    f.properties = { geoid: p.ID };
    for (const field of FIELDS) {
      f.properties[field.toLowerCase()] = p[field];
      f.properties[`${field.toLowerCase()}_pct`] = p[`P_${field}`];
    }
  }
  await writeOverlay("air-quality.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: LAYER, dataset: "EPA EJScreen v2.32 (PEDP mirror)", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildAirQuality();
