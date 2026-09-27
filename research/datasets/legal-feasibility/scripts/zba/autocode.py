import json,re,datetime
from code import *
p=json.load(open('parsed.json'))
out=[]
for r in p:
    ti=table_items(r['table']); di=dec_items(r['decision_text'])
    dsec={s for _,s in di}
    items=di+[x for x in ti if x[1] not in dsec and x not in di]
    r['table_items']=ti
    oc,ol=outcome(r['decision_text'],r['request'],items)
    # findings first ~1500 chars after Findings of Fact for context
    t=open(r['file'],errors='ignore').read()
    i=t.find('Findings of Fact'); ctx=re.sub(r'\s+',' ',t[i:i+1800]) if i>=0 else ''
    blob=' '.join([r['request'] or '', r['decision_text'] or '', ctx])
    um=units_mentions((r['request'] or '')+' '+(r['decision_text'] or ''))
    typ=typology((r['request'] or '')+' '+(r['decision_text'] or ''),um) or typology(ctx,[])
    sc=scope(r['request'],r['decision_text'],typ,r['zoning_district'])
    r.update(items=items,outcome_code=oc,outcome=ol,relief_types=sorted(relief_types(items)),units_mentions=um,typology_auto=typ,scope_auto=sc,ctx=ctx[:600])
    out.append(r)
json.dump(out,open('auto.json','w'),default=str,indent=0)
import collections
print(collections.Counter(r['outcome_code'] for r in out))
print(collections.Counter(r['scope_auto'] for r in out))
print(collections.Counter(r['typology_auto'] for r in out if r['scope_auto']=='units'))
print(sum(1 for r in out if not r['items']))
