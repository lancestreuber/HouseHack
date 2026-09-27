"""Density of new-construction sales comps by City of Pittsburgh neighborhood, plus rent spread.

Round 9 sweep: research/sweeps/r9-revenue-comps-sub-zip.md

Stdlib only. Bulk inputs are NOT kept in the repo; download them to a scratch dir first:
  sales.csv      https://data.wprdc.org/datastore/dump/5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1
  assess.csv     https://data.wprdc.org/datastore/dump/65855e14-549e-4992-b5be-d629afc676fa
  centroids.csv  https://data.wprdc.org/datastore/dump/3fab7152-3f11-4788-8372-4c33f86ea813
  zori.csv       https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv
  cr_tract_city.json / cr_bg_city.json  (keyless Census Reporter, ACS B25064)
    https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25064&geo_ids=140|16000US4261000
    https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25064&geo_ids=150|16000US4261000

Run: python3 admin/scripts/new_construction_comps.py <scratch_dir> [as_of YYYY-MM-DD]
Only non-personal fields are read (no owner or mailing-address columns).
"""
import csv
import json
import os
import re
import statistics as st
import sys
from collections import Counter, defaultdict
from datetime import date

D = sys.argv[1]
AS_OF = date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else date(2026, 9, 27)
CITY_RE = re.compile(r"Ward\s*-\s*PITTSBURGH", re.I)
RES_USES = {"SINGLE FAMILY", "TWO FAMILY", "THREE FAMILY", "FOUR FAMILY", "ROWHOUSE",
            "TOWNHOUSE", "CONDOMINIUM"}
MIN_PRICE = 50000
MIN_SF = 400
csv.field_size_limit(10**8)


def p(path):
    return os.path.join(D, path)


def med(xs):
    return round(st.median(xs)) if xs else None


def years_back(n):
    return AS_OF.replace(year=AS_OF.year - n).isoformat()


cent = {}
with open(p("centroids.csv"), newline="") as f:
    for r in csv.DictReader(f):
        if r["CITY_NEIGHBORHOOD"]:
            cent[r["PIN"]] = (r["CITY_NEIGHBORHOOD"], r["FIPS_TRACT"])

assess = {}
neigh_by_code = defaultdict(Counter)
zip_city = defaultdict(Counter)
with open(p("assess.csv"), newline="") as f:
    for r in csv.DictReader(f):
        city = bool(CITY_RE.search(r["MUNIDESC"]))
        z = (r["PROPERTYZIP"] or "")[:5]
        if r["USEDESC"] in RES_USES:
            zip_city[z][city] += 1
        if not city or r["CARDNUMBER"] not in ("", "1"):
            continue
        sf = float(r["FINISHEDLIVINGAREA"] or 0)
        yb = int(float(r["YEARBLT"])) if r["YEARBLT"] else None
        hood = cent.get(r["PARID"], (None,))[0]
        if hood:
            neigh_by_code[r["NEIGHCODE"]][hood] += 1
        assess[r["PARID"]] = dict(use=r["USEDESC"], sf=sf, yb=yb, hood=hood, ncode=r["NEIGHCODE"])

hood_src = Counter()
for a in assess.values():
    if a["hood"]:
        hood_src["centroid"] += 1
    elif neigh_by_code.get(a["ncode"]):
        a["hood"] = neigh_by_code[a["ncode"]].most_common(1)[0][0]
        hood_src["assessor-code fallback"] += 1
    else:
        hood_src["unassigned"] += 1
all_hoods = sorted({h for h, _ in cent.values()})

sales = []
with open(p("sales.csv"), newline="") as f:
    for r in csv.DictReader(f):
        if not CITY_RE.search(r["MUNIDESC"]) or r["SALECODE"] not in ("0", "16", "27", "14"):
            continue
        a = assess.get(r["PARID"])
        price = float(r["PRICE"] or 0)
        sales.append(dict(parid=r["PARID"], date=r["SALEDATE"], price=price, code=r["SALECODE"], a=a))

out = {"as_of": AS_OF.isoformat(), "hood_assignment": dict(hood_src),
       "n_city_hoods_in_centroids": len(all_hoods)}


def summarize(name, rows):
    by = defaultdict(list)
    unmatched = 0
    for s in rows:
        if not s["a"] or not s["a"]["hood"]:
            unmatched += 1
            continue
        by[s["a"]["hood"]].append(s)
    table = []
    for h, ss in by.items():
        ppsf = [s["price"] / s["a"]["sf"] for s in ss if s["a"]["sf"] >= MIN_SF]
        table.append(dict(hood=h, n=len(ss), n_sf=len(ppsf), med_price=med([s["price"] for s in ss]),
                          med_ppsf=med(ppsf)))
    table.sort(key=lambda t: -t["n"])
    allp = [s["price"] for s in rows]
    allpsf = [s["price"] / s["a"]["sf"] for s in rows if s["a"] and s["a"]["sf"] >= MIN_SF]
    return dict(name=name, sales=len(rows), unmatched=unmatched, hoods_any=len(table),
                hoods_ge5=sum(t["n"] >= 5 for t in table), hoods_ge10=sum(t["n"] >= 10 for t in table),
                hoods_sf_ge5=sum(t["n_sf"] >= 5 for t in table),
                hoods_sf_ge10=sum(t["n_sf"] >= 10 for t in table),
                city_med_price=med(allp), city_med_ppsf=med(allpsf),
                share_with_sf=round(len(allpsf) / len(rows), 3) if rows else None,
                uses=Counter(s["a"]["use"] if s["a"] else "NO ASSESSMENT ROW" for s in rows).most_common(8),
                table=table)


results = []
for yrs in (3, 5):
    start = years_back(yrs)
    win = [s for s in sales if s["date"] >= start and s["price"] >= MIN_PRICE]
    c16 = [s for s in win if s["code"] == "16"]
    c16res = [s for s in c16 if s["a"] and s["a"]["use"] in RES_USES]
    v = [s for s in win if s["code"] == "0" and s["a"] and s["a"]["use"] in RES_USES]
    vnew = [s for s in v if s["a"]["yb"] and s["a"]["yb"] >= 2015]
    vfirst = [s for s in vnew if int(s["date"][:4]) - s["a"]["yb"] <= 1]
    c16res_new = [s for s in c16res if s["a"]["yb"] and s["a"]["yb"] >= 2015]
    union = {(s["parid"], s["date"]): s for s in c16res + vnew}
    broad = [s for s in win if s["code"] in ("0", "16", "27", "14") and s["a"] and s["a"]["use"] in RES_USES
             and s["a"]["yb"] and s["a"]["yb"] >= 2015]
    for name, rows in ((f"code16_all_{yrs}y", c16), (f"code16_res_{yrs}y", c16res),
                       (f"code16_res_yb2015_{yrs}y", c16res_new),
                       (f"valid_res_yb2015_{yrs}y", vnew), (f"valid_res_yb2015_within1yr_{yrs}y", vfirst),
                       (f"union_code16res_validyb2015_{yrs}y", list(union.values())),
                       (f"union_noncondo_{yrs}y", [s for s in union.values() if s["a"]["use"] != "CONDOMINIUM"]),
                       (f"broad_codes_0_16_27_14_res_yb2015_{yrs}y", broad),
                       (f"valid_res_all_{yrs}y", v)):
        results.append(summarize(name, rows))
    yb16 = Counter()
    for s in c16res:
        yb = s["a"]["yb"]
        yb16["missing" if yb is None else ("<2015" if yb < 2015 else ">=2015")] += 1
    out[f"code16_res_yearbuilt_{yrs}y"] = dict(yb16)
out["results"] = results

zc = {z: c[True] / (c[True] + c[False]) for z, c in zip_city.items() if c[True] + c[False] >= 200}
city_zips = sorted(z for z, sh in zc.items() if sh >= 0.5)
touch_zips = sorted(z for z, sh in zc.items() if sh > 0.05)
with open(p("zori.csv"), newline="") as f:
    rd = csv.reader(f)
    hdr = next(rd)
    months = [h for h in hdr if re.match(r"\d{4}-\d{2}-\d{2}", h)]
    latest = months[-1]
    zrows = {}
    for r in rd:
        rec = dict(zip(hdr, r))
        if rec.get("CountyName") == "Allegheny County":
            zrows[rec["RegionName"].zfill(5)] = rec
zori = []
for z in touch_zips:
    rec = zrows.get(z)
    val = float(rec[latest]) if rec and rec[latest] else None
    zori.append(dict(zip=z, city_share=round(zc[z], 2), zori=round(val) if val else None))
out["zori"] = dict(latest_month=latest, allegheny_zips=len(zrows), city_majority_zips=city_zips,
                   rows=zori)


def acs(fname):
    j = json.load(open(p(fname)))
    vals = []
    for g, d in j["data"].items():
        e = d["B25064"]["estimate"]["B25064001"]
        m = d["B25064"]["error"]["B25064001"]
        vals.append((g, e, m))
    ok = sorted(e for _, e, _ in vals if e)
    hi_cv = sum(1 for _, e, m in vals if e and m and (m / 1.645) / e > 0.30)

    def q(x):
        return ok[min(len(ok) - 1, int(x * len(ok)))]
    return dict(release=j["release"]["name"], geos=len(vals), with_estimate=len(ok), min=ok[0],
                p10=q(.1), p25=q(.25), median=round(st.median(ok)), p75=q(.75), p90=q(.9), max=ok[-1],
                cv_over_30pct=hi_cv, values={g: (e, m) for g, e, m in vals})


out["acs_tract"] = acs("cr_tract_city.json")
out["acs_bg"] = acs("cr_bg_city.json")
tract_hood = defaultdict(Counter)
for h, t in cent.values():
    tract_hood[t][h] += 1
hood_rent = defaultdict(list)
for g, (e, m) in out["acs_tract"]["values"].items():
    t = g[-6:]
    if e and tract_hood.get(t):
        hood_rent[tract_hood[t].most_common(1)[0][0]].append(e)
out["acs_tract_by_hood_count"] = len(hood_rent)
for k in ("acs_tract", "acs_bg"):
    out[k].pop("values")

json.dump(out, open(p("comps_results.json"), "w"), indent=1)
for r in results:
    print(r["name"], {k: v for k, v in r.items() if k not in ("table",)})
print(json.dumps({k: v for k, v in out.items() if k != "results"}, indent=1))
