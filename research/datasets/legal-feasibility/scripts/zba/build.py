import re, glob, json, csv, os
from parse import parse
from code import *
man={os.path.basename(m['file']):m for m in json.load(open('live_manifest.json'))}
todo={}
for fn in ['todo2.txt','todo3.txt']:
    for l in open(fn):
        if l.strip(): ts,u=l.split(); todo[os.path.basename(u)]=(ts,u)
rows=[]
for f in sorted(glob.glob('txt/*.txt')):
    t=open(f,errors='ignore').read()
    if 'Date of Decision' not in t[:3000]: continue
    src,b=os.path.basename(f)[:-4].split('__',1)
    if src=='live':
        m=man.get(b+'.pdf'); url=m['url']; meeting=m['meeting']; srcname='pittsburghpa.gov meeting page'
    elif src=='rt2':
        url='https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/'+b+'.pdf'; meeting=None; srcname='pittsburghpa.gov (migrated file; link found on archived dcp/zba page)'
    else:
        key=b+'.pdf'
        ts,u=todo.get(key,(None,None))
        if u is None:
            # redtail originals may have different case
            cands=[k for k in todo if k.lower()==key.lower()]
            ts,u=todo[cands[0]] if cands else (None,None)
        url=f'https://web.archive.org/web/{ts}/{u}' if u else None; meeting=None; srcname='Internet Archive (Wayback)'
    r=parse(t); r['file']=f; r['url']=url; r['source']=srcname; r['meeting_page_date']=meeting
    r['case_key']=norm_case(r['zone_case'])
    rows.append(r)
# dedupe by case_key + address
best={}
for r in rows:
    k=(r['case_key'], re.sub(r'\W','',(r['address'] or '').lower())[:12])
    if k in best:
        o=best[k]
        # prefer live, then longer text
        if o['source'].startswith('pitts') and not r['source'].startswith('pitts'): continue
        if r['source']==o['source'] and len(r['decision_text'] or '')<=len(o['decision_text'] or ''): continue
    best[k]=r
print('parsed',len(rows),'unique',len(best))
json.dump(list(best.values()),open('parsed.json','w'),default=str,indent=0)
