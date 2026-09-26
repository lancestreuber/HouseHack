// Development pipeline and building conditions (City of Pittsburgh only).
// - PLI permits: new residential construction and demolitions since 2022 (points).
// - Condemned / dead-end properties (points; the `owner` field is never read).
// - Code violations found in the last 24 months, per 100 housing units by block group.

import { writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV, polygonIndex } from "./geo";

const DUMP = "https://data.wprdc.org/datastore/dump";
const PERMITS = `${DUMP}/f4d1177a-f597-4c32-8cbf-7885f56253f6?fields=permit_type,work_type,work_description,commercial_or_residential,total_project_value,issue_date,latitude,longitude,neighborhood`;
const CONDEMNED = `${DUMP}/0a963f26-eb4b-4325-bbbc-3ddf6a871410?fields=property_type,create_date,latest_inspection_result,inspection_status,latitude,longitude,neighborhood`;
const VIOLATIONS = `${DUMP}/70c06278-92c5-4040-ab28-17671866f81c?fields=investigation_date,investigation_outcome,latitude,longitude`;
const CR = "https://api.censusreporter.org/1.0";
const CITY_BGS = "150|16000US4261000";

const SINCE = "2022-01-01";
const NEW_WORK = new Set(["NEW CONSTRUCTION", "NEW"]);
const DEMO_WORK = new Set(["COMPLETE DEMOLITION", "CITY FUNDED DEMOLITION"]);
const BUILDING_PERMITS = new Set(["BUILDING", "BUILDING & DEVELOPMENT APPLICATION"]);

const pt = (lon: number, lat: number) => ({
  type: "Point",
  coordinates: [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5],
});
const text = (url: string) => fetch(url).then((r) => r.text());

async function buildPermits() {
  const features = [];
  for (const r of parseCSV(await text(PERMITS))) {
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (!lat || !lon || !(r.issue_date >= SINCE)) continue;
    const work = (r.work_type ?? "").toUpperCase();
    const isDemo = DEMO_WORK.has(work);
    const isNewHome =
      NEW_WORK.has(work) &&
      BUILDING_PERMITS.has((r.permit_type ?? "").toUpperCase()) &&
      (r.commercial_or_residential ?? "").toLowerCase() === "residential";
    if (!isDemo && !isNewHome) continue;
    features.push({
      type: "Feature" as const,
      geometry: pt(lon, lat),
      properties: {
        kind: isDemo ? (work === "CITY FUNDED DEMOLITION" ? "city_demolition" : "demolition") : "new_residential",
        issued: r.issue_date.slice(0, 10),
        value: Number(r.total_project_value) || null,
        description: (r.work_description ?? "").slice(0, 140) || null,
        neighborhood: r.neighborhood || null,
      },
    });
  }
  await writeOverlay("permits-activity.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: PERMITS, since: SINCE, builtAt: new Date().toISOString() },
  });
}

async function buildCondemned() {
  const features = parseCSV(await text(CONDEMNED))
    .filter((r) => Number(r.latitude) && Number(r.longitude))
    .map((r) => ({
      type: "Feature" as const,
      geometry: pt(Number(r.longitude), Number(r.latitude)),
      properties: {
        property_type: r.property_type || null,
        since: (r.create_date ?? "").slice(0, 10) || null,
        inspection: r.latest_inspection_result || null,
        status: r.inspection_status || null,
        neighborhood: r.neighborhood || null,
      },
    }));
  await writeOverlay("condemned-properties.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: CONDEMNED, builtAt: new Date().toISOString() },
  });
}

async function buildViolations() {
  type CR = { data: Record<string, { B25001: { estimate: Record<string, number> } }> };
  const [geo, units] = await Promise.all([
    fetch(`${CR}/geo/show/latest?geo_ids=${CITY_BGS}`).then((r) => r.json() as Promise<{ features: GeoJSONFeature[] }>),
    fetch(`${CR}/data/show/latest?table_ids=B25001&geo_ids=${CITY_BGS}`).then((r) => r.json() as Promise<CR>),
  ]);
  const findBg = polygonIndex(
    geo.features.map((f) => ({ key: String(f.properties.geoid), geometry: f.geometry as { type: string; coordinates: unknown } })),
  );
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 24);
  const since = cutoff.toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const r of parseCSV(await text(VIOLATIONS))) {
    if (r.investigation_outcome !== "Violation Found" || !(r.investigation_date >= since)) continue;
    const bg = findBg(Number(r.longitude), Number(r.latitude));
    if (bg) counts.set(bg, (counts.get(bg) ?? 0) + 1);
  }
  const features = geo.features.map((f) => {
    const id = String(f.properties.geoid);
    const housingUnits = units.data[id]?.B25001?.estimate?.B25001001 ?? 0;
    const found = counts.get(id) ?? 0;
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: id.replace(/^15000US/, ""),
        violations_24mo: found,
        housing_units: housingUnits,
        violations_per_100_units: housingUnits >= 50 ? Math.round((found / housingUnits) * 1000) / 10 : null,
      },
    };
  });
  await writeOverlay("code-violations.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: VIOLATIONS, since, builtAt: new Date().toISOString() },
  });
}

export async function buildActivity() {
  await buildPermits();
  await buildCondemned();
  await buildViolations();
}

if (import.meta.main) await buildActivity();
