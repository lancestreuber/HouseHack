// Existing subsidized and affordable housing (HUD official ArcGIS services):
// LIHTC projects, public housing buildings, HUD-assisted multifamily properties
// (points, clipped to the county) and Housing Choice Voucher use by tract.
// Contact / project-manager / phone fields are never requested.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { polygonIndex } from "./geo";

const HUD = "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services";
const COUNTY_BOUNDARY =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Boundary/FeatureServer/0";
const BBOX = {
  geometry: "-80.36,40.19,-79.69,40.68",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
};

// HUD contract dates are text like "31-MAR-30" (DD-MON-YY). Two-digit years up
// to 70 are read as 20xx (contracts run into the 2040s), others as 19xx.
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function parseHudDate(v: unknown): Date | null {
  const m = /^(\d{1,2})-([A-Z]{3})-(\d{2})$/.exec(String(v ?? "").trim().toUpperCase());
  if (!m) return null;
  const yy = Number(m[3]);
  const month = MONTHS.indexOf(m[2]);
  if (month < 0) return null;
  return new Date(Date.UTC(yy <= 70 ? 2000 + yy : 1900 + yy, month, Number(m[1])));
}

const num = (v: unknown) => (v == null || v === "" ? null : Number(v));
// LIHTC year fields use placeholder codes such as 8888/9999 for unknown.
const year = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 1900 && n < 2100 ? n : null;
};

async function countyFilter() {
  const boundary = await fetchAllGeoJSON(COUNTY_BOUNDARY, { outFields: [] });
  const inside = polygonIndex(boundary.map((f) => ({ key: true, geometry: f.geometry as { type: string; coordinates: unknown } })));
  return (f: GeoJSONFeature) => {
    const [lon, lat] = (f.geometry as { coordinates: number[] }).coordinates;
    return inside(lon, lat) === true;
  };
}

export async function buildSubsidizedHousing() {
  const inCounty = await countyFilter();
  const soon = new Date();
  soon.setFullYear(soon.getFullYear() + 5);

  const lihtc = (
    await fetchAllGeoJSON(`${HUD}/LIHTC/FeatureServer/0`, {
      outFields: ["PROJECT", "PROJ_ADD", "PROJ_CTY", "N_UNITS", "LI_UNITS", "N_0BR", "N_1BR", "N_2BR", "N_3BR", "N_4BR", "YR_PIS", "NON_PROF"],
      pageSize: 2000,
      extraParams: BBOX,
    })
  )
    .filter(inCounty)
    .map((f) => {
      const p = f.properties;
      const placed = year(p.YR_PIS);
      return {
        type: "Feature" as const,
        geometry: f.geometry,
        properties: {
          program: "lihtc",
          name: p.PROJECT,
          address: [p.PROJ_ADD, p.PROJ_CTY].filter(Boolean).join(", "),
          units: num(p.N_UNITS),
          affordable_units: num(p.LI_UNITS),
          bedrooms: [p.N_0BR, p.N_1BR, p.N_2BR, p.N_3BR, p.N_4BR].map(num).join("/"),
          year_placed: placed,
          nonprofit_sponsor: p.NON_PROF === 1 || p.NON_PROF === "1",
          // Assumption: the standard LIHTC compliance + extended-use period is 30 years.
          affordability_may_end_soon: placed != null && placed <= new Date().getFullYear() - 30 + 5,
        },
      };
    });

  const publicHousing = (
    await fetchAllGeoJSON(`${HUD}/Public_Housing_Buildings/FeatureServer/0`, {
      outFields: ["FORMAL_PARTICIPANT_NAME", "PROJECT_NAME", "BUILDING_TYPE_CODE", "TOTAL_UNITS", "PCT_OCCUPIED", "CONSTRUCT_DATE"],
      extraParams: BBOX,
    })
  )
    .filter(inCounty)
    .map((f) => {
      const p = f.properties;
      return {
        type: "Feature" as const,
        geometry: f.geometry,
        properties: {
          program: "public_housing",
          name: p.PROJECT_NAME,
          authority: p.FORMAL_PARTICIPANT_NAME,
          building_type: p.BUILDING_TYPE_CODE ?? null,
          units: num(p.TOTAL_UNITS),
          pct_occupied: num(p.PCT_OCCUPIED),
          year_built: p.CONSTRUCT_DATE ? new Date(Number(p.CONSTRUCT_DATE)).getFullYear() || null : null,
        },
      };
    });

  const assisted = (
    await fetchAllGeoJSON(`${HUD}/MULTIFAMILY_PROPERTIES_ASSISTED/FeatureServer/0`, {
      outFields: [
        "PROPERTY_NAME_TEXT",
        "ADDRESS_LINE1_TEXT",
        "TOTAL_UNIT_COUNT",
        "TOTAL_ASSISTED_UNIT_COUNT",
        "CLIENT_GROUP_NAME",
        "PROGRAM_TYPE1",
        "EXPIRATION_DATE1",
        "REAC_LAST_INSPECTION_SCORE",
      ],
      pageSize: 2000,
      extraParams: BBOX,
    })
  )
    .filter(inCounty)
    .map((f) => {
      const p = f.properties;
      const validExpiry = parseHudDate(p.EXPIRATION_DATE1);
      return {
        type: "Feature" as const,
        geometry: f.geometry,
        properties: {
          program: "hud_assisted",
          name: p.PROPERTY_NAME_TEXT,
          address: p.ADDRESS_LINE1_TEXT ?? null,
          units: num(p.TOTAL_UNIT_COUNT),
          affordable_units: num(p.TOTAL_ASSISTED_UNIT_COUNT),
          serves: p.CLIENT_GROUP_NAME ?? null,
          program_type: p.PROGRAM_TYPE1 ?? null,
          contract_expires: validExpiry ? validExpiry.toISOString().slice(0, 10) : null,
          expires_within_5y: validExpiry ? validExpiry <= soon && validExpiry >= new Date() : false,
          inspection_score: num(p.REAC_LAST_INSPECTION_SCORE),
        },
      };
    });

  await writeOverlay("subsidized-housing.geojson", {
    type: "FeatureCollection",
    features: [...lihtc, ...publicHousing, ...assisted],
    metadata: { source: HUD, builtAt: new Date().toISOString() },
  });

  const vouchers = await fetchAllGeoJSON(`${HUD}/Housing_Choice_Vouchers_by_Tract/FeatureServer/0`, {
    where: "GEOID LIKE '42003%'",
    outFields: ["GEOID", "HCV_PUBLIC", "HCV_PUBLIC_PCT"],
    maxAllowableOffset: 0.00005,
    pageSize: 2000,
  });
  for (const f of vouchers) {
    const p = f.properties;
    f.properties = { geoid: p.GEOID, voucher_households: num(p.HCV_PUBLIC), voucher_pct: num(p.HCV_PUBLIC_PCT) };
  }
  await writeOverlay("housing-vouchers.geojson", {
    type: "FeatureCollection",
    features: vouchers,
    metadata: { source: `${HUD}/Housing_Choice_Vouchers_by_Tract/FeatureServer/0`, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildSubsidizedHousing();
