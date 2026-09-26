import csv, json, pathlib, subprocess, urllib.parse

HERE = pathlib.Path(__file__).resolve().parent.parent
SRC = HERE.parent.parent / "sources" / "ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md"
AS_OF = "2026-09-26"
SOURCE_URL = "https://ecode360.com/45476524"
COLS = ["R1D","R1A","R2","R3","RM","NDO","LNC","NDI","UNC","HC","GI","UI","UC-MU","UC-E","R-MU","P","H","EMI","GT","DT2","RIV-RM","RIV-MU","RIV-NS","RIV-GI","RIV-IMU"]

TYPOLOGY = {
    "Single-Unit Detached Residential": ("single_detached", "sfd"),
    "Single-Unit Attached Residential": ("single_attached", "townhome"),
    "Two-Unit Residential": ("two_unit", "duplex"),
    "Three-Unit Residential": ("three_unit", None),
    "Multi-Unit Residential": ("multi_unit", "apartments"),
    "Housing for the Elderly (Limited)": ("elderly_limited", "senior"),
    "Housing for the Elderly (General)": ("elderly_general", "senior"),
    "Assisted Living Class A": ("assisted_living_a", None),
    "Assisted Living Class B": ("assisted_living_b", None),
    "Assisted Living Class C": ("assisted_living_c", None),
    "Personal Care Residence (Small)": ("personal_care_small", None),
    "Personal Care Residence (Large)": ("personal_care_large", None),
    "Community Home": ("community_home", None),
    "Multi-Suite Residential (Limited)": ("multi_suite_limited", None),
    "Multi-Suite Residential (General)": ("multi_suite_general", None),
    "Interim Housing": ("interim_housing", None),
}

PATHWAY = {
    "P": ("by_right", 0),
    "A": ("za", 1),
    "S": ("zbe_special_exception", 2),
    "C": ("conditional_use", 3),
    "": ("not_permitted", 4),
}

PATHWAY_INFO = [
    {"pathway": "by_right", "rank": 0, "decider": "Zoning staff (BDA review via OneStopPGH)", "hearing": "no", "statutory_clock": "none", "deemed_denial_on_missed_deadline": "n/a", "extra_fee_usd": "", "section": "", "note": "Section for by-right zoning review not read; Site Plan Review §922.04 still applies at >=4 units or any construction in H"},
    {"pathway": "za", "rank": 1, "decider": "Zoning Administrator (Administrator Exception)", "hearing": "no", "statutory_clock": "decision 21 days after complete application", "deemed_denial_on_missed_deadline": "City code: deemed denial, may go to ZBA (§922.08.C)", "extra_fee_usd": "", "section": "§922.08", "note": ""},
    {"pathway": "zbe_special_exception", "rank": 2, "decider": "Zoning Board of Adjustment", "hearing": "yes, >=21-day notice", "statutory_clock": "hearing within 45 days of complete application; decision within 45 days of hearing", "deemed_denial_on_missed_deadline": "conflict: City code says deemed denial; PA MPC (2003 ed.) says deemed approval; see sources/pa-dced-2003-01-mpc-908-913-2-deemed-approval.md §908(9)", "extra_fee_usd": "400", "section": "§922.07", "note": "Seven 'no detrimental impact' tests; ZBA handout Dec 2024 for fee"},
    {"pathway": "conditional_use", "rank": 3, "decider": "Planning Commission recommends, City Council decides", "hearing": "yes, two (PC and Council)", "statutory_clock": "up to 4 x 45 days (~6 months) before deemed denial", "deemed_denial_on_missed_deadline": "conflict: City code says deemed denial; PA MPC (2003 ed.) says deemed approval; see sources/pa-dced-2003-01-mpc-908-913-2-deemed-approval.md §913.2(b)(2); 39 Council CUs recorded as Passed pursuant to Case Law", "extra_fee_usd": "", "section": "§922.06", "note": "Council needs >=7 votes if PC recommended denial"},
    {"pathway": "not_permitted", "rank": 4, "decider": "Only via use variance (ZBA, §922.09 five findings incl. hardship) or rezoning (Council map amendment)", "hearing": "yes", "statutory_clock": "variance as ZBA; rezoning not bounded", "deemed_denial_on_missed_deadline": "variance: conflict: City code says deemed denial; PA MPC (2003 ed.) says deemed approval; see sources/pa-dced-2003-01-mpc-908-913-2-deemed-approval.md §908(9)", "extra_fee_usd": "400 (variance)", "section": "§922.09 / map amendment", "note": "ZBA 2023-26 (zba-decisions.csv): unit cases with a use variance 22 of 30 approved; conditional on a posted decision, withdrawals invisible"},
    {"pathway": "per_plan", "rank": "", "decider": "Planning Commission, through the site's approved unit development plan", "hearing": "yes", "statutory_clock": "not bounded in code read", "deemed_denial_on_missed_deadline": "unknown", "extra_fee_usd": "", "section": "§909.02", "note": "AP/CP/RP planned-unit districts; not ranked"},
    {"pathway": "not_city_jurisdiction", "rank": "", "decider": "Mount Oliver Borough", "hearing": "", "statutory_clock": "", "deemed_denial_on_missed_deadline": "", "extra_fee_usd": "", "section": "", "note": "Enclave inside the City zoning layer; not ranked"},
    {"pathway": "unknown", "rank": "", "decider": "", "hearing": "", "statutory_clock": "", "deemed_denial_on_missed_deadline": "", "extra_fee_usd": "", "section": "", "note": "Code text unresolved; show as insufficient data, not as bad"},
]

def parse_use_table():
    rows = {}
    for line in SRC.read_text().splitlines():
        parts = line.split("|")
        if parts[0] in TYPOLOGY:
            cells = parts[1:1 + len(COLS)]
            assert len(cells) == len(COLS), (parts[0], len(cells))
            rows[parts[0]] = (dict(zip(COLS, cells)), parts[-1].strip())
    assert len(rows) == len(TYPOLOGY), set(TYPOLOGY) - set(rows)
    return rows

def live_districts():
    q = urllib.parse.urlencode({"where": "1=1", "outFields": "zon_new,full_zoning_type", "returnDistinctValues": "true", "returnGeometry": "false", "f": "json"})
    url = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebZoning/FeatureServer/0/query?" + q
    feats = json.loads(subprocess.run(["curl", "-s", "--max-time", "60", url], capture_output=True, check=True).stdout)["features"]
    return sorted({(f["attributes"]["zon_new"], (f["attributes"]["full_zoning_type"] or "").strip()) for f in feats})

def column_for(z):
    for base in ("R1D", "R1A", "R2", "R3", "RM"):
        if z.startswith(base + "-"):
            return base
    if z.startswith("GT-"):
        return "GT"
    return z if z in COLS else None

SPECIAL_PATHWAY = {"P": ("by_right", 0), "A": ("za", 1), "S": ("zbe_special_exception", 2), "C": ("conditional_use", 3), "not_permitted": ("not_permitted", 4), "per_plan": ("per_plan", ""), "unknown": ("unknown", ""), "not_city_jurisdiction": ("not_city_jurisdiction", "")}

INTERIM_SPECIAL = {
    "MTOBOR": ("not_city_jurisdiction", "", "Mount Oliver Borough is not City jurisdiction"),
    "UPR-A": ("zbe_special_exception", "S", "UPR-A adopts the GT use list (§908.04.D.1.b); GT column of §911.02 = S"),
    "UPR-B": ("zbe_special_exception", "S", "UPR-B adopts the LNC use list (§908.04.D.2.b); LNC column of §911.02 = S"),
    "SP-8": ("zbe_special_exception", "S", "SP-8 adopts GT uses (§909.01.O.4); GT column of §911.02 = S"),
    "SP-11": ("zbe_special_exception", "S", "SUBDISTRICT-DEPENDENT: subdistricts 2-3 adopt the GT list (S); subdistrict 1 is a closed list without it"),
    "SP-1": ("not_permitted", "", "Closed use list (§909.01.F.1) does not include Interim Housing"),
    "SP-4": ("not_permitted", "", "Closed use lists (§909.01.I) do not include Interim Housing"),
    "SP-5": ("not_permitted", "", "Use list (§909.01.J.1) does not include Interim Housing"),
    "SP-9": ("not_permitted", "", "Use lists (§909.01.P.1) do not include Interim Housing"),
    "CP": ("per_plan", "", "Planning Commission may approve any HC use in the plan (§909.02.E.2); HC column = S"),
    "AP": ("per_plan", "", "Planning Commission may approve any RP or CP use in the plan (§909.02.F.2)"),
}

def special_overrides():
    rows = {}
    with open(HERE / "special-district-residential-permissions.csv") as f:
        for r in csv.DictReader(f):
            rows[(r["zon_new"], r["use"])] = r
    return rows

def main():
    table = parse_use_table()
    special = special_overrides()
    districts = live_districts()
    out = []
    for z, full in districts:
        col = column_for(z)
        for use, (cells, standard) in table.items():
            tid, mat = TYPOLOGY[use]
            if col is None:
                code, pathway, rank, conf = "", "unknown", "", "not_in_911_02"
                note = "District not in §911.02 table (SP/PUD/public-realm/non-City); see special-district-residential-permissions.csv"
            else:
                raw = cells[col].strip()
                code = raw
                key = "S" if raw == "P/S" else raw
                pathway, rank = PATHWAY[key]
                conf = "read"
                note = "P/S in R1D: by right or special exception per §911.04A.69A; coded as the more demanding" if raw == "P/S" else ""
            sp = special.get((z, use))
            if col is None and sp:
                pathway, rank = SPECIAL_PATHWAY[sp["code"]]
                code = sp["code"] if sp["code"] in ("P", "A", "S", "C") else ""
                standard = sp["section"]
                conf = sp["confidence"]
                note = sp["note"]
            if col is None and not sp and tid == "interim_housing" and z in INTERIM_SPECIAL:
                pathway, code, note = INTERIM_SPECIAL[z]
                rank = dict(PATHWAY.values()).get(pathway, "")
                conf = "inferred_from_adopted_use_list" if z != "MTOBOR" else "read"
            if tid == "single_attached" and code == "P/S":
                note = "R1D: by right if lot width <= 35 ft, Special Exception if wider (§911.04.A.69A); coded as the more demanding"
            if tid == "single_attached" and z == "H":
                note = (note + "; " if note else "") + "H: Special Exception, max 4 units per cluster (§911.04.A.69(c))"
            if z == "H" and tid == "single_detached":
                note = (note + "; " if note else "") + "any construction in H also triggers Site Plan Review"
            if tid == "multi_unit" and pathway in ("by_right", "za", "zbe_special_exception", "conditional_use"):
                note = (note + "; " if note else "") + ">=4 units triggers Site Plan Review (§922.04) and RCO Development Activities Meeting if a hearing is needed"
            out.append({
                "zon_new": z, "full_zoning_type": full, "use_table_column": col or "",
                "use_911_02": use, "typology": tid, "mat_typology_id": mat or "none",
                "code": code, "pathway": pathway, "pathway_rank": rank,
                "use_standard": standard, "confidence": conf, "note": note,
                "source": sp["source_url"] if (col is None and sp) else SOURCE_URL, "as_of": AS_OF,
            })
    fields = list(out[0].keys())
    with open(HERE / "typology-district-matrix.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(out)
    with open(HERE / "pathways.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(PATHWAY_INFO[0].keys())); w.writeheader(); w.writerows(PATHWAY_INFO)
    wide = {}
    for r in out:
        wide.setdefault(r["zon_new"], {"zon_new": r["zon_new"], "full_zoning_type": r["full_zoning_type"]})[r["typology"]] = r["pathway"]
    with open(HERE / "typology-district-matrix-wide.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["zon_new", "full_zoning_type"] + [t for t, _ in TYPOLOGY.values()]); w.writeheader(); w.writerows(wide.values())
    with open(HERE / "typology-district-matrix.json", "w") as f:
        json.dump({"as_of": AS_OF, "source": SOURCE_URL, "pathway_order": [p for p, _ in sorted(PATHWAY.values(), key=lambda v: v[1])], "unranked_states": ["per_plan", "not_city_jurisdiction", "unknown"], "districts": {z: {k: v for k, v in d.items() if k != "zon_new"} for z, d in wide.items()}}, f, indent=1)
    print(len(districts), "districts;", len(out), "rows")

main()
