"""Assemble DATA_SOURCES.md from the curated catalog (core.md) plus sections generated from the repo.

Generated parts:
  §3 map layers        <- overlay registry `meta` blocks (overlay_meta.py) + provenance stored in each built file
  §4 pillar indicators <- apps/web/src/lib/pillars/pillars.config.json
  §5 legal files       <- apps/web/scripts/data/inputs/legal-feasibility/ listing
  §7 team-built files  <- scripts/data/inputs/** and scripts/pillars/inputs/** listings
  §9 method references <- links in research/pillars/*.md
  §10 bibliography     <- research/docs/02-bibliography.md (links rewritten for the repo root)
  Appendix A/B         <- every URL in every branch and session transcript (repo_urls.py, transcript_urls.py,
                          endpoints.py), plus a coverage check of code-referenced endpoints against the catalog
"""
import collections
import datetime
import json
import os
import re
import subprocess

REPO = os.environ.get("HOUSEHACK_REPO") or subprocess.run(["git", "-C", os.path.dirname(os.path.abspath(__file__)), "rev-parse", "--path-format=absolute", "--git-common-dir"], capture_output=True, text=True).stdout.strip().removesuffix("/.git")
if not os.path.isdir(os.path.join(REPO, ".git")):
    raise SystemExit("HouseHack repo not found; run from inside the repo or set HOUSEHACK_REPO")
APP_BRANCH = "origin/lance-flock"      # newest branch with the full map, cameras and pillars
LEGAL_BRANCH = APP_BRANCH
RESEARCH_BRANCH = "origin/lance-research"


def git(*a):
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True, errors="replace").stdout


def md_escape(s):
    return str(s or "").replace("|", "\\|").replace("\n", " ").strip()


core = open("core.md").read()
parts = re.split(r"(?m)^(?=## \d+\. )", core)
sec = {int(re.match(r"## (\d+)\.", p).group(1)): p.rstrip() for p in parts if re.match(r"## \d+\.", p)}

overlays = json.load(open("overlays_meta.json"))
file_meta = json.load(open("file_meta.json"))
cfg = json.load(open("pillars.config.json"))
endpoints = json.load(open("endpoints.json"))
code_urls = json.load(open("code_urls.json"))
repo_urls = json.load(open("repo_urls.json"))
tx_urls = json.load(open("transcript_urls.json"))
n_branches = len([b for b in git("branch", "-r").splitlines() if "HEAD" not in b])
n_sessions = len({s for x in tx_urls.values() for s in x["fetched_by"] + x["mentioned_by"]})

# ---------- §3 map layers ----------
def layer_rows():
    rows = []
    for oid, m in sorted(overlays.items()):
        base = re.sub(r"-(outline|dots|fill|heat|raster|lines|separate|planned)$", "", oid)
        rows.append((base, m.get("label", ""), m.get("source") or "(see file provenance below)",
                     (m.get("sourceUrl") or "").replace("${CITY}", "CITY"), m.get("asOf") or "", m.get("geography") or ""))
    seen, out = set(), []
    for r in rows:
        if r[0] in seen:
            continue
        seen.add(r[0])
        out.append(r)
    return out

lr = layer_rows()
s3 = ["## 3. Every map layer and its source",
      "",
      f"Generated from the overlay registry (`apps/web/src/components/map/overlays/*.ts`, the `meta` block every layer must declare), newest version across branches. **{len(lr)} layers.** Each layer also shows its source, vintage, geography and caveats in the app's layer panel.",
      "",
      "| Layer id | Label | Source (as declared) | Source URL | As of | Geography |",
      "|---|---|---|---|---|---|"]
for r in lr:
    s3.append("| " + " | ".join(md_escape(x) for x in r) + " |")
s3 += ["",
       f"### 3.1 Provenance recorded inside each built map file ({len(file_meta)} files)",
       "",
       "Every build script writes a `metadata` block into its GeoJSON (`apps/web/public/data/overlays/`). This is the machine record of where each file's features came from.",
       "",
       "| File | Features | Recorded source(s) |",
       "|---|---|---|"]
for f, v in sorted(file_meta.items()):
    m = v.get("metadata") or {}
    src = m.get("source") or m.get("sources") or m.get("dataset") or ""
    if isinstance(src, list):
        src = " · ".join(src)
    extra = {k: val for k, val in m.items() if k not in ("source", "sources", "dataset")}
    txt = str(src) + (f" ({json.dumps(extra)[:200]})" if extra else "")
    s3.append(f"| `{f}` | {v.get('features', '')} | {md_escape(txt)} |")

# ---------- §4 pillar indicators ----------
FILE_DATASET = {
    "usps-vacancy.geojson": "HUD/USPS vacant addresses (§2.4)",
    "market-zip.geojson": "County property sales + Zillow ZORI (§2.4)",
    "market-mva.geojson": "Reinvestment Fund MVA 2021 / DRR (§2.4)",
    "flood-zones.geojson": "FEMA NFHL (§2.2)",
    "weather-risk.geojson": "FEMA National Risk Index (§2.2)",
    "housing-costs.geojson": "ACS 2020–24 via Census Reporter (§2.4)",
    "location-affordability.geojson": "HUD/DOT Location Affordability Index v3 (§2.4)",
    "places-groceries.geojson": "USDA SNAP retailers + ACHD food permits (§2.10)",
    "air-quality.geojson": "EPA EJScreen v2.32, PEDP mirror (§2.2)",
    "landslide-susceptibility.geojson": "County landslide susceptibility (§2.2)",
    "lead-service-lines.geojson": "PWSA service line material (§2.3)",
    "chas-cost-burden.geojson": "HUD CHAS 2018–22 (§2.4)",
    "transit-stops.geojson": "PRT stops via WPRDC (§2.3)",
    "commerce-density.geojson": "ACHD food facilities (§2.10)",
    "places-pharmacies.geojson": "CMS NPPES pharmacies (§2.8)",
    "places-schools.geojson": "Allegheny County Schools (§2.10)",
    "parks.geojson": "County parks, greenways (§2.10)",
    "places-health-centers.geojson": "HRSA health center sites (§2.8)",
    "places-clinics.geojson": "CMS NPPES clinics (§2.8)",
    "places-hospitals.geojson": "PA DOH hospitals + CMS ratings (§2.8)",
    "places-child-care.geojson": "PA DHS child care (§2.10)",
    "places-libraries.geojson": "County libraries (§2.10)",
    "places-food-banks.geojson": "Greater Pittsburgh Community Food Bank (§2.10)",
    "places-dentists.geojson": "OSM + County Assets (§2.10)",
    "places-community-centers.geojson": "OSM + County Assets (§2.10)",
    "places-senior-centers.geojson": "County Assets (§2.10)",
    "jobs.geojson": "LODES + UMN Access Across America (§2.6, §2.3)",
    "allegheny_tract_household_growth_2020_2024.csv": "2020 Census PL 94-171 + ACS B11001 (§2.6)",
    "derived_tract_turnover.csv": "County sales + ACS tenure (§2.4)",
    "allegheny_jobs_demand_bg_2023.csv": "LEHD LODES8 2019/2023 (§2.6)",
    "pgh_new_residential_permits_classified.csv": "PLI permits via WPRDC (§2.6)",
    "slope25.geojson": "City PGHWebSlope25 (§2.2)",
    "landslide-prone.geojson": "City PGHWebLandslideProne (§2.2)",
    "undermined.geojson": "City PGHWebUndermined (§2.2)",
    "typology-district-matrix.csv": "Zoning Code §911.02 via eCode360 (§2.11)",
    "typology-district-matrix.json": "Zoning Code §911.02 via eCode360 (§2.11)",
    "allegheny_tract_sales_2019_2025.csv": "County property sales + assessments (§2.4, §2.5)",
    "pittsburgh_evictions_zip_2025.csv": "Eviction Lab ETS (§2.4)",
    "allegheny_energy_burden_tract_2022.csv": "DOE LEAD 2022 (§2.4)",
    "allegheny_tract_college_enrollment.csv": "ACS B14007/B26001 (§2.7)",
    "achd_facilities_latest.csv": "ACHD emissions inventory (§2.2)",
    "pgh_parcel_lst_canopy.csv": "Landsat C2L2 surface temperature + NLCD canopy (§2.2)",
    "allegheny_bg_canopy_impervious_lst.csv": "NLCD canopy/impervious + Landsat (§2.2)",
}


def src_files(src):
    f = src.get("file")
    fs = f if isinstance(f, list) else [f] if f else []
    return [x.split("/")[-1] for x in fs]


pillar_label = {p["id"]: p.get("label", p["id"]) for p in cfg.get("pillars", [])}
pillar_of = {}
inds = cfg.get("indicators", [])
s4 = ["## 4. Every pillar-score indicator and its source",
      "",
      f"Generated from `apps/web/src/lib/pillars/pillars.config.json` ({APP_BRANCH}), the open-weights file the scorer, panel and CLI all read. **{len(inds)} indicators.** Evidence types follow the brief: observed, assumption, policy or value.",
      "",
      "| Indicator id | Pillar | What it measures | Geography | Evidence | Input file → field | Original dataset |",
      "|---|---|---|---|---|---|---|"]
for ind in inds:
    src = ind.get("source") or {}
    files = src_files(src)
    kind = src.get("kind", "")
    field = src.get("property") or src.get("ratio") or ""
    if not files:
        ds = "City ParcelsPublic (§2.1)" if kind in ("parcel_attr", "parcel_use") else ""
        fdesc = f"{kind}" + (f" → {field}" if field else "")
    else:
        ds = "; ".join(FILE_DATASET.get(f, "?") for f in files)
        fdesc = ", ".join(f"`{f}`" for f in files) + (f" → `{field}`" if field else "") + f" ({kind})"
    s4.append("| " + " | ".join([f"`{ind.get('id')}`", pillar_label.get(ind.get("pillar"), ind.get("pillar", "")) + (f" / {ind['subscore']}" if ind.get("subscore") else ""),
                                 md_escape(ind.get("label")), md_escape(ind.get("geography")),
                                 md_escape(ind.get("evidence")), fdesc, ds]) + " |")
unknown = sorted({f for ind in inds for f in src_files(ind.get("source") or {}) if f not in FILE_DATASET})
if unknown:
    s4 += ["", "⚠ Input files without a dataset mapping above: " + ", ".join(unknown)]

# ---------- §5 legal feasibility ----------
legal_files = [f for f in git("ls-tree", "-r", "--name-only", LEGAL_BRANCH, "apps/web/scripts/data/inputs/legal-feasibility/").split()]
s5 = ["## 5. Legal-feasibility datasets (City of Pittsburgh)",
      "",
      "Built by the legal-feasibility workstream from primary legal records (§2.11). All are raw, coded facts with no scores. The source notes inside each `.md` file give exact queries, counts and access logs.",
      "",
      "| File | Primary sources |",
      "|---|---|"]
LEGAL_SRC = {
    "typology-district-matrix": "Zoning Code §911.02 (eCode360), live distinct `zon_new` query on PGHWebZoning",
    "pathways": "Zoning Code Ch. 922 procedures (eCode360)",
    "zba-decisions": "ZBA decision PDFs on pittsburghpa.gov, located via the Wayback Machine CDX API and the archived ZBA page; geocoded",
    "zba-outcomes": "Derived from zba-decisions",
    "council-land-use-actions": "Legistar Web API (webapi.legistar.com/v1/pittsburgh/matters), Allegheny County parcels MapServer, Census geocoder",
    "planning-commission": "Planning Commission compiled minutes 2020–2025 (pittsburghpa.gov PDFs)",
    "permits-new-residential": "OneStopPGH OSPI_H, WPRDC PLI permits, City Development_Construction_Projects_v2, PGHWebZoning, PGHWebNeighborhoods",
    "permits-by-typology": "Derived from permits-new-residential",
    "senior-and-group-housing": "PA DHS provider directory, data.pa.gov personal care homes and nursing homes, CMS nursing home provider info, HUD MF-Assisted / 202 / 811 / LIHTC / Public Housing, HACP communities, City boundary, PGHWebZoning, Census geocoder",
    "special-district": "eCode360 print views (Art. IV, V, IX), SP-10 Appendix PDF, Legistar (ADU history), PGHWebZoningOverlays",
    "use-definitions": "eCode360; City DCP use classifications handout",
    "care-facility-spacing": "PA DHS / DOH facility records; Zoning Code §911.04 spacing rule (800 ft)",
    "README": "Folder guide",
}
for f in legal_files:
    name = f.split("/")[-1]
    if name.endswith((".py", ".json")) and "/scripts/" in f:
        continue
    key = next((k for k in LEGAL_SRC if name.startswith(k)), None)
    s5.append(f"| `{f.replace('apps/web/scripts/data/inputs/legal-feasibility/', '')}` | {LEGAL_SRC.get(key, 'see the folder README')} |")

# ---------- §7 team-built files ----------
def listing(branch, prefix):
    return [f for f in git("ls-tree", "-r", "--name-only", branch, prefix).split()]

team = listing(APP_BRANCH, "apps/web/scripts/data/inputs/") + listing(APP_BRANCH, "apps/web/scripts/pillars/inputs/")
team = [f for f in team if "/legal-feasibility/" not in f]
data_files = [f for f in team if not f.endswith((".py", ".sh", ".md"))]
scripts = [f for f in team if f.endswith((".py", ".sh"))]
s7 = ["## 7. Team-built extracts and the scripts that made them",
      "",
      "Large national files were cut to Allegheny County and saved with their scripts, so every number can be regenerated. Upstream sources are in §2.",
      "",
      f"**{len(data_files)} data files** in `apps/web/scripts/data/inputs/` and `apps/web/scripts/pillars/inputs/` ({APP_BRANCH}):",
      ""]
for f in data_files:
    s7.append(f"- `{f.replace('apps/web/scripts/', '')}`")
s7 += ["", f"**{len(scripts)} extraction scripts:** " + ", ".join(f"`{f.split('/')[-1]}`" for f in scripts), ""]
s7 += ["Map build scripts (`apps/web/scripts/data/*.ts`) and pillar scripts (`apps/web/scripts/pillars/*.ts`) turn these and the live endpoints into the map files and scores."]

# ---------- §9 method references ----------
refs = collections.OrderedDict()
for f in ("aggregation-standards", "per-pillar-methods", "typology-design"):
    txt = git("show", f"{APP_BRANCH}:research/pillars/{f}.md")
    for m in re.finditer(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", txt):
        refs.setdefault(m.group(2), m.group(1))
    for u in re.findall(r"https?://[^\s)>\"]+", txt):
        u = u.rstrip(".,;")
        refs.setdefault(u, "")
s9 = ["## 9. Methodology references (pillar scores)",
      "",
      "Standards and methods cited in `research/pillars/aggregation-standards.md`, `per-pillar-methods.md` and `typology-design.md`: composite-indicator guidance (OECD/JRC), index designs (HDI, CalEnviroScreen, CEJST, CTCAC opportunity maps, AARP Livability, Walk Score), and the technical documentation of the datasets we score.",
      ""]
for u, t in refs.items():
    s9.append(f"- [{md_escape(t) or u}]({u})")

# ---------- §10 research bibliography ----------
bib = git("show", f"{RESEARCH_BRANCH}:research/docs/02-bibliography.md")
bib = re.sub(r"\]\(\.\./", "](research/", bib)
bib = re.sub(r"\]\((?!https?:|research/|#)([^)]+\.md)\)", r"](research/docs/\1)", bib)
bib = re.sub(r"(?m)^# Annotated Bibliography", "## 10. Research bibliography (all sources consulted)", bib)
bib = re.sub(r"(?m)^## (?!10\.)", "### ", bib)
bib = bib.replace("`admin/scripts/build_bibliography.py`", "`research/admin/scripts/build_bibliography.py`")
s10 = [bib.strip(), "",
       f"_Embedded from `research/docs/02-bibliography.md` on `{RESEARCH_BRANCH.split('/')[-1]}`. Regenerate with `research/admin/scripts/build_bibliography.py`._"]

# ---------- Appendix A/B ----------
curated = "\n".join([sec[1], sec[2], sec[6], sec[8]])
def in_catalog(u):
    m = re.search(r"/services/([^/]+)/(?:FeatureServer|MapServer|ImageServer)", u)
    if m:
        return m.group(1) in curated
    m = re.search(r"([0-9a-f]{8})-[0-9a-f]{4}-", u)
    if m and ("wprdc" in u):
        return m.group(1) in curated
    m = re.search(r"data\.wprdc\.org/dataset/([a-z0-9-]+)", u)
    if m:
        return m.group(1) in curated
    core_u = re.sub(r"[?#].*$", "", u).rstrip("/")
    core_u = re.sub(r"^https?://(www\.)?", "", core_u)
    return core_u.split("/")[0] in curated and (core_u in curated or len(core_u.split("/")) <= 2 or "/".join(core_u.split("/")[:3]) in curated)

IGNORE = re.compile(r"neon\.new|key=|token=|apikey|secret|sig=|schemas\.openxml|example\.(com|test)|github\.com|localhost|openstreetmap\.org/copyright|youtube\.com/embed|relay\.ozolio|video\.nest|images\.weatherstem|usgs-nims-images|images\.webcamgalore|96\.69\.79|wx\.w3sll\.net/weewx/image|breathecam\.org/#|/api/\?$|/1\.0$|resource_show\?id=$|datastore/dump$|data\.wprdc\.org$|/rest/services$|nominatim\.openstreetmap\.org/search\?$")
method_text = "\n".join(s9 + s10)
checked = [u for u in code_urls if not IGNORE.search(u)]
as_method = [u for u in checked if not in_catalog(u) and u in method_text]
missing = sorted(u for u in checked if not in_catalog(u) and u not in method_text)

FAMILIES = [
    ("pittsburghpa.gov ZBA decision PDFs and archived copies", r"zoning-board-of-adjustm|redtail/images|web\.archive\.org/web/\d+/https://www\.pittsburghpa\.gov"),
    ("OpenStreetMap node links (ALPR locations)", r"openstreetmap\.org/node/"),
    ("Legistar matter records (Council land-use actions)", r"legistar\.com/(v1/pittsburgh/matters/\d|gateway\.aspx)"),
    ("WPRDC playground photos", r"tools\.wprdc\.org/images/"),
]
fam_counts = collections.Counter()
data_eps = []
for e in endpoints:
    if e["kind"] != "data/doc" or re.search(r"neon\.new|[?&](key|token|apikey|sig|secret)=|\$|\{|\[|\[::1", e["endpoint"], re.I):
        continue
    ep = e["endpoint"]
    fam = next((name for name, rx in FAMILIES if re.search(rx, ep)), None)
    if fam:
        fam_counts[fam] += e["n_raw"]
        continue
    data_eps.append(e)
data_eps.sort(key=lambda e: re.sub(r"^https?://(www\.)?", "", e["endpoint"]))
appA = ["## Appendix A. Every endpoint found in code, docs and session transcripts",
        "",
        f"Machine-extracted from every file on all {n_branches} branches and from the {n_sessions} Claude session transcripts in this project. URLs are collapsed to one entry per ArcGIS layer, WPRDC resource/dataset, Socrata dataset or page. News articles and tooling links are excluded here (news is in §10). **{len(data_eps)} endpoints**, plus these row-level link families, which are records inside one dataset rather than separate sources:",
        ""]
for name, n in fam_counts.most_common():
    appA.append(f"- {name}: {n:,} links")
appA += ["", "`✓` = cited in the catalog (§1–§2, §6, §8). Sessions: which Claude session fetched or cited it.", "",
         "| Endpoint | ✓ | Repo files | Sessions |", "|---|---|---|---|"]
for e in data_eps:
    ok = "✓" if in_catalog(e["endpoint"]) else ""
    appA.append(f"| {md_escape(e['endpoint'])} | {ok} | {e['n_files']} | {md_escape(', '.join(e['sessions']))} |")

appB = ["## Appendix B. Coverage check",
        "",
        f"Every URL referenced by the app, map build scripts, pillar scripts or extraction scripts ({len(code_urls)} URLs on the newest branches) was checked against the catalog. Camera stream URLs, schema namespaces and placeholders are excluded; their pages are cited in §2.12. {len(as_method)} of the URLs are methodology references (mostly copied into the /resources page data) and are cited in §9 or §10.",
        ""]
if missing:
    appB += [f"**{len(missing)} code-referenced URLs not matched to a catalog row:**", ""] + [f"- {u}" for u in missing]
else:
    appB += ["**Result: every code-referenced data endpoint is cited in the catalog.**"]

# ---------- header ----------
n_cat = sum(1 for line in "\n".join([sec[2]]).splitlines() if line.startswith("| ") and not line.startswith("| Dataset") and not line.startswith("| Camera") and not line.startswith("|---"))
today = datetime.date.today().isoformat()
n_bib = re.search(r"\*\*(\d+) unique external sources", bib)
n_bib = n_bib.group(1) if n_bib else "?"
header = f"""# HouseHack: Data Sources and Citations

**Every dataset, service and reference used to build HouseHack**, the Track 3 (Housing Typology, Equity & Climate Matchmaker) entry for the AI Horizons 2026 AI for Housing Hackathon. It covers Pittsburgh and Allegheny County, Pennsylvania.

Compiled {today} from:
- the code on all {n_branches} branches;
- the overlay registry, where every map layer declares its source;
- the provenance written into every built map file;
- the pillar config;
- the legal-feasibility source notes;
- the research bibliography;
- the transcripts of the {n_sessions} Claude sessions that worked on the project and cited or fetched a URL.

Sections §3, §4, §5, §7, §9, §10 and both appendices are generated by code in `research/citations-build/` (`build_citations.py`, with `app_inputs.py`, `overlay_meta.py`, `repo_urls.py`, `transcript_urls.py`, `endpoints.py`). §1, §2, §6 and §8 are curated by hand from those extractions. Appendix B is a coverage check: every endpoint the code actually calls is matched against the catalog.

**At a glance**

| | Count |
|---|---|
| Datasets and services in the curated catalog (§2) | {n_cat} |
| Map layers with a declared source (§3) | {len(lr)} |
| Built map files with recorded provenance (§3.1) | {len(file_meta)} |
| Pillar-score indicators, each traced to a dataset (§4) | {len(inds)} |
| Team-built extract files (§7) | {len(data_files)} |
| Methodology references (§9) | {len(refs)} |
| Research sources consulted (§10) | {n_bib} |
| Distinct endpoints found anywhere (Appendix A) | {len(data_eps)} |

**Contents:** [1. Attribution and licenses](#1-attribution-and-license-obligations) · [2. Dataset catalog](#2-dataset-catalog-by-theme) · [3. Map layers](#3-every-map-layer-and-its-source) · [4. Pillar indicators](#4-every-pillar-score-indicator-and-its-source) · [5. Legal-feasibility datasets](#5-legal-feasibility-datasets-city-of-pittsburgh) · [6. AI and runtime services](#6-ai-models-and-runtime-services) · [7. Team-built extracts](#7-team-built-extracts-and-the-scripts-that-made-them) · [8. Researched, not used](#8-researched-but-not-used-in-the-product) · [9. Methodology references](#9-methodology-references-pillar-scores) · [10. Research bibliography](#10-research-bibliography-all-sources-consulted) · [Appendix A](#appendix-a-every-endpoint-found-in-code-docs-and-session-transcripts) · [Appendix B](#appendix-b-coverage-check)

**Limitations of this document.**
- Licenses marked "not stated" had no license string at the source.
- A few operational numbers (feature counts) change as sources update; the date each was read is given.
- This is a citation list, not legal advice about reuse terms.

---
"""
doc = "\n\n".join([header, sec[1], sec[2], "\n".join(s3), "\n".join(s4), "\n".join(s5), sec[6],
                   "\n".join(s7), sec[8], "\n".join(s9), "\n".join(s10), "\n".join(appA), "\n".join(appB)]) + "\n"
open("DATA_SOURCES.md", "w").write(doc)
print("written", len(doc), "chars;", doc.count("\n"), "lines; catalog rows", n_cat, "; missing coverage", len(missing))
for u in missing:
    print("  MISSING", u)
