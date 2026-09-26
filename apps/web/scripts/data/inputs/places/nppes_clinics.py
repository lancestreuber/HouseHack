import json,subprocess,time,urllib.parse
zs=open('allegheny_zips.txt').read().split()
out={}
for term in ('Primary Care','Urgent Care','Federally Qualified Health Center','Community Health'):
    for z in zs:
        skip=0
        while True:
            u='https://npiregistry.cms.hhs.gov/api/?'+urllib.parse.urlencode({'version':'2.1','enumeration_type':'NPI-2','taxonomy_description':term,'postal_code':z,'limit':200,'skip':skip})
            r=subprocess.run(['curl','-s','-m','60',u],capture_output=True,text=True).stdout
            try: d=json.loads(r)
            except Exception: time.sleep(2); continue
            res=d.get('results',[])
            for x in res: out[x['number']]=x
            if len(res)<200 or skip>=1000: break
            skip+=200
json.dump(out,open('nppes_clinics.json','w'));print(len(out))
