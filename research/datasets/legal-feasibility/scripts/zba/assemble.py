import json,re,csv,datetime,os
from code import typology, norm_case
from geo import pins, wprdc, county, census
a=json.load(open('auto.json'))
TYP={'SD':'single_detached','SA':'single_attached','2U':'two_unit','3U':'three_unit','MU':'multi_unit','SR':'senior/elderly','AL':'assisted_living/personal_care','CH':'community_home','OR':'other_residential','NR':'non_residential'}
SCOPE={'U':'housing_units','A':'residential_accessory','N':'non_housing'}
ov={}
for l in open('overrides.txt'):
    if l.startswith('#') or not l.strip(): continue
    p=l.rstrip('\n').split('|'); ov.setdefault(p[0],[]).append(p)
S={norm_case(s['zone_case'])+'|'+s['address'][:6].lower():s for s in csv.DictReader(open('/Users/lancestreuber/Desktop/HouseHack/.worktrees/20260926-research/research/sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv'))}
Sk={}
for k,s in S.items(): Sk.setdefault(k.split('|')[0],[]).append(s)
OUTL={'A':'Approved','AC':'Approved with conditions','D':'Denied','DWP':'Denied without prejudice','S':'Split','APD':'Appeal denied','APG':'Appeal granted','NC':'Nonconforming status confirmed','NR':'No relief required','W':'Withdrawn','UNK':'Unclear'}
GROUP={'A':'approved','AC':'approved','NC':'approved','D':'denied','DWP':'denied','S':'split','APD':'appeal','APG':'appeal','NR':'no_relief_needed','UNK':'unclear'}
def strip_names(t):
    t=re.split(r'\s(?:RECUSED|s/)\s',t)[0]
    return t
def fam(sec):
    m=re.match(r'(9\d\d\.\d\d)',sec); return m.group(1) if m else sec
rows=[]
for r in a:
    ck=r['case_key']; notes=[]
    o=None
    for p in ov.get(ck,[]):
        if not p[1] or (r['request'] or '').startswith(p[1]) or (r['address'] or '').startswith(p[1]): o=p
    dist=r['zoning_district']; lb=r['lot_block']
    if ck=='24 of 2023' and dist=='52-J-392': dist='OPR-B'; lb='52-J-392'; notes.append('caption fields shifted in PDF: lot/block printed in district line; district taken from relief table')
    dist=re.sub(r'\s*\(.*?\)','',dist or '').strip()
    if o:
        scope=SCOPE[o[2]]; typ=TYP[o[3]] if o[3] else None; ub=o[4]; ua=o[5]; cls=o[6]; 
        if o[7]: notes.append(o[7])
        tsrc='manual'
    else:
        sc=r['scope_auto']; scope={'units':'housing_units','residential_accessory':'residential_accessory','none':'non_housing'}[sc]
        ub=ua=''; cls='NONE'
        if scope=='non_housing': typ='non_residential'; tsrc='rule'
        else:
            txt=(r['request'] or '')+' '+(r['decision_text'] or '')+' '+re.sub(r'\([^)]*(District|Density)[^)]*\)','',r['ctx'])
            txt=re.sub(r'R\d[A-Z]?-[A-Z]+|Two Unit|One Unit|Single-Unit|Single Unit|Multi-Family|Multi-Unit (?=\w+ Density)','',txt)
            typ=typology(txt,[]) or 'other_residential'; tsrc='auto (text match; dwelling type often not stated)'
    if scope=='non_housing': typ='non_residential'
    ua_s=str(ua); added=''
    if ua_s.startswith('+'): added=ua_s[1:]; ua=''
    elif ub!='' and ua!='' : 
        try: added=str(int(ua)-int(ub))
        except: pass
    # outcome
    oc=r['outcome_code']; osrc='auto (regex on decision paragraph, reviewed)'
    sm=None
    for s in Sk.get(norm_case(ck),[]):
        if s['address'][:6].lower()==(r['address'] or '')[:6].lower() or len(Sk[norm_case(ck)])==1: sm=s
    if sm:
        if sm['outcome_code']!=oc: notes.append(f'outcome per 2026 hand-coded sample ({sm["outcome_code"]}); regex gave {oc}')
        oc=sm['outcome_code']; osrc='2026 hand-coded sample'
    if ck=='59 of 2024': oc='NR'; osrc='manual'; notes.append('Board found the installation is not a sign; no relief needed')
    hd=[datetime.date.fromisoformat(x) if isinstance(x,str) else x for x in r['hearing_dates']]
    dd=r['decision_date']; dd=datetime.date.fromisoformat(dd) if isinstance(dd,str) and dd not in ('None',) else None
    if r['decision_raw'] and not dd: notes.append(f'decision date unparseable as printed: "{r["decision_raw"]}"')
    last=max(hd) if hd else None; first=min(hd) if hd else None
    days=(dd-last).days if dd and last else ''
    if days!='' and (days<0 or days>300): notes.append(f'hearing ({last}) and decision ({dd}) dates as printed imply {days} days; year typo in PDF suspected; days left blank'); days=''
    items=[tuple(x) for x in r['items']]
    rt=set(r['relief_types'])
    # merge: nonconforming reviews
    if oc=='NC': rt.add('nonconforming_review')
    if 'appeal' in rt and oc not in ('APD','APG') and len(rt)>1: pass
    secs=sorted({fam(s) for _,s in items})
    year=(dd or last).year if (dd or last) else ''
    if dd and last and dd<last: year=last.year
    base=('R-MU' if dist.startswith('R-MU') else re.split(r'[,/ ]',dist)[0].split('-')[0]) if dist else ''
    if ck=='374 of 2016': r['request']=re.split(r'\s+Special',r['request'])[0]; notes.append('OCR of scanned PDF (macOS Vision); 2016 decision found in archive')
    exc=strip_names(re.sub(r'\s+',' ',r['decision_text'] or ''))[:500]
    if r['case_key'] and re.search(r'of (\d{4})',r['case_key']) and r['url'] and re.search(r'(\d+)[-_]+(?:of)[-_]+(20\d\d)',r['url'].lower()):
        m=re.search(r'(\d+)[-_]+(?:of)[-_]+(20\d\d)',r['url'].lower())
        if f"{int(m.group(1))} of {m.group(2)}"!=ck: notes.append(f'file name says {int(m.group(1))} of {m.group(2)}; PDF caption says {ck}')
    rows.append(dict(zone_case=ck, bda_application=r['application'], hearing_date=last.isoformat() if last else '', first_hearing_date_listed=first.isoformat() if first and first!=last else '',
        decision_date=dd.isoformat() if dd else '', days_hearing_to_decision=days, year=year, address=r['address'], lot_block=lb, zon_new=dist, zon_base=base,
        ward=r['ward'] or '', neighborhood=r['neighborhood'] or '', request_as_captioned=r['request'] or '', housing_scope=scope, typology=typ, typology_source=tsrc,
        units_before=ub, units_after=ua, units_added=added, residential_units_class=cls,
        relief_type='|'.join(sorted(rt)), relief_sections='|'.join(secs), relief_items=';'.join(f'{t}|{s}' for t,s in items),
        outcome_code=oc, outcome=OUTL.get(oc,oc), outcome_group=GROUP.get(oc,oc), outcome_source=osrc, decision_text_excerpt=exc,
        decision_pdf=r['url'], source=r['source'], meeting_page_date=r['meeting_page_date'] or '', notes='; '.join(notes)))
# geocode
allp=[]
for x in rows:
    x['_pins']=pins(x['lot_block']); allp+=x['_pins']
cent=wprdc(sorted(set(allp)))
for x in rows:
    lat=lon=None; meth=''; pin=''
    for p in x['_pins']:
        if p in cent and cent[p][0]:
            lat,lon=cent[p][0],cent[p][1]; meth='parcel_centroid_wprdc'; pin=p; break
    if lat is None:
        for p in x['_pins']:
            c=county(p)
            if c: lat,lon=c; meth='parcel_polygon_centroid_county_gis'; pin=p; break
    if lat is None and x['address']:
        addr=re.split(r',| and |&',x['address'])[0]
        c=census(addr)
        if c: lat,lon=c[0],c[1]; meth='census_geocoder_address'
    x['parcel_pin']=pin; x['lat']=round(lat,6) if lat else ''; x['lon']=round(lon,6) if lon else ''; x['geocode_method']=meth or 'not_geocoded'
    if len({q[:10] for q in x['_pins']})>1 and pin: x['notes']=(x['notes']+'; ' if x['notes'] else '')+'multiple parcels captioned; point is first matched parcel'
    del x['_pins']
json.dump(rows,open('final_rows.json','w'),indent=0,default=str)
import collections
print(len(rows),collections.Counter(x['geocode_method'] for x in rows))
