// Everyday amenities (county-wide points).
// - Groceries and restaurant/shop density: ACHD food facility permits (WPRDC, CC0).
// - Pharmacies, libraries, banks, etc.: Allegheny County Assets (WPRDC, CC0).
//   Rows flagged do_not_display or sensitive are dropped; contact fields never kept.

import { writeOverlay } from "./arcgis";
import { parseCSV } from "./geo";

const FOOD = "https://data.wprdc.org/datastore/dump/112a3821-334d-4f3f-ab40-4de1220b1a0a";
const ASSETS = "https://data.wprdc.org/datastore/dump/5c7825d2-6814-40c7-aefe-3d0f3d6f22e7";

const round = (v: number) => Math.round(v * 1e5) / 1e5;
const pt = (lon: number, lat: number) => ({ type: "Point", coordinates: [round(lon), round(lat)] });

const RESTAURANT = /^(chain )?restaurant with(out)? liquor$/i;
const SHOP = /^(chain )?retail\/convenience store$/i;

// Asset type -> output file (and optional name exclusions).
const ASSET_LAYERS: Record<string, { file: string; exclude?: RegExp }> = {
  pharmacies: { file: "places-pharmacies.geojson", exclude: /rite ?aid/i }, // Rite Aid closed its stores in 2025
  libraries: { file: "places-libraries.geojson" },
  health_centers: { file: "places-health-centers.geojson" },
  banks: { file: "places-banks.geojson" },
  post_offices: { file: "places-post-offices.geojson" },
  senior_centers: { file: "places-senior-centers.geojson" },
  food_banks: { file: "places-food-banks.geojson" },
  laundromats: { file: "places-laundromats.geojson" },
};

async function buildFood() {
  const rows = parseCSV(await fetch(FOOD).then((r) => r.text())).filter(
    (r) => !r.bus_cl_date && Number(r.x) && Number(r.y),
  );
  const groceries = rows
    .filter((r) => /^(chain )?supermarket$/i.test(r.description) || /\baldi\b/i.test(r.facility_name))
    .map((r) => ({
      type: "Feature" as const,
      geometry: pt(Number(r.x), Number(r.y)),
      properties: { name: r.facility_name, address: r.address || null, municipality: r.municipal || null },
    }));
  await writeOverlay("places-groceries.geojson", {
    type: "FeatureCollection",
    features: groceries,
    metadata: { source: FOOD, builtAt: new Date().toISOString() },
  });

  // Density layer: one weightless point per restaurant or shop.
  const commerce = rows
    .filter((r) => RESTAURANT.test(r.description) || SHOP.test(r.description))
    .map((r) => ({
      type: "Feature" as const,
      geometry: pt(Number(r.x), Number(r.y)),
      properties: { kind: RESTAURANT.test(r.description) ? "restaurant" : "shop" },
    }));
  await writeOverlay("commerce-density.geojson", {
    type: "FeatureCollection",
    features: commerce,
    metadata: { source: FOOD, builtAt: new Date().toISOString() },
  });
}

async function buildAssets() {
  const rows = parseCSV(await fetch(ASSETS).then((r) => r.text()));
  for (const [assetType, { file, exclude }] of Object.entries(ASSET_LAYERS)) {
    const features = rows
      .filter(
        (r) =>
          r.asset_type === assetType &&
          r.do_not_display !== "t" &&
          r.sensitive !== "t" &&
          Number(r.latitude) &&
          Number(r.longitude) &&
          !(exclude && exclude.test(r.name)),
      )
      .map((r) => ({
        type: "Feature" as const,
        geometry: pt(Number(r.longitude), Number(r.latitude)),
        properties: {
          name: r.name,
          address: r.street_address || null,
          municipality: r.municipality || null,
          hours: r.hours_of_operation || null,
        },
      }));
    await writeOverlay(file, {
      type: "FeatureCollection",
      features,
      metadata: { source: ASSETS, assetType, builtAt: new Date().toISOString() },
    });
  }
}

export async function buildAmenities() {
  await buildFood();
  await buildAssets();
}

if (import.meta.main) await buildAmenities();
