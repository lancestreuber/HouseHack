// Income, housing cost and vacancy.
// - ACS 2024 5-year by block group via Census Reporter (no key; api.census.gov needs one).
// - USPS vacant addresses 2023 Q4 by tract (WPRDC, CC0), on Census Reporter tract geometry.

import { writeOverlay, type GeoJSONFeature } from "./arcgis";

const CR = "https://api.censusreporter.org/1.0";
const BG_GEOS = "150|05000US42003";
const TRACT_GEOS = "140|05000US42003";
const TABLES = ["B19013", "B25064", "B25077", "B25070", "B25002", "B25004"];
const USPS_CSV = "https://data.wprdc.org/datastore/dump/70dd02d2-137d-43c9-b158-f7b1ec6c6d42";

type TableData = { estimate: Record<string, number | null>; error: Record<string, number | null> };
type CRData = { data: Record<string, Record<string, TableData>>; release: { name: string } };

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

const ratio = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

// ACS margins of error are large for block groups. Flag estimates whose MOE is
// over 40% of the estimate (or missing) so the map can grey them out.
function unreliable(est: number | null | undefined, moe: number | null | undefined) {
  if (est == null || est <= 0) return true;
  return moe != null && moe / est > 0.4;
}

async function buildBlockGroups() {
  const [data, geo] = await Promise.all([
    getJSON<CRData>(`${CR}/data/show/latest?table_ids=${TABLES.join(",")}&geo_ids=${BG_GEOS}`),
    getJSON<{ features: GeoJSONFeature[] }>(`${CR}/geo/show/latest?geo_ids=${BG_GEOS}`),
  ]);
  const features = geo.features.map((f) => {
    const id = String(f.properties.geoid);
    const t = data.data[id] ?? {};
    const e = (table: string, col: string) => t[table]?.estimate?.[`${table}${col}`] ?? null;
    const m = (table: string, col: string) => t[table]?.error?.[`${table}${col}`] ?? null;
    const n = (table: string, col: string) => e(table, col) ?? 0;

    const renters = n("B25070", "001") - n("B25070", "011"); // excludes "not computed"
    const burdened = n("B25070", "007") + n("B25070", "008") + n("B25070", "009") + n("B25070", "010");
    const units = n("B25002", "001");

    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: id.replace(/^15000US/, ""),
        median_hh_income: e("B19013", "001"),
        median_hh_income_moe: m("B19013", "001"),
        median_hh_income_unreliable: unreliable(e("B19013", "001"), m("B19013", "001")),
        median_gross_rent: e("B25064", "001"),
        median_gross_rent_moe: m("B25064", "001"),
        median_gross_rent_unreliable: unreliable(e("B25064", "001"), m("B25064", "001")),
        median_home_value: e("B25077", "001"),
        median_home_value_moe: m("B25077", "001"),
        median_home_value_unreliable: unreliable(e("B25077", "001"), m("B25077", "001")),
        rent_burden_pct: ratio(burdened, renters),
        severe_rent_burden_pct: ratio(n("B25070", "010"), renters),
        renter_households: renters,
        vacancy_pct: ratio(n("B25002", "003"), units),
        other_vacant_pct: ratio(n("B25004", "008"), units),
        housing_units: units,
      },
    };
  });
  await writeOverlay("housing-costs.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: `${CR}/data/show/latest`, dataset: data.release.name, builtAt: new Date().toISOString() },
  });
}

// Minimal CSV parser for the WPRDC dump (no quoted commas in the fields we use).
function parseCSV(text: string) {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const cols = header.split(",").map((c) => c.replace(/^"|"$/g, ""));
  return rows.map((row) => {
    const cells = row.split(",").map((c) => c.replace(/^"|"$/g, ""));
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

async function buildUspsVacancy() {
  const [csv, geo] = await Promise.all([
    fetch(USPS_CSV).then((r) => r.text()),
    getJSON<{ features: GeoJSONFeature[] }>(`${CR}/geo/show/latest?geo_ids=${TRACT_GEOS}`),
  ]);
  const byTract = new Map<string, Record<string, string>>();
  for (const row of parseCSV(csv)) {
    if (row.geoid?.startsWith("42003") && row.quarter_sortable === "2023-Q4") byTract.set(row.geoid, row);
  }
  const features = geo.features.map((f) => {
    const tract = String(f.properties.geoid).replace(/^14000US/, "");
    const row = byTract.get(tract);
    const active = Number(row?.ams_res ?? 0);
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: tract,
        res_addresses: row ? active : null,
        res_vacancy_pct: row ? ratio(Number(row.res_vac), active) : null,
        no_stat_pct: row ? ratio(Number(row.nostat_res), active) : null,
      },
    };
  });
  await writeOverlay("usps-vacancy.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: USPS_CSV, dataset: "HUD/USPS vacant addresses, 2023 Q4", builtAt: new Date().toISOString() },
  });
}

export async function buildHousingCosts() {
  await buildBlockGroups();
  await buildUspsVacancy();
}

if (import.meta.main) await buildHousingCosts();
