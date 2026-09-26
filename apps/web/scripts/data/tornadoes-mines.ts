// Tornado paths (NOAA Storm Prediction Center, 1950–2025, public domain) and
// undermined areas (PA DEP mined-out areas, underground coal).

import { fetchAllGeoJSON, writeOverlay } from "./arcgis";
import { readDbf } from "./geo";

const TORNADO_ZIP = "https://www.spc.noaa.gov/gis/svrgis/zipped/1950-2025-torn-aspath.zip";
const MINED_OUT =
  "https://gis.dep.pa.gov/depgisprd/rest/services/DistrictMiningOperations/DMO_MinedOutAreaCoalUnderground/FeatureServer/0";
const COUNTY_BBOX = [-80.36, 40.19, -79.69, 40.68] as const;

// --- Minimal shapefile reader: polyline .shp (type 3); .dbf via geo.readDbf. ---

function readPolylines(buf: DataView): number[][][][] {
  const shapes: number[][][][] = [];
  let off = 100;
  while (off < buf.byteLength) {
    const contentLen = buf.getInt32(off + 4, false) * 2;
    const rec = off + 8;
    const type = buf.getInt32(rec, true);
    const parts: number[][][] = [];
    if (type === 3) {
      const numParts = buf.getInt32(rec + 36, true);
      const numPoints = buf.getInt32(rec + 40, true);
      const partStarts = Array.from({ length: numParts }, (_, i) => buf.getInt32(rec + 44 + i * 4, true));
      const ptsOff = rec + 44 + numParts * 4;
      for (let p = 0; p < numParts; p++) {
        const end = p + 1 < numParts ? partStarts[p + 1] : numPoints;
        const line: number[][] = [];
        for (let i = partStarts[p]; i < end; i++) {
          line.push([buf.getFloat64(ptsOff + i * 16, true), buf.getFloat64(ptsOff + i * 16 + 8, true)]);
        }
        parts.push(line);
      }
    }
    shapes.push(parts);
    off = rec + contentLen;
  }
  return shapes;
}

function unzipMember(zipPath: string, pattern: RegExp): DataView {
  const list = Bun.spawnSync(["unzip", "-Z1", zipPath]).stdout.toString().split("\n");
  const member = list.find((m) => pattern.test(m));
  if (!member) throw new Error(`no ${pattern} in zip`);
  const bytes = Bun.spawnSync(["unzip", "-p", zipPath, member]).stdout;
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

const [minX, minY, maxX, maxY] = COUNTY_BBOX;
const inBox = ([x, y]: number[]) => x >= minX && x <= maxX && y >= minY && y <= maxY;
// Keep a track if any vertex, or its straight start→end segment midpoint, is in the county box.
function touchesCounty(parts: number[][][]) {
  return parts.some(
    (line) =>
      line.some(inBox) ||
      line.slice(1).some((pt, i) => inBox([(pt[0] + line[i][0]) / 2, (pt[1] + line[i][1]) / 2])),
  );
}

async function buildTornadoes() {
  const zipPath = `${Bun.env.TMPDIR ?? "/tmp"}/spc-tornado-paths.zip`;
  await Bun.write(zipPath, await (await fetch(TORNADO_ZIP)).arrayBuffer());
  const shapes = readPolylines(unzipMember(zipPath, /\.shp$/));
  const attrs = readDbf(unzipMember(zipPath, /\.dbf$/));
  const features = [];
  for (let i = 0; i < shapes.length; i++) {
    if (!shapes[i].length || !touchesCounty(shapes[i])) continue;
    const a = attrs[i];
    const mag = Number(a.mag);
    features.push({
      type: "Feature" as const,
      geometry: {
        type: "MultiLineString",
        coordinates: shapes[i].map((line) => line.map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5])),
      },
      properties: {
        year: Number(a.yr),
        date: a.date || null,
        mag: mag >= 0 ? mag : null,
        length_mi: Number(a.len) || null,
        width_yd: Number(a.wid) || null,
        injuries: Number(a.inj) || 0,
        fatalities: Number(a.fat) || 0,
      },
    });
  }
  await writeOverlay("tornado-paths.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { source: TORNADO_ZIP, builtAt: new Date().toISOString() },
  });
}

async function buildMinedOut() {
  const rows = await fetchAllGeoJSON(MINED_OUT, {
    outFields: ["COAL_SEAM", "OPERATION", "LASTMINED"],
    maxAllowableOffset: 0.0002,
    pageSize: 2000,
    extraParams: {
      geometry: COUNTY_BBOX.join(","),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
    },
  });
  for (const f of rows) {
    const p = f.properties;
    f.properties = { seam: p.COAL_SEAM ?? null, mine: p.OPERATION ?? null, last_mined: p.LASTMINED || null };
  }
  await writeOverlay("mined-out-areas.geojson", {
    type: "FeatureCollection",
    features: rows,
    metadata: { source: MINED_OUT, builtAt: new Date().toISOString() },
  });
}

export async function buildTornadoesAndMines() {
  await buildTornadoes();
  await buildMinedOut();
}

if (import.meta.main) await buildTornadoesAndMines();
