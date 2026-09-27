import json,urllib.request,urllib.parse,time,ssl,certifi
CTX=ssl.create_default_context(cafile=certifi.where())
B="https://webapi.legistar.com/v1/pittsburgh/matters"
terms=["Zoning","zoning","Conditional Use","conditional use","Specially Planned","Planned Unit","Project Development Plan","Zoning Map","rezon","Rezon"]
allm={}
counts={}
for t in terms:
    skip=0;n=0
    while True:
        q={"$filter":f"substringof('{t}',MatterTitle)","$top":"1000","$skip":str(skip),"$orderby":"MatterId"}
        url=B+"?"+urllib.parse.urlencode(q,quote_via=urllib.parse.quote)
        d=json.load(urllib.request.urlopen(url,timeout=120,context=CTX))
        for m in d: allm[m["MatterId"]]=m
        n+=len(d)
        if len(d)<1000: break
        skip+=1000
    counts[t]=n; print(t,n,flush=True)
json.dump(list(allm.values()),open("matters_raw.json","w"))
json.dump(counts,open("term_counts.json","w"))
print("unique",len(allm))
