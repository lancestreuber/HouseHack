// FEMA National Flood Hazard Layer (effective FIRMs), Allegheny County bbox.
// "X minimal" (the background zone) is skipped; only mapped flood hazard kept.

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const LAYER = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28";
const COUNTY_BBOX = "-80.36,40.19,-79.69,40.68";

// Collapse FEMA zone codes into the three classes the map draws.
function floodClass(zone: unknown, subtype: unknown): string {
  const sub = String(subtype ?? "").toUpperCase();
  if (sub.includes("FLOODWAY")) return "floodway";
  if (zone === "A" || zone === "AE") return "sfha";
  if (sub.includes("0.2 PCT")) return "moderate";
  return "other";
}

export async function buildFloodZones() {
  const features = await fetchAllGeoJSON(LAYER, {
    where: "FLD_ZONE IN ('A','AE') OR ZONE_SUBTY = '0.2 PCT ANNUAL CHANCE FLOOD HAZARD'",
    outFields: ["FLD_ZONE", "ZONE_SUBTY", "SFHA_TF", "STATIC_BFE"],
    maxAllowableOffset: 0.0001,
    pageSize: 2000,
    extraParams: {
      geometry: COUNTY_BBOX,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
    },
  });
  for (const f of features) {
    const p = f.properties;
    const bfe = Number(p.STATIC_BFE);
    f.properties = {
      class: floodClass(p.FLD_ZONE, p.ZONE_SUBTY),
      zone: p.FLD_ZONE,
      subtype: p.ZONE_SUBTY ?? null,
      // FEMA uses -9999 for "no static base flood elevation".
      bfe_ft: Number.isFinite(bfe) && bfe > -9000 ? bfe : null,
    };
  }
  await writeOverlay("flood-zones.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: LAYER, dataset: "FEMA NFHL flood hazard zones", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildFloodZones();
