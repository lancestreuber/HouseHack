import json,urllib.request,ssl,certifi,concurrent.futures as cf
CTX=ssl.create_default_context(cafile=certifi.where())
B="https://webapi.legistar.com/v1/pittsburgh/matters/"
M=json.load(open("matters_cat.json"))
C=[m for m in M if m["_cat"] in("conditional_use","map_amendment","sp_pud")]
def get(u):
    for i in range(4):
        try: return json.load(urllib.request.urlopen(u,timeout=60,context=CTX))
        except Exception as e: err=e
    return {"error":str(err)}
def job(m):
    i=m["MatterId"]
    h=get(B+f"{i}/histories")
    v=get(B+f"{i}/versions")
    txt=None
    if isinstance(v,list) and v:
        key=sorted(v,key=lambda x:x.get("Value") or "")[-1]["Key"]
        t=get(B+f"{i}/texts/{key}")
        if isinstance(t,dict): txt=t.get("MatterTextPlain")
    return i,{"histories":h,"text":txt}
out={}
with cf.ThreadPoolExecutor(8) as ex:
    for i,r in ex.map(job,C): out[i]=r
json.dump(out,open("hist.json","w"))
print(len(out),sum(1 for r in out.values() if r["text"]))
