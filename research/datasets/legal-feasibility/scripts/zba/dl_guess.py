from curl_cffi import requests
import re,os,time,json
B='https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/'
s=requests.Session(impersonate='chrome')
res={}
for name in open('miss.txt').read().split():
    low=re.sub(r'^\d+_','',name.lower()); low=re.sub(r'\.(pdf|docx)$','',low)
    low=low.replace('(1)','')
    h=re.sub(r'[^a-z0-9]+','-',low).strip('-')
    variants=[h]
    h2=re.sub(r'-case-',r'-',h); variants.append(h2)
    variants.append(re.sub(r'^zone-case-(\d+)-(.*)$',r'\2-\1-of-2024',h))
    ok=None
    for v in dict.fromkeys(variants):
        for suf in ['','-1','-2','-3']:
            c=v+suf+'.pdf'
            r=s.get(B+c,timeout=60); time.sleep(0.6)
            if r.status_code==200 and r.content[:4]==b'%PDF':
                open('pdf_rt2/'+c,'wb').write(r.content); ok=B+c; break
        if ok: break
    res[name]=ok; print(name,ok,flush=True)
json.dump(res,open('guess_map.json','w'),indent=1)
