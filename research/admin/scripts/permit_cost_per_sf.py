#!/usr/bin/env python3
"""Declared construction value per finished sq ft for City of Pittsburgh residential new construction.

Inputs (bulk dumps, pull at run time; do not commit them):
  permits:     https://data.wprdc.org/datastore/dump/f4d1177a-f597-4c32-8cbf-7885f56253f6
  assessments: https://data.wprdc.org/datastore/dump/65855e14-549e-4992-b5be-d629afc676fa

Usage: python3 permit_cost_per_sf.py <permits.csv> <assessments.csv> [out_rows.csv]
Stdlib only. Reads no owner, contractor or mailing-address fields.
"""
import csv
import re
import sys
from collections import Counter, defaultdict

LO, HI = 30.0, 1000.0
BUILDING_TYPES = {"BUILDING", "Building & Development Application"}

DWELLING = re.compile(r"DWELL|HOUSE|HOME|TOWN ?HOME|ROW ?HOUSE|APARTMENT|\bUNITS?\b|RESIDEN|DUPLEX|FAMILY|MODULAR|CONDO")
EXCLUDE = re.compile(
    r"FOUNDATION(S)? ONLY|ONLY FOUNDATION|FOUNDATIONS THROUGH|RETAIN|RETAING|\bSHED\b|CARPORT|PERGOLA|"
    r"GREENHOUSE|DETACHED GARAGE|ACCESSORY (STRUCTURE|BUILDING)|DECK ONLY|FENCE|SIGN\b|PARKING (LOT|PAD) ONLY|"
    r"TEMPORARY|TRAILER|WALKWAY|STAIRS? ONLY|SHELL ONLY"
)
NONRES = re.compile(r"HOSPITAL|OFFICE BUILDING|WAREHOUSE|RESTAURANT|SCHOOL|CHURCH|HOTEL|RETAIL|LABORATORY|DORMITOR")
MF = re.compile(r"APARTMENT|MULTI-? ?FAMILY|TRIPLEX|THREE[- ]FAMILY|3[- ]FAMILY|FOUR[- ]FAMILY|FOURPLEX|QUADPLEX|DWELLING UNITS|\d+ (?:NEW )?UNITS?\b|CONDO")
TWO = re.compile(r"TWO[- ]?FAMILY|2[- ]FAMILY|DUPLEX|TWO[- ]UNIT|2[- ]UNIT")
ATT = re.compile(r"ATTACHED|TOWN ?HOUSE|TOWN ?HOME|ROW ?HOUSE|ROWHOME")
MOD = re.compile(r"MODULAR|PANELIZED|PREFAB(RICATED)? (HOUSE|HOME|DWELLING)")
WORDNUM = {"THREE": 3, "FOUR": 4, "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10,
           "ELEVEN": 11, "TWELVE": 12}
UNITS_RE = re.compile(r"\(?\b(\d{1,4}|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE)\)?[- ](?:NEW )?(?:RESIDENTIAL |DWELLING |APARTMENT |RENTAL |MARKET[- ]RATE )?(?:UNITS?|APARTMENTS)\b")
SQFT_RE = re.compile(r"(\d{1,3}(?:,\d{3})+|\d{3,7})\s*(?:\+/-\s*)?(?:SQ\.?\s*FT|SQUARE\s*FE?E?T|SF\b|GSF\b|S\.F\.)")


def num(s):
    try:
        return float(str(s).replace(",", ""))
    except ValueError:
        return None


SALE_CODES = {"0", "16"}


def iso(mdy):
    m = re.match(r"(\d{2})-(\d{2})-(\d{4})", mdy or "")
    return f"{m.group(3)}-{m.group(1)}-{m.group(2)}" if m else None


def pct(xs, p):
    xs = sorted(xs)
    if not xs:
        return float("nan")
    k = (len(xs) - 1) * p
    f = int(k)
    c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


def classify(d):
    if MF.search(d) and not re.search(r"SINGLE[- ]FAMILY", d):
        m = UNITS_RE.search(d)
        n = None
        if m:
            g = m.group(1)
            n = WORDNUM.get(g) or int(g)
        if n is not None and n < 3:
            return "two-family" if n == 2 else "single-family attached"
        if n is None:
            return "multifamily (units n/a)"
        return "multifamily 3-19" if n < 20 else "multifamily 20+"
    if TWO.search(d):
        return "two-family"
    if ATT.search(d):
        return "single-family attached/townhouse"
    return "single-family detached"


def main(permits_path, assess_path, out_path=None):
    funnel = Counter()
    cands = []
    for r in csv.DictReader(open(permits_path, newline="", encoding="utf-8")):
        if r["work_type"].strip().upper() != "NEW CONSTRUCTION" or r["permit_type"] not in BUILDING_TYPES:
            continue
        funnel["new construction building/BDA permits"] += 1
        d = (r["work_description"] or "").upper()
        cr = r["commercial_or_residential"]
        if cr != "Residential" and not (DWELLING.search(d) and not NONRES.search(d)):
            continue
        if cr == "Residential":
            funnel["  flagged Residential"] += 1
        else:
            funnel["  flagged Commercial but describes dwellings"] += 1
        if EXCLUDE.search(d) or not DWELLING.search(d):
            funnel["  dropped: not a dwelling / foundation-only / accessory"] += 1
            continue
        v = num(r["total_project_value"])
        if not v or v <= 0:
            funnel["  dropped: value missing or 0"] += 1
            continue
        m = SQFT_RE.search(d)
        cands.append({
            "permit_id": r["permit_id"], "permit_type": r["permit_type"], "cr": cr,
            "year": r["issue_date"][:4], "issue": r["issue_date"][:10], "parcel": r["parcel_num"].strip(), "value": v,
            "btype": classify(d), "modular": bool(MOD.search(d)),
            "desc_sqft": num(m.group(1)) if m else None, "status": r["status"],
            "neighborhood": r["neighborhood"],
        })
    funnel["dwelling new-construction permits with value > 0"] = len(cands)

    by_parcel = defaultdict(list)
    for c in cands:
        by_parcel[c["parcel"]].append(c)
    multi = {p: v for p, v in by_parcel.items() if len(v) > 1 and p}
    funnel["parcels with >1 qualifying permit"] = len(multi)
    funnel["permits on those parcels"] = sum(len(v) for v in multi.values())
    kept, groups = [], []
    for p, v in by_parcel.items():
        if not p:
            kept.extend(v)
        elif len(v) >= 3:
            groups.append((p, v))
        else:
            kept.append(max(v, key=lambda c: (c["value"], c["year"])))
    funnel["  group developments (>=3 permits on one parent parcel), excluded from $/sf"] = len(groups)
    funnel["  permits in those groups"] = sum(len(v) for _, v in groups)
    funnel["after dedup (1 per parcel, max value)"] = len(kept)

    need = {c["parcel"] for c in kept}
    ass = {}
    for r in csv.DictReader(open(assess_path, newline="", encoding="utf-8")):
        if r["PARID"] in need:
            ass[r["PARID"]] = {"fla": num(r["FINISHEDLIVINGAREA"]), "yb": num(r["YEARBLT"]),
                               "use": r["USEDESC"], "muni": r["MUNIDESC"], "neigh": r["NEIGHDESC"],
                               "sale_code": r["SALECODE"], "sale_price": num(r["SALEPRICE"]),
                               "sale_date": iso(r["SALEDATE"])}

    rows = []
    for c in kept:
        a = ass.get(c["parcel"])
        c.update({"fla": None, "yb": None, "use": "", "sqft": None, "sqft_src": ""})
        if a is None:
            funnel["no assessment match (new/split parcel id)"] += 1
        else:
            c.update({"fla": a["fla"], "yb": a["yb"], "use": a["use"]})
            if (a["sale_code"] in SALE_CODES and a["sale_price"] and a["sale_price"] >= 50000
                    and a["sale_date"] and a["sale_date"] > c["issue"]):
                c["sale_price"], c["sale_code"] = a["sale_price"], a["sale_code"]
            if not a["fla"]:
                funnel["matched, FINISHEDLIVINGAREA empty/0"] += 1
            elif not a["yb"] or a["yb"] < int(c["year"]) - 1:
                funnel["matched, YEARBLT predates permit (old/not-yet-assessed building)"] += 1
            else:
                c["sqft"], c["sqft_src"] = a["fla"], "assessment"
        if c["sqft"] is None and c["desc_sqft"] and c["desc_sqft"] >= 300:
            c["sqft"], c["sqft_src"] = c["desc_sqft"], "description"
        if c["sqft"]:
            c["psf"] = c["value"] / c["sqft"]
            rows.append(c)
    funnel["with usable sq ft"] = len(rows)
    funnel["  sq ft from assessment"] = sum(r["sqft_src"] == "assessment" for r in rows)
    funnel["  sq ft from work_description"] = sum(r["sqft_src"] == "description" for r in rows)
    out = [r for r in rows if LO <= r["psf"] <= HI]
    funnel[f"dropped $/sf < {LO:.0f}"] = sum(r["psf"] < LO for r in rows)
    funnel[f"dropped $/sf > {HI:.0f}"] = sum(r["psf"] > HI for r in rows)
    funnel["final analytic sample"] = len(out)

    print("## Funnel")
    for k, v in funnel.items():
        print(f"{k}: {v}")

    def table(title, key):
        print(f"\n## {title}")
        print("| group | n | p10 | p25 | median | p75 | p90 | median value | median sq ft |")
        print("|---|---|---|---|---|---|---|---|---|")
        g = defaultdict(list)
        for r in out:
            g[key(r)].append(r)
        for k in sorted(g):
            xs = [r["psf"] for r in g[k]]
            print(f"| {k} | {len(xs)} | {pct(xs,.1):.0f} | {pct(xs,.25):.0f} | {pct(xs,.5):.0f} | {pct(xs,.75):.0f} | "
                  f"{pct(xs,.9):.0f} | {pct([r['value'] for r in g[k]],.5):,.0f} | {pct([r['sqft'] for r in g[k]],.5):,.0f} |")

    print("\n## Coverage by issue year (deduped dwelling permits -> usable sq ft -> in final sample)")
    print("| year | permits | usable sq ft | final | coverage |")
    print("|---|---|---|---|---|")
    ky = Counter(c["year"] for c in kept)
    uy = Counter(r["year"] for r in rows)
    oy = Counter(r["year"] for r in out)
    for y in sorted(ky):
        print(f"| {y} | {ky[y]} | {uy[y]} | {oy[y]} | {oy[y]/ky[y]:.0%} |")
    print("\n## Coverage by building type")
    print("| type | permits | final | coverage |")
    print("|---|---|---|---|")
    kt = Counter(c["btype"] for c in kept)
    ot = Counter(r["btype"] for r in out)
    for t in sorted(kt):
        print(f"| {t} | {kt[t]} | {ot[t]} | {ot[t]/kt[t]:.0%} |")

    print("\n## Group developments: declared value per permit (no $/sf; sq ft not attributable)")
    print("| issue year(s) | type | permits | median value/permit | min | max |")
    print("|---|---|---|---|---|---|")
    for p, v in sorted(groups, key=lambda kv: -len(kv[1])):
        vals = [c["value"] for c in v]
        yrs = "/".join(sorted({c["year"] for c in v}))
        print(f"| {yrs} | {Counter(c['btype'] for c in v).most_common(1)[0][0]} | {len(v)} | {pct(vals,.5):,.0f} | {min(vals):,.0f} | {max(vals):,.0f} |")

    table("All", lambda r: "all")
    table("By building type", lambda r: r["btype"])
    table("By issue year", lambda r: r["year"])
    table("By sq ft source", lambda r: r["sqft_src"])
    table("Modular vs site-built (1-2 family only)",
          lambda r: ("modular" if r["modular"] else "site-built") if not r["btype"].startswith("multi") else "zz multifamily (excluded)")
    table("By period (1-2 family only)",
          lambda r: ("2019-2021" if r["year"] <= "2021" else "2022-2023" if r["year"] <= "2023" else "2024-2026")
          if not r["btype"].startswith("multi") else "zz multifamily")

    print("\n## Cluster-collapsed (permits sharing issue year + neighborhood + declared value -> one obs at their median $/sf)")
    cl = defaultdict(list)
    for r in out:
        cl[(r["year"], r["neighborhood"], r["value"])].append(r["psf"])
    big = sorted(((len(v), k) for k, v in cl.items() if len(v) >= 5), reverse=True)
    print(f"clusters: {len(cl)} from {len(out)} permits; clusters of >=5 identical-value permits: "
          + "; ".join(f"{k[0]} {k[1]} ${k[2]:,.0f} x{n}" for n, k in big))
    xs = [pct(v, .5) for v in cl.values()]
    print("| sample | n | p10 | p25 | median | p75 | p90 |")
    print("|---|---|---|---|---|---|---|")
    print(f"| cluster-collapsed | {len(xs)} | {pct(xs,.1):.0f} | {pct(xs,.25):.0f} | {pct(xs,.5):.0f} | {pct(xs,.75):.0f} | {pct(xs,.9):.0f} |")
    rnd = [r["psf"] for r in out if r["value"] % 5000 != 0]
    print(f"| non-round declared values only (not a multiple of $5,000) | {len(rnd)} | {pct(rnd,.1):.0f} | {pct(rnd,.25):.0f} | {pct(rnd,.5):.0f} | {pct(rnd,.75):.0f} | {pct(rnd,.9):.0f} |")

    print("\n## Cross-check: later arm's-length sale of the same parcel (SALECODE 0 valid, 16 no-bldg-asmt; sale after permit issue; >= $50k)")
    sl = [r for r in out if r.get("sale_price")]
    if sl:
        sp = [r["sale_price"] / r["sqft"] for r in sl]
        ratio = [r["value"] / r["sale_price"] for r in sl]
        print(f"n={len(sl)} (code 0: {sum(r['sale_code']=='0' for r in sl)}, code 16: {sum(r['sale_code']=='16' for r in sl)})")
        print("| measure | p10 | p25 | median | p75 | p90 |")
        print("|---|---|---|---|---|---|")
        own = [r["psf"] for r in sl]
        print(f"| declared permit $/sf (this subset) | {pct(own,.1):.0f} | {pct(own,.25):.0f} | {pct(own,.5):.0f} | {pct(own,.75):.0f} | {pct(own,.9):.0f} |")
        print(f"| sale price $/sf | {pct(sp,.1):.0f} | {pct(sp,.25):.0f} | {pct(sp,.5):.0f} | {pct(sp,.75):.0f} | {pct(sp,.9):.0f} |")
        print(f"| declared value / sale price | {pct(ratio,.1):.2f} | {pct(ratio,.25):.2f} | {pct(ratio,.5):.2f} | {pct(ratio,.75):.2f} | {pct(ratio,.9):.2f} |")

    vc = Counter(c["value"] for c in cands)
    print("\n## Most repeated declared values (all dwelling candidates)")
    for v, n in vc.most_common(10):
        print(f"{v:,.0f}: {n}")
    print("\n## Round-number share (value divisible by 25,000)")
    print(f"{sum(1 for c in cands if c['value'] % 25000 == 0)}/{len(cands)}")

    if out_path:
        cols = ["permit_id", "year", "btype", "modular", "cr", "value", "sqft", "sqft_src", "yb", "use", "psf", "neighborhood"]
        with open(out_path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)


if __name__ == "__main__":
    main(*sys.argv[1:4])
