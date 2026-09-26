import json,csv,numpy as np
from PIL import Image
def poly_mask(rings,xs,ys):
    # even-odd rule over pixel centers; xs (w,), ys (h,)
    X,Y=np.meshgrid(xs,ys); inside=np.zeros(X.shape,bool)
    for ring in rings:
        r=np.asarray(ring); x1,y1=r[:-1,0],r[:-1,1]; x2,y2=r[1:,0],r[1:,1]
        for a,b,c,d in zip(x1,y1,x2,y2):
            if b==d: continue
            cond=((b>Y)!=(d>Y)) & (X < (c-a)*(Y-b)/(d-b)+a)
            inside^=cond
    return inside
class Grid:
    def __init__(s,arr,x0,y0,dx,dy): s.a,s.x0,s.y0,s.dx,s.dy=arr,x0,y0,dx,dy
    def zonal(s,geom,valid):
        polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
        vals=[]
        for p in polys:
            xs_all=np.concatenate([np.asarray(r)[:,0] for r in p]); ys_all=np.concatenate([np.asarray(r)[:,1] for r in p])
            c0=max(int((xs_all.min()-s.x0)/s.dx),0); c1=min(int((xs_all.max()-s.x0)/s.dx)+1,s.a.shape[1])
            r0=max(int((s.y0-ys_all.max())/(-s.dy) if s.dy<0 else 0),0); r1=min(int((s.y0-ys_all.min())/(-s.dy))+1,s.a.shape[0])
            if c1<=c0 or r1<=r0: continue
            xs=s.x0+(np.arange(c0,c1)+.5)*s.dx; ys=s.y0+(np.arange(r0,r1)+.5)*s.dy
            m=poly_mask(p,xs,ys); sub=s.a[r0:r1,c0:c1]; ok=m & valid(sub)
            vals.append(sub[ok])
        v=np.concatenate(vals) if vals else np.array([])
        return (float(v.mean()),int(v.size)) if v.size else (None,0)
def tif_grid(f):
    im=Image.open(f); t=im.tag_v2[34264]; return Grid(np.array(im),t[3],t[7],t[0],t[5])
tcc=tif_grid('mrlc_display__nlcd_tcc_conus_2021_v2021-4.tif')
imp=tif_grid('mrlc_download__NLCD_2021_Impervious_L48.tif')
b=np.load('lst_LC08_L2SP_017032_20250810_02_T1.npy'); qa=np.load('qa_LC08.npy')[0]
cloud=((qa>>1)&1)|((qa>>3)&1)|((qa>>4)&1)|((qa>>0)&1)   # fill, dilated cloud, cloud, shadow
lstC=np.where((b[1]>0)&(b[0]>0)&(cloud==0), b[0]*0.00341802+149.0-273.15, np.nan)
W,H=2400,1800; lst=Grid(lstC,-80.37,40.69,(0.69)/W,-(0.51)/H)
print('LST cloud-masked share',round(float(np.isnan(lstC).mean()),3))
geo=json.load(open('crgeo.json'))
out=[]
for f in geo['features']:
    g=f['properties']['geoid'].replace('15000US','')
    c,cn=tcc.zonal(f['geometry'],lambda s:s<=100)
    i,inn=imp.zonal(f['geometry'],lambda s:s<=100)
    l,ln=lst.zonal(f['geometry'],lambda s:~np.isnan(s))
    out.append({'geoid':g,'canopy_pct_mean':round(c,1) if c is not None else None,'canopy_px':cn,
                'impervious_pct_mean':round(i,1) if i is not None else None,'impervious_px':inn,
                'lst_c_mean_20250810':round(l,2) if l is not None else None,'lst_px':ln})
w=csv.DictWriter(open('allegheny_bg_canopy_impervious_lst.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
for k in ('canopy_pct_mean','impervious_pct_mean','lst_c_mean_20250810'):
    v=sorted(o[k] for o in out if o[k] is not None);print(k,len(v),'p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
print('corr canopy vs lst',round(float(np.corrcoef([o['canopy_pct_mean'] for o in out if o['lst_c_mean_20250810'] and o['canopy_pct_mean'] is not None],[o['lst_c_mean_20250810'] for o in out if o['lst_c_mean_20250810'] and o['canopy_pct_mean'] is not None])[0,1]),2))
