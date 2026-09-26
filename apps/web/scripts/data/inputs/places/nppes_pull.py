import json,subprocess,time
zs=open('allegheny_zips.txt').read().split()
out={}
for z in zs:
    skip=0
    while True:
        u=f'https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-2&taxonomy_description=Pharmacy&postal_code={z}&limit=200&skip={skip}'
        r=subprocess.run(['curl','-s','-m','60',u],capture_output=True,text=True).stdout
        try: d=json.loads(r)
        except Exception: time.sleep(2); continue
        res=d.get('results',[])
        for x in res: out[x['number']]=x
        if len(res)<200 or skip>=1000: break
        skip+=200
json.dump(out,open('nppes_pharm.json','w'))
print(len(zs),'zips;',len(out),'org pharmacy NPIs')
