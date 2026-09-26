// Housing market and displacement.
// - Market Value Analysis 2021 (Reinvestment Fund for URA/County; CC0), block groups,
//   joined with the 2021 Displacement Risk Ratio (same package) on geoid.
// - ZIP-level market: median valid sale price 2024+ (County sales, CC0) and Zillow
//   ZORI rents (Zillow Research public aggregates), on TIGERweb ZCTA polygons.

import { fetchAllGeoJSON, writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV, readDbf } from "./geo";

const PKG = "https://data.wprdc.org/dataset/f669d677-c9e2-4d2f-b16f-c9ab5a4f3d10/resource";
const MVA = `${PKG}/ec09f5ad-f43e-4f06-af3a-65641c2818dc/download/mva.geojson`;
const DRR_ZIP = `${PKG}/3a648531-15d7-4fc0-aba0-611968b92435/download/pitts_allegheny_drr2021.zip`;
const SALES = "https://data.wprdc.org/datastore/dump/5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1";
const ZORI = "https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv";
const ZCTA = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1";

const round5 = (c: unknown): unknown =>
  Array.isArray(c) ? (typeof c[0] === "number" ? c.map((v) => Math.round(v * 1e5) / 1e5) : c.map(round5)) : c;
// The MVA file codes missing values as -9999; real values (including negative
// DRR and price change) are never that low.
const num = (v: unknown) =>
  v == null || v === "" || Number.isNaN(Number(v)) || Number(v) <= -9999 ? null : Number(v);
const pct = (v: unknown) => (num(v) == null ? null : Math.round(num(v)! * 1000) / 10);

async function buildMva() {
  const mva = (await fetch(MVA).then((r) => r.json())) as { features: GeoJSONFeature[] };

  const zipPath = `${Bun.env.TMPDIR ?? "/tmp"}/pitts-drr2021.zip`;
  await Bun.write(zipPath, await (await fetch(DRR_ZIP)).arrayBuffer());
  const member = Bun.spawnSync(["unzip", "-Z1", zipPath]).stdout.toString().split("\n").find((m) => m.endsWith(".dbf"))!;
  const bytes = Bun.spawnSync(["unzip", "-p", zipPath, member]).stdout;
  const drr = new Map(readDbf(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)).map((r) => [r.geoid, r]));

  const features = mva.features.map((f) => {
    const p = f.properties;
    const d = drr.get(String(p.geoid));
    // "Insufficient Data" rows carry DRR = 0, which means null, not zero risk.
    const drrClass = d?.DRR1920C || null;
    const insufficient = !drrClass || /insufficient/i.test(drrClass);
    const geometry = f.geometry as { type: string; coordinates: unknown };
    return {
      type: "Feature" as const,
      geometry: { type: geometry.type, coordinates: round5(geometry.coordinates) },
      properties: {
        geoid: p.geoid,
        mva: p.MVA21 ?? null,
        median_sale_1719: num(p.MSP1719),
        owner_occupied_pct: pct(p.PHHOO),
        subsidized_rental_pct: pct(p.PROSubHH),
        vacant_lot_pct: pct(p.PVacLot),
        violations_pct: pct(p.PViolAddre),
        foreclosure_pct: pct(p.pforc1719),
        drr_1920: insufficient ? null : num(d?.DRR1920),
        drr_class: insufficient ? null : drrClass,
        price_change_1419_pct: insufficient ? null : num(d?.PdMSP1419),
      },
    };
  });
  await writeOverlay("market-mva.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { sources: [MVA, DRR_ZIP], builtAt: new Date().toISOString() },
  });
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function buildZipMarket() {
  // Valid arm's-length sales since 2024, median price per ZIP (≥5 sales).
  const prices = new Map<string, number[]>();
  for (const r of parseCSV(await fetch(SALES).then((res) => res.text()))) {
    if (r.SALEDESC !== "VALID SALE" || !(r.SALEDATE >= "2024-01-01")) continue;
    const price = Number(r.PRICE);
    const zip = (r.PROPERTYZIP ?? "").slice(0, 5);
    if (!(price > 1000) || !zip) continue;
    (prices.get(zip) ?? prices.set(zip, []).get(zip)!).push(price);
  }

  const zori = new Map<string, { rent: number | null; yoy: number | null; fiveYr: number | null; month: string }>();
  const zoriRows = parseCSV(await fetch(ZORI).then((res) => res.text()));
  const months = Object.keys(zoriRows[0] ?? {}).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  const latest = months.at(-1)!;
  const back = (n: number) => months[months.length - 1 - n];
  for (const r of zoriRows) {
    if (r.State !== "PA" || r.CountyName !== "Allegheny County") continue;
    const now = num(r[latest]);
    const y1 = num(r[back(12)]);
    const y5 = num(r[back(60)]);
    zori.set(r.RegionName.padStart(5, "0"), {
      rent: now == null ? null : Math.round(now),
      yoy: now && y1 ? Math.round((now / y1 - 1) * 1000) / 10 : null,
      fiveYr: now && y5 ? Math.round((now / y5 - 1) * 1000) / 10 : null,
      month: latest,
    });
  }

  const zctas = await fetchAllGeoJSON(ZCTA, {
    where: "ZCTA5 LIKE '15%'",
    outFields: ["ZCTA5"],
    maxAllowableOffset: 0.0001,
    extraParams: {
      geometry: "-80.36,40.19,-79.69,40.68",
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
    },
  });
  const features = zctas
    .map((f) => {
      const zip = String(f.properties.ZCTA5);
      const sales = prices.get(zip) ?? [];
      const z = zori.get(zip);
      return {
        type: "Feature" as const,
        geometry: f.geometry,
        properties: {
          zip,
          valid_sales: sales.length,
          median_sale_price: sales.length >= 5 ? Math.round(median(sales)) : null,
          zori_rent: z?.rent ?? null,
          zori_yoy_pct: z?.yoy ?? null,
          zori_5yr_pct: z?.fiveYr ?? null,
          zori_month: z?.month ?? null,
        },
      };
    })
    // Keep ZIPs that have county sales (drops neighbouring counties' ZIPs).
    .filter((f) => f.properties.valid_sales > 0 || f.properties.zori_rent != null);
  await writeOverlay("market-zip.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { sources: [SALES, ZORI, ZCTA], zoriMonth: latest, builtAt: new Date().toISOString() },
  });
}

export async function buildMarket() {
  await buildMva();
  await buildZipMarket();
}

if (import.meta.main) await buildMarket();
