import json,csv,collections,math
d=json.load(open('acs_tr.json'))['data']
# 2010 tract pop (Census 2010 Gazetteer) allocated to 2020 tracts by land-area share of each 2010 tract
pop10={}
for l in open('gaz10.txt',encoding='latin1').read().splitlines()[1:]:
    p=l.split('\t')
    if p[1].startswith('42003'): pop10[p[1]]=int(p[2])
alloc=collections.Counter(); land10=collections.Counter(); parts=[]
for r in csv.DictReader(open('rel_tract.txt',encoding='utf-8-sig'),delimiter='|'):
    t20,t10=r['GEOID_TRACT_20'],r['GEOID_TRACT_10']
    if t10.startswith('42003'):
        a=int(r['AREALAND_PART'] or 0); parts.append((t20,t10,a)); land10[t10]+=a
for t20,t10,a in parts:
    if land10[t10]: alloc[t20]+=pop10.get(t10,0)*a/land10[t10]
def moe_ratio(num_e,num_m,den_e,den_m):
    if not den_e: return None
    p=num_e/den_e; x=num_m**2-(p**2)*(den_m**2)
    if x<0: x=num_m**2+(p**2)*(den_m**2)
    return math.sqrt(x)/den_e
def s(e,m,keys):  # sum estimates and root-sum-square MOEs
    return sum(e[k] or 0 for k in keys), math.sqrt(sum((m[k] or 0)**2 for k in keys))
U18M=[f'B01001{n:03d}' for n in range(3,7)]; U18F=[f'B01001{n:03d}' for n in range(27,31)]
O65M=[f'B01001{n:03d}' for n in range(20,26)]; O65F=[f'B01001{n:03d}' for n in range(44,50)]
out=[]
for g,t in d.items():
    geoid=g.replace('14000US','')
    E={k:v for tb in t.values() for k,v in tb['estimate'].items()}; M={k:v for tb in t.values() for k,v in tb['error'].items()}
    pop,popm=E['B01003001'],M['B01003001']
    u,um=s(E,M,U18M+U18F); o,om=s(E,M,O65M+O65F)
    hh,hhm=E['B11001001'],M['B11001001']; alone,alonem=E['B11001008'],M['B11001008']
    ten,tenm=E['B25003001'],M['B25003001']; own,ownm=E['B25003002'],M['B25003002']; rent,rentm=E['B25003003'],M['B25003003']
    p10=alloc.get(geoid)
    o_={'tract':geoid,'pop_2020_24':pop,'pop_moe':popm,
        'pct_under18':round(u/pop,4) if pop else None,'pct_under18_moe':round(moe_ratio(u,um,pop,popm),4) if pop else None,
        'pct_65plus':round(o/pop,4) if pop else None,'pct_65plus_moe':round(moe_ratio(o,om,pop,popm),4) if pop else None,
        'avg_hh_size':E['B25010001'],'avg_hh_size_moe':M['B25010001'],
        'households':hh,'pct_living_alone':round(alone/hh,4) if hh else None,'pct_living_alone_moe':round(moe_ratio(alone,alonem,hh,hhm),4) if hh else None,
        'pct_owner':round(own/ten,4) if ten else None,'pct_owner_moe':round(moe_ratio(own,ownm,ten,tenm),4) if ten else None,
        'pct_renter':round(rent/ten,4) if ten else None,
        'pop_2010_est_on_2020_tract':round(p10) if p10 is not None else None,
        'pop_change_pct_2010_to_2020_24':round((pop-p10)/p10,4) if p10 else None}
    out.append(o_)
w=csv.DictWriter(open('allegheny_demand_acs_tract.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'tracts; county pop 2020-24',sum(o['pop_2020_24'] for o in out),'2010 allocated',round(sum(o['pop_2010_est_on_2020_tract'] or 0 for o in out)),'2010 gazetteer total',sum(pop10.values()))
v=sorted(o['pct_65plus'] for o in out if o['pct_65plus'] is not None);print('65+ p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
v=sorted(o['pop_change_pct_2010_to_2020_24'] for o in out if o['pop_change_pct_2010_to_2020_24'] is not None and o['pop_2020_24']>500);print('pop chg p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
