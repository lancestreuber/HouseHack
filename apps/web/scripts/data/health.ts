// Healthcare access and health outcomes.
// - HRSA Health Professional Shortage Areas: primary care and dental (federal designations).
// - CDC PLACES 2024 tract estimates (model-based, BRFSS).
// - CDC/NCHS USALEEP life expectancy at birth, 2010–2015, on 2010 tracts.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV } from "./geo";

const HPSA = "https://gisportal.hrsa.gov/server/rest/services/Shortage/HealthProfessionalShortageAreas_FS/MapServer";
const PLACES = "https://data.cdc.gov/resource/k9zj-b28y.json?countyfips=42003&$limit=500";
const CR_TRACTS = "https://api.censusreporter.org/1.0/geo/show/latest?geo_ids=140|05000US42003";
const USALEEP = "https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Datasets/NVSS/USALEEP/CSV/PA_A.CSV";
const TRACTS_2010 = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer/14";
const BBOX = {
  geometry: "-80.36,40.19,-79.69,40.68",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
};

const PLACES_MEASURES = ["access2", "checkup", "casthma", "copd", "diabetes", "bphigh", "depression", "mhlth", "disability"];

async function buildShortageAreas() {
  const features: GeoJSONFeature[] = [];
  for (const [layer, discipline] of [
    [10, "primary_care"],
    [2, "dental"],
  ] as const) {
    const rows = await fetchAllGeoJSON(`${HPSA}/${layer}`, {
      outFields: ["HPSA_NM", "HPSA_SCORE", "HPSA_STATUS_DESC", "HPSA_POPULATION_TYP_DESC", "HPSA_ESTIMATED_UNDERSERVED_POP"],
      maxAllowableOffset: 0.00005,
      extraParams: BBOX,
    });
    for (const f of rows) {
      const p = f.properties;
      features.push({
        type: "Feature",
        geometry: f.geometry,
        properties: {
          discipline,
          name: p.HPSA_NM ?? null,
          score: p.HPSA_SCORE ?? null,
          status: p.HPSA_STATUS_DESC ?? null,
          population_type: p.HPSA_POPULATION_TYP_DESC ?? null,
          underserved: p.HPSA_ESTIMATED_UNDERSERVED_POP ?? null,
        },
      });
    }
  }
  await writeOverlay("health-shortage-areas.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: HPSA, builtAt: new Date().toISOString() },
  });
}

async function buildPlaces() {
  type Row = Record<string, string>;
  const [rows, geo] = await Promise.all([
    fetch(PLACES).then((r) => r.json() as Promise<Row[]>),
    fetch(CR_TRACTS).then((r) => r.json() as Promise<{ features: GeoJSONFeature[] }>),
  ]);
  const byTract = new Map(rows.map((r) => [r.tractfips, r]));
  const features = geo.features.map((f) => {
    const geoid = String(f.properties.geoid).replace(/^14000US/, "");
    const r = byTract.get(geoid);
    const properties: Record<string, unknown> = { geoid };
    for (const m of PLACES_MEASURES) {
      const v = r?.[`${m}_crudeprev`];
      properties[m] = v == null || v === "" ? null : Number(v);
      properties[`${m}_ci`] = r?.[`${m}_crude95ci`] ?? null;
    }
    return { type: "Feature" as const, geometry: f.geometry, properties };
  });
  await writeOverlay("health-outcomes.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: PLACES, release: "PLACES 2024", builtAt: new Date().toISOString() },
  });
}

async function buildLifeExpectancy() {
  const le = new Map<string, { e0: number; se: number }>();
  for (const r of parseCSV(await fetch(USALEEP).then((res) => res.text()))) {
    if (r.CNTY2KX !== "003") continue;
    le.set(r["Tract ID"], { e0: Number(r["e(0)"]), se: Number(r["se(e(0))"]) });
  }
  const tracts = await fetchAllGeoJSON(TRACTS_2010, {
    where: "STATE = '42' AND COUNTY = '003'",
    outFields: ["GEOID"],
    maxAllowableOffset: 0.00005,
  });
  for (const f of tracts) {
    const id = String(f.properties.GEOID);
    const v = le.get(id);
    f.properties = {
      geoid: id,
      life_expectancy: v ? Math.round(v.e0 * 10) / 10 : null,
      life_expectancy_se: v ? Math.round(v.se * 100) / 100 : null,
      // Small tracts have wide intervals; fade estimates with SE over 2 years.
      unreliable: v ? v.se > 2 : true,
    };
  }
  await writeOverlay("life-expectancy.geojson", {
    type: "FeatureCollection",
    features: tracts,
    metadata: { source: USALEEP, builtAt: new Date().toISOString() },
  });
}

export async function buildHealth() {
  await buildShortageAreas();
  await buildPlaces();
  await buildLifeExpectancy();
}

if (import.meta.main) await buildHealth();
