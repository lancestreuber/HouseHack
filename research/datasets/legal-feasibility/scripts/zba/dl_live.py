from curl_cffi import requests
import json,os,time
p=json.load(open('pages.json'))
s=requests.Session(impersonate='chrome')
os.makedirs('live',exist_ok=True)
man=[]
seen=set()
for x in p:
    if x['status']!=200: continue
    for d in x['docs']:
        if 'decision' not in (d['title']+d['href']).lower(): continue
        h=d['href']; 
        if h in seen: continue
        seen.add(h)
        url='https://www.pittsburghpa.gov'+h if h.startswith('/') else h
        fn='live/'+h.rsplit('/',1)[1]
        man.append({'meeting':x['date'],'title':d['title'],'url':url,'file':fn})
        if os.path.exists(fn) and os.path.getsize(fn)>1000: continue
        try:
            r=s.get(url,timeout=60); open(fn,'wb').write(r.content); print(r.status_code,fn,flush=True)
        except Exception as e: print('ERR',url,e,flush=True)
        time.sleep(1)
json.dump(man,open('live_manifest.json','w'),indent=1)
print('DONE',len(man))
