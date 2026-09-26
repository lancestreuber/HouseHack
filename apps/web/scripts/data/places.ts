// Hospitals, schools and child care as point layers (county-wide).
// Personal fields (hospital executives, school contacts) are never kept.

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const HOSPITALS = "https://mapservices.pasda.psu.edu/server/rest/services/pasda/DepHealth/MapServer/6";
const SCHOOLS = "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Schools/FeatureServer/0";
const CHILD_CARE = "https://data.pa.gov/resource/ajn5-kaxt.json?facility_county=Allegheny&$limit=5000";

const SPECIALTY = /encompass|select specialty|\bpam\b|southwood|lifecare|children's home|rehab|behavioral|psychiatric|western psychiatric|kindred/i;

const point = (lon: number, lat: number) => ({
  type: "Point",
  coordinates: [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5],
});

// CMS Care Compare hospital general information: overall star rating and
// emergency-services flag. CMS has no coordinates, so rows are matched to the
// DOH points by street number + first street word (preferring general hospitals
// where a specialty unit shares the address), with one name alias.
const CMS = "https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0?conditions[0][property]=state&conditions[0][value]=PA&conditions[1][property]=countyparish&conditions[1][value]=ALLEGHENY&limit=100";
type CmsRow = { facility_name: string; address: string; hospital_overall_rating: string; emergency_services: string };
// "320 E. North Avenue" and "320 EAST NORTH AVENUE" both become "320 north".
const DIRECTIONS = new Set(["e", "east", "w", "west", "n", "north", "s", "south"]);
const addressKey = (address: unknown) => {
  const words = String(address ?? "").toLowerCase().replace(/\./g, "").split(/[\s,]+/).filter(Boolean);
  const [num, ...rest] = words;
  const street = rest.length > 1 && DIRECTIONS.has(rest[0]) ? rest[1] : rest[0];
  return `${num} ${street ?? ""}`.trim();
};

async function buildHospitals() {
  const rows = await fetchAllGeoJSON(HOSPITALS, {
    where: "COUNTY = 'Allegheny'",
    outFields: ["NAME", "STREET", "CITY", "ZIP_CODE", "WEBSITE"],
  });
  const cms = ((await fetch(CMS).then((r) => r.json())) as { results: CmsRow[] }).results;
  const cmsByKey = new Map(cms.map((c) => [addressKey(c.address), c]));
  const childrens = cms.find((c) => /UPMC CHILDREN'S HOSPITAL/i.test(c.facility_name));

  const features = rows.map((f) => {
    const name = String(f.properties.NAME);
    const kind = SPECIALTY.test(name) ? "specialty" : "general";
    let match = kind === "general" ? cmsByKey.get(addressKey(f.properties.STREET)) : undefined;
    if (/children's hospital of pittsburgh/i.test(name)) match = childrens;
    const rating = Number(match?.hospital_overall_rating);
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        name,
        address: [f.properties.STREET, f.properties.CITY].filter(Boolean).join(", "),
        kind,
        website: f.properties.WEBSITE ?? null,
        cms_rating: Number.isFinite(rating) ? rating : null,
        cms_rated: match ? match.hospital_overall_rating : null,
        emergency: match ? match.emergency_services === "Yes" : null,
      },
    };
  });
  const matched = features.filter((f) => f.properties.cms_rated != null).length;
  console.log(`hospitals: matched ${matched} of ${cms.length} CMS rows`);
  await writeOverlay("places-hospitals.geojson", { type: "FeatureCollection", features, metadata: { source: HOSPITALS } });
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

// Fire, police and EMS are built by emergency-multisource.ts.
export async function buildPlaces() {
  await buildHospitals();
  await buildSchools();
  await buildChildCare();
}

if (import.meta.main) await buildPlaces();
