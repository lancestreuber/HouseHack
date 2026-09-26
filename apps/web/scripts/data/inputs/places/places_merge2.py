import json,csv,math,re,collections
osm=json.load(open('osm_amenities_allegheny.json'))
assets=[x for x in csv.DictReader(open('assets.csv',encoding='utf-8-sig')) if x['latitude'] and x['do_not_display']!='t' and x['sensitive']!='t']
def dist(a,b): return math.hypot((a[0]-b[0])*85000,(a[1]-b[1])*111000)
def merge(osm_recs,asset_type,radius=75):
    out=[{'name':o['name'],'address':o['addr'],'lat':o['lat'],'lon':o['lon'],'sources':'OSM','osm_id':o['osm_id']} for o in osm_recs]
    add=0
    for a in (x for x in assets if x['asset_type']==asset_type):
        p=(float(a['longitude']),float(a['latitude']))
        if any(dist((r['lon'],r['lat']),p)<=radius for r in out):
            for r in out:
                if dist((r['lon'],r['lat']),p)<=radius: r['sources']='OSM+County_Assets'; r['address']=r['address'] or a['street_address']; r['name']=r['name'] or a['name']; break
        else:
            out.append({'name':a['name'],'address':a['street_address'],'lat':float(a['latitude']),'lon':float(a['longitude']),'sources':'County_Assets','osm_id':''}); add+=1
    return out,add
private_mail=re.compile(r'UPS|FEDEX|MAIL|PAK|SHIP|OFFICE PLUS|POSTAL ANNEX|PACK',re.I)
po_osm=[o for o in osm if o['category']=='post_office' and o['name'] and not private_mail.search(o['name'])]
po,a1=merge(po_osm,'post_offices',150)
la_osm=[o for o in osm if o['category']=='shop=laundry']
la,a2=merge(la_osm,'laundromats',75)
de=[{'name':o['name'],'address':o['addr'],'lat':o['lat'],'lon':o['lon'],'sources':'OSM','osm_id':o['osm_id']} for o in osm if o['category']=='dentist']
de2,a3=merge([o for o in osm if o['category']=='dentist'],'dentists',60)
cc,a4=merge([o for o in osm if o['category']=='community_centre' and o['name']],'rec_centers',120)
for name,rows in (('allegheny_post_offices_merged.csv',po),('allegheny_laundromats_merged.csv',la),('allegheny_dentists_merged.csv',de2),('allegheny_community_centers_merged.csv',cc)):
    w=csv.DictWriter(open(name,'w',newline=''),fieldnames=['name','address','lat','lon','sources','osm_id']);w.writeheader();w.writerows(rows)
    print(name,len(rows),collections.Counter(r['sources'] for r in rows))
