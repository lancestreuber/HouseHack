import csv, json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent.parent
ORG = re.compile(r"\b(LLC|L\.L\.C|Inc|Incorporated|LP|L\.P|LLP|Ltd|Co|Corp|Corporation|Company|Authority|University|Association|Church|Parish|Diocese|Housing|Development|Developers?|Partners|Partnership|Trust|Trustees|Hospital|City|School|Center|Centre|Group|Foundation|Board|Department|Properties|Property|Land|Bank|Council|Commission|Realty|Holdings|Ventures|Services|Community|Ministries|District|Society|Club|College|Carnegie|Museum|Allegheny|Pittsburgh|County|Commonwealth|Institute|Industries|Enterprises|Investments|Associates|Management|Capital|Fund|Estate|Apartments|Homes|Residences|Hotel|Health|Medical|UPMC|PNC|Duquesne|Chatham|Carlow|Temple|Synagogue|Mosque|Academy|Agency|Organization|Network|Energy|Railroad|Railway|Port|Transit|Steel|ALMONO|URA|YMCA|YWCA|Salvation|Goodwill|Presbyterian|Catholic|Lutheran|Methodist|Baptist|Episcopal|Assembly|Fellowship|Mission|Ministry|Cemetery|Library|Club)s?\b", re.I)
SPAN = re.compile(r"((?:on behalf of|application of|request of|petition of|filed by|submitted by|owned by|lessee and|\bto(?: the)?|\bfor(?: the)?)\s+|^|[;:]\s*)([A-Z][^,;]{1,80}?),\s+(?:the\s+)?(property\s+owners?|owners?|applicants?|lessees?)\b")

def redact(text):
    if not text:
        return text, 0
    n = 0
    def sub(m):
        nonlocal n
        name = m.group(2)
        if ORG.search(name):
            return m.group(0)
        n += 1
        return f"{m.group(1)}[individual owner name redacted], {m.group(3)}"
    out = SPAN.sub(sub, text)
    out2 = re.sub(r"(on behalf of|owned by)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-zA-Z'’-]+|[A-Z]\.\s?[A-Z]\.\s?[A-Z][a-zA-Z'’-]+)(?=[,;.]| and\b)", lambda m: m.group(0) if ORG.search(m.group(2)) else (f"{m.group(1)} [individual owner name redacted]"), out)
    n += out2 != out
    return out2, n

def run_csv(name, cols):
    path = HERE / name
    rows = list(csv.DictReader(open(path, newline="")))
    total = 0
    for r in rows:
        for c in cols:
            r[c], k = redact(r.get(c, ""))
            total += k
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    return total

def run_geojson(name, cols):
    path = HERE / name
    d = json.load(open(path))
    total = 0
    for f in d["features"]:
        for c in cols:
            if c in f["properties"]:
                f["properties"][c], k = redact(f["properties"][c])
                total += k
    json.dump(d, open(path, "w"), separators=(",", ":"))
    return total

if __name__ == "__main__":
    print("council csv", run_csv("council-land-use-actions.csv", ["title"]))
    print("council geojson", run_geojson("council-land-use-actions.geojson", ["title"]))
    print("pc csv", run_csv("planning-commission-actions-parsed.csv", ["item_description"]))
