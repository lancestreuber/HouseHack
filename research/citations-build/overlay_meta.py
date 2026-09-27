"""Extract every map overlay's declared source metadata from the overlay registry on several branches."""
import json, os, re, subprocess
REPO = os.environ.get("HOUSEHACK_REPO") or subprocess.run(["git", "-C", os.path.dirname(os.path.abspath(__file__)), "rev-parse", "--path-format=absolute", "--git-common-dir"], capture_output=True, text=True).stdout.strip().removesuffix("/.git")
if not os.path.isdir(os.path.join(REPO, ".git")):
    raise SystemExit("HouseHack repo not found; run from inside the repo or set HOUSEHACK_REPO")
BRANCHES = ["origin/lance-flock", "origin/main", "origin/better-jev", "origin/vid-branch", "origin/lance-pillar-hexes", "origin/lance-map-data"]
D = "apps/web/src/components/map/overlays/"

def git(*a):
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True).stdout

def block(s, i):
    depth = 0
    for j in range(i, len(s)):
        if s[j] == "{": depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0: return s[i:j + 1]
    return s[i:]

STR = r'''(?:"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`|'((?:[^'\\]|\\.)*)')'''
def field(b, name):
    m = re.search(rf"\b{name}:\s*{STR}", b)
    if m: return next(g for g in m.groups() if g is not None)
    m = re.search(rf"\b{name}:\s*([A-Z_][A-Z0-9_]*)\b", b)
    return f"<const {m.group(1)}>" if m else None

def consts(s):
    out = {}
    for m in re.finditer(rf"const\s+([A-Z_][A-Z0-9_]*)\s*=\s*{STR}", s):
        out[m.group(1)] = next(g for g in m.groups()[1:] if g is not None)
    return out

overlays = {}
for br in BRANCHES:
    date = git("log", "-1", "--format=%ci", br).strip()
    files = [f for f in git("ls-tree", "-r", "--name-only", br, D).split() if f.endswith(".ts")]
    for f in files:
        s = git("show", f"{br}:{f}")
        cs = consts(s)
        for m in re.finditer(r"\bmeta:\s*\{", s):
            b = block(s, m.end() - 1)
            before = s[:m.start()]
            ids = re.findall(r'\bid:\s*"([a-z0-9-]+)"', before)
            labels = re.findall(r'\blabel:\s*"([^"]+)"', before)
            if not ids: continue
            rec = {k: field(b, k) for k in ("source", "sourceUrl", "asOf", "geography", "evidence")}
            for k, v in rec.items():
                if v and v.startswith("<const "): rec[k] = cs.get(v[7:-1], v)
            cav = re.search(r"caveats:\s*\[(.*?)\]", b, re.S)
            rec["caveats"] = re.findall(STR, cav.group(1)) if cav else []
            rec["caveats"] = [next(g for g in c if g) for c in rec["caveats"] if any(c)]
            rec.update(id=ids[-1], label=labels[-1] if labels else "", file=f.split("/")[-1], branch=br, branch_date=date)
            prev = overlays.get(rec["id"])
            if not prev or date > prev["branch_date"] or (date == prev["branch_date"] and not prev.get("sourceUrl")):
                overlays[rec["id"]] = rec
json.dump(overlays, open("overlays_meta.json", "w"), indent=1)
print(len(overlays), "overlay/meta blocks")
for k, v in sorted(overlays.items()):
    print(f"{k:34s} | {str(v['source'])[:70]:70s} | {str(v['sourceUrl'])[:60]} | {v['branch'].split('/')[-1]}")
