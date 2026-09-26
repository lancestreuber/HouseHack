// Subsidy designation areas (HUD QCT 2026, DDA 2026, Opportunity Zones) and
// HUD/DOT Location Affordability Index v3 (observed tract fields only).

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const HUD = "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services";
const BBOX = {
  geometry: "-80.36,40.19,-79.69,40.68",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
};

export async function buildDesignations() {
  const qct = await fetchAllGeoJSON(`${HUD}/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0`, {
    where: "GEOID LIKE '42003%'",
    outFields: ["GEOID"],
    maxAllowableOffset: 0.00005,
  });
  const dda = await fetchAllGeoJSON(`${HUD}/Difficult_Development_Areas_2026/FeatureServer/0`, {
    outFields: ["ZCTA5", "DDA_NAME"],
    maxAllowableOffset: 0.00005,
    extraParams: BBOX,
  });
  const oz = await fetchAllGeoJSON(`${HUD}/Opportunity_Zones/FeatureServer/13`, {
    outFields: ["GEOID10"],
    maxAllowableOffset: 0.00005,
    extraParams: BBOX,
  });
  const tag = (features: typeof qct, designation: string, idField: string) =>
    features.map((f) => ({
      type: "Feature" as const,
      geometry: f.geometry,
      properties: { designation, id: f.properties[idField] ?? null },
    }));
  await writeOverlay("designation-areas.geojson", {
    type: "FeatureCollection",
    features: [...tag(qct, "qct", "GEOID"), ...tag(dda, "dda", "ZCTA5"), ...tag(oz, "oz", "GEOID10")],
    metadata: { source: HUD, builtAt: new Date().toISOString() },
  });

  const lai = await fetchAllGeoJSON(`${HUD}/Location_Affordability_Index_v3/FeatureServer/0`, {
    where: "GEOID LIKE '42003%'",
    outFields: ["GEOID", "median_gross_rent", "avg_h_cost", "autos_per_hh", "pct_transit_j2w", "avg_hh_vmt"],
    maxAllowableOffset: 0.00005,
  });
  for (const f of lai) {
    const p = f.properties;
    const n = (v: unknown) => (v == null || Number(v) < 0 ? null : Number(v));
    f.properties = {
      geoid: p.GEOID,
      avg_hh_vmt: n(p.avg_hh_vmt) == null ? null : Math.round(n(p.avg_hh_vmt)!),
      autos_per_hh: n(p.autos_per_hh) == null ? null : Math.round(n(p.autos_per_hh)! * 100) / 100,
      pct_transit_j2w: n(p.pct_transit_j2w) == null ? null : Math.round(n(p.pct_transit_j2w)! * 10) / 10,
      avg_h_cost: n(p.avg_h_cost) == null ? null : Math.round(n(p.avg_h_cost)!),
      median_gross_rent: n(p.median_gross_rent),
    };
  }
  await writeOverlay("location-affordability.geojson", {
    type: "FeatureCollection",
    features: lai,
    metadata: { source: `${HUD}/Location_Affordability_Index_v3/FeatureServer/0`, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildDesignations();
