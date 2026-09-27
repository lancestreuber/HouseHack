// Fire, police and EMS from official county lists merged with City layers and
// OpenStreetMap (extracts in inputs/places/). OSM and City additions are
// clipped to the county; official county-list agencies are always kept.
// - Fire: ConnectGovs county fire departments + City fire stations + named OSM
//   fire stations, merged within 200 m upstream.
// - Police: ConnectGovs municipal departments + OSM police, merged within 150 m
//   upstream; here, OSM-only duplicates of a listed department are dropped, and
//   PA State Police stations (PASDA) are added.
// - EMS: ConnectGovs designated EMS agencies + OSM ambulance stations, plus the
//   City's EMS medic stations merged within 150 m.

import path from "node:path";

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV, polygonIndex } from "./geo";

const DIR = path.resolve(import.meta.dirname, "inputs/places");
const COUNTY_BOUNDARY =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Boundary/FeatureServer/0";
const STATE_POLICE = "https://mapservices.pasda.psu.edu/server/rest/services/pasda/PennsylvaniaStatePolice/MapServer/1";
const CITY_EMS = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/EMS_Station/FeatureServer/0";
const COUNTY_BBOX = { geometry: "-80.36,40.19,-79.69,40.68", geometryType: "esriGeometryEnvelope", inSR: "4326", spatialRel: "esriSpatialRelIntersects" };

type Row = Record<string, string>;
const round = (v: number) => Math.round(v * 1e5) / 1e5;
const point = (lon: number, lat: number) => ({ type: "Point", coordinates: [round(lon), round(lat)] });
const meters = (a: number[], b: number[]) =>
  Math.hypot((a[0] - b[0]) * 111_320 * Math.cos((a[1] * Math.PI) / 180), (a[1] - b[1]) * 110_540);
const read = async (file: string) => parseCSV(await Bun.file(`${DIR}/${file}`).text());
// "Mt. Lebanon Police Department" -> "mtle"; catches typos like "Corapolis".
const nameKey = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 4);

export async function buildEmergencyMultisource() {
  const boundary = await fetchAllGeoJSON(COUNTY_BOUNDARY, { outFields: [] });
  const index = polygonIndex(boundary.map((f) => ({ key: true, geometry: f.geometry as never })));
  const inCounty = (lon: number, lat: number) => index(lon, lat) === true;
  // Official county-list agencies stay even if their base is just over the
  // line (Trafford, McDonald and Penn Township serve Allegheny municipalities);
  // only OSM and City additions are clipped.
  const toFeatures = (rows: Row[], props: (r: Row) => Record<string, unknown>) =>
    rows
      .filter((r) => Number(r.lat) && Number(r.lon) && (r.sources?.includes("ConnectGovs") || inCounty(Number(r.lon), Number(r.lat))))
      .map((r) => ({ type: "Feature" as const, geometry: point(Number(r.lon), Number(r.lat)), properties: props(r) }));

  const fire = toFeatures(await read("allegheny_fire_stations_merged.csv"), (r) => ({
    name: r.name,
    station: r.station || null,
    municipality: r.municipality || null,
    address: r.address || null,
    sources: r.sources,
  }));
  await writeOverlay("places-fire.geojson", { type: "FeatureCollection", features: fire, metadata: { source: "inputs/places/allegheny_fire_stations_merged.csv" } });

  const policeRows = await read("allegheny_police_merged.csv");
  const listed = policeRows.filter((r) => r.sources.includes("ConnectGovs"));
  const police = toFeatures(
    policeRows.filter((r) => {
      if (/review board|academy/i.test(r.name)) return false; // not stations
      if (r.sources !== "OSM") return true;
      const here = [Number(r.lon), Number(r.lat)];
      return !listed.some((c) => nameKey(c.name) === nameKey(r.name) && meters(here, [Number(c.lon), Number(c.lat)]) < 1000);
    }),
    (r) => ({ name: r.name, address: r.address || null, serves: r.municipalities_served || null, sources: r.sources }),
  );
  const psp = await fetchAllGeoJSON(STATE_POLICE, { outFields: ["*"], extraParams: COUNTY_BBOX });
  for (const f of psp) {
    const [lon, lat] = f.geometry.coordinates as number[];
    if (!inCounty(lon, lat)) continue;
    const name = Object.entries(f.properties).find(([k]) => /name|station/i.test(k))?.[1];
    police.push({ type: "Feature", geometry: point(lon, lat), properties: { name: `PA State Police ${name ?? ""}`.trim(), address: null, serves: null, sources: "PASDA" } });
  }
  await writeOverlay("places-police.geojson", { type: "FeatureCollection", features: police, metadata: { source: "inputs/places/allegheny_police_merged.csv + PSP (PASDA)" } });

  const ems: GeoJSONFeature[] = toFeatures(await read("allegheny_ems_merged.csv"), (r) => ({
    name: r.name,
    address: r.address || null,
    serves: r.municipalities_served || null,
    sources: r.sources,
  }));
  const medics = await fetchAllGeoJSON(CITY_EMS, { outFields: ["name", "address"] });
  let added = 0;
  for (const f of medics) {
    const c = f.geometry.coordinates as number[];
    if (ems.some((e) => meters(c, e.geometry.coordinates as number[]) < 150)) continue;
    ems.push({ type: "Feature", geometry: point(c[0], c[1]), properties: { name: `Pittsburgh EMS ${f.properties.name ?? ""}`.trim(), address: f.properties.address ?? null, serves: "City of Pittsburgh", sources: "City" } });
    added++;
  }
  await writeOverlay("places-ems.geojson", { type: "FeatureCollection", features: ems, metadata: { source: "inputs/places/allegheny_ems_merged.csv + City EMS_Station" } });
  console.log(`police: ${policeRows.length} rows -> ${police.length} (incl. ${psp.length} PSP); EMS: +${added} City medic stations`);
}

if (import.meta.main) await buildEmergencyMultisource();
