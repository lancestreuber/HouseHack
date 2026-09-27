import json,csv,collections,re,sys
OUT=sys.argv[1]
R=json.load(open('final_rows.json'))
for x in R:
    if x['outcome_code']=='NC':
        if x['relief_type']!='nonconforming_review':
            x['notes']=(x['notes']+'; ' if x['notes'] else '')+f"relief table listed {x['relief_type'] or 'none'}; Board found use legally nonconforming, so relief_type set to nonconforming_review"
        x['relief_type']='nonconforming_review'
    x['is_housing']= 'yes' if x['housing_scope'] in ('housing_units','residential_accessory') else 'no'
R.sort(key=lambda x:(x['decision_date'] or x['hearing_date'], x['zone_case']))
cols=['zone_case','bda_application','year','hearing_date','first_hearing_date_listed','decision_date','days_hearing_to_decision','address','lot_block','parcel_pin','zon_new','zon_base','ward','neighborhood','request_as_captioned','is_housing','housing_scope','typology','typology_source','units_before','units_after','units_added','residential_units_class','relief_type','relief_sections','relief_items','outcome_code','outcome','outcome_group','outcome_source','decision_text_excerpt','lat','lon','geocode_method','decision_pdf','source','meeting_page_date','notes']
with open(f'{OUT}/zba-decisions.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
    for x in R: w.writerow({c:x.get(c,'') for c in cols})
feats=[]
for x in R:
    if x['lat']=='' : continue
    props={c:x.get(c,'') for c in cols if c not in ('lat','lon','decision_text_excerpt','relief_items')}
    feats.append({'type':'Feature','geometry':{'type':'Point','coordinates':[x['lon'],x['lat']]},'properties':props})
json.dump({'type':'FeatureCollection','name':'zba-decisions','features':feats},open(f'{OUT}/zba-decisions.geojson','w'))
# aggregation
agg=collections.defaultdict(lambda: collections.Counter())
for x in R:
    g=x['outcome_group']
    if g not in ('approved','denied','split'): continue
    rts=[t for t in x['relief_type'].split('|') if t and t!='appeal'] or ['unspecified']
    for zb in (x['zon_base'],'ALL'):
        for rt in rts+['ALL']:
            for typ in (x['typology'],'ALL'):
                for sc in (x['housing_scope'],'ALL'):
                    k=(zb,typ,rt,sc)
                    agg[k][g]+=1
    # 'ALL' relief counted once per case
rows=[]
for (zb,typ,rt,sc),c in agg.items():
    n=c['approved']+c['denied']+c['split']
    rows.append(dict(zon_base=zb,typology=typ,relief_type=rt,housing_scope=sc,n=n,approved=c['approved'],denied=c['denied'],split=c['split'],approval_rate=round(c['approved']/n,3) if n else '',small_n_flag='yes' if n<10 else ''))
order=lambda r:(r['zon_base']!='ALL',r['zon_base'],r['housing_scope']!='ALL',r['housing_scope'],r['typology']!='ALL',r['typology'],r['relief_type']!='ALL',r['relief_type'])
rows.sort(key=order)
with open(f'{OUT}/zba-outcomes-by-district-typology.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(len(R),len(feats),len(rows))
