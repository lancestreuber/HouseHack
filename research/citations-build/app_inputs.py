"""Pull the app-side inputs straight from git: the pillar config, the provenance block in each built map file,
and every URL referenced by app or script code on the newest app branches."""
import json, re, subprocess, os, collections
REPO = os.environ.get("HOUSEHACK_REPO") or subprocess.run(["git", "-C", os.path.dirname(os.path.abspath(__file__)), "rev-parse", "--path-format=absolute", "--git-common-dir"], capture_output=True, text=True).stdout.strip().removesuffix("/.git")
if not os.path.isdir(os.path.join(REPO, ".git")):
    raise SystemExit("HouseHack repo not found; run from inside the repo or set HOUSEHACK_REPO")
APP_BRANCHES = ["origin/lance-flock", "origin/better-jev", "origin/main", "origin/vid-branch", "origin/lance-map-data"]
OVERLAYS = "apps/web/public/data/overlays/"
CODE = re.compile(r"^apps/web/(scripts/(data|pillars)/[^/]+\.(ts|py)|scripts/(data|pillars)/inputs/.*\.(py|md|json)$|src/components/map/overlays/.*\.ts$|src/components/.*\.tsx$|src/lib/.*\.(ts|json)$)|^packages/api/src/.*\.ts$")
SKIP = re.compile(r"alpr\.json|legal-matrix\.generated|citipark_\d\.json|\.geojson")
URL = re.compile(r"https?://[^\s\"'<>`)\]\\|,]+")

def git(*a):
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True, errors="replace").stdout

app = APP_BRANCHES[0]
json.dump(json.loads(git("show", f"{app}:apps/web/src/lib/pillars/pillars.config.json")), open("pillars.config.json", "w"), indent=1)

file_meta = {}
for f in git("ls-tree", "-r", "--name-only", app, OVERLAYS).split():
    name = f[len(OVERLAYS):]
    if "/" in name or not name.endswith(".geojson"):
        continue
    d = json.loads(git("show", f"{app}:{f}"))
    meta = {k: v for k, v in (d.get("metadata") or {}).items() if k not in ("builtAt", "generatedAt", "updatedAt")}
    file_meta[name] = {"features": len(d.get("features", [])), "metadata": meta}
json.dump(file_meta, open("file_meta.json", "w"), indent=1)

code_urls = collections.defaultdict(set)
for br in APP_BRANCHES:
    for f in git("ls-tree", "-r", "--name-only", br).split():
        if not CODE.search(f) or SKIP.search(f):
            continue
        for u in URL.findall(git("show", f"{br}:{f}")):
            u = re.sub(r"\$\{.*$", "", u).rstrip(".;:*_")
            code_urls[u].add(f)
json.dump({u: sorted(v) for u, v in sorted(code_urls.items())}, open("code_urls.json", "w"), indent=0)
print(len(file_meta), "map files;", len(code_urls), "code URLs;", "pillars config from", app)
