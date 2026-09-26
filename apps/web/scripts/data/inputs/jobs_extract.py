import gzip,csv,json,collections
C='42003'
def agg(path,key,cols):
    d=collections.defaultdict(lambda: collections.Counter())
    for r in csv.DictReader(gzip.open(path,'rt')):
        g=r[key]
        if g.startswith(C):
            for c in cols: d[g[:12]][c]+=int(r[c])
    return d
SECT={'CNS07':'retail','CNS16':'health','CNS18':'food_accommodation','CNS05':'manufacturing','CNS15':'education','CNS12':'professional','CNS10':'finance'}
w23=agg('lodes_pa_wac_S000_JT00_2023.csv.gz','w_geocode',['C000','CE01','CE02','CE03']+list(SECT))
w19=agg('lodes_pa_wac_S000_JT00_2019.csv.gz','w_geocode',['C000','CE01'])
rac=agg('lodes_pa_rac_S000_JT00_2023.csv.gz','h_geocode',['C000','CE01'])
inb=collections.defaultdict(collections.Counter)
for f in ('lodes_pa_od_main_JT00_2023.csv.gz','lodes_pa_od_aux_JT00_2023.csv.gz'):
    for r in csv.DictReader(gzip.open(f,'rt')):
        w=r['w_geocode']
        if w.startswith(C):
            bg=w[:12]; inb[bg]['all']+=int(r['S000'])
            if not r['h_geocode'].startswith(C):
                inb[bg]['from_outside_county']+=int(r['S000']); inb[bg]['low_wage_from_outside']+=int(r['SE01'])
            if r['h_geocode'][:12]!=bg: pass
geo=json.load(open('crgeo.json'))
aland={f['properties']['geoid'].replace('15000US',''):float(f['properties']['aland'] or 0) for f in geo['features']}
out=[]
for bg in sorted(set(aland)|set(w23)|set(rac)):
    a=aland.get(bg,0); sqmi=a/2589988.11 if a else None
    j23=w23[bg]['C000']; j19=w19[bg]['C000']; rw=rac[bg]['C000']
    o={'geoid':bg,'land_sqmi':round(sqmi,4) if sqmi else None,'jobs_2023':j23,'jobs_2019':j19,'jobs_change':j23-j19,
       'jobs_change_pct':round((j23-j19)/j19,3) if j19>=50 else None,
       'jobs_per_sqmi':round(j23/sqmi) if sqmi else None,
       'low_wage_jobs':w23[bg]['CE01'],'mid_wage_jobs':w23[bg]['CE02'],'high_wage_jobs':w23[bg]['CE03'],
       'low_wage_share':round(w23[bg]['CE01']/j23,3) if j23 else None}
    for c,n in SECT.items(): o[f'jobs_{n}']=w23[bg][c]
    o.update({'resident_workers':rw,'resident_low_wage_workers':rac[bg]['CE01'],
       'jobs_per_resident_worker':round(j23/rw,2) if rw else None,
       'in_commuters_outside_county':inb[bg]['from_outside_county'],'in_commuters_outside_county_low_wage':inb[bg]['low_wage_from_outside'],
       'in_commuter_share':round(inb[bg]['from_outside_county']/inb[bg]['all'],3) if inb[bg]['all'] else None})
    out.append(o)
w=csv.DictWriter(open('allegheny_jobs_demand_bg_2023.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
T=lambda k:sum(o[k] or 0 for o in out)
print(len(out),'BGs; missing geometry',sum(1 for o in out if o['land_sqmi'] is None))
print('jobs 2019',T('jobs_2019'),'2023',T('jobs_2023'),'low-wage',T('low_wage_jobs'),'resident workers',T('resident_workers'),'in-commuters from outside county',T('in_commuters_outside_county'),'of which low-wage',T('in_commuters_outside_county_low_wage'))
top=sorted(out,key=lambda o:-o['jobs_2023'])[:5];print([(o['geoid'],o['jobs_2023'],o['jobs_per_sqmi']) for o in top])
g=sorted([o for o in out if o['jobs_change_pct'] is not None],key=lambda o:-o['jobs_change']);print('top growth',[(o['geoid'],o['jobs_change']) for o in g[:5]])
