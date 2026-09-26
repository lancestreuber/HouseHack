// Small geometry helpers for build scripts: assign points to polygons.

type Ring = number[][];
type Polygon = Ring[];
type Geometry = { type: string; coordinates: unknown };

function ringContains(ring: Ring, x: number, y: number) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonContains(poly: Polygon, x: number, y: number) {
  if (!ringContains(poly[0], x, y)) return false;
  return !poly.slice(1).some((hole) => ringContains(hole, x, y));
}

function polygonsOf(geometry: Geometry): Polygon[] {
  if (geometry.type === "Polygon") return [geometry.coordinates as Polygon];
  if (geometry.type === "MultiPolygon") return geometry.coordinates as Polygon[];
  return [];
}

type Indexed<T> = { key: T; polys: Polygon[]; bbox: [number, number, number, number] };

// Point-in-polygon lookup with a bounding-box prefilter. Fine for a few hundred
// polygons and a few hundred thousand points.
export function polygonIndex<T>(items: { key: T; geometry: Geometry }[]) {
  const indexed: Indexed<T>[] = items.map(({ key, geometry }) => {
    const polys = polygonsOf(geometry);
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of polys)
      for (const [px, py] of poly[0]) {
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    return { key, polys, bbox: [minX, minY, maxX, maxY] };
  });
  return (x: number, y: number): T | undefined => {
    for (const item of indexed) {
      const [minX, minY, maxX, maxY] = item.bbox;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      if (item.polys.some((poly) => polygonContains(poly, x, y))) return item.key;
    }
    return undefined;
  };
}

// RFC 4180-ish CSV parser (handles quoted fields with commas/newlines).
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift()?.map((h) => h.replace(/^﻿/, "")) ?? [];
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}
