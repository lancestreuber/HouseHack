// City of Pittsburgh hazard overlay districts (Zoning Code Ch. 906): landslide-
// prone and undermined areas (the 25%+ slope layer is fetched live). These are the
// City's own triggers for extra review, distinct from the county/USGS layers.
// Also county landslide sites with FEMA public-assistance damage records.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";

const CITY = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services";
const PUBLIC_ASSISTANCE =
  "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Public_Assistance/FeatureServer/0";

// Slope25 is too detailed to ship as a file (~13 MB even simplified); the map
// fetches it by viewport instead (overlays/city-hazards.ts).
const LAYERS = [
  { service: "PGHWebLandslideProne", kind: "landslide_prone", file: "city-hazard-overlays.geojson", offset: 0.00003 },
  { service: "PGHWebUndermined", kind: "undermined", file: "city-hazard-overlays.geojson", offset: 0.00003 },
];

export async function buildCityHazards() {
  const byFile = new Map<string, GeoJSONFeature[]>();
  for (const l of LAYERS) {
    const rows = await fetchAllGeoJSON(`${CITY}/${l.service}/FeatureServer/0`, {
      outFields: [],
      maxAllowableOffset: l.offset,
      geometryPrecision: 5,
    });
    const list = byFile.get(l.file) ?? [];
    for (const f of rows) if (f.geometry) list.push({ type: "Feature", geometry: f.geometry, properties: { kind: l.kind } });
    byFile.set(l.file, list);
  }
  for (const [file, features] of byFile) {
    await writeOverlay(file, {
      type: "FeatureCollection",
      features,
      metadata: { source: CITY, layers: LAYERS.filter((l) => l.file === file).map((l) => l.service), builtAt: new Date().toISOString() },
    });
  }

  const sites = await fetchAllGeoJSON(PUBLIC_ASSISTANCE, {
    outFields: ["Name", "Jurisdiction", "Type", "Category", "Damage", "Damage_Value"],
  });
  for (const f of sites) {
    const p = f.properties;
    f.properties = {
      location: p.Name ?? null,
      municipality: p.Jurisdiction ?? null,
      type: p.Type ?? null,
      category: p.Category ?? null,
      damage: p.Damage ?? null,
      damage_value: p.Damage_Value ?? null,
    };
  }
  await writeOverlay("landslide-public-assistance.geojson", {
    type: "FeatureCollection",
    features: sites,
    metadata: { source: PUBLIC_ASSISTANCE, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildCityHazards();
