// Emergency services, schools and child care as point layers (county-wide).
// Personal fields (hospital executives, school contacts) are never kept.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { polygonIndex } from "./geo";

const HOSPITALS = "https://mapservices.pasda.psu.edu/server/rest/services/pasda/DepHealth/MapServer/6";
const FIRE = "https://services.arcgis.com/Kwm2c3YqtFhUC26N/arcgis/rest/services/Fire_Departments_Allegheny_County/FeatureServer/0";
const SCHOOLS = "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Schools/FeatureServer/0";
const STATE_POLICE = "https://mapservices.pasda.psu.edu/server/rest/services/pasda/PennsylvaniaStatePolice/MapServer/1";
const COUNTY_BOUNDARY =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Boundary/FeatureServer/0";
const CHILD_CARE = "https://data.pa.gov/resource/ajn5-kaxt.json?facility_county=Allegheny&$limit=5000";
// Overpass mirrors are frequently overloaded; try each in turn.
const OVERPASS_MIRRORS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];
const COUNTY_BBOX = "-80.36,40.19,-79.69,40.68";

const SPECIALTY = /encompass|select specialty|\bpam\b|southwood|lifecare|children's home|rehab|behavioral|psychiatric|western psychiatric|kindred/i;

const point = (lon: number, lat: number) => ({
  type: "Point",
  coordinates: [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5],
});

async function countyContains() {
  const boundary = await fetchAllGeoJSON(COUNTY_BOUNDARY, { outFields: [] });
  const inCounty = polygonIndex(
    boundary.map((f) => ({ key: true, geometry: f.geometry as { type: string; coordinates: unknown } })),
  );
  return (lon: number, lat: number) => inCounty(lon, lat) === true;
}

async function buildHospitals() {
  const rows = await fetchAllGeoJSON(HOSPITALS, {
    where: "COUNTY = 'Allegheny'",
    outFields: ["NAME", "STREET", "CITY", "ZIP_CODE", "WEBSITE"],
  });
  const features = rows.map((f) => ({
    type: "Feature" as const,
    geometry: f.geometry,
    properties: {
      name: f.properties.NAME,
      address: [f.properties.STREET, f.properties.CITY].filter(Boolean).join(", "),
      kind: SPECIALTY.test(String(f.properties.NAME)) ? "specialty" : "general",
      website: f.properties.WEBSITE ?? null,
    },
  }));
  await writeOverlay("places-hospitals.geojson", { type: "FeatureCollection", features, metadata: { source: HOSPITALS } });
}

async function buildFireStations() {
  const rows = await fetchAllGeoJSON(FIRE, {
    outFields: ["Municipality", "Fire_Department", "Address", "Station_Number"],
    extraParams: { geometry: COUNTY_BBOX, geometryType: "esriGeometryEnvelope", inSR: "4326", spatialRel: "esriSpatialRelIntersects" },
  });
  const features = rows.map((f) => ({
    type: "Feature" as const,
    geometry: f.geometry,
    properties: {
      name: f.properties.Fire_Department,
      station: f.properties.Station_Number ?? null,
      municipality: f.properties.Municipality ?? null,
      address: f.properties.Address ?? null,
    },
  }));
  await writeOverlay("places-fire.geojson", { type: "FeatureCollection", features, metadata: { source: FIRE } });
}

type OsmElement = { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

// OpenStreetMap police stations and ambulance stations, clipped to the county.
async function buildOsmEmergency(inCounty: (lon: number, lat: number) => boolean) {
  const query = `[out:json][timeout:120][bbox:40.19,-80.36,40.68,-79.69];(nwr["amenity"="police"];nwr["emergency"="ambulance_station"];);out center tags;`;
  let elements: OsmElement[] | undefined;
  for (const mirror of OVERPASS_MIRRORS) {
    const res = await fetch(mirror, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "HouseHack-map-builder/1.0" },
      body: new URLSearchParams({ data: query }),
    });
    if (res.ok) {
      elements = ((await res.json()) as { elements: OsmElement[] }).elements;
      break;
    }
    console.warn(`Overpass ${mirror}: HTTP ${res.status}`);
  }
  if (!elements) throw new Error("all Overpass mirrors failed");
  const police: GeoJSONFeature[] = [];
  const ems: GeoJSONFeature[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const name = el.tags?.name;
    if (lat == null || lon == null || !name || !inCounty(lon, lat)) continue;
    if (/academy|911 center/i.test(name)) continue;
    const feature = { type: "Feature" as const, geometry: point(lon, lat), properties: { name } };
    (el.tags?.amenity === "police" ? police : ems).push(feature);
  }

  const psp = await fetchAllGeoJSON(STATE_POLICE, {
    outFields: ["*"],
    extraParams: { geometry: COUNTY_BBOX, geometryType: "esriGeometryEnvelope", inSR: "4326", spatialRel: "esriSpatialRelIntersects" },
  });
  for (const f of psp) {
    const name = Object.entries(f.properties).find(([k]) => /name|station/i.test(k))?.[1];
    police.push({ type: "Feature", geometry: f.geometry, properties: { name: `PA State Police ${name ?? ""}`.trim() } });
  }

  await writeOverlay("places-police.geojson", {
    type: "FeatureCollection",
    features: police,
    metadata: { source: "OpenStreetMap (Overpass) + PSP stations (PASDA)" },
  });
  await writeOverlay("places-ems.geojson", {
    type: "FeatureCollection",
    features: ems,
    metadata: { source: "OpenStreetMap (Overpass)" },
  });
}

async function buildSchools() {
  const rows = await fetchAllGeoJSON(SCHOOLS, {
    outFields: ["School_Name", "LEA_Inst_Name", "School_Category_Description", "Grade_List", "Elementary", "Secondary", "Cyber_School"],
  });
  const features = rows
    .filter((f) => !/^(y|yes|1|true)$/i.test(String(f.properties.Cyber_School ?? "")))
    .map((f) => ({
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        name: f.properties.School_Name,
        district: f.properties.LEA_Inst_Name ?? null,
        category: String(f.properties.School_Category_Description ?? "Other").replace(/ School$/, ""),
        grades: f.properties.Grade_List ?? null,
      },
    }));
  await writeOverlay("places-schools.geojson", { type: "FeatureCollection", features, metadata: { source: SCHOOLS } });
}

async function buildChildCare() {
  type Row = { facility_name?: string; provider_type?: string; capacity?: string; star_level?: string; geocoded_column?: { coordinates: number[] } };
  const rows = (await fetch(CHILD_CARE).then((r) => r.json())) as Row[];
  const features = rows
    .filter((r) => r.geocoded_column?.coordinates?.length === 2)
    .map((r) => ({
      type: "Feature" as const,
      geometry: point(r.geocoded_column!.coordinates[0], r.geocoded_column!.coordinates[1]),
      properties: {
        name: r.facility_name ?? "Child care provider",
        type: r.provider_type ?? null,
        capacity: r.capacity ? Number(r.capacity) : null,
        stars: r.star_level ?? null,
      },
    }));
  await writeOverlay("places-child-care.geojson", { type: "FeatureCollection", features, metadata: { source: CHILD_CARE } });
}

export async function buildPlaces() {
  const inCounty = await countyContains();
  await buildHospitals();
  await buildFireStations();
  await buildSchools();
  await buildChildCare();
  try {
    await buildOsmEmergency(inCounty);
  } catch (error) {
    // Overpass is often overloaded; keep the previously built files if so.
    console.warn("OSM police/EMS skipped:", error);
  }
}

if (import.meta.main) await buildPlaces();
