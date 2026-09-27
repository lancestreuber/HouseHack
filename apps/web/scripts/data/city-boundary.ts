// City of Pittsburgh boundary, the mask that greys out everything outside it,
// and the County's municipality names keyed by MUNICODE (Allegheny County GIS).
// Mount Oliver Borough is an enclave: it's a hole in the City polygon, so the
// mask covers it too.

import { writeFile } from "node:fs/promises";
import path from "node:path";

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const MUNICIPALITIES =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Municipal_Boundaries/FeatureServer/0";
const NAMES_OUT = path.resolve(import.meta.dirname, "../../src/lib/municipalities.generated.json");
const PITTSBURGH = "100";
const WORLD_RING = [
  [-81.5, 39.5],
  [-78.5, 39.5],
  [-78.5, 41.5],
  [-81.5, 41.5],
  [-81.5, 39.5],
];

type Ring = number[][];

export async function buildCityBoundary() {
  const munis = await fetchAllGeoJSON(MUNICIPALITIES, {
    outFields: ["F0_LABEL", "F0_MUNICODE"],
    maxAllowableOffset: 0.00003,
  });

  const names = Object.fromEntries(
    munis.map((f) => [String(f.properties.F0_MUNICODE), String(f.properties.F0_LABEL)]).sort(([a], [b]) => Number(a) - Number(b)),
  );
  await writeFile(NAMES_OUT, `${JSON.stringify(names, null, 1)}\n`);
  console.log(`wrote municipalities.generated.json: ${Object.keys(names).length} municipalities`);

  const city = munis.find((f) => String(f.properties.F0_MUNICODE) === PITTSBURGH);
  if (!city) throw new Error("Pittsburgh not found in the municipal boundaries layer");
  const geom = city.geometry as { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
  const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

  const outers = polygons.map((p) => p[0]);
  const holes = polygons.flatMap((p) => p.slice(1));
  const source = { source: MUNICIPALITIES, builtAt: new Date().toISOString() };

  await writeOverlay("city-boundary.geojson", {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: city.geometry, properties: { name: "City of Pittsburgh" } }],
    metadata: source,
  });
  await writeOverlay("city-mask.geojson", {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "MultiPolygon", coordinates: [[WORLD_RING, ...outers], ...holes.map((h) => [h])] },
        properties: {},
      },
    ],
    metadata: source,
  });
}

if (import.meta.main) await buildCityBoundary();
