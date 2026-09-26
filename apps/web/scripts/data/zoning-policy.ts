// Zoning beyond the city line, city zoning overlays, historic districts and RCOs.
// - Suburban zoning from each municipality's own GIS, normalized to
//   { muni, zone_code, zone_desc } (codes are local and not comparable).
// - City overlays: inclusionary zoning, parking reduction, transit buffer,
//   multi-unit districts, historic districts.
// - Registered Community Organizations: contact names, emails, phones and
//   mailing addresses are never requested.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";

type MuniSource = { muni: string; url: string; code: string; desc?: string };

const SUBURBS: MuniSource[] = [
  { muni: "Penn Hills", url: "https://services5.arcgis.com/DllnbBENKfts6TQD/arcgis/rest/services/Zoning/FeatureServer/1", code: "ZONING", desc: "ZONING_DES" },
  { muni: "Bethel Park", url: "https://services7.arcgis.com/ptmAvweveinujaUS/arcgis/rest/services/Public_View___Zoning_and_Parcels_and_Addresses/FeatureServer/4", code: "ZONING" },
  { muni: "Monroeville", url: "https://services9.arcgis.com/8FOQ9nDvQJjqML1o/arcgis/rest/services/Monroeville_Zoning_view/FeatureServer/0", code: "ZONE" },
  { muni: "Mt. Lebanon", url: "https://services8.arcgis.com/4sXEsxQJTWBlSKA1/arcgis/rest/services/BasemapFeatureService_ReadOnl/FeatureServer/9", code: "ZONECLASS", desc: "ZONEDESC" },
  { muni: "Whitehall", url: "https://services8.arcgis.com/A3O49kUB98Moka4Y/arcgis/rest/services/MasterFeatureService_ReadOnlyView/FeatureServer/24", code: "ZONECLASS", desc: "ZONEDESC" },
  { muni: "Upper St. Clair", url: "https://services6.arcgis.com/XgADIppb49xTX0al/arcgis/rest/services/MasterFeatureService_ReadOnlyView/FeatureServer/35", code: "ZONECLASS", desc: "ZONEDESC" },
  { muni: "Dormont", url: "https://services6.arcgis.com/pIIoxuHIRX225O2N/arcgis/rest/services/MasterFeatureService_PublicView/FeatureServer/7", code: "ZONING" },
  { muni: "Moon Township", url: "https://services8.arcgis.com/g8yM34Z7IOCI3L3m/arcgis/rest/services/Zoning/FeatureServer/2", code: "Zoning" },
  { muni: "McCandless", url: "https://services1.arcgis.com/q8sarOko6mCDwiGm/arcgis/rest/services/McCandless_Zoning/FeatureServer/1", code: "ZoningAbbr", desc: "Zoning_Name" },
];

const CITY = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services";
const CITY_OVERLAYS: { layer: string; kind: string; label: string }[] = [
  { layer: "InclusionaryHousingOverlayDistrict", kind: "inclusionary", label: "Inclusionary zoning overlay" },
  { layer: "PGHWebParkingReductionOverlay", kind: "parking_reduction", label: "Parking reduction overlay" },
  { layer: "PGHWebMajorTransitBuffer", kind: "transit_buffer", label: "Major transit buffer (1,500 ft parking reduction)" },
  { layer: "Multi_Unit_Zoning_Districts", kind: "multi_unit", label: "District permits multi-unit housing" },
];

export async function buildZoningPolicy() {
  const suburban: GeoJSONFeature[] = [];
  for (const m of SUBURBS) {
    try {
      const rows = await fetchAllGeoJSON(m.url, {
        outFields: [m.code, ...(m.desc ? [m.desc] : [])],
        maxAllowableOffset: 0.00003,
      });
      for (const f of rows) {
        suburban.push({
          type: "Feature",
          geometry: f.geometry,
          properties: {
            muni: m.muni,
            zone_code: f.properties[m.code] ?? null,
            zone_desc: m.desc ? (f.properties[m.desc] ?? null) : null,
            source_url: m.url,
          },
        });
      }
    } catch (error) {
      console.warn(`suburban zoning ${m.muni} skipped:`, error);
    }
  }
  await writeOverlay("suburban-zoning.geojson", {
    type: "FeatureCollection",
    features: suburban,
    metadata: { munis: SUBURBS.map((m) => m.muni), builtAt: new Date().toISOString() },
  });

  const overlays: GeoJSONFeature[] = [];
  for (const o of CITY_OVERLAYS) {
    const rows = await fetchAllGeoJSON(`${CITY}/${o.layer}/FeatureServer/0`, {
      outFields: [],
      maxAllowableOffset: 0.00003,
    });
    for (const f of rows) overlays.push({ type: "Feature", geometry: f.geometry, properties: { kind: o.kind, label: o.label } });
  }
  const historic = await fetchAllGeoJSON(`${CITY}/PGHWebCHDHistoricDistricts/FeatureServer/0`, {
    outFields: ["historic_name", "guideline_link"],
    maxAllowableOffset: 0.00003,
  });
  for (const f of historic) {
    overlays.push({
      type: "Feature",
      geometry: f.geometry,
      properties: {
        kind: "historic",
        label: `City historic district: ${f.properties.historic_name ?? ""}`.trim(),
        link: f.properties.guideline_link ?? null,
      },
    });
  }
  await writeOverlay("city-zoning-overlays.geojson", {
    type: "FeatureCollection",
    features: overlays,
    metadata: { source: CITY, builtAt: new Date().toISOString() },
  });

  const rcos = await fetchAllGeoJSON(`${CITY}/PGHWebRCO/FeatureServer/0`, {
    outFields: ["organization_name", "website", "meeting_dates__and_times", "rco_expiration_date"],
    maxAllowableOffset: 0.00003,
  });
  for (const f of rcos) {
    const p = f.properties;
    const expires = typeof p.rco_expiration_date === "number" ? new Date(p.rco_expiration_date).toISOString().slice(0, 10) : null;
    f.properties = {
      name: p.organization_name ?? null,
      website: p.website ?? null,
      meetings: p.meeting_dates__and_times ?? null,
      expires,
    };
  }
  await writeOverlay("rcos.geojson", {
    type: "FeatureCollection",
    features: rcos,
    metadata: { source: `${CITY}/PGHWebRCO/FeatureServer/0`, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildZoningPolicy();
