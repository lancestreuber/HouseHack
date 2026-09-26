// Parks, greenways and regional trails (Allegheny County GIS).

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const ORG = "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services";
const MUNICIPAL_PARKS = `${ORG}/Allegheny_County_Municipal_Parks_New/FeatureServer/0`;
const COUNTY_PARKS = `${ORG}/ParkBoundaries/FeatureServer/0`;
const GREENWAYS = `${ORG}/Allegheny_County_Greenways_New/FeatureServer/0`;
const TRAILS = `${ORG}/Regional_Trails_(PUBLIC)/FeatureServer/0`;

export async function buildParks() {
  const [municipal, county, greenways] = await Promise.all([
    fetchAllGeoJSON(MUNICIPAL_PARKS, { outFields: ["NAME", "MUNICIPALITY"], maxAllowableOffset: 0.00003 }),
    fetchAllGeoJSON(COUNTY_PARKS, { outFields: ["NAME"], maxAllowableOffset: 0.00003 }),
    fetchAllGeoJSON(GREENWAYS, { outFields: ["NAME", "MUNICIPALITY"], maxAllowableOffset: 0.00003 }),
  ]);
  const tag = (features: typeof municipal, kind: string) =>
    features.map((f) => ({
      type: "Feature" as const,
      geometry: f.geometry,
      properties: { name: f.properties.NAME ?? null, municipality: f.properties.MUNICIPALITY ?? null, kind },
    }));
  await writeOverlay("parks.geojson", {
    type: "FeatureCollection",
    features: [...tag(county, "county_park"), ...tag(municipal, "municipal_park"), ...tag(greenways, "greenway")],
    metadata: { sources: [MUNICIPAL_PARKS, COUNTY_PARKS, GREENWAYS], builtAt: new Date().toISOString() },
  });

  const trails = await fetchAllGeoJSON(TRAILS, {
    where: "STATUS IN ('OPEN - DEVELOPED', 'OPEN - UNDEVELOPED', 'PLANNED', 'PROPOSED')",
    outFields: ["Label", "STATUS"],
    maxAllowableOffset: 0.00003,
  });
  for (const f of trails) {
    const status = String(f.properties.STATUS ?? "");
    f.properties = { name: f.properties.Label ?? null, open: status.startsWith("OPEN"), status: status.toLowerCase() };
  }
  await writeOverlay("trails.geojson", {
    type: "FeatureCollection",
    features: trails,
    metadata: { source: TRAILS, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildParks();
