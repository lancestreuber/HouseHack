// Landslide susceptibility polygons (county-wide) and county DPW landslide incidents.
// Provenance of the polygons is inferred, not documented: the flag set matches
// USGS 1970s–80s landslide-susceptibility mapping of Allegheny County.

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const SUSCEPTIBILITY =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Prone_Areas/FeatureServer/0";
const INCIDENTS = "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslides_DPW/FeatureServer/0";

const FLAGS = ["RECLAN", "ROCKFALL", "PREHIS", "REDBED", "MANFILL", "CREEP", "VSLOPE"] as const;

// Most severe class wins.
function landslideClass(p: Record<string, unknown>): string | null {
  const on = (f: string) => String(p[f] ?? "").toUpperCase() === "Y";
  if (on("RECLAN") || on("ROCKFALL")) return "recent";
  if (on("PREHIS") || on("REDBED")) return "old_or_redbed";
  if (on("MANFILL") || on("CREEP") || on("VSLOPE")) return "fill_or_creep";
  return null;
}

export async function buildLandslides() {
  const polygons = await fetchAllGeoJSON(SUSCEPTIBILITY, {
    outFields: [...FLAGS],
    maxAllowableOffset: 0.00005,
  });
  const kept = [];
  for (const f of polygons) {
    const cls = landslideClass(f.properties);
    if (!cls) continue;
    const flags = FLAGS.filter((flag) => String(f.properties[flag] ?? "").toUpperCase() === "Y").map((x) =>
      x.toLowerCase(),
    );
    kept.push({ type: "Feature" as const, geometry: f.geometry, properties: { class: cls, flags: flags.join(",") } });
  }
  await writeOverlay("landslide-susceptibility.geojson", {
    type: "FeatureCollection",
    features: kept,
    metadata: { source: SUSCEPTIBILITY, dataset: "Allegheny County landslide-prone areas", builtAt: new Date().toISOString() },
  });

  const incidents = await fetchAllGeoJSON(INCIDENTS, {
    outFields: ["Date_Occurred", "Municipality", "Location", "Traffic_Restriction", "Remediated"],
  });
  for (const f of incidents) {
    const p = f.properties;
    const date = typeof p.Date_Occurred === "number" ? new Date(p.Date_Occurred).toISOString().slice(0, 10) : null;
    f.properties = {
      date,
      municipality: p.Municipality ?? null,
      location: p.Location ?? null,
      traffic_restriction: p.Traffic_Restriction ?? null,
      remediated: p.Remediated ?? null,
    };
  }
  await writeOverlay("landslide-incidents.geojson", {
    type: "FeatureCollection",
    features: incidents,
    metadata: { source: INCIDENTS, dataset: "Allegheny County DPW landslides", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildLandslides();
