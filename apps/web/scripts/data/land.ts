// Land availability and acquisition signals (City of Pittsburgh).
// - City-owned property by inventory status (WPRDC, CC-BY).
// - Upcoming City treasurer tax sales.
// - City + school tax delinquency, 3+ prior years (a distress / acquisition signal).
// Owner names and billing addresses are never requested.

import { writeOverlay } from "./arcgis";
import { parseCSV } from "./geo";

const DUMP = "https://data.wprdc.org/datastore/dump";
const CITY_OWNED = `${DUMP}/e1dcee82-9179-4306-8167-5891915b62a7?fields=pin,address,parc_sq_ft,class,zoned_as,inventory_type,current_status,latitude,longitude,neighborhood_name`;
const TREASURY = `${DUMP}/6b2aa631-26e0-4d02-abe0-7fb87707210c?fields=pin,address,treasury_sale_date,total_tax_due,demo_cost_due,latitude,longitude,neighborhood_name`;
const DELINQUENT = `${DUMP}/ed0d1550-c300-4114-865c-82dc7c23235b?fields=pin,prior_years,current_delq_tax,prior_delq_tax,state_description,latitude,longitude,neighborhood`;

// Assumption, labeled in the UI: 3+ years delinquent is a common distress threshold.
const DELINQUENT_YEARS = 3;

const pt = (lon: number, lat: number) => ({
  type: "Point",
  coordinates: [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5],
});
const rows = async (url: string) =>
  parseCSV(await fetch(url).then((r) => r.text())).filter((r) => Number(r.latitude) && Number(r.longitude));

// Collapse inventory type + status into a few map classes.
function cityLandClass(inventory: string, status: string) {
  const s = status.toLowerCase();
  const inv = inventory.toLowerCase();
  if (inv.includes("park") || inv.includes("greenway") || s.includes("permanent")) return "not_developable";
  if (s.includes("available")) return "available";
  if (inv.includes("plb") || inv.includes("ura")) return "transfer";
  if (s.includes("pending")) return "pending";
  return "hold";
}

export async function buildLand() {
  const cityOwned = (await rows(CITY_OWNED)).map((r) => ({
    type: "Feature" as const,
    geometry: pt(Number(r.longitude), Number(r.latitude)),
    properties: {
      pin: r.pin,
      address: r.address || null,
      lot_sf: Number(r.parc_sq_ft) || null,
      zoned_as: r.zoned_as || null,
      inventory_type: r.inventory_type || null,
      status: r.current_status || null,
      class: cityLandClass(r.inventory_type ?? "", r.current_status ?? ""),
      neighborhood: r.neighborhood_name || null,
    },
  }));
  await writeOverlay("city-owned-land.geojson", {
    type: "FeatureCollection",
    features: cityOwned,
    metadata: { source: CITY_OWNED, builtAt: new Date().toISOString() },
  });

  const treasury = (await rows(TREASURY)).map((r) => ({
    type: "Feature" as const,
    geometry: pt(Number(r.longitude), Number(r.latitude)),
    properties: {
      pin: r.pin,
      address: r.address || null,
      sale_date: (r.treasury_sale_date ?? "").slice(0, 10) || null,
      tax_due: Number(r.total_tax_due) || null,
      demo_cost_due: Number(r.demo_cost_due) || null,
      neighborhood: r.neighborhood_name || null,
    },
  }));
  await writeOverlay("treasury-sales.geojson", {
    type: "FeatureCollection",
    features: treasury,
    metadata: { source: TREASURY, builtAt: new Date().toISOString() },
  });

  const delinquent = (await rows(DELINQUENT))
    .filter((r) => Number(r.prior_years) >= DELINQUENT_YEARS)
    .map((r) => ({
      type: "Feature" as const,
      geometry: pt(Number(r.longitude), Number(r.latitude)),
      properties: {
        pin: r.pin,
        years_delinquent: Number(r.prior_years),
        amount_owed: Math.round((Number(r.current_delq_tax) || 0) + (Number(r.prior_delq_tax) || 0)),
        land_use: r.state_description || null,
        neighborhood: r.neighborhood || null,
      },
    }));
  await writeOverlay("tax-delinquent.geojson", {
    type: "FeatureCollection",
    features: delinquent,
    metadata: { source: DELINQUENT, minYears: DELINQUENT_YEARS, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildLand();
