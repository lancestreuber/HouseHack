import csv,re,collections
r=list(csv.DictReader(open('permits.csv',encoding='utf-8-sig')))
NEW={'NEW CONSTRUCTION','New Construction','NEW'}; PT={'BUILDING','Building & Development Application'}
W={'one':1,'single':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'twelve':12}
def units(d):
    m=re.search(r'(\d{1,4})\s*[- ]?\s*(?:residential\s+|dwelling\s+|apartment\s+|condo(?:minium)?\s+)?(?:units?|apartments?|dwellings?)\b',d)
    if m: return int(m.group(1))
    m=re.search(r'\b('+'|'.join(W)+r')[- ](?:unit|family)\b',d)
    if m: return W[m.group(1)]
    return None
def typ(d):
    d=d.lower(); u=units(d)
    if re.search(r'\b(accessory dwelling|adu|carriage house|garage apartment)\b',d): return 'adu',u or 1
    if re.search(r'town ?house|townhome|row ?house|rowhome',d): return 'townhouse',u
    if re.search(r'\b(two|2)[- ]?(family|unit)|duplex',d): return '2_unit',2
    if re.search(r'\b(three|3)[- ]?(family|unit)|triplex',d): return '3_4_unit',3
    if re.search(r'\b(four|4)[- ]?(family|unit)|quadplex|fourplex',d): return '3_4_unit',4
    if re.search(r'apartment|multi[- ]?family|mixed[- ]use|condo',d) or (u and u>=5): return 'multifamily_5plus' if (u is None or u>=5) else '3_4_unit',u
    if re.search(r'single[- ]family|sfd|single[- ]unit|one[- ]family|dwelling|house|home',d): return 'single_family',1
    return 'unclassified',u
out=[];c=collections.Counter()
for x in r:
    if x['work_type'] in NEW and x['permit_type'] in PT and (x['commercial_or_residential']=='Residential' or re.search(r'apartment|dwelling|residential|multi[- ]?family|condo|town ?house|units?\b',(x['work_description'] or '').lower())):
        t,u=typ(x['work_description'] or '')
        c[t]+=1
        out.append({'permit_id':x['permit_id'],'issue_date':x['issue_date'],'year':x['issue_date'][:4],'parcel_num':x['parcel_num'],'latitude':x['latitude'],'longitude':x['longitude'],
                    'neighborhood':x['neighborhood'],'total_project_value':x['total_project_value'],'housing_type_guess':t,'units_guess':u,'comm_or_res':x['commercial_or_residential'],'work_description':(x['work_description'] or '').replace('\n',' ')[:300]})
w=csv.DictWriter(open('pgh_new_residential_permits_classified.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'new residential building permits',c.most_common())
print(collections.Counter(o['year'] for o in out))
for t in ('unclassified','multifamily_5plus','2_unit'): print(t,[o['work_description'][:80] for o in out if o['housing_type_guess']==t][:4])
