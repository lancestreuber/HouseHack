import zipfile,io,json,csv,math
z=zipfile.ZipFile('pa2020pl.zip')
geo={}
for l in io.TextIOWrapper(z.open('pageo2020.pl'),encoding='latin1'):
    f=l.split('|')
    if f[2]=='140' and f[14]=='003': geo[f[7]]=f[9]   # LOGRECNO -> GEOCODE (11-digit tract)
print('tracts in PL',len(geo))
seg2={}
for l in io.TextIOWrapper(z.open('pa000022020.pl'),encoding='latin1'):
    f=l.rstrip('\n').split('|')
    if f[4] in geo: seg2[geo[f[4]]]=(int(f[149]),int(f[150]),int(f[151]))  # H1 total, occupied, vacant
seg1={}
for l in io.TextIOWrapper(z.open('pa000012020.pl'),encoding='latin1'):
    f=l.rstrip('\n').split('|')
    if f[4] in geo: seg1[geo[f[4]]]=int(f[5])
d=json.load(open('acs_hh_tr.json'))['data']
out=[]
for g,t in d.items():
    tr=g.replace('14000US',''); hh=t['B11001']['estimate']['B11001001']; m=t['B11001']['error']['B11001001']
    h20=seg2.get(tr)
    o={'tract':tr,'households_2020_census':h20[1] if h20 else None,'housing_units_2020_census':h20[0] if h20 else None,'pop_2020_census':seg1.get(tr),
       'households_acs2024':hh,'households_acs2024_moe':m}
    if h20 and h20[1]>=100:
        o['hh_change']=round(hh-h20[1]); o['hh_change_pct']=round((hh-h20[1])/h20[1],4); o['hh_change_pct_moe']=round(m/h20[1],4)
        o['change_exceeds_moe']=abs(hh-h20[1])>m
    else: o.update({'hh_change':None,'hh_change_pct':None,'hh_change_pct_moe':None,'change_exceeds_moe':None})
    o['small_base_flag']=bool(h20 and h20[1]<100)
    out.append(o)
w=csv.DictWriter(open('allegheny_tract_household_growth_2020_2024.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'tracts; county hh 2020',sum(o['households_2020_census'] or 0 for o in out),'acs 2020-24',sum(o['households_acs2024'] for o in out))
v=sorted(o['hh_change_pct'] for o in out if o['hh_change_pct'] is not None);print('hh chg p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
print('change beyond MOE',sum(1 for o in out if o['change_exceeds_moe']))
