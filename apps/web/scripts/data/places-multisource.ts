// Everyday places rebuilt from several current sources (extracts in
// inputs/places/, made by the scripts alongside them). Replaces the older
// single-source groceries, pharmacies, banks and health-center lists.
// - Food retail: USDA SNAP retailers merged with ACHD food permits, tiered.
// - Pharmacies: CMS NPPES pharmacy NPIs (Rite Aid family removed; it closed in 2025).
// - Banks: FDIC BankFind branch locations.
// - Health centers: HRSA health-center sites; clinics: NPPES clinic NPIs.
// Everything is clipped to the county line, since ZIP codes cross it.

import path from "node:path";

import { writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV, polygonIndex } from "./geo";

const DIR = path.resolve(import.meta.dirname, "inputs/places");
const COUNTY =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=GEOID%3D%2742003%27&outFields=GEOID&outSR=4326&f=geojson";

const round = (v: number) => Math.round(v * 1e5) / 1e5;
const pt = (lon: number, lat: number) => ({ type: "Point", coordinates: [round(lon), round(lat)] });
const read = async (file: string) => parseCSV(await Bun.file(`${DIR}/${file}`).text());

type Row = Record<string, string>;

export async function buildPlacesMultisource() {
  const county = (await fetch(COUNTY).then((r) => r.json())) as { features: GeoJSONFeature[] };
  const inCounty = polygonIndex([{ key: true, geometry: county.features[0].geometry as never }]);

  async function write(file: string, rows: Row[], lon: string, lat: string, props: (r: Row) => Record<string, unknown>, source: string) {
    const located = rows.filter((r) => Number(r[lat]) && Number(r[lon]));
    const kept = located.filter((r) => inCounty(Number(r[lon]), Number(r[lat])));
    const features = kept.map((r) => ({ type: "Feature" as const, geometry: pt(Number(r[lon]), Number(r[lat])), properties: props(r) }));
    await writeOverlay(file, { type: "FeatureCollection", features, metadata: { source, builtAt: new Date().toISOString() } });
    if (kept.length < located.length) console.log(`  ${file}: dropped ${located.length - kept.length} outside the county`);
    return features;
  }

  const food = await read("allegheny_food_retail_merged.csv");
  const foodProps = (r: Row) => ({
    name: r.name,
    address: r.address || null,
    tier: r.tier,
    snap: r.snap_authorized === "True",
    snap_type: r.snap_store_type || null,
    permit_category: r.achd_category || null,
  });
  const FOOD_SOURCE = "USDA FNS SNAP retailers + ACHD food permits (inputs/places/allegheny_food_retail_merged.csv)";
  // The pillars read places-groceries for grocery distance, so it keeps the
  // grocery tiers only; everything else goes to places-food-other.
  const groceryTiers = new Set(["full_grocery", "specialty_food"]);
  await write("places-groceries.geojson", food.filter((r) => groceryTiers.has(r.tier)), "lon", "lat", foodProps, FOOD_SOURCE);
  await write("places-food-other.geojson", food.filter((r) => !groceryTiers.has(r.tier)), "lon", "lat", foodProps, FOOD_SOURCE);

  await write(
    "places-pharmacies.geojson",
    await read("allegheny_pharmacies_nppes_2026.csv"),
    "lon",
    "lat",
    (r) => ({ name: r.name, address: [r.address, r.city].filter(Boolean).join(", ") || null, kind: r.kind, npi: r.npi }),
    "CMS NPPES NPI Registry, pharmacy taxonomy (inputs/places/allegheny_pharmacies_nppes_2026.csv)",
  );

  await write(
    "places-banks.geojson",
    await read("allegheny_bank_branches_fdic.csv"),
    "LONGITUDE",
    "LATITUDE",
    (r) => ({ name: r.NAME, branch: r.OFFNAME || null, address: [r.ADDRESS, r.CITY].filter(Boolean).join(", ") || null, service: r.SERVTYPE_DESC || null }),
    "FDIC BankFind branch locations (inputs/places/allegheny_bank_branches_fdic.csv)",
  );

  const hrsa = await read("allegheny_fqhc_sites_hrsa.csv");
  const centers = await write(
    "places-health-centers.geojson",
    hrsa,
    "lon",
    "lat",
    (r) => ({ name: r.site_name, organization: r.health_center || null, address: r.address || null, mobile: r.site_type === "Mobile Van" }),
    "HRSA health center service sites (inputs/places/allegheny_fqhc_sites_hrsa.csv)",
  );

  // Clinic NPIs for health-center sites duplicate the HRSA points; drop any
  // within ~100 m of one.
  const near = (lon: number, lat: number) =>
    centers.some((c) => {
      const [x, y] = c.geometry.coordinates as number[];
      const dx = (x - lon) * 111_320 * Math.cos((lat * Math.PI) / 180);
      const dy = (y - lat) * 110_540;
      return Math.hypot(dx, dy) < 100;
    });
  const clinics = (await read("allegheny_clinics_nppes_2026.csv")).filter(
    (r) => !(r.kind === "fqhc_clinic" && near(Number(r.lon), Number(r.lat))),
  );
  await write(
    "places-clinics.geojson",
    clinics,
    "lon",
    "lat",
    (r) => ({ name: r.name, kind: r.kind, address: [r.address, r.city].filter(Boolean).join(", ") || null }),
    "CMS NPPES NPI Registry, clinic taxonomies (inputs/places/allegheny_clinics_nppes_2026.csv)",
  );
}

if (import.meta.main) await buildPlacesMultisource();
