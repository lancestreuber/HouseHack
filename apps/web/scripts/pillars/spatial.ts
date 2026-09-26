// Grid-hashed spatial lookups for the pillar build: point-in-polygon, nearest
// point, and points within a radius. Coordinates are WGS84 lon/lat; distances
// use a local equirectangular approximation, accurate to well under 1% across
// Allegheny County.

type Ring = number[][];
type Polygon = Ring[];
export type Geometry = { type: string; coordinates: unknown };

const CELL = 0.005; // degrees: ~555 m north–south, ~425 m east–west at 40.4°N
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LON = 111_320 * Math.cos((40.44 * Math.PI) / 180);

export function distanceM(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot((ax - bx) * M_PER_DEG_LON, (ay - by) * M_PER_DEG_LAT);
}

const cellKey = (cx: number, cy: number) => cx * 100_000 + cy;
const cellOf = (v: number) => Math.floor(v / CELL);

export function polygonsOf(geometry: Geometry | null): Polygon[] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates as Polygon];
  if (geometry.type === "MultiPolygon") return geometry.coordinates as Polygon[];
  return [];
}

function ringContains(ring: Ring, x: number, y: number) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonContains(poly: Polygon, x: number, y: number) {
  if (!ringContains(poly[0], x, y)) return false;
  return !poly.slice(1).some((hole) => ringContains(hole, x, y));
}

export function bboxOf(polys: Polygon[]): [number, number, number, number] {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of polys)
    for (const [x, y] of poly[0]) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  return [minX, minY, maxX, maxY];
}

// Returns the payload of the first polygon containing (x, y).
export function polygonLookup<T>(items: { value: T; geometry: Geometry | null }[]) {
  const grid = new Map<number, number[]>();
  const entries = items.map((item) => {
    const polys = polygonsOf(item.geometry);
    return { value: item.value, polys, bbox: bboxOf(polys) };
  });
  entries.forEach((e, idx) => {
    if (!e.polys.length) return;
    const [minX, minY, maxX, maxY] = e.bbox;
    for (let cx = cellOf(minX); cx <= cellOf(maxX); cx++)
      for (let cy = cellOf(minY); cy <= cellOf(maxY); cy++) {
        const key = cellKey(cx, cy);
        const list = grid.get(key);
        if (list) list.push(idx);
        else grid.set(key, [idx]);
      }
  });
  return (x: number, y: number): T | undefined => {
    for (const idx of grid.get(cellKey(cellOf(x), cellOf(y))) ?? []) {
      const e = entries[idx];
      const [minX, minY, maxX, maxY] = e.bbox;
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      if (e.polys.some((p) => polygonContains(p, x, y))) return e.value;
    }
    return undefined;
  };
}

export type PointItem<T> = { x: number; y: number; value: T };

export function pointIndex<T>(points: PointItem<T>[]) {
  const grid = new Map<number, PointItem<T>[]>();
  for (const p of points) {
    const key = cellKey(cellOf(p.x), cellOf(p.y));
    const list = grid.get(key);
    if (list) list.push(p);
    else grid.set(key, [p]);
  }
  const cellM = CELL * Math.min(M_PER_DEG_LAT, M_PER_DEG_LON);

  // Nearest point within maxM, searching outward ring by ring.
  function nearest(x: number, y: number, maxM = 10_000): { item: PointItem<T>; distance: number } | null {
    const cx = cellOf(x);
    const cy = cellOf(y);
    let best: { item: PointItem<T>; distance: number } | null = null;
    const maxRing = Math.ceil(maxM / cellM) + 1;
    for (let r = 0; r <= maxRing; r++) {
      if (best && (r - 1) * cellM > best.distance) break;
      for (let dx = -r; dx <= r; dx++)
        for (let dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          for (const p of grid.get(cellKey(cx + dx, cy + dy)) ?? []) {
            const d = distanceM(x, y, p.x, p.y);
            if (d <= maxM && (!best || d < best.distance)) best = { item: p, distance: d };
          }
        }
    }
    return best;
  }

  function within(x: number, y: number, radiusM: number) {
    const r = Math.ceil(radiusM / cellM);
    const cx = cellOf(x);
    const cy = cellOf(y);
    const out: { item: PointItem<T>; distance: number }[] = [];
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++)
        for (const p of grid.get(cellKey(cx + dx, cy + dy)) ?? []) {
          const d = distanceM(x, y, p.x, p.y);
          if (d <= radiusM) out.push({ item: p, distance: d });
        }
    return out;
  }

  return { nearest, within };
}

// Up to n×n sample points inside a parcel, used to estimate the share of its
// area covered by a hazard polygon. Falls back to the given point for slivers.
export function samplePoints(polys: Polygon[], fallback: [number, number], n = 4): [number, number][] {
  const [minX, minY, maxX, maxY] = bboxOf(polys);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = minX + ((i + 0.5) / n) * (maxX - minX);
      const y = minY + ((j + 0.5) / n) * (maxY - minY);
      if (polys.some((p) => polygonContains(p, x, y))) out.push([x, y]);
    }
  return out.length ? out : [fallback];
}
