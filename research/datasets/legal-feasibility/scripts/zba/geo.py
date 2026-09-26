import re, json, time, urllib.parse, subprocess, os
def pins(lb):
    if not lb: return []
    s=lb.upper().replace('–','-').replace('—','-')
    out=[]
    m=re.search(r'(\d{4})-([A-Z])-(\d{5})-(\d{4})-(\d{2})',s)
    if m: return [''.join(m.groups())]
    for m in re.finditer(r'\b(\d{1,4})\s*-\s*([A-Z])\s*-\s*(\d{1,5})(?:\s*-\s*(\d{1,4}))?',s):
        b,l,lot,suf=m.groups()
        base=f"{int(b):04d}{l}{int(lot):05d}"
        if suf: out+= [base+f"{int(suf):04d}00", base+"000000"]
        else: out.append(base+"000000")
    return out
def wprdc(pinlist):
    res={}
    for i in range(0,len(pinlist),50):
        chunk=pinlist[i:i+50]
        q=urllib.parse.urlencode({'resource_id':'3fab7152-3f11-4788-8372-4c33f86ea813','filters':json.dumps({'PIN':chunk}),'limit':500})
        out=subprocess.run(['curl','-s','https://data.wprdc.org/api/3/action/datastore_search?'+q],capture_output=True,text=True).stdout
        for r in json.loads(out)['result']['records']:
            res[r['PIN']]=(r['LAT'],r['LONG'],r.get('CITY_NEIGHBORHOOD'),r.get('MUNI_NAME'))
        time.sleep(0.5)
    return res
def county(pin):
    q=urllib.parse.urlencode({'where':f"PIN='{pin}'",'outFields':'PIN','returnGeometry':'true','outSR':'4326','f':'json'})
    out=subprocess.run(['curl','-s','--max-time','30','https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0/query?'+q],capture_output=True,text=True).stdout
    try:
        f=json.loads(out)['features']
        if not f: return None
        ring=f[0]['geometry']['rings'][0]
        # area-weighted centroid
        A=cx=cy=0
        for (x0,y0),(x1,y1) in zip(ring,ring[1:]):
            c=x0*y1-x1*y0; A+=c; cx+=(x0+x1)*c; cy+=(y0+y1)*c
        if A==0: return (sum(p[1] for p in ring)/len(ring), sum(p[0] for p in ring)/len(ring))
        return (cy/(3*A), cx/(3*A))
    except Exception as e: return None
def census(addr):
    q=urllib.parse.urlencode({'address':addr+', Pittsburgh, PA','benchmark':'Public_AR_Current','format':'json'})
    out=subprocess.run(['curl','-s','--max-time','30','https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?'+q],capture_output=True,text=True).stdout
    try:
        m=json.loads(out)['result']['addressMatches']
        if m: return (m[0]['coordinates']['y'],m[0]['coordinates']['x'],m[0]['matchedAddress'])
    except: pass
    return None
