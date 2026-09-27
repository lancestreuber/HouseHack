from curl_cffi import requests
import re,os,time,sys,json
B='https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/'
s=requests.Session(impersonate='chrome')
os.makedirs('pdf_rt2',exist_ok=True)
res={}
for l in open(sys.argv[1]):
    if not l.strip(): continue
    u=l.split()[-1]; name=u.rsplit('/',1)[1]
    low=name.lower()
    cands=[low, low.replace('(','').replace(')',''), re.sub(r'\((\d)\)',r'\1',low), low.replace('(','_').replace(')','_'), low.replace('_(1)',''), low.replace('%e2%80%93','-'), low.replace(',','')]
    ok=None
    for c in dict.fromkeys(cands):
        fn='pdf_rt2/'+c
        if os.path.exists(fn): ok=c;break
        r=s.get(B+c,timeout=60); time.sleep(0.8)
        if r.status_code==200 and r.content[:4]==b'%PDF':
            open(fn,'wb').write(r.content); ok=c; break
    res[name]=ok and B+ok
    print(name, bool(ok), flush=True)
json.dump(res,open(sys.argv[2],'w'),indent=1)
