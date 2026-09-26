import csv,collections,json,glob
r=[x for x in csv.DictReader(open('ets.csv')) if x['city']=='Pittsburgh, PA']
f25=collections.Counter(); base=collections.defaultdict(float)
for x in r:
    m,y=x['month'].split('/')
    if y=='2025':
        f25[x['GEOID']]+=int(float(x['filings_2020'] or 0)); base[x['GEOID']]+=float(x['filings_avg_prepandemic_baseline'] or 0)
ren={}
for f in glob.glob('zcta_*.json'):
    for g,t in json.load(open(f))['data'].items(): ren[g[-5:]]=t['B25003']['estimate']['B25003003']
out=[]
for z in sorted(f25):
    rh=ren.get(z)
    out.append({'zip':z,'filings_2025':f25[z],'prepandemic_baseline_12mo':round(base[z]),'renter_households':rh,'filings_per_100_renter_hh':round(100*f25[z]/rh,1) if rh else None})
w=csv.DictWriter(open('pittsburgh_evictions_zip_2025.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
v=sorted(o['filings_per_100_renter_hh'] for o in out if o['filings_per_100_renter_hh'] is not None and o['renter_households']>=200)
print(len(out),'zips; filings 2025',sum(f25.values()),'baseline',round(sum(base.values())),'rate p10/med/p90 (zips>=200 renter hh)',[v[int(len(v)*q)] for q in (.1,.5,.9)],'n',len(v))
print([(o['zip'],o['filings_2025'],o['filings_per_100_renter_hh']) for o in sorted(out,key=lambda o:-(o['filings_2025']))[:6]])
