// Housing stability and housing-caused harm.
// - Eviction filings 2025 by ZIP: Princeton Eviction Lab, Eviction Tracking
//   System (Pittsburgh site), from the extract in inputs/ (made by
//   inputs/evictions_extract.py), on TIGERweb ZCTA polygons. Aggregate counts only.
// - Children's elevated blood lead by tract: Allegheny County Health Dept via WPRDC (CC0).

import path from "node:path";

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV } from "./geo";

const EVICTIONS = path.resolve(import.meta.dirname, "inputs/pittsburgh_evictions_zip_2025.csv");
const ZCTA = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1";
const EBLL = "https://data.wprdc.org/api/3/action/datastore_search?resource_id=8432f1ad-c5bf-447f-b34b-160d8ee063b6&limit=1000";
// ACHD reports on 2010 census tracts.
const TRACTS_2010 = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer/14";
// Rates on very few renter households are mostly noise.
const MIN_RENTER_HH = 200;

const num = (v: string | undefined) => (v == null || v === "" ? null : Number(v));

async function buildEvictions() {
  const rows = new Map(parseCSV(await Bun.file(EVICTIONS).text()).map((r) => [r.zip, r]));
  const zctas = await fetchAllGeoJSON(ZCTA, {
    where: "ZCTA5 LIKE '15%'",
    outFields: ["ZCTA5"],
    maxAllowableOffset: 0.0001,
    extraParams: {
      geometry: "-80.36,40.19,-79.69,40.68",
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
    },
  });
  const features = zctas
    .filter((f) => rows.has(String(f.properties.ZCTA5)))
    .map((f) => {
      const zip = String(f.properties.ZCTA5);
      const r = rows.get(zip)!;
      const renters = num(r.renter_households);
      return {
        type: "Feature" as const,
        geometry: f.geometry,
        properties: {
          zip,
          filings_2025: num(r.filings_2025),
          prepandemic_baseline: num(r.prepandemic_baseline_12mo),
          renter_households: renters,
          filings_per_100_renters: renters != null && renters >= MIN_RENTER_HH ? num(r.filings_per_100_renter_hh) : null,
        },
      };
    });
  await writeOverlay("evictions-zip.geojson", {
    type: "FeatureCollection",
    features,
    metadata: {
      source: "https://eviction-lab-data-downloads.s3.amazonaws.com/ets/all_sites_monthly_2020_2021.csv",
      builtAt: new Date().toISOString(),
    },
  });
  const total = features.reduce((s, f) => s + (f.properties.filings_2025 ?? 0), 0);
  console.log(`evictions: ${features.length} of ${rows.size} ZIPs drawn, ${total} filings on the map`);
}

async function buildBloodLead() {
  type Row = Record<string, string | number | null>;
  const [data, tracts] = await Promise.all([
    fetch(EBLL).then((r) => r.json() as Promise<{ result: { records: Row[] } }>),
    fetchAllGeoJSON(TRACTS_2010, { where: "STATE = '42' AND COUNTY = '003'", outFields: ["GEOID"], maxAllowableOffset: 0.00005 }),
  ]);
  const byTract = new Map(data.result.records.map((r) => [String(r.CensusTract), r]));
  const pct = (v: Row[string] | undefined) => (v == null ? null : Number(v));
  const unstable = (v: Row[string] | undefined) => v != null && String(v).startsWith("Unstable");
  // ACHD: censored = fewer than 50 children tested; unstable = fewer than 10 elevated.
  const features: GeoJSONFeature[] = tracts.map((f) => {
    const geoid = String(f.properties.GEOID);
    const r = byTract.get(geoid);
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid,
        ebll_2015_20_pct: pct(r?.percentEBLL15_20),
        ebll_2015_20_unstable: unstable(r?.note15_20),
        ebll_2021_24_pct: pct(r?.percentEBLL2021_2024),
        ebll_2021_24_unstable: unstable(r?.note2021_2024),
      },
    };
  });
  await writeOverlay("child-blood-lead.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: EBLL, builtAt: new Date().toISOString() },
  });
  const unmatched = [...byTract.keys()].filter((k) => !features.some((f) => f.properties.geoid === k));
  const p = features.map((f) => f.properties);
  console.log(
    `blood lead: ${features.length} tracts; 2015–20 values ${p.filter((x) => x.ebll_2015_20_pct != null).length}, 2021–24 values ${p.filter((x) => x.ebll_2021_24_pct != null).length}; unmatched WPRDC rows: ${unmatched.join(",") || "none"}`,
  );
}

export async function buildHousingStability() {
  await buildEvictions();
  await buildBloodLead();
}

if (import.meta.main) await buildHousingStability();
