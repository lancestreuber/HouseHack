// Safety (reported). Only aggregates and crash points are shipped:
// - City of Pittsburgh UCR Part I crimes (blotter ends Nov 2023): violent and
//   property rates per 1,000 residents by census tract, Dec 2020 – Nov 2023.
// - County homicides (ACHD / Medical Examiner): rate per 10,000 residents per
//   year by tract. Victim-level fields (age, race, gender, cause) are never read.
// - PennDOT crashes 2023–2025: killed-or-serious-injury (KSI) crash points.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV, polygonIndex } from "./geo";

const CR = "https://api.censusreporter.org/1.0";
const COUNTY_TRACTS = "140|05000US42003";
const CITY_TRACTS = "140|16000US4261000";
const BLOTTER = "https://data.wprdc.org/datastore/dump/044f2016-1dfd-4ab0-bc1e-065da05fca2e";
const HOMICIDE_LAYERS = [
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/AC_Homicide_Incidents_2007_2022/FeatureServer/2",
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/2024_Homicides_in_Allegheny_County/FeatureServer/59",
];
const CRASH_RESOURCES = {
  2023: "96777349-57df-48fb-a1d7-8384786fe71a",
  2024: "4c016b4c-59f0-45ca-981c-718c784b3462",
  2025: "c6bedb17-2d23-49b1-843a-8f6b41e5e5c3",
};

const CRIME_START = "2020-12-01";
const CRIME_END = "2023-12-01";
const CRIME_YEARS = 3;
const HOMICIDE_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2024]; // no 2023 layer found

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function buildSafetyTracts() {
  type CRData = { data: Record<string, { B01003: { estimate: Record<string, number> } }> };
  const [geo, pop, cityGeo] = await Promise.all([
    getJSON<{ features: GeoJSONFeature[] }>(`${CR}/geo/show/latest?geo_ids=${COUNTY_TRACTS}`),
    getJSON<CRData>(`${CR}/data/show/latest?table_ids=B01003&geo_ids=${COUNTY_TRACTS}`),
    getJSON<{ features: GeoJSONFeature[] }>(`${CR}/geo/show/latest?geo_ids=${CITY_TRACTS}`),
  ]);
  const cityTracts = new Set(cityGeo.features.map((f) => String(f.properties.geoid)));
  const findTract = polygonIndex(
    geo.features.map((f) => ({ key: String(f.properties.geoid), geometry: f.geometry as { type: string; coordinates: unknown } })),
  );

  // City crime: count Part I (hierarchy 1–8) by tract.
  const violent = new Map<string, number>();
  const property = new Map<string, number>();
  const blotter = parseCSV(await fetch(BLOTTER).then((r) => r.text()));
  for (const row of blotter) {
    const h = Number(row.HIERARCHY);
    const t = row.INCIDENTTIME ?? "";
    const x = Number(row.X);
    const y = Number(row.Y);
    if (!(h >= 1 && h <= 8) || t < CRIME_START || t >= CRIME_END || !x || !y) continue;
    const tract = findTract(x, y);
    if (!tract) continue;
    const bucket = h <= 4 ? violent : property;
    bucket.set(tract, (bucket.get(tract) ?? 0) + 1);
  }

  // Homicides: read only the incident location and year.
  const homicides = new Map<string, number>();
  for (const layer of HOMICIDE_LAYERS) {
    const fields = layer.includes("2024")
      ? ["INC_STD_LATITUDE", "INC_STD_LONGITUDE"]
      : ["INC_STD_LATITUDE", "INC_STD_LONGITUDE", "DOD_YEAR"];
    const points = await fetchAllGeoJSON(layer, { outFields: fields });
    for (const f of points) {
      const year = layer.includes("2024") ? 2024 : Number(f.properties.DOD_YEAR);
      if (!HOMICIDE_YEARS.includes(year)) continue;
      const lat = Number(f.properties.INC_STD_LATITUDE);
      const lon = Number(f.properties.INC_STD_LONGITUDE);
      if (!lat || !lon) continue;
      const tract = findTract(lon, lat);
      if (tract) homicides.set(tract, (homicides.get(tract) ?? 0) + 1);
    }
  }

  const round = (v: number) => Math.round(v * 10) / 10;
  const features = geo.features.map((f) => {
    const id = String(f.properties.geoid);
    const population = pop.data[id]?.B01003?.estimate?.B01003001 ?? 0;
    const inCity = cityTracts.has(id);
    // Tiny-population tracts (parks, rail yards) make rates meaningless.
    const ratesOk = population >= 200;
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: id.replace(/^14000US/, ""),
        population,
        in_city: inCity,
        violent_per_1k:
          inCity && ratesOk ? round(((violent.get(id) ?? 0) / population / CRIME_YEARS) * 1000) : null,
        property_per_1k:
          inCity && ratesOk ? round(((property.get(id) ?? 0) / population / CRIME_YEARS) * 1000) : null,
        homicides: homicides.get(id) ?? 0,
        homicide_per_10k:
          ratesOk ? round(((homicides.get(id) ?? 0) / population / HOMICIDE_YEARS.length) * 10000) : null,
      },
    };
  });
  await writeOverlay("safety-tracts.geojson", {
    type: "FeatureCollection",
    features,
    metadata: {
      crimeWindow: `${CRIME_START} to 2023-11-30`,
      homicideYears: HOMICIDE_YEARS,
      builtAt: new Date().toISOString(),
    },
  });
}

async function crashCsvUrl(resourceId: string) {
  const res = await getJSON<{ result: { url: string } }>(
    `https://data.wprdc.org/api/3/action/resource_show?id=${resourceId}`,
  );
  return res.result.url;
}

async function buildCrashes() {
  const features = [];
  for (const [year, resourceId] of Object.entries(CRASH_RESOURCES)) {
    const rows = parseCSV(await fetch(await crashCsvUrl(resourceId)).then((r) => r.text()));
    for (const r of rows) {
      const severity = Number(r.MAX_SEVERITY_LEVEL);
      if (severity !== 1 && severity !== 2) continue; // killed or suspected serious injury
      // 2025 uses DEC_LATITUDE/DEC_LONGITUDE; earlier years use DEC_LAT/DEC_LONG.
      const lat = Number(r.DEC_LATITUDE ?? r.DEC_LAT);
      const lon = Number(r.DEC_LONGITUDE ?? r.DEC_LONG);
      if (!lat || !lon) continue;
      features.push({
        type: "Feature" as const,
        geometry: { type: "Point", coordinates: [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5] },
        properties: {
          year: Number(year),
          fatal: severity === 1,
          ped: Number(r.PED_COUNT) > 0,
          bike: Number(r.BICYCLE_COUNT) > 0,
        },
      });
    }
  }
  await writeOverlay("crashes-ksi.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { dataset: "PennDOT reportable crashes (WPRDC), KSI only", years: Object.keys(CRASH_RESOURCES), builtAt: new Date().toISOString() },
  });
}

export async function buildSafety() {
  await buildSafetyTracts();
  await buildCrashes();
}

if (import.meta.main) await buildSafety();
