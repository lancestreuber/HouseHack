// HUD CHAS 2018–2022 (special ACS 5-year tabulation), housing cost burden by
// HUD income band per tract. Built from the Allegheny extract in inputs/
// (made by inputs/chas_extract.py from HUD's 226 MB national tract file).

import path from "node:path";

import { writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV } from "./geo";

const INPUT = path.resolve(import.meta.dirname, "inputs/chas_2018_2022_allegheny_tracts.csv");
const CR_GEO = "https://api.censusreporter.org/1.0/geo/show/latest?geo_ids=140|05000US42003";

const num = (v: string | undefined) => (v == null || v === "" ? null : Number(v));

export async function buildChas() {
  const rows = parseCSV(await Bun.file(INPUT).text());
  const byTract = new Map(rows.map((r) => [r.geoid, r]));
  const geo = (await fetch(CR_GEO).then((r) => r.json())) as { features: GeoJSONFeature[] };

  const features = geo.features.map((f) => {
    const geoid = String(f.properties.geoid).replace(/^14000US/, "");
    const r = byTract.get(geoid);
    // The extract stores shares as 0–1 fractions; convert to percent.
    const pct = (v: string | undefined) => {
      const n = num(v);
      return n == null || Number.isNaN(n) ? null : Math.round(n * 1000) / 10;
    };
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid,
        renter_hh: num(r?.renter_hh),
        owner_hh: num(r?.owner_hh),
        renter_le30: num(r?.renter_le30),
        renter_le30_cb50: num(r?.renter_le30_cb50),
        renter_lowinc_le80: num(r?.renter_lowinc_le80),
        renter_lowinc_costburdened: num(r?.renter_lowinc_costburdened),
        owner_lowinc_le80: num(r?.owner_lowinc_le80),
        owner_lowinc_costburdened: num(r?.owner_lowinc_costburdened),
        renter_lowinc_costburdened_pct: pct(r?.renter_lowinc_costburdened_pct),
        renter_le30_severe_pct: pct(r?.renter_le30_severe_pct),
        owner_lowinc_costburdened_pct: pct(r?.owner_lowinc_costburdened_pct),
      },
    };
  });
  await writeOverlay("chas-cost-burden.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: "HUD CHAS 2018–2022 tract file (Table 8)", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildChas();
