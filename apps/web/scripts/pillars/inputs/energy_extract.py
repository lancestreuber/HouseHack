import csv,io,zipfile,collections
z=zipfile.ZipFile('lead_pa.zip'); f=io.TextIOWrapper(z.open('PA AMI Census Tracts 2022.csv'),encoding='utf-8')
agg=collections.defaultdict(lambda: collections.defaultdict(float)); cats=collections.Counter()
for r in csv.DictReader(f):
    t=r['FIP']
    if not t.startswith('42003'): continue
    cats[r['AMI150']]+=1
    u=float(r['UNITS'] or 0); inc=float(r['HINCP*UNITS'] or 0); en=sum(float(r[k] or 0) for k in ('ELEP*UNITS','GASP*UNITS','FULP*UNITS'))
    groups=['all', 'tenure_'+r['TEN'].lower()]
    if r['AMI150'] in ('0-30%','30-60%','60-80%'): groups.append('lowinc')
    if r['AMI150']=='0-30%': groups.append('eli')
    for g in groups:
        a=agg[t]; a[g+'_units']+=u; a[g+'_inc']+=inc; a[g+'_en']+=en
print('AMI cats',cats)
out=[]
for t,a in sorted(agg.items()):
    o={'tract':t,'households':round(a['all_units']),'avg_energy_cost_usd':round(a['all_en']/a['all_units']) if a['all_units'] else None}
    for g in ('all','lowinc','eli','tenure_rent','tenure_own'):
        o[f'energy_burden_{g}']=round(a[g+'_en']/a[g+'_inc'],4) if a[g+'_inc']>0 else None
    o['lowinc_households']=round(a['lowinc_units'])
    out.append(o)
w=csv.DictWriter(open('allegheny_energy_burden_tract_2022.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
for k in ('energy_burden_all','energy_burden_lowinc','energy_burden_eli','avg_energy_cost_usd'):
    v=sorted(o[k] for o in out if o[k] is not None);print(k,len(v),'p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
