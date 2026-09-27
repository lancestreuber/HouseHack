from curl_cffi import requests
import re, json, datetime, time, html, sys
base='https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-'
out=[]
d=datetime.date(2022,1,6)
end=datetime.date(2026,10,15)
s=requests.Session(impersonate='chrome')
while d<=end:
    slug=f"{d.strftime('%B')}-{d.day}-{d.year}"
    try:
        r=s.get(base+slug,timeout=30)
    except Exception as e:
        print(slug,'ERR',e,flush=True); d+=datetime.timedelta(7); continue
    rec={'date':d.isoformat(),'slug':slug,'status':r.status_code,'docs':[]}
    if r.status_code==200:
        t=r.text
        # split by folder titles
        parts=re.split(r'<h3 class="folder-title">([^<]*)</h3>',t)
        folder='top'
        segs=[('top',parts[0])]+[(parts[i],parts[i+1]) for i in range(1,len(parts)-1,2)]
        for folder,seg in segs:
            for m in re.finditer(r'<div class="meeting-document-title"><span>([^<]*)</span></div><div class="alt-formats"><a href="([^"]+)"',seg):
                rec['docs'].append({'folder':html.unescape(folder),'title':html.unescape(m.group(1)),'href':m.group(2)})
            for m in re.finditer(r'href="(/files/assets/[^"]+)"',seg):
                if not any(x['href']==m.group(1) for x in rec['docs']):
                    rec['docs'].append({'folder':html.unescape(folder),'title':'','href':m.group(1)})
    print(slug,r.status_code,len(rec['docs']),flush=True)
    out.append(rec)
    d+=datetime.timedelta(7)
    time.sleep(1.0)
json.dump(out,open('pages.json','w'),indent=1)
