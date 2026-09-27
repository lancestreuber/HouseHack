"""Collapse raw URLs into distinct data endpoints and flag which look like data (vs news/docs)."""
import json, re, collections
repo = json.load(open("repo_urls.json")); tx = json.load(open("transcript_urls.json"))
def norm(u):
    u = u.split("#")[0]
    m = re.match(r"(https?://[^/]+/.*?/(?:FeatureServer|MapServer|ImageServer)(?:/\d+)?)", u, re.I)
    if m: return m.group(1)
    m = re.search(r"resource_id=([0-9a-f-]{36})", u)
    if m: return "wprdc:resource/" + m.group(1)
    m = re.search(r"data\.wprdc\.org/(?:datastore/dump/|dataset/[^/]+/resource/)([0-9a-f-]{36})", u)
    if m: return "wprdc:resource/" + m.group(1)
    m = re.search(r"data\.wprdc\.org/dataset/([a-z0-9-]+)", u)
    if m: return "wprdc:dataset/" + m.group(1)
    m = re.search(r"(data\.(?:pa|cdc)\.gov)/(?:resource|api/views)/([a-z0-9]{4}-[a-z0-9]{4})", u)
    if m: return f"socrata:{m.group(1)}/{m.group(2)}"
    return re.sub(r"\?.*$", "", u).rstrip("/")
NOISE = re.compile(r"localhost|127\.0\.0|schemas\.openxml|github\.com|youtube|twitter|linkedin|fonts\.|cdn\.|npmjs|vercel\.(com|app)|anthropic|claude\.ai|openrouter|w3\.org|example\.com|shields\.io|wikipedia|web\.archive\.org|chatgpt\.site|docs\.google|slack\.com|discord", re.I)
NEWS = re.compile(r"wesa|post-gazette|publicsource|triblive|witf|stateimpact|cnn\.com|cbs|nbc|axios|newsnation|njbiz|consumeraffairs|kcrg|alleghenyfront|pghcitypaper|nextpittsburgh|wtae|kdka|wpxi|industrialinfo|datacenterdynamics|marketbeat|housingfinance|pittsburghquarterly|wikipedia", re.I)
eps = collections.defaultdict(lambda: {"raw": set(), "repo_files": set(), "sessions": set()})
for u, files in repo.items():
    e = norm(u); eps[e]["raw"].add(u); eps[e]["repo_files"].update(files)
for u, x in tx.items():
    e = norm(u); eps[e]["raw"].add(u); eps[e]["sessions"].update(x["fetched_by"] + x["mentioned_by"])
rows = []
for e, x in eps.items():
    kind = "noise" if NOISE.search(e) else "news" if NEWS.search(e) else "data/doc"
    rows.append({"endpoint": e, "kind": kind, "n_raw": len(x["raw"]), "n_files": len(x["repo_files"]), "sessions": sorted(x["sessions"]),
                 "files_sample": sorted(x["repo_files"])[:4]})
json.dump(rows, open("endpoints.json", "w"), indent=0)
c = collections.Counter(r["kind"] for r in rows); print(len(rows), "endpoints", c)
# row-level reference families (many URLs from one dataset)
fam = collections.Counter()
for r in rows:
    h = re.sub(r"^(https?://)?([^/]+).*", r"\2", r["endpoint"])
    fam[h] += 1
print("hosts with most distinct endpoints:", fam.most_common(25))
