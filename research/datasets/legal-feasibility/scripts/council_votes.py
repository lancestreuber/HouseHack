import json,urllib.request,ssl,certifi,concurrent.futures as cf
CTX=ssl.create_default_context(cafile=certifi.where())
H=json.load(open("hist.json"))
ids=[h["MatterHistoryId"] for r in H.values() for h in r["histories"] if h.get("MatterHistoryPassedFlag") is not None or (h.get("MatterHistoryActionName") or "").startswith(("Passed","Affirm","Veto","Overr","Defeat","Negative"))]
def get(i):
    for k in range(4):
        try: return i,json.load(urllib.request.urlopen(f"https://webapi.legistar.com/v1/pittsburgh/eventitems/{i}/votes",timeout=60,context=CTX))
        except Exception as e: err=str(e)
    return i,{"error":err}
V={}
with cf.ThreadPoolExecutor(10) as ex:
    for i,v in ex.map(get,ids): V[i]=v
json.dump(V,open("votes.json","w"))
print(len(ids),sum(1 for v in V.values() if isinstance(v,list) and v),sum(1 for v in V.values() if isinstance(v,dict)))
