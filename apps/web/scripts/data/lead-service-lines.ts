// Pittsburgh Water (PWSA) service-line material, one point per service address.
// Only the material codes are kept (no addresses). Non-lead points (~80% of
// ~81k) are dropped to keep the static file small; the legend says so.

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";

const LAYER =
  "https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/PGH2O_Water_Service_Line_Material/FeatureServer/0";

// Collapse PWSA material strings into a few categories the map can color.
function category(material: unknown): string {
  const m = String(material ?? "").toLowerCase();
  if (m === "lead") return "lead";
  if (m.includes("galvanized")) return "galvanized";
  if (m.includes("nonlead") || m.includes("non-lead") || m.includes("abandoned")) return "non_lead";
  return "unknown";
}

// Worst of the two sides, so the map shows the most concerning status.
const SEVERITY = ["non_lead", "unknown", "galvanized", "lead"];
function worst(a: string, b: string) {
  return SEVERITY.indexOf(a) >= SEVERITY.indexOf(b) ? a : b;
}

export async function buildLeadServiceLines() {
  const features = await fetchAllGeoJSON(LAYER, {
    outFields: ["FinalReportedMaterialPublic", "FinalReportedMaterialPrivate"],
  });
  const kept = [];
  for (const f of features) {
    const pub = category(f.properties.FinalReportedMaterialPublic);
    const priv = category(f.properties.FinalReportedMaterialPrivate);
    const status = worst(pub, priv);
    if (status === "non_lead") continue;
    kept.push({ type: "Feature" as const, geometry: f.geometry, properties: { status, public: pub, private: priv } });
  }
  await writeOverlay("lead-service-lines.geojson", {
    type: "FeatureCollection",
    features: kept,
    metadata: {
      source: LAYER,
      dataset: "PWSA service line material",
      totalAddresses: features.length,
      builtAt: new Date().toISOString(),
    },
  });
}

if (import.meta.main) await buildLeadServiceLines();
