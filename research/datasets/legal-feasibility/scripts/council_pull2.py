import json,urllib.request,urllib.parse,ssl,certifi
CTX=ssl.create_default_context(cafile=certifi.where())
B="https://webapi.legistar.com/v1/pittsburgh/matters"
allm={m["MatterId"]:m for m in json.load(open("matters_raw.json"))}
counts=json.load(open("term_counts.json"))
def q(filt):
    out=[];skip=0
    while True:
        u=B+"?"+urllib.parse.urlencode({"$filter":filt,"$top":"1000","$skip":str(skip)},quote_via=urllib.parse.quote)
        d=json.load(urllib.request.urlopen(u,timeout=120,context=CTX));out+=d
        if len(d)<1000:return out
        skip+=1000
for t in ["Title Nine","Title 9","Planned Development","Development Plan","SP-","Map amendment","Map Amendment","Institutional Master Plan"]:
    d=q(f"substringof('{t}',MatterTitle)");counts["title:"+t]=len(d);print(t,len(d))
    for m in d: allm[m["MatterId"]]=m
for t in ["Zoning","Conditional Use","Rezon","Specially Planned","Planned Unit"]:
    d=q(f"substringof('{t}',MatterName)");counts["name:"+t]=len(d);print("name",t,len(d))
    for m in d: allm[m["MatterId"]]=m
json.dump(list(allm.values()),open("matters_raw.json","w"));json.dump(counts,open("term_counts.json","w"))
print("unique",len(allm))
