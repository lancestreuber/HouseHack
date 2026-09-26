// Equity and opportunity context.
// - CDC/ATSDR Social Vulnerability Index 2022 + Child Opportunity Index 3.0 (2020 tracts).
// - Opportunity Atlas economic mobility (2010 tracts, on TIGERweb 2010 tract polygons).
// - HOLC 1937 "redlining" grades (Mapping Inequality, CC BY-SA).

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";
import { parseCSV } from "./geo";

const SVI = "https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/2";
const COI = "https://services7.arcgis.com/s3vGpGobX9nzlLH3/arcgis/rest/services/coi3_20_2021_shp3/FeatureServer/0";
const OA_CSV = "https://opportunityinsights.org/wp-content/uploads/2018/10/tract_outcomes_simple.csv";
const TRACTS_2010 = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer/14";
const HOLC =
  "https://data.wprdc.org/dataset/904294e5-ba3f-47f0-9e68-e7ede3ba6b33/resource/9f67567a-a4d8-455f-804e-d22db49318a0/download/holc-simplified.geojson";

// SVI uses -999 for "no data"; percentiles are 0–1, shown as 0–100.
const rank = (v: unknown) => {
  const n = Number(v);
  return v == null || Number.isNaN(n) || n < 0 ? null : Math.round(n * 100);
};

async function buildSviCoi() {
  const svi = await fetchAllGeoJSON(SVI, {
    where: "STCNTY = '42003'",
    outFields: ["FIPS", "E_TOTPOP", "RPL_THEMES", "RPL_THEME1", "RPL_THEME2", "RPL_THEME3", "RPL_THEME4"],
    maxAllowableOffset: 0.00005,
  });
  const coiRows = await fetchAllGeoJSON(COI, {
    where: "geoid20 LIKE '42003%'",
    outFields: ["geoid20", "c5_COI_met", "r_COI_met", "r_ED_met", "r_HE_met", "r_SE_met"],
  });
  const coi = new Map(coiRows.map((f) => [String(f.properties.geoid20), f.properties]));
  const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
  for (const f of svi) {
    const p = f.properties;
    const c = coi.get(String(p.FIPS));
    f.properties = {
      geoid: p.FIPS,
      population: p.E_TOTPOP,
      svi_overall: rank(p.RPL_THEMES),
      svi_socioeconomic: rank(p.RPL_THEME1),
      svi_household: rank(p.RPL_THEME2),
      svi_minority: rank(p.RPL_THEME3),
      svi_housing_transport: rank(p.RPL_THEME4),
      coi_level: c?.c5_COI_met ?? null,
      coi_rank: num(c?.r_COI_met),
      coi_education: num(c?.r_ED_met),
      coi_health_env: num(c?.r_HE_met),
      coi_social_econ: num(c?.r_SE_met),
    };
  }
  await writeOverlay("equity-svi-coi.geojson", {
    type: "FeatureCollection",
    features: svi,
    metadata: { sources: [SVI, COI], builtAt: new Date().toISOString() },
  });
}

async function buildOpportunityAtlas() {
  const outcomes = new Map<string, Record<string, string>>();
  for (const r of parseCSV(await fetch(OA_CSV).then((res) => res.text()))) {
    if (r.state !== "42" || r.county !== "3") continue;
    outcomes.set(`42003${r.tract.padStart(6, "0")}`, r);
  }
  const tracts = await fetchAllGeoJSON(TRACTS_2010, {
    where: "STATE = '42' AND COUNTY = '003'",
    outFields: ["GEOID"],
    maxAllowableOffset: 0.00005,
  });
  const pctile = (v: string | undefined) => (v == null || v === "" ? null : Math.round(Number(v) * 1000) / 10);
  for (const f of tracts) {
    const id = String(f.properties.GEOID);
    const r = outcomes.get(id);
    const se = r ? Number(r.kfr_pooled_pooled_p25_se) : NaN;
    f.properties = {
      geoid: id,
      mobility_p25: pctile(r?.kfr_pooled_pooled_p25),
      mobility_p25_se: Number.isNaN(se) ? null : Math.round(se * 1000) / 10,
      // Flag noisy estimates (standard error over 5 percentile points).
      mobility_unreliable: Number.isNaN(se) ? true : se > 0.05,
      mobility_black_p25: pctile(r?.kfr_black_pooled_p25),
      mobility_white_p25: pctile(r?.kfr_white_pooled_p25),
    };
  }
  await writeOverlay("opportunity-atlas.geojson", {
    type: "FeatureCollection",
    features: tracts,
    metadata: { sources: [OA_CSV, TRACTS_2010], builtAt: new Date().toISOString() },
  });
}

async function buildHolc() {
  const holc = (await fetch(HOLC).then((r) => r.json())) as { features: { geometry: unknown; properties: Record<string, unknown> }[] };
  const features = holc.features.map((f) => ({
    type: "Feature" as const,
    geometry: f.geometry,
    properties: { grade: f.properties.holc_grade ?? null, id: f.properties.holc_id ?? null, name: f.properties.name ?? null },
  }));
  await writeOverlay("holc-1937.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: HOLC, builtAt: new Date().toISOString() },
  });
}

export async function buildEquity() {
  await buildSviCoi();
  await buildOpportunityAtlas();
  await buildHolc();
}

if (import.meta.main) await buildEquity();
