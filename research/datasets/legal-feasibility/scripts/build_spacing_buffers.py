import json, math, pathlib

HERE = pathlib.Path(__file__).resolve().parent.parent
RADIUS_M = 800 * 0.3048
TRIGGER_TYPES = {
    "personal_care": "Personal Care Residence; health-care-related facility",
    "assisted_living": "Assisted Living; group care facility",
    "nursing": "health-care-related / group care facility",
}

def circle(lon, lat, r, n=48):
    mx = 111320.0 * math.cos(math.radians(lat))
    my = 110574.0
    pts = [[round(lon + r * math.cos(2 * math.pi * i / n) / mx, 6), round(lat + r * math.sin(2 * math.pi * i / n) / my, 6)] for i in range(n)]
    return pts + [pts[0]]

def main():
    src = json.load(open(HERE / "senior-and-group-housing.geojson"))
    feats = []
    for f in src["features"]:
        p = f["properties"]
        if p["type"] not in TRIGGER_TYPES:
            continue
        lon, lat = f["geometry"]["coordinates"]
        feats.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [circle(lon, lat, RADIUS_M)]},
            "properties": {
                "facility_id": p["id"], "facility_name": p["name"], "facility_type": p["type"],
                "counts_as": TRIGGER_TYPES[p["type"]], "radius_ft": 800,
                "rule": "New Assisted Living (§911.04.A.66) or Personal Care Residence (§911.04.A.95A/B) must be >= 800 ft from other such facilities",
                "completeness": "partial: licensed PA DHS personal care / assisted living and CMS nursing homes only; unlicensed group residences and group homes not included",
                "source": p["source"], "as_of": "2026-09-26",
            },
        })
    json.dump({"type": "FeatureCollection", "name": "care-facility-spacing-800ft", "features": feats}, open(HERE / "care-facility-spacing-800ft.geojson", "w"), separators=(",", ":"))
    print(len(feats), "buffers")

main()
