import { customType, index, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

// Drizzle's built-in `geometry()` column only supports Point geometries
// (it hardcodes `geometry(point, srid)` as the column type). Parcels are
// Polygon/MultiPolygon, so we define our own generic geometry column here.
// Values are always written/read through raw SQL (ST_GeomFromGeoJSON /
// ST_AsGeoJSON), so no driver value mapping is needed.
const geometryColumn = customType<{ data: string }>({
  dataType() {
    return "geometry(Geometry,4326)";
  },
});

// Allegheny County parcel boundaries (Pittsburgh & suburbs), imported from
// WPRDC's countywide parcel GeoJSON. Source CRS is EPSG:2272 (PA State Plane
// South, feet); geometries are reprojected to EPSG:4326 (lon/lat) at import
// time so they can be rendered directly on a web map.
export const parcel = pgTable(
  "parcel",
  {
    id: serial("id").primaryKey(),
    pin: text("pin").notNull().unique(),
    properties: jsonb("properties").notNull(),
    geom: geometryColumn("geom").notNull(),
  },
  (table) => [index("parcel_geom_idx").using("gist", table.geom)],
);
