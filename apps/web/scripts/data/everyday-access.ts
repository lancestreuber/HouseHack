// Everyday-life access, by tract / block group.
// - USDA ERS Food Access Research Atlas 2025 (straight-line distance), 2020 tracts.
// - ACS 2024 5-year B28002 home internet subscriptions via Census Reporter.
// - EPA National Walkability Index (Smart Location Database), 2020 block groups.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";

const FARA = "https://gisportal.ers.usda.gov/server/rest/services/FARA/FARA_2025_StraightLine/MapServer/5";
const CR = "https://api.censusreporter.org/1.0";
const TRACT_GEOS = "140|05000US42003";
const WALK = "https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0";

const flag = (v: unknown) => (v == null ? null : Number(v) === 1);
const round1 = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 10) / 10);

async function buildFoodAccess() {
  const rows = await fetchAllGeoJSON(FARA, {
    where: "CensusTract20 LIKE '42003%'",
    outFields: [
      "CensusTract20",
      "SD_SRAM_LILATracts_halfAnd10",
      "SD_SRAM_LILATracts_Vehicle",
      "SD_SRAM_LATracts_half",
      "SD_SRAM_LATracts1",
      "LowIncomeTracts",
      "PovertyRate",
      "TractHUNV",
    ],
    maxAllowableOffset: 0.00003,
  });
  const features = rows.map((f) => {
    const p = f.properties;
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: String(p.CensusTract20),
        lila_half_10: flag(p.SD_SRAM_LILATracts_halfAnd10),
        lila_vehicle: flag(p.SD_SRAM_LILATracts_Vehicle),
        low_access_half: flag(p.SD_SRAM_LATracts_half),
        low_access_1: flag(p.SD_SRAM_LATracts1),
        low_income: flag(p.LowIncomeTracts),
        poverty_rate: round1(p.PovertyRate),
        households_no_vehicle: p.TractHUNV ?? null,
      },
    };
  });
  await writeOverlay("food-access.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: FARA, builtAt: new Date().toISOString() },
  });
  const count = (k: string) => features.filter((f) => f.properties[k as keyof typeof f.properties] === true).length;
  console.log(`food access: ${features.length} tracts, ${count("lila_half_10")} LILA ½/10, ${count("lila_vehicle")} LILA vehicle`);
}

type TableData = { estimate: Record<string, number | null>; error: Record<string, number | null> };

async function buildInternet() {
  const [data, geo] = await Promise.all([
    fetch(`${CR}/data/show/latest?table_ids=B28002&geo_ids=${TRACT_GEOS}`).then(
      (r) => r.json() as Promise<{ data: Record<string, Record<string, TableData>>; release: { name: string } }>,
    ),
    fetch(`${CR}/geo/show/latest?geo_ids=${TRACT_GEOS}`).then((r) => r.json() as Promise<{ features: GeoJSONFeature[] }>),
  ]);
  const features = geo.features.map((f) => {
    const id = String(f.properties.geoid);
    const t = data.data[id]?.B28002;
    const hh = t?.estimate.B28002001 ?? 0;
    const none = t?.estimate.B28002013 ?? null;
    const noneMoe = t?.error.B28002013 ?? null;
    const pct = (n: number | null | undefined) => (hh > 0 && n != null ? Math.round((n / hh) * 1000) / 10 : null);
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: id.replace(/^14000US/, ""),
        households: hh,
        no_internet_pct: pct(none),
        no_internet_moe_pct: pct(noneMoe),
        broadband_pct: pct(t?.estimate.B28002004),
      },
    };
  });
  await writeOverlay("home-internet.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: `${CR}/data/show/latest?table_ids=B28002`, dataset: data.release.name, builtAt: new Date().toISOString() },
  });
  const vals = features.map((f) => f.properties.no_internet_pct).filter((v): v is number => v != null).sort((a, b) => a - b);
  console.log(`internet: ${vals.length} tracts with households, median no-internet ${vals[Math.floor(vals.length / 2)]}%`);
}

async function buildWalkability() {
  const rows = await fetchAllGeoJSON(WALK, {
    where: "STATEFP = '42' AND COUNTYFP = '003'",
    outFields: ["GEOID20", "NatWalkInd", "D2A_EPHHM", "D3B", "D4A", "D1B", "Pct_AO0"],
    maxAllowableOffset: 0.00003,
    extraParams: { outSR: "4326" },
  });
  for (const f of rows) {
    const p = f.properties;
    const d4a = Number(p.D4A);
    f.properties = {
      geoid: String(p.GEOID20),
      walk_index: round1(p.NatWalkInd),
      mix: p.D2A_EPHHM == null ? null : Math.round(Number(p.D2A_EPHHM) * 100) / 100,
      intersections_sqmi: round1(p.D3B),
      // EPA uses -99999 when no transit stop is within 3/4 mile.
      transit_distance_m: d4a < 0 || Number.isNaN(d4a) ? null : Math.round(d4a),
      pop_density_acre: round1(p.D1B),
      zero_car_pct: p.Pct_AO0 == null ? null : Math.round(Number(p.Pct_AO0) * 1000) / 10,
    };
  }
  await writeOverlay("walkability.geojson", {
    type: "FeatureCollection",
    features: rows,
    metadata: { source: WALK, builtAt: new Date().toISOString() },
  });
  console.log(`walkability: ${rows.length} block groups`);
}

export async function buildEverydayAccess() {
  await buildFoodAccess();
  await buildInternet();
  await buildWalkability();
}

if (import.meta.main) await buildEverydayAccess();
