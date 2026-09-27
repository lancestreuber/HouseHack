import csv, json, pathlib

HERE = pathlib.Path(__file__).resolve().parent.parent
RANKED = {"by_right": "P", "za": "A", "zbe_special_exception": "S", "conditional_use": "C"}
SIZE_UNKNOWN = ["Housing for the Elderly (General)", "Housing for the Elderly (Limited)"]

def code(pathway, blank_if_absent=False):
    if pathway in RANKED:
        return RANKED[pathway]
    if pathway in ("not_permitted", "unknown"):
        return "" if blank_if_absent else {"not_permitted": "-", "unknown": "?"}[pathway]
    return pathway

def main():
    m = {(r["zon_new"], r["use_911_02"]): r for r in csv.DictReader(open(HERE / "typology-district-matrix.csv"))}
    typ2label = {r["typology"]: r["use_911_02"] for r in m.values()}
    path = HERE / "senior-and-group-housing.geojson"
    d = json.load(open(path))
    changed = 0
    for f in d["features"]:
        p = f["properties"]
        z, label = p["zon_new"], p["zoning_use_label"]
        uses = SIZE_UNKNOWN if label == "Housing for the Elderly (size unknown)" else [label]
        rows = [m.get((z, u)) for u in uses]
        mu = m.get((z, "Multi-Unit Residential"))
        if not all(rows) or not mu:
            continue
        new = {
            "permission_pathway": "|".join(r["pathway"] for r in rows),
            "permission_code": "|".join(code(r["pathway"]) for r in rows),
            "multi_unit_pathway": mu["pathway"],
            "multi_unit_code": code(mu["pathway"], blank_if_absent=True),
        }
        if any(p.get(k) != v for k, v in new.items()):
            changed += 1
            p.update(new)
    json.dump(d, open(path, "w"), indent=1)

    rows_out = list(csv.DictReader(open(HERE / "senior-and-group-housing-by-district.csv")))
    for r in rows_out:
        mu = m.get((r["zon_new"], "Multi-Unit Residential"))
        if mu:
            r["multi_unit_pathway"] = mu["pathway"]
            r["multi_unit_code"] = code(mu["pathway"], blank_if_absent=True)
        codes = []
        for item in r["inferred_uses"].split(";"):
            parts = []
            for use in item.split("|"):
                row = m.get((r["zon_new"], typ2label.get(use)))
                parts.append(code(row["pathway"]) if row else "?")
            c = "|".join(parts)
            if c not in codes:
                codes.append(c)
        r["permission_codes"] = ";".join(codes)
    with open(HERE / "senior-and-group-housing-by-district.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows_out[0].keys())); w.writeheader(); w.writerows(rows_out)
    print("features changed:", changed)

main()
