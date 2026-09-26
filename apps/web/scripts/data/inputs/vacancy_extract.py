import json,glob,csv,collections
cent={}
for x in csv.DictReader(open('centroids.csv',encoding='utf-8-sig')): cent.setdefault(x['PIN'],(x['LAT'],x['LONG'],x['MUNI_LABEL'],x['CITY_NEIGHBORHOOD'],'42003'+x['FIPS_TRACT']))
pp={}
for f in glob.glob('pp_*.json'):
    for ft in json.load(open(f))['features']: pp[ft['attributes']['pin']]=ft['attributes']
# 1) USPS-vacant parcels (city, Feb 2024)
us=[]
for f in glob.glob('uspsv_*.json'):
    for ft in json.load(open(f))['features']:
        p=ft['attributes']['pin']; a=pp.get(p,{}); c=cent.get(p)
        us.append({'pin':p,'address':a.get('Address'),'usedesc':a.get('usedesc'),'classdesc':a.get('classdesc'),'owner_category':a.get('OwnerCateg') or ft['attributes']['OwnerCateg'],'neighborhood':a.get('hood'),'zoning':a.get('zon_new'),
                   'lat':c[0] if c else None,'lon':c[1] if c else None,'tract':c[4] if c else None})
w=csv.DictWriter(open('pgh_usps_vacant_parcels_feb2024.csv','w',newline=''),fieldnames=list(us[0]));w.writeheader();w.writerows(us)
print('USPS vacant',len(us),'with address',sum(1 for u in us if u['address']),'with coords',sum(1 for u in us if u['lat']),collections.Counter(u['classdesc'] for u in us).most_common(5),collections.Counter(u['usedesc'] for u in us).most_common(6))
# 2) County-wide vacant land (assessments)
vl=[]
for f in glob.glob('vac_*.json'):
    for r in json.load(open(f))['result']['records']:
        c=cent.get(r['PARID']); num=str(r['PROPERTYHOUSENUM'] or '').replace('.0','')
        addr=' '.join(x for x in (num if num not in ('0','') else '',(r['PROPERTYFRACTION'] or '').strip(),(r['PROPERTYADDRESS'] or '').strip()) if x)
        vl.append({'pin':r['PARID'],'address':addr,'city':r['PROPERTYCITY'],'zip':r['PROPERTYZIP'],'municipality':(r['MUNIDESC'] or '').strip(),'usedesc':r['USEDESC'],'owner_type':r['OWNERDESC'],
                   'lot_sf':r['LOTAREA'],'fair_market_land':r['FAIRMARKETLAND'],'lat':c[0] if c else None,'lon':c[1] if c else None,'tract':c[4] if c else None})
w=csv.DictWriter(open('allegheny_vacant_land_parcels.csv','w',newline=''),fieldnames=list(vl[0]));w.writeheader();w.writerows(vl)
print('vacant land',len(vl),'with coords',sum(1 for v in vl if v['lat']),collections.Counter(v['usedesc'] for v in vl),collections.Counter(v['owner_type'] for v in vl).most_common(6))
print('in Pittsburgh',sum(1 for v in vl if 'PITTSBURGH' in v['municipality'].upper() and 'WARD' in v['municipality'].upper()))
print('no house number',sum(1 for v in vl if not v['address'][:1].isdigit()))
