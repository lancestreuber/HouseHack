// PA Department of Education Future Ready PA Index 2024–25, Allegheny County
// public, charter, CTC and special-ed schools (cyber excluded). Built from the
// extract in inputs/ (made by inputs/schools_extract.py from PDE's xlsx files).

import path from "node:path";

import { writeOverlay } from "./arcgis";
import { parseCSV } from "./geo";

const INPUT = path.resolve(import.meta.dirname, "inputs/allegheny_schools_2024_25.csv");
const num = (v: string | undefined) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

export async function buildSchoolQuality() {
  const features = parseCSV(await Bun.file(INPUT).text())
    .filter((r) => num(r.lat) && num(r.lon))
    .map((r) => ({
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [num(r.lon), num(r.lat)] },
      properties: {
        name: r.name,
        district: r.district || null,
        type: r.type || null,
        grades: r.grades || null,
        enrollment: num(r.enrollment),
        econ_disadv_pct: num(r.econ_disadv_pct),
        english_learner_pct: num(r.english_learner_pct),
        ela_growth: num(r.ela_growth_pvaas),
        math_growth: num(r.math_growth_pvaas),
        ela_prof_pct: num(r.ela_prof_pct),
        math_prof_pct: num(r.math_prof_pct),
        attendance_pct: num(r.regular_attendance_pct),
        grad_4yr_pct: num(r.grad_4yr_pct),
        essa: r.essa_designation || null,
        website: r.website || null,
      },
    }));
  await writeOverlay("school-quality.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: "PA Dept of Education, Future Ready PA Index 2024–25", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildSchoolQuality();
