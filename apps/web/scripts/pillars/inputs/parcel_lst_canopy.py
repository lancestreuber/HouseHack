import csv,numpy as np
from PIL import Image
SC=['LC08_L2SP_017032_20250810_02_T1','LC08_L2SP_017032_20240823_02_T1','LC08_L2SP_017032_20230618_02_T1','LC08_L2SP_017032_20230602_02_T1']
X0,Y0,W,H=-80.37,40.69,2400,1800; DX,DY=0.69/W,-0.51/H
layers=[];anoms=[]
for s in SC:
    b=np.load(f'lst_{s}.npy'); qa=np.load(f'qa_{s}.npy')[0]
    bad=((qa>>0)&1)|((qa>>1)&1)|((qa>>3)&1)|((qa>>4)&1)
    c=np.where((b[1]>0)&(b[0]>0)&(bad==0), b[0]*0.00341802+149.0-273.15, np.nan)
    med=np.nanmedian(c); layers.append(c); anoms.append(c-med)
    print(s,'masked',round(float(np.isnan(c).mean()),3),'county median C',round(float(med),1))
L=np.stack(layers); A=np.stack(anoms)
lst_mean=np.nanmean(L,0); lst_anom=np.nanmean(A,0); nvalid=(~np.isnan(L)).sum(0)
im=Image.open('mrlc_display__nlcd_tcc_conus_2021_v2021-4.tif'); t=im.tag_v2[34264]; tcc=np.array(im)
def rc(lon,lat,x0,y0,dx,dy,shape):
    c=int((lon-x0)/dx); r=int((lat-y0)/dy)
    return (r,c) if 0<=r<shape[0] and 0<=c<shape[1] else None
out=[];seen=set()
for x in csv.DictReader(open('centroids.csv',encoding='utf-8-sig')):
    if x['MUNI_NAME']!='PITTSBURGH' or x['PIN'] in seen: continue
    seen.add(x['PIN']); lon,lat=float(x['LONG']),float(x['LAT'])
    p=rc(lon,lat,X0,Y0,DX,DY,lst_mean.shape); q=rc(lon,lat,t[3],t[7],t[0],t[5],tcc.shape)
    o={'pin':x['PIN'],'lst_c_20250810':None,'lst_c_mean_4scenes':None,'lst_anom_c_4scenes':None,'lst_n_scenes':0,'canopy_pct':None}
    if p:
        v=layers[0][p]; o['lst_c_20250810']=None if np.isnan(v) else round(float(v),2)
        if nvalid[p]>0: o['lst_c_mean_4scenes']=round(float(lst_mean[p]),2); o['lst_anom_c_4scenes']=round(float(lst_anom[p]),2); o['lst_n_scenes']=int(nvalid[p])
    if q:
        v=int(tcc[q]); o['canopy_pct']=v if v<=100 else None
    out.append(o)
w=csv.DictWriter(open('pgh_parcel_lst_canopy.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'city parcels (distinct PIN)')
for k in ('lst_c_20250810','lst_c_mean_4scenes','lst_anom_c_4scenes','canopy_pct'):
    v=sorted(o[k] for o in out if o[k] is not None);print(k,len(v),'p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
import collections;print('n scenes',collections.Counter(o['lst_n_scenes'] for o in out))
