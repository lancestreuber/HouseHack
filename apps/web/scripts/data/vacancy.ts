// Vacant properties with addresses, from extracts in inputs/ (made by
// inputs/vacancy_extract.py; points are parcel centroids, no owner names).
// - Vacant buildings: City parcels USPS flagged vacant (no mail collected for
//   90+ days), Feb 2024 snapshot (City layer Vacant_USPS_Feb_24), joined to
//   ParcelsPublic for address, use and zoning.
// - Vacant lots: county assessment parcels whose use is vacant land, commercial
//   or industrial vacant land, or a builder's lot (WPRDC assessments, Sep 2026).

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { VACANT_LOT_GRID } from "../../src/components/map/overlays/vacancy";

import { writeOverlay } from "./arcgis";
import { parseCSV } from "./geo";

const INPUTS = path.resolve(import.meta.dirname, "inputs");
const num = (v: string | undefined) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const coord = (v: string) => Math.round(Number(v) * 1e5) / 1e5;

// Short codes keep the 75k-point lots file small.
const LOT_USE: Record<string, string> = {
  "VACANT LAND": "L",
  "VACANT COMMERCIAL LAND": "C",
  "BUILDERS LOT": "B",
  "VACANT INDUSTRIAL LAND": "I",
};

export async function buildVacancy() {
  const buildings = parseCSV(await Bun.file(`${INPUTS}/pgh_usps_vacant_parcels_feb2024.csv`).text())
    .filter((r) => num(r.lat) != null && num(r.lon) != null)
    .map((r) => ({
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [coord(r.lon), coord(r.lat)] },
      properties: {
        pin: r.pin,
        address: r.address || null,
        use: r.usedesc || null,
        class: r.classdesc || null,
        owner_category: r.owner_category || null,
        neighborhood: r.neighborhood || null,
        zoning: r.zoning || null,
      },
    }));
  await writeOverlay("vacant-buildings.geojson", {
    type: "FeatureCollection",
    features: buildings,
    metadata: {
      source: "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Vacant_USPS_Feb_24/FeatureServer/0",
      builtAt: new Date().toISOString(),
    },
  });

  const lots = parseCSV(await Bun.file(`${INPUTS}/allegheny_vacant_land_parcels.csv`).text())
    .filter((r) => num(r.lat) != null && num(r.lon) != null)
    .map((r) => ({
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [coord(r.lon), coord(r.lat)] },
      properties: {
        p: r.pin,
        a: r.address || null,
        m: r.municipality || null,
        u: LOT_USE[r.usedesc] ?? null,
        o: r.owner_type?.startsWith("CORPORATION") ? "corp" : r.owner_type ? "individual" : null,
        sf: num(r.lot_sf),
        v: num(r.fair_market_land),
      },
    }));
  // Keys: p pin, a address, m municipality, u use (L land, C commercial,
  // B builder's lot, I industrial), o owner type, sf lot sq ft, v land value.
  const { west, south, size, overviewCell } = VACANT_LOT_GRID;
  const tiles = new Map<string, typeof lots>();
  const cells = new Map<string, { x: number; y: number; n: number }>();
  for (const f of lots) {
    const [x, y] = f.geometry.coordinates as number[];
    const key = `${Math.floor((x - west) / size)}_${Math.floor((y - south) / size)}`;
    (tiles.get(key) ?? tiles.set(key, []).get(key)!).push(f);
    const cx = Math.floor(x / overviewCell);
    const cy = Math.floor(y / overviewCell);
    const cell = cells.get(`${cx}_${cy}`) ?? { x: (cx + 0.5) * overviewCell, y: (cy + 0.5) * overviewCell, n: 0 };
    cell.n++;
    cells.set(`${cx}_${cy}`, cell);
  }
  const tileDir = path.resolve(import.meta.dirname, "../../public/data/overlays/vacant-lots");
  await mkdir(tileDir, { recursive: true });
  for (const [key, features] of tiles) {
    await writeFile(path.join(tileDir, `${key}.geojson`), JSON.stringify({ type: "FeatureCollection", features }));
  }
  console.log(`wrote vacant-lots/: ${lots.length} lots in ${tiles.size} tiles (largest ${Math.max(...[...tiles.values()].map((t) => t.length))})`);
  await writeOverlay("vacant-lots-overview.geojson", {
    type: "FeatureCollection",
    features: [...cells.values()].map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [Math.round(c.x * 1e4) / 1e4, Math.round(c.y * 1e4) / 1e4] },
      properties: { n: c.n },
    })),
    metadata: { source: "WPRDC Allegheny County property assessments, vacant-land use codes", cell: overviewCell, builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildVacancy();
