import json,glob,collections,numpy as np
g=json.load(open('county.geojson'))['features'][0]['geometry']
polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
def inside(lon,lat):
    X=np.asarray(lon);Y=np.asarray(lat);res=np.zeros(X.shape,bool)
    for p in polys:
        ins=np.zeros(X.shape,bool)
        for ring in p:
            r=np.asarray(ring);x1,y1,x2,y2=r[:-1,0],r[:-1,1],r[1:,0],r[1:,1]
            for a,b,c,d in zip(x1,y1,x2,y2):
                if b==d: continue
                ins^=((b>Y)!=(d>Y))&(X<(c-a)*(Y-b)/(d-b)+a)
        res|=ins
    return res
el={}
for f in glob.glob('osm_tile_*.json'):
    for e in json.load(open(f))['elements']: el[(e['type'],e['id'])]=e
els=list(el.values())
lon=[e.get('lon') or e['center']['lon'] for e in els];lat=[e.get('lat') or e['center']['lat'] for e in els]
m=inside(lon,lat)
def cat(t): return t.get('amenity') or ('ambulance_station' if t.get('emergency')=='ambulance_station' else None) or ('shop='+t['shop'] if t.get('shop') else None)
out=[]
for e,a,b,ok in zip(els,lon,lat,m):
    if not ok: continue
    t=e['tags'];out.append({'osm_id':f"{e['type']}/{e['id']}",'category':cat(t),'name':t.get('name',''),'brand':t.get('brand',''),'operator':t.get('operator',''),'addr':' '.join(x for x in (t.get('addr:housenumber',''),t.get('addr:street','')) if x),'city':t.get('addr:city',''),'lat':round(b,6),'lon':round(a,6)})
json.dump(out,open('osm_amenities_allegheny.json','w'))
print(len(els),'in bbox',len(out),'in county')
print(collections.Counter(o['category'] for o in out).most_common(40))
print('unnamed',collections.Counter(o['category'] for o in out if not o['name']).most_common(10))
