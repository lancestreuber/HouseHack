"""Allegheny food retail: USDA SNAP retailers merged with ACHD food-facility permits.

Rules
- SNAP-authorized stores (current federal list) are the backbone and are always kept.
- An ACHD permit merges into a SNAP store when the names share a token and the store is
  within 300 m (big-box permits can sit a parking lot away), else only when a SNAP
  store is within 25 m. Only a name match may change the tier.
- ACHD permits that match no SNAP store are kept only if inspected on/after 2023-01-01
  (ACHD's "open" list still carries businesses closed decades ago), and are deduped
  against each other with the same rules. They are never marked SNAP-authorized.
- Same store number (3-5 digits) plus a shared name token matches within 1.5 km.
- Dollar, pharmacy, gas and beer-distributor names can never be full_grocery.

Inputs: snap_*.json, food.csv (ACHD geocoded facilities), achd_last_inspection.json
Output: allegheny_food_retail_merged.csv
"""
import collections
import csv
import glob
import json
import math
import re

TIER_SNAP = {
    "Supermarket": "full_grocery", "Super Store": "full_grocery", "Grocery Store": "full_grocery",
    "Specialty Store": "specialty_food", "Farmers and Markets": "farmers_market",
    "Convenience Store": "convenience_limited", "Other": "other_food_retail",
}
TIER_ACHD = {
    "Supermarket": "full_grocery", "Chain Supermarket": "full_grocery",
    "Retail/Convenience Store": "convenience_limited", "Chain Retail/Convenience Store": "convenience_limited",
    "Packaged Food Only": "other_food_retail", "Chain Packaged Food Only": "other_food_retail",
    "Bakery": "specialty_food", "Chain Bakery": "specialty_food", "Seasonal/Farmers Market": "farmers_market",
}
RANK = ["full_grocery", "specialty_food", "farmers_market", "other_food_retail", "convenience_limited"]
STOPWORDS = {"THE", "AND", "INC", "LLC", "STORE", "MARKET", "FOOD", "FOODS"}
DEAD = re.compile(r"RITE ?AID|BLOCKBUSTER|BLOCK BUSTER|HOLLYWOOD VIDEO|\bAMES\b|PHAR-?MOR|ECKERD", re.I)
TEST_ACCOUNT = re.compile(r"\(test\b|test client", re.I)  # ACHD test records, e.g. 2121 Noblestown Rd
NOT_GROCERY = [
    (re.compile(r"DOLLAR|FAMILY DOLLAR|FIVE BELOW|CVS|WALGREEN|PHARM|DRUG", re.I), "other_food_retail"),
    (re.compile(r"GETGO|GET GO|SHEETZ|7-?ELEVEN|SPEEDWAY|SUNOCO|EXXON|\bBP\b|CITGO|MARATHON|GULF|BEER|DISTRIBUT", re.I),
     "convenience_limited"),
]
NAMED_RADIUS_M = 300
UNNAMED_RADIUS_M = 25
STORE_NUMBER_RADIUS_M = 1500
RECENT = "2023-01-01"


def dist_m(a, b):
    return math.hypot((a[0] - b[0]) * 85000, (a[1] - b[1]) * 111000)


def tokens(name):
    return {t for t in re.sub(r"[^A-Z ]", " ", (name or "").upper()).split() if len(t) > 2 and t not in STOPWORDS}


def store_number(name):
    m = re.findall(r"(?<!\d)0*(\d{3,5})(?!\d)", name or "")
    return m[-1] if m else None


def find_match(pool, point, name_tokens, number=None):
    if number:
        for r in pool:
            if (store_number(r["name"]) == number and tokens(r["name"]) & name_tokens
                    and dist_m((r["lon"], r["lat"]), point) <= STORE_NUMBER_RADIUS_M):
                return r, True
    near = [r for r in pool if abs(r["lat"] - point[1]) <= 0.003 and abs(r["lon"] - point[0]) <= 0.004]
    ranked = sorted(((dist_m((r["lon"], r["lat"]), point), r) for r in near), key=lambda t: t[0])
    for dist, r in ranked:
        if dist <= NAMED_RADIUS_M and tokens(r["name"]) & name_tokens:
            return r, True
    if ranked and ranked[0][0] <= UNNAMED_RADIUS_M:
        return ranked[0][1], False
    return None, False


def absorb(rec, permit, tier, named):
    rec["achd_category"] = rec["achd_category"] or permit["description"]
    rec["achd_last_inspection"] = max(rec["achd_last_inspection"], permit["last_inspection"])
    if rec["snap_authorized"] and "ACHD" not in rec["sources"]:
        rec["sources"] = "USDA_SNAP+ACHD"
    if named and RANK.index(tier) < RANK.index(rec["tier"]):
        rec["tier"] = tier


def main():
    snap = [f["attributes"] for g in glob.glob("snap_*.json") for f in json.load(open(g))["features"]]
    last = json.load(open("achd_last_inspection.json"))
    permits = [x for x in csv.DictReader(open("food.csv", encoding="utf-8-sig"))
               if not x.get("bus_cl_date") and x["description"] in TIER_ACHD and x["x"] and x["y"]
               and not TEST_ACCOUNT.search(x["facility_name"])]
    for p in permits:
        p["last_inspection"] = last.get(p["id"], "")

    snap_recs = [{
        "name": s["Store_Name"].strip(), "address": f"{s['Store_Street_Address']}, {s['City']} {s['Zip_Code']}",
        "lat": float(s["Latitude"]), "lon": float(s["Longitude"]), "tier": TIER_SNAP.get(s["Store_Type"], "other_food_retail"),
        "snap_store_type": s["Store_Type"], "achd_category": "", "snap_authorized": True, "sources": "USDA_SNAP",
        "achd_last_inspection": "",
    } for s in snap if s["Latitude"] is not None]
    seen, unique = set(), []
    for r in snap_recs:  # the SNAP file itself repeats some stores (same name + address)
        key = (re.sub(r"[^A-Z0-9]", "", r["name"].upper()), re.sub(r"[^A-Z0-9]", "", r["address"].upper()))
        if key not in seen:
            seen.add(key)
            unique.append(r)
    snap_recs = unique
    achd_only = []
    counts = collections.Counter()
    for p in permits:
        point, tier, name_tokens = (float(p["x"]), float(p["y"])), TIER_ACHD[p["description"]], tokens(p["facility_name"])
        number = store_number(p["facility_name"])
        rec, named = find_match(snap_recs, point, name_tokens, number)
        if rec:
            absorb(rec, p, tier, named)
            counts["merged_into_snap"] += 1
            continue
        if p["last_inspection"] < RECENT:
            counts["dropped_stale"] += 1
            continue
        rec, named = find_match(achd_only, point, name_tokens, number)
        if rec:
            absorb(rec, p, tier, named)
            counts["merged_into_achd"] += 1
            continue
        achd_only.append({
            "name": p["facility_name"].strip(), "address": p["address"], "lat": point[1], "lon": point[0], "tier": tier,
            "snap_store_type": "", "achd_category": p["description"], "snap_authorized": False, "sources": "ACHD",
            "achd_last_inspection": p["last_inspection"],
        })
    recs = [r for r in snap_recs + achd_only if not DEAD.search(r["name"])]
    for r in recs:
        for pattern, cap in NOT_GROCERY:
            if pattern.search(r["name"]) and RANK.index(r["tier"]) < RANK.index(cap):
                r["tier"] = cap
                counts["tier_capped"] += 1
                break
    with open("allegheny_food_retail_merged.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(recs[0]))
        w.writeheader()
        w.writerows(recs)
    print(dict(counts), "total", len(recs))
    print(collections.Counter(r["tier"] for r in recs), collections.Counter(r["sources"] for r in recs))
    bad = [r for r in recs if r["sources"] != "ACHD" and not r["snap_authorized"]]
    print("sources/snap inconsistencies:", len(bad))
    full = [r for r in recs if r["tier"] == "full_grocery"]
    print("full_grocery", len(full), collections.Counter(re.split(r"[ #0-9]", r["name"].upper())[0] for r in full).most_common(12))


if __name__ == "__main__":
    main()
