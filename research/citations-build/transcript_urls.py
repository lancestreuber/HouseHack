"""URLs used in every HouseHack session transcript, split by whether a tool actually fetched them."""
import json, re, glob, collections, os
URL = re.compile(r"https?://[^\s\"'<>`)\]\\|,]+")
NAMES = {"8a73caaf": "adding to map", "92681206": "feasability data", "dbf658f5": "high level data", "b18003ab": "low level data",
         "5dca8317": "camera finding", "a0944f19": "camera finding (2)", "059a4e86": "resources page",
         "7afaebb9": "deal killers algo", "b35cbf37": "slack scrape", "cf831d34": "research followups", "64dbdd6d": "pillar hexes GUI", "1020b8c5": "dataset provenance Q&A",
         "a733fb5d": "typology Q&A", "37f2c559": "naming", "cdc8352b": "high level data (2)"}
out = collections.defaultdict(lambda: {"fetched_by": set(), "mentioned_by": set()})
for f in glob.glob(os.path.expanduser("~/.claude/projects/-Users-lancestreuber-Desktop-HouseHack/*.jsonl")):
    sid = os.path.basename(f)[:8]; name = NAMES.get(sid, sid)
    for line in open(f, errors="replace"):
        try: d = json.loads(line)
        except Exception: continue
        msg = d.get("message") or {}
        content = msg.get("content")
        if not isinstance(content, list): continue
        for c in content:
            if not isinstance(c, dict): continue
            if c.get("type") == "tool_use":
                inp = json.dumps(c.get("input", {}))
                for u in URL.findall(inp.replace("\\n", " ").replace('\\"', '"')):
                    out[u.rstrip(".;:*_\\")]["fetched_by"].add(name)
            elif c.get("type") == "text" and d.get("type") == "assistant":
                for u in URL.findall(c.get("text", "")):
                    out[u.rstrip(".;:*_\\")]["mentioned_by"].add(name)
res = {u: {k: sorted(v) for k, v in x.items()} for u, x in out.items()}
json.dump(res, open("transcript_urls.json", "w"), indent=0)
dom = collections.Counter(re.sub(r"^https?://([^/]+).*", r"\1", u) for u in res)
by = collections.Counter(s for x in res.values() for s in set(x["fetched_by"]) | set(x["mentioned_by"]))
print(len(res), "unique URLs in transcripts; per session:", by.most_common())
print(dom.most_common(70))
