"""Every URL in every file on every branch (plus the uncommitted map worktree), with where it appears."""
import json, re, subprocess, collections, os
REPO = "/Users/lancestreuber/Desktop/HouseHack"
SKIP = re.compile(r"(node_modules|\.agents/skills|bun\.lock|package-lock|\.geojson$|\.png$|\.jpg$|\.pdf$|\.ico$|\.woff|pnpm-lock|skills-lock|\.svg$|legal-matrix\.generated)")
URL = re.compile(r"https?://[^\s\"'<>`)\]\\|,]+")
def git(*a): return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True, errors="replace").stdout
branches = [b.strip() for b in git("branch", "-r").splitlines() if "HEAD" not in b] + ["lance-map-data"]
hits = collections.defaultdict(set)
seen_blobs = set()
for br in branches:
    for line in git("ls-tree", "-r", br).splitlines():
        meta, path = line.split("\t", 1)
        blob = meta.split()[2]
        if SKIP.search(path) or blob in seen_blobs: continue
        seen_blobs.add(blob)
        txt = git("cat-file", "-p", blob)
        if len(txt) > 5_000_000: continue
        for u in URL.findall(txt):
            hits[u.rstrip(".;:*_")].add(path)
# uncommitted map worktree edits
W = f"{REPO}/.worktrees/lance-map-data"
for rel in git("-C", W, "status", "--porcelain").splitlines():
    p = rel[3:].strip()
    fp = os.path.join(W, p)
    if SKIP.search(p) or not os.path.isfile(fp): continue
    for u in URL.findall(open(fp, errors="replace").read()): hits[u.rstrip(".;:*_")].add(p + " (uncommitted)")
json.dump({u: sorted(v) for u, v in hits.items()}, open("repo_urls.json", "w"), indent=0)
dom = collections.Counter(re.sub(r"^https?://([^/]+).*", r"\1", u) for u in hits)
print(len(branches), "branches;", len(seen_blobs), "unique files;", len(hits), "unique URLs")
print(dom.most_common(60))
