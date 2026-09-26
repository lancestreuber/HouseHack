import json,glob,csv,math,re,collections
snap=[f['attributes'] for g in glob.glob('snap_*.json') for f in json.load(open(g))['features']]
print('snap',len(snap))
TIER_SNAP={'Supermarket':'full_grocery','Super Store':'full_grocery','Grocery Store':'full_grocery','Specialty Store':'specialty_food','Farmers and Markets':'farmers_market','Convenience Store':'convenience_limited','Other':'other_food_retail'}
TIER_ACHD={'Supermarket':'full_grocery','Chain Supermarket':'full_grocery','Retail/Convenience Store':'convenience_limited','Chain Retail/Convenience Store':'convenience_limited',
           'Packaged Food Only':'other_food_retail','Chain Packaged Food Only':'other_food_retail','Bakery':'specialty_food','Chain Bakery':'specialty_food','Seasonal/Farmers Market':'farmers_market'}
achd=[x for x in csv.DictReader(open('food.csv',encoding='utf-8-sig')) if not x.get('bus_cl_date') and x['description'] in TIER_ACHD and x['x'] and x['y']]
print('achd candidates',len(achd),collections.Counter(x['description'] for x in achd))
RANK=['full_grocery','specialty_food','farmers_market','other_food_retail','convenience_limited']
def d(a,b): return math.hypot((a[0]-b[0])*85000,(a[1]-b[1])*111000)
tok=lambda s:set(t for t in re.sub(r'[^A-Z ]',' ',(s or '').upper()).split() if len(t)>2 and t not in('THE','AND','INC','LLC','STORE','MARKET','FOOD','FOODS'))
recs=[]
for s in snap:
    if s['Latitude'] is None: continue
    recs.append({'name':s['Store_Name'].strip(),'address':f"{s['Store_Street_Address']}, {s['City']} {s['Zip_Code']}",'lat':float(s['Latitude']),'lon':float(s['Longitude']),'tier':TIER_SNAP.get(s['Store_Type'],'other_food_retail'),
                 'snap_store_type':s['Store_Type'],'achd_category':'','snap_authorized':True,'sources':'USDA_SNAP'})
n_merge=0
for a in achd:
    p=(float(a['x']),float(a['y'])); t=TIER_ACHD[a['description']]; ta=tok(a['facility_name'])
    best=None
    for r in recs:
        if abs(r['lat']-p[1])>0.001 or abs(r['lon']-p[0])>0.0013: continue
        if d((r['lon'],r['lat']),p)<=90 and (tok(r['name'])&ta or d((r['lon'],r['lat']),p)<=25): best=r;break
    if best:
        n_merge+=1; best['achd_category']=a['description']; best['sources']='USDA_SNAP+ACHD'
        if RANK.index(t)<RANK.index(best['tier']): best['tier']=t
    else:
        recs.append({'name':a['facility_name'].strip(),'address':a['address'],'lat':p[1],'lon':p[0],'tier':t,'snap_store_type':'','achd_category':a['description'],'snap_authorized':False,'sources':'ACHD'})
# drop closed chains / non-food mis-hits
dead=re.compile(r'RITE ?AID',re.I)
recs=[r for r in recs if not dead.search(r['name'])]
w=csv.DictWriter(open('allegheny_food_retail_merged.csv','w',newline=''),fieldnames=list(recs[0]));w.writeheader();w.writerows(recs)
print('merged',n_merge,'total',len(recs),collections.Counter(r['tier'] for r in recs),collections.Counter(r['sources'] for r in recs))
fg=[r for r in recs if r['tier']=='full_grocery'];print('full grocery top names',collections.Counter(re.split(r'[ #0-9]',r['name'].upper())[0] for r in fg).most_common(14))
