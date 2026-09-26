// Everyday services and facilities (extracts in inputs/places/), clipped to the county:
// - Magisterial district courts (ConnectGovs), where landlord-tenant cases are
//   heard. The judge's name is left out.
// - Licensed drug & alcohol treatment facilities and nursing homes (PA DOH via PASDA).
// - Farmers markets and farm stands (WPRDC, CC0).
// - POGOH bike-share stations (live GBFS station_information snapshot).
// - City playgrounds (WPRDC, CC-BY), Citiparks pools and recreation centers.
// - Colleges and universities (NCES EDGE postsecondary geocodes 2023–24).
// Phone numbers in the extracts are not carried over.

import path from "node:path";

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";
import { parseCSV, polygonIndex } from "./geo";

const DIR = path.resolve(import.meta.dirname, "inputs/places");
const COUNTY_BOUNDARY =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Boundary/FeatureServer/0";

type Row = Record<string, string>;
const round = (v: number) => Math.round(v * 1e5) / 1e5;
const title = (s: string | undefined) => (s ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : null);

export async function buildServices() {
  const boundary = await fetchAllGeoJSON(COUNTY_BOUNDARY, { outFields: [] });
  const index = polygonIndex(boundary.map((f) => ({ key: true, geometry: f.geometry as never })));

  async function write(file: string, rows: Row[], lon: string, lat: string, props: (r: Row) => Record<string, unknown>, source: string) {
    const features = rows
      .filter((r) => Number(r[lat]) && Number(r[lon]) && index(Number(r[lon]), Number(r[lat])) === true)
      .map((r) => ({ type: "Feature" as const, geometry: { type: "Point", coordinates: [round(Number(r[lon])), round(Number(r[lat]))] }, properties: props(r) }));
    await writeOverlay(file, { type: "FeatureCollection", features, metadata: { source, builtAt: new Date().toISOString() } });
    if (features.length < rows.length) console.log(`  ${file}: ${rows.length - features.length} outside the county or unlocated`);
  }
  const csv = async (file: string) => parseCSV(await Bun.file(`${DIR}/${file}`).text());
  // ArcGIS JSON exports: attributes + {x, y} geometry.
  const esri = async (file: string) =>
    ((await Bun.file(`${DIR}/${file}`).json()) as { features: { attributes: Row; geometry?: { x: number; y: number } }[] }).features.map((f) => ({
      ...f.attributes,
      _lon: String(f.geometry?.x ?? ""),
      _lat: String(f.geometry?.y ?? ""),
    }));

  await write("places-courts.geojson", await csv("allegheny_mdj_courts_connectgovs.csv"), "lon", "lat",
    (r) => ({ name: r.district, address: r.address || null, coverage: r.coverage?.replace(/\s+,/g, ",") || null }),
    "ConnectGovs Magisterial District Courts (inputs/places/allegheny_mdj_courts_connectgovs.csv)");

  await write("places-treatment.geojson", await csv("allegheny_drug_alcohol_treatment_doh.csv"), "Longitude", "Latitude",
    (r) => ({ name: title(r.FACILITY_NAME), address: [title(r.STREET), title(r.CITY_OR_BOROUGH)].filter(Boolean).join(", ") || null }),
    "PA DOH licensed drug & alcohol treatment facilities, PASDA DepHealth (inputs/places/allegheny_drug_alcohol_treatment_doh.csv)");

  await write("places-nursing-homes.geojson", await csv("allegheny_nursing_homes_doh.csv"), "LONGITUDE", "LATITUDE",
    (r) => ({ name: r.NAME, address: [title(r.STREET), title(r.CITY)].filter(Boolean).join(", ") || null, website: r.WEBSITE && r.WEBSITE !== "NA" ? r.WEBSITE : null }),
    "PA DOH nursing homes, PASDA DepHealth (inputs/places/allegheny_nursing_homes_doh.csv)");

  await write("places-farmers-markets.geojson", await csv("farmers_markets_2026.csv"), "longitude", "latitude",
    (r) => ({ name: r.market_name, type: r.market_type || null, address: [r.address1, r.city].filter(Boolean).join(", ") || null }),
    "WPRDC farmers markets, resource 0d99978a (inputs/places/farmers_markets_2026.csv)");

  await write("places-bike-share.geojson", await csv("pogoh_stations.csv"), "lon", "lat",
    (r) => ({ name: r.name, capacity: Number(r.capacity) || null }),
    "POGOH GBFS station_information (inputs/places/pogoh_stations.csv)");

  await write("places-playgrounds.geojson", await csv("city_playgrounds.csv"), "longitude", "latitude",
    (r) => ({ name: r.name, park: r.park || null, neighborhood: r.neighborhood || null }),
    "City of Pittsburgh playgrounds, WPRDC (inputs/places/city_playgrounds.csv)");

  const pools = (await esri("citipark_2.json")).map((r) => ({ ...r, kind: "pool" }));
  const rec = (await esri("citipark_1.json")).map((r) => ({ ...r, kind: "rec_center" }));
  await write("places-citiparks.geojson", [...pools, ...rec], "_lon", "_lat",
    (r) => ({
      name: r.name,
      kind: r.kind,
      address: r.address || r.ADDRESS || null,
      status: r.status || r.NOTES || null,
      hours: r.kind === "pool" ? (r.HOURS_M_F ? `Mon–Fri ${r.HOURS_M_F}; Sat–Sun ${r.HOURS_Sat_Sun}` : null) : r.hours ? `${r.days}: ${r.hours}` : null,
    }),
    "Citiparks facilities, City ArcGIS Citipark_Facilities layers 1–2 (inputs/places/citipark_*.json)");

  await write("places-colleges.geojson", await esri("nces_post.json"), "LON", "LAT",
    (r) => ({ name: r.NAME, address: [r.STREET, r.CITY].filter(Boolean).join(", ") || null }),
    "NCES EDGE postsecondary school geocodes 2023–24 (inputs/places/nces_post.json)");
}

if (import.meta.main) await buildServices();
