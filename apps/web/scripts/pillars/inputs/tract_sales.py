import csv,json,statistics,collections
DWELL={'SINGLE FAMILY','TOWNHOUSE','CONDOMINIUM','TWO FAMILY','ROWHOUSE','THREE FAMILY','FOUR FAMILY'}
cls={r['PARID']:(r['CLASS'],r['USEDESC']) for r in csv.DictReader(open('asmt_class.csv'))}
tract={}
for x in csv.DictReader(open('centroids.csv',encoding='utf-8-sig')): tract[x['PIN']]='42003'+x['FIPS_TRACT']
hu={g.replace('14000US',''):t['B25001']['estimate']['B25001001'] for g,t in json.load(open('acs_hu_tr.json'))['data'].items()}
P=collections.defaultdict(list); drop=collections.Counter()
for s in csv.DictReader(open('sales.csv',encoding='utf-8-sig')):
    if s['SALEDESC']!='VALID SALE': continue
    y=s['SALEDATE'][:4]
    if not ('2019'<=y<='2025'): continue
    try: p=float(s['PRICE'])
    except: drop['price']+=1; continue
    if p<10000: drop['lt10k']+=1; continue
    c=cls.get(s['PARID'])
    if not c or c[0]!='R' or c[1] not in DWELL: drop['nonres']+=1; continue
    t=tract.get(s['PARID'])
    if not t: drop['notract']+=1; continue
    P[(t,y)].append(p)
print('dropped',drop, 'kept',sum(len(v) for v in P.values()))
YRS=[str(y) for y in range(2019,2026)]
out=[]
for t in sorted(set(k[0] for k in P)|set(hu)):
    o={'tract':t,'housing_units_acs2024':hu.get(t)}
    for y in YRS:
        v=P.get((t,y),[]); o[f'n_{y}']=len(v); o[f'median_{y}']=round(statistics.median(v)) if v else None
    a=P.get((t,'2020'),[])+P.get((t,'2021'),[]); b=P.get((t,'2024'),[])+P.get((t,'2025'),[])
    o['median_2019']; 
    o['chg_pct_2020_to_2025']=round((o['median_2025']-o['median_2020'])/o['median_2020'],3) if o['median_2020'] and o['median_2025'] else None
    o['n_2020_2021']=len(a); o['n_2024_2025']=len(b)
    o['median_2020_2021']=round(statistics.median(a)) if a else None; o['median_2024_2025']=round(statistics.median(b)) if b else None
    o['chg_pct_pooled_2021_to_2425']=round((o['median_2024_2025']-o['median_2020_2021'])/o['median_2020_2021'],3) if a and b else None
    o['sales_per_100hu_2024_2025']=round(100*len(b)/o['housing_units_acs2024'],2) if o['housing_units_acs2024'] else None
    o['low_n_flag']='; '.join(k for k,n in (('n_2020<10',o['n_2020']),('n_2025<10',o['n_2025']),('pooled_2021<10',len(a)),('pooled_2425<10',len(b))) if n<10)
    out.append(o)
w=csv.DictWriter(open('allegheny_tract_sales_2019_2025.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'tracts')
for y in YRS: print(y,'total n',sum(o[f'n_{y}'] for o in out),'county median',round(statistics.median([p for (t,yy),v in P.items() if yy==y for p in v])))
v=sorted(o['chg_pct_pooled_2021_to_2425'] for o in out if o['chg_pct_pooled_2021_to_2425'] is not None and not o['low_n_flag'].count('pooled'));print('pooled chg (n>=10 both) p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)],'n',len(v))
print('tracts flagged n_2019<10 or n_2025<10',sum(1 for o in out if 'n_2020' in o['low_n_flag'] or 'n_2025' in o['low_n_flag']))
v=sorted(o['sales_per_100hu_2024_2025'] for o in out if o['sales_per_100hu_2024_2025'] is not None);print('turnover p10/med/p90',[v[int(len(v)*q)] for q in (.1,.5,.9)])
