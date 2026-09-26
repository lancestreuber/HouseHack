"""Allegheny pharmacies from the CMS NPPES registry.

Steps: pull organization NPIs with a Pharmacy taxonomy for every Allegheny ZIP
(nppes_pull.py writes nppes_pharm.json), drop the Rite Aid family (all stores
closed by Sept 2025), dedupe by address, geocode with the Census batch geocoder,
fall back to OSM Nominatim, then to exact address matches in the county assets
and ACHD food-facility files. Clip to the county polygon afterwards (ZIPs cross
the county line).

Inputs: nppes_pharm.json, allegheny_zips.txt, assets.csv, food.csv
Output: allegheny_pharmacies_nppes_2026.csv
"""
import csv
import json
import re
import subprocess
import time
import urllib.parse

DEAD = re.compile(r"RITE ?AID|THRIFT DRUG|ECKERD", re.I)
RETAIL = "3336C0003X"
CLINICAL = {"3336I0012X", "3336H0001X", "3336C0002X", "3336C0004X"}
UA = "HouseHack-hackathon/0.1 (research; low volume)"


def records():
    d = json.load(open("nppes_pharm.json"))
    zips = set(open("allegheny_zips.txt").read().split())
    seen = set()
    for npi, x in d.items():
        loc = [a for a in x["addresses"] if a["address_purpose"] == "LOCATION"][0]
        if loc["postal_code"][:5] not in zips or loc["state"] != "PA":
            continue
        codes = {t["code"] for t in x["taxonomies"]}
        kind = "retail" if RETAIL in codes else ("clinic_or_institutional" if codes & CLINICAL else "other_pharmacy")
        name = (x["basic"].get("organization_name") or "").strip()
        dba = [o.get("organization_name") or o.get("name") for o in x.get("other_names", []) if o.get("code") == "3"]
        dba = dba[0] if dba and dba[0] else ""
        if DEAD.search(f"{dba} {name}"):
            continue
        key = (re.sub(r"[^A-Z0-9]", "", loc["address_1"].upper())[:18], loc["postal_code"][:5], kind)
        if key in seen:
            continue
        seen.add(key)
        prim = [t["desc"] for t in x["taxonomies"] if t.get("primary")]
        yield {
            "npi": npi, "name": (dba or name).title(), "legal_name": name, "kind": kind,
            "primary_taxonomy": prim[0] if prim else "", "address": loc["address_1"],
            "city": loc["city"], "zip": loc["postal_code"][:5], "npi_last_updated": x["basic"].get("last_updated", ""),
        }


def census_batch(rows):
    with open("pharm_geocode_in.csv", "w", newline="") as f:
        w = csv.writer(f)
        for r in rows:
            w.writerow([r["npi"], r["address"], r["city"], "PA", r["zip"]])
    subprocess.run(["curl", "-s", "-m", "300", "--form", "addressFile=@pharm_geocode_in.csv",
                    "--form", "benchmark=Public_AR_Current",
                    "https://geocoding.geo.census.gov/geocoder/locations/addressbatch",
                    "-o", "pharm_geocoded.csv"], check=True)
    out = {}
    for r in csv.reader(open("pharm_geocoded.csv")):
        if len(r) > 5 and r[2] == "Match" and r[5]:
            lon, lat = r[5].split(",")
            out[r[0]] = (float(lat), float(lon))
    return out


def nominatim(r):
    q = urllib.parse.urlencode({"street": r["address"], "city": r["city"], "state": "PA",
                                "postalcode": r["zip"], "country": "US", "format": "json", "limit": 1})
    res = subprocess.run(["curl", "-s", "-m", "30", "-A", UA, "https://nominatim.openstreetmap.org/search?" + q],
                         capture_output=True, text=True).stdout
    time.sleep(1.1)
    try:
        d = json.loads(res)
        return (float(d[0]["lat"]), float(d[0]["lon"])) if d else None
    except (ValueError, KeyError, IndexError):
        return None


def norm(a):
    a = re.sub(r"\b(STE|SUITE|UNIT|#)\b.*", "", a.upper())
    a = re.sub(r"[^A-Z0-9 ]", "", a)
    for long, short in (("ROAD", "RD"), ("STREET", "ST"), ("AVENUE", "AVE"), ("HIGHWAY", "HWY"), ("DRIVE", "DR")):
        a = re.sub(rf"\b{long}\b", short, a)
    return " ".join(a.split()[:3])


def known_coords():
    ref = {}
    for x in csv.DictReader(open("assets.csv", encoding="utf-8-sig")):
        if x["latitude"] and x["street_address"]:
            ref.setdefault(norm(x["street_address"]), (float(x["latitude"]), float(x["longitude"])))
    for x in csv.DictReader(open("food.csv", encoding="utf-8-sig")):
        if x["y"] and x["address"]:
            ref.setdefault(norm(x["address"].split(",")[0]), (float(x["y"]), float(x["x"])))
    return ref


def main():
    rows = list(records())
    geo = census_batch(rows)
    ref = known_coords()
    out = []
    for r in rows:
        src = "census_geocoder"
        p = geo.get(r["npi"])
        if not p:
            p, src = nominatim(r), "nominatim_osm"
        if not p:
            p, src = ref.get(norm(r["address"])), "address_match_county_assets_or_achd"
        if not p:
            continue
        out.append({**r, "lat": round(p[0], 6), "lon": round(p[1], 6), "geocode_source": src})
    with open("allegheny_pharmacies_nppes_2026.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    print(len(rows), "records ->", len(out), "located")


if __name__ == "__main__":
    main()
