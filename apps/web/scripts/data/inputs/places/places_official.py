"""Official-source place layers for Allegheny County (handoffs #28 and #30).

Builds, from live public APIs:
  allegheny_bank_branches_fdic.csv        FDIC BankFind locations
  allegheny_fqhc_sites_hrsa.csv           HRSA health-center service sites (active, non-admin)
  allegheny_clinics_nppes_2026.csv        NPPES urgent care / FQHC / primary / community clinics
                                          (needs nppes_clinics.json from nppes_clinics.py)
  allegheny_police_merged.csv             ConnectGovs municipal police + OSM police
  allegheny_ems_merged.csv                ConnectGovs designated EMS agencies + OSM ambulance stations
  allegheny_mdj_courts_connectgovs.csv    Magisterial district court offices (judge names omitted)
  allegheny_fire_stations_merged.csv      ConnectGovs fire departments + City fire stations + OSM

OSM inputs come from osm_amenities_allegheny.json (osm_tiles.sh + osm_merge.py).
Clip every output to the county polygon afterwards, but keep ConnectGovs rows even
when the station sits just over the line (they serve Allegheny municipalities).

Usage: python3 places_official.py [--offline]
  --offline reuses the cached API responses in this folder instead of refetching.
"""
import csv
import json
import math
import re
import subprocess
import sys
from collections import defaultdict

OFFLINE = "--offline" in sys.argv
CG = "https://services.arcgis.com/Kwm2c3YqtFhUC26N/arcgis/rest/services"
PGH = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services"


def fetch(url, path, args=()):
    if not OFFLINE:
        subprocess.run(["curl", "-s", "-m", "120", *args, "-o", path, url], check=True)
    return path


def dist_m(a, b):
    return math.hypot((a[0] - b[0]) * 85000, (a[1] - b[1]) * 111000)


def norm(addr, n=22):
    return re.sub(r"[^A-Z0-9]", "", (addr or "").upper())[:n]


def write(path, rows):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    print(path, len(rows))


def osm(category, named=True):
    return [o for o in json.load(open("osm_amenities_allegheny.json"))
            if o["category"] == category and (o["name"] or not named)]


def banks():
    fetch("https://api.fdic.gov/banks/locations", "fdic.json", [
        "-G", "--data-urlencode", 'filters=STALP:PA AND COUNTY:"Allegheny"',
        "--data-urlencode", "fields=NAME,OFFNAME,ADDRESS,CITY,ZIP,LATITUDE,LONGITUDE,SERVTYPE_DESC",
        "--data-urlencode", "limit=2000"])
    rows = [x["data"] for x in json.load(open("fdic.json"))["data"]]
    keys = ["NAME", "OFFNAME", "ADDRESS", "CITY", "ZIP", "LATITUDE", "LONGITUDE", "SERVTYPE_DESC"]
    write("allegheny_bank_branches_fdic.csv", [{k: r.get(k) for k in keys} for r in rows])


def hrsa():
    fetch("https://data.hrsa.gov/DataDownload/DD_Files/Health_Center_Service_Delivery_and_LookAlike_Sites.csv",
          "hrsa_sites.csv", ["-A", "Mozilla/5.0"])
    rows = []
    for x in csv.DictReader(open("hrsa_sites.csv", encoding="utf-8-sig")):
        if not x["State and County Federal Information Processing Standard Code"].strip().startswith("42003"):
            continue
        if x["Site Status Description"] != "Active" or x["Health Center Type Description"] == "Administrative":
            continue
        rows.append({
            "site_name": x["Site Name"], "health_center": x["Health Center Name"], "address": x["Site Address"],
            "site_type": x["Health Center Location Type Description"], "hc_type": x["Health Center Type Description"],
            "lon": x["Geocoding Artifact Address Primary X Coordinate"],
            "lat": x["Geocoding Artifact Address Primary Y Coordinate"], "website": x["Site Web Address"],
        })
    write("allegheny_fqhc_sites_hrsa.csv", rows)


def clinics():
    kinds = {
        "Clinic/Center, Urgent Care": "urgent_care",
        "Clinic/Center, Federally Qualified Health Center (FQHC)": "fqhc_clinic",
        "Clinic/Center, Primary Care": "primary_care_clinic",
        "Clinic/Center, Community Health": "community_health_clinic",
    }
    zips = set(open("allegheny_zips.txt").read().split())
    rows, seen = [], set()
    for npi, x in json.load(open("nppes_clinics.json")).items():
        loc = [a for a in x["addresses"] if a["address_purpose"] == "LOCATION"][0]
        prim = [t["desc"] for t in x["taxonomies"] if t.get("primary")]
        kind = kinds.get(prim[0] if prim else "")
        if loc["postal_code"][:5] not in zips or not kind:
            continue
        key = (norm(loc["address_1"], 18), loc["postal_code"][:5], kind)
        if key in seen:
            continue
        seen.add(key)
        dba = [o.get("organization_name") or o.get("name") for o in x.get("other_names", []) if o.get("code") == "3"]
        name = (dba[0] if dba and dba[0] else None) or x["basic"].get("organization_name") or ""
        rows.append({"npi": npi, "name": name.title(), "kind": kind, "address": loc["address_1"],
                     "city": loc["city"], "zip": loc["postal_code"][:5]})
    with open("clin_in.csv", "w", newline="") as f:
        csv.writer(f).writerows([[r["npi"], r["address"], r["city"], "PA", r["zip"]] for r in rows])
    fetch("https://geocoding.geo.census.gov/geocoder/locations/addressbatch", "clin_geo.csv",
          ["--form", "addressFile=@clin_in.csv", "--form", "benchmark=Public_AR_Current"])
    geo = {r[0]: r for r in csv.reader(open("clin_geo.csv"))}
    out = []
    for r in rows:
        g = geo.get(r["npi"])
        if g and len(g) > 5 and g[2] == "Match":
            lon, lat = g[5].split(",")
            out.append({**r, "lat": round(float(lat), 6), "lon": round(float(lon), 6)})
    write("allegheny_clinics_nppes_2026.csv", out)


def connectgovs(layer):
    path = fetch(f"{CG}/{layer}/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json", f"cg_{layer}.json")
    return [(f["attributes"], f["geometry"]) for f in json.load(open(path))["features"] if f.get("geometry")]


def served_by(rows, key_fn, muni_field, build):
    agencies, covered = {}, defaultdict(set)
    for a, g in rows:
        k = key_fn(a)
        if a.get(muni_field):
            covered[k].add(a[muni_field].strip().title())
        rec = build(a, g)
        if rec is not None and (k not in agencies or a.get("Has_Police_Department_") == "Y"):
            agencies[k] = rec
    for k, v in agencies.items():
        v["municipalities_served"] = "; ".join(sorted(covered[k]))
    return list(agencies.values())


def merge_osm(rows, category, radius, fallback_name=None, junk=None):
    for r in rows:
        r.setdefault("sources", "ConnectGovs")
    for o in osm(category, named=fallback_name is None):
        if junk and junk.search(o["name"]):
            continue
        p = (o["lon"], o["lat"])
        hit = next((r for r in rows if dist_m((float(r["lon"]), float(r["lat"])), p) <= radius), None)
        if hit:
            if "OSM" not in hit["sources"]:
                hit["sources"] += "+OSM"
        else:
            rows.append({"name": o["name"] or fallback_name, "address": o["addr"], "phone": "",
                         "lat": o["lat"], "lon": o["lon"], "municipalities_served": "", "sources": "OSM"})
    return rows


def police():
    def build(a, g):
        name = (a["Police_Department"] or "").strip()
        if not re.search(r"police|p\.?d\.?$", name, re.I):
            name += " Police"
        return {"name": name, "address": a["Agency_Address"], "phone": a["Phone_Number"],
                "lat": round(g["y"], 6), "lon": round(g["x"], 6)}
    rows = served_by(connectgovs("Police_Departments_Allegheny_County"),
                     lambda a: norm(a["Agency_Address"]) or norm(a["Police_Department"]), "MUNICIPALITY", build)
    rows = merge_osm(rows, "police", 150, junk=re.compile(r"review board|academy", re.I))
    # OSM-only rows that duplicate a listed department placed farther away (same first 4 letters, < 1 km)
    listed = [r for r in rows if r["sources"] != "OSM"]
    rows = [r for r in rows if r["sources"] != "OSM" or not any(
        r["name"][:4].upper() == l["name"][:4].upper()
        and dist_m((float(r["lon"]), float(r["lat"])), (float(l["lon"]), float(l["lat"]))) < 1000 for l in listed)]
    write("allegheny_police_merged.csv", rows)


def ems():
    def build(a, g):
        return {"name": a["Desingated_Agency"], "address": a["Address"], "phone": a["Phone_Number"],
                "lat": round(g["y"], 6), "lon": round(g["x"], 6)}
    rows = served_by(connectgovs("EMS_Departments_Allegheny_County"),
                     lambda a: norm(a["Address"]) or norm(a["Desingated_Agency"]), "MUNICIPALITY", build)
    write("allegheny_ems_merged.csv", merge_osm(rows, "ambulance_station", 150, fallback_name="Ambulance station"))


def courts():
    rows = [{"district": a["Magisteria"], "address": f"{a['Address']}, {a['CITY']} {a['Zip']}",
             "coverage": a["Coverage"], "lat": round(g["y"], 6), "lon": round(g["x"], 6)}
            for a, g in connectgovs("Magisterial_District_Judges_Office_Locations")]
    write("allegheny_mdj_courts_connectgovs.csv", rows)


def fire():
    rows = [{"name": a["Fire_Department"], "station": a.get("Station_Number") or "", "address": a["Address"],
             "municipality": a["Municipality"], "lat": g["y"], "lon": g["x"], "sources": "ConnectGovs"}
            for a, g in connectgovs("Fire_Departments_Allegheny_County")]

    def add(rec, src, radius=200):
        p = (rec["lon"], rec["lat"])
        hit = next((r for r in rows if dist_m((r["lon"], r["lat"]), p) <= radius), None)
        if hit:
            if src not in hit["sources"]:
                hit["sources"] += "+" + src
        else:
            rows.append({**rec, "sources": src})

    path = fetch(f"{PGH}/Fire_Station/FeatureServer/0/query?where=1%3D1&outFields=station,address,type,nhood&outSR=4326&f=json",
                 "city_fire.json")
    for f in json.load(open(path))["features"]:
        a, g = f["attributes"], f["geometry"]
        if re.search(r"academy|headquarters|hq", str(a.get("type", "")), re.I):
            continue
        add({"name": f"Pittsburgh Bureau of Fire Station {a['station']}", "station": str(a["station"]),
             "address": a["address"], "municipality": "Pittsburgh", "lat": g["y"], "lon": g["x"]}, "City_Fire_Station")
    junk = re.compile(r"tax office|local no|union|museum|training|academy", re.I)
    for o in osm("fire_station"):
        if not junk.search(o["name"]):
            add({"name": o["name"], "station": "", "address": o["addr"], "municipality": "",
                 "lat": o["lat"], "lon": o["lon"]}, "OSM")
    write("allegheny_fire_stations_merged.csv", rows)


if __name__ == "__main__":
    for step in (banks, hrsa, clinics, police, ems, courts, fire):
        step()
