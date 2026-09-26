import zipfile, csv, io, re, xml.etree.ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z=zipfile.ZipFile('chasdict.xlsx')
ss=[''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS)]
sheets=[s.get('name') for s in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS)]
def rows(name):
    x=ET.fromstring(z.read(f'xl/worksheets/sheet{sheets.index(name)+1}.xml'))
    for r in x.iter('{%s}row'%NS['m']):
        out=[]
        for c in r.findall('m:c',NS):
            v=c.find('m:v',NS); val=v.text if v is not None else ''
            if c.get('t')=='s': val=ss[int(val)]
            out.append(val)
        yield out
d=list(rows('Table 8')); hdr=d[0]; meta={r[0]:dict(zip(hdr,r)) for r in d[1:] if r and r[0].startswith('T8_est')}
BANDS={'le30':'less than or equal to 30% of HAMFI','30_50':'greater than 30% but less than or equal to 50% of HAMFI',
       '50_80':'greater than 50% but less than or equal to 80% of HAMFI','80_100':'greater than 80% but less than or equal to 100% of HAMFI','gt100':'greater than 100% of HAMFI'}
def col(tenure,inc,cb):
    m=[k for k,v in meta.items() if v['Tenure']==tenure and v['Household income']==inc and v['Cost burden']==cb and v['Facilities']=='All']
    assert len(m)==1,(tenure,inc,cb,m); return m[0]
T={'owner':'Owner occupied','renter':'Renter occupied'}
spec={'total_hh':'T8_est1'}
for t,tl in T.items():
    spec[f'{t}_hh']=col(tl,'All','All')
    for b,bl in BANDS.items():
        spec[f'{t}_{b}']=col(tl,bl,'All')
        spec[f'{t}_{b}_cb30_50']=col(tl,bl,'greater than 30% but less than or equal to 50%')
        spec[f'{t}_{b}_cb50']=col(tl,bl,'greater than 50%')
raw=zipfile.ZipFile('chas140.zip').open('140/Table8.csv')
rd=csv.DictReader(io.TextIOWrapper(raw,encoding='latin1'))
out=[]
for r in rd:
    if r['st'].strip().zfill(2)=='42' and r['cnty'].strip().zfill(3)=='003':
        o={'geoid':re.sub(r'^.*US','',r['geoid']),'name':r['name']}
        for k,c in spec.items(): o[k]=int(float(r[c] or 0))
        for t in T:
            lo=sum(o[f'{t}_{b}'] for b in ('le30','30_50','50_80'))
            cb=sum(o[f'{t}_{b}_cb30_50']+o[f'{t}_{b}_cb50'] for b in ('le30','30_50','50_80'))
            o[f'{t}_lowinc_le80']=lo; o[f'{t}_lowinc_costburdened']=cb
            o[f'{t}_lowinc_costburdened_pct']=round(cb/lo,3) if lo else None
            o[f'{t}_le30_severe_pct']=round(o[f'{t}_le30_cb50']/o[f'{t}_le30'],3) if o[f'{t}_le30'] else None
        out.append(o)
w=csv.DictWriter(open('chas_2018_2022_allegheny_tracts.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'tracts'); print({k:out[0][k] for k in list(out[0])[:8]})
import statistics
v=[o['renter_lowinc_costburdened_pct'] for o in out if o['renter_lowinc_costburdened_pct'] is not None]
print('renter low-inc cost-burdened pct median',statistics.median(v),'n',len(v))
print('county totals renter hh',sum(o['renter_hh'] for o in out),'renter <=30% HAMFI',sum(o['renter_le30'] for o in out),'of which severe',sum(o['renter_le30_cb50'] for o in out))
