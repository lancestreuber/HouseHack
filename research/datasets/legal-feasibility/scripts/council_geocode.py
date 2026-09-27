import json, re, urllib.request, urllib.parse, ssl, certifi, concurrent.futures as cf

CTX = ssl.create_default_context(cafile=certifi.where())
PARCEL_URL = "https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0/query"
CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
R = json.load(open("rows.json"))


def get(url):
    for _ in range(3):
        try:
            return json.load(urllib.request.urlopen(url, timeout=60, context=CTX))
        except Exception as e:
            err = e
    return {"error": str(err)}


def norm(p):
    parts = p.split("-")
    out = []
    for x in parts:
        out.append(str(int(x)) if x.isdigit() else x.upper())
    cands = ["-".join(out)]
    if len(out) == 4:
        cands.append("-".join(out[:3] + ["0", out[3]]))
    return cands


def centroid(rings):
    ring = rings[0]
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        c = x1 * y2 - x2 * y1
        a += c
        cx += (x1 + x2) * c
        cy += (y1 + y2) * c
    if abs(a) < 1e-14:
        xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
        return sum(xs) / len(xs), sum(ys) / len(ys)
    a *= 0.5
    return cx / (6 * a), cy / (6 * a)


def parcel_lookup(plist):
    cands = {}
    for p in plist[:25]:
        for c in norm(p):
            cands[c] = p
    if not cands:
        return []
    where = "MAPBLOCKLOT IN (" + ",".join("'" + c + "'" for c in cands) + ")"
    q = urllib.parse.urlencode({"where": where, "outFields": "MAPBLOCKLOT,PIN", "returnGeometry": "true", "outSR": "4326", "f": "json"})
    d = get(PARCEL_URL + "?" + q)
    out = []
    for f in d.get("features", []) if isinstance(d, dict) else []:
        g = f.get("geometry", {})
        if g.get("rings"):
            out.append((f["attributes"]["MAPBLOCKLOT"], f["attributes"]["PIN"], centroid(g["rings"])))
    return out


def census(addr):
    q = urllib.parse.urlencode({"address": addr + ", Pittsburgh, PA", "benchmark": "Public_AR_Current", "format": "json"})
    d = get(CENSUS_URL + "?" + q)
    try:
        m = d["result"]["addressMatches"]
    except Exception:
        return None
    if not m:
        return None
    c = m[0]["coordinates"]
    ma = m[0]["matchedAddress"].upper()
    words = [w for w in re.findall(r"[A-Za-z]{3,}", addr) if w.upper() not in ("STREET","AVENUE","ROAD","WAY","BOULEVARD","DRIVE","PLACE","LANE","TERRACE","COURT","NORTH","SOUTH","EAST","WEST","AVE","BLVD")]
    if words and not any(w.upper() in ma for w in words):
        return None
    if not (-80.10 < c["x"] < -79.86 and 40.36 < c["y"] < 40.51):
        return None
    return c["x"], c["y"], m[0]["matchedAddress"]


def job(r):
    plist = [p for p in r["parcels"].split("|") if p]
    alist = [a for a in r["addresses"].split("|") if a]
    res = dict(lon="", lat="", geocode_method="none", geocode_detail="", parcels_matched="")
    tdr = r["action_subtype"] == "cu_transfer_of_development_rights"
    if tdr:
        plist = plist[-1:]
    if plist:
        hits = parcel_lookup(plist)
        if hits:
            xs = [h[2][0] for h in hits]; ys = [h[2][1] for h in hits]
            res.update(lon=round(sum(xs) / len(xs), 6), lat=round(sum(ys) / len(ys), 6),
                       geocode_method="allegheny_parcel_centroid" + ("_mean" if len(hits) > 1 else ""),
                       geocode_detail=f"{len(hits)} of {min(len(plist),25)} parcel ids matched MAPBLOCKLOT" + (" (only first 25 queried)" if len(plist) > 25 else "") + ("; TDR: receiving site = last parcel in title" if tdr else ""),
                       parcels_matched="|".join(h[0] for h in hits))
            return r["matter_id"], res
    for a in alist:
        c = census(a)
        if c:
            res.update(lon=round(c[0], 6), lat=round(c[1], 6), geocode_method="census_geocoder_onelineaddress",
                       geocode_detail=f"input '{a}, Pittsburgh, PA' -> '{c[2]}'")
            return r["matter_id"], res
    if plist or alist:
        res["geocode_detail"] = "parcel/address parsed but no match"
    return r["matter_id"], res


G = {}
with cf.ThreadPoolExecutor(8) as ex:
    for k, v in ex.map(job, R):
        G[k] = v
json.dump(G, open("geo.json", "w"))
import collections
print(collections.Counter(v["geocode_method"] for v in G.values()))
