import { useTheme } from "next-themes";

// A static "screenshot" of one parcel: OpenStreetMap raster tiles (the
// explorer's OSM basemap, with the same dark-mode filter) and the parcel
// outline drawn on top, all in one SVG. No map instance, so a dashboard full
// of them stays cheap. (CARTO's raster tiles need an API key; its vector
// style, used by the explorer, doesn't.)

export type Outline = { type: "Polygon" | "MultiPolygon"; coordinates: unknown };

const TILE = 256;
const MIN_ZOOM = 14;
const MAX_ZOOM = 19;
// How much of the frame the parcel's bounding box fills.
const FILL = 0.55;

/** Web Mercator world pixels at zoom 0. */
function project([lng, lat]: number[]): [number, number] {
  const phi = (lat! * Math.PI) / 180;
  return [((lng! + 180) / 360) * TILE, ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * TILE];
}

function rings(outline: Outline): number[][][] {
  return outline.type === "Polygon" ? (outline.coordinates as number[][][]) : (outline.coordinates as number[][][][]).flat();
}

export function ParcelThumb({ outline, width = 320, height = 200, className }: { outline: Outline | undefined; width?: number; height?: number; className?: string }) {
  const { resolvedTheme } = useTheme();
  const frame = <div className={`bg-muted ${className ?? ""}`} style={{ aspectRatio: `${width} / ${height}` }} aria-hidden />;
  if (!outline) return frame;

  const world = rings(outline).map((ring) => ring.map(project));
  const xs = world.flat().map((p) => p[0]);
  const ys = world.flat().map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max((maxX - minX) / width, (maxY - minY) / height, 1e-9);
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(Math.log2(FILL / span))));
  const scale = 2 ** zoom;
  const originX = ((minX + maxX) / 2) * scale - width / 2;
  const originY = ((minY + maxY) / 2) * scale - height / 2;

  const dark = resolvedTheme !== "light";
  const tiles: { x: number; y: number }[] = [];
  for (let x = Math.floor(originX / TILE); x <= Math.floor((originX + width) / TILE); x++)
    for (let y = Math.floor(originY / TILE); y <= Math.floor((originY + height) / TILE); y++) tiles.push({ x, y });

  const d = world
    .map((ring) => `M${ring.map(([x, y]) => `${(x * scale - originX).toFixed(1)},${(y * scale - originY).toFixed(1)}`).join("L")}Z`)
    .join("");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`block bg-muted ${className ?? ""}`} role="img" aria-label="Parcel outline on the map">
      <g style={dark ? { filter: "grayscale(100%) hue-rotate(180deg) invert(100%)" } : undefined}>
        {tiles.map(({ x, y }) => (
          <image
            key={`${x}-${y}`}
            href={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
            x={x * TILE - originX}
            y={y * TILE - originY}
            width={TILE}
            height={TILE}
          />
        ))}
      </g>
      <path d={d} fillRule="evenodd" className="fill-brass/25 stroke-brass" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}
