"""Pull raw inputs for build_permits_new_residential.py into a cache dir (argv[1], default cwd).
Sources: OneStopPGH OSPI_H FeatureServer/0, WPRDC pli-permits (datastore_search), City AGOL
Development_Construction_Projects_v2, PGHWebZoning, PGHWebNeighborhoods. OSPI_H is slow (~11 s/query)."""
import requests, json, sys, time, os
OUT = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
OSPI = "https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0/query"
AGOL = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services"
NEWCON = ("source='pli_permits' AND ((type='BUILDING' AND type_work_desc='NEW CONSTRUCTION') OR "
          "(type='Building & Development Application' AND type_work_desc='New Construction'))")
KW = ['%CONVER%', '%CHANGE OF USE%', '%CHANGE IN USE%', '%CHANGE USE%', '%ACCESSORY DWELLING%', '%ADU%', '%ADDITIONAL DWELLING%',
      '%ADDITIONAL UNIT%', '%NEW DWELLING UNIT%', '%NEW UNIT%', '%ADD UNIT%', '%ADD A UNIT%', '%ADDING%UNIT%']
CONV = ("source='pli_permits' AND type IN ('BUILDING','Building & Development Application') AND type_work_desc IN "
        "('ADDITION / ALTERATION','MINOR ALTERATION','Existing (alteration/addition)') AND (" +
        " OR ".join("UPPER(work_desc) LIKE '%s'" % k for k in KW) + ")")

def pull_ospi(where, out):
    feats = []; off = 0
    while True:
        r = requests.post(OSPI, data=dict(where=where, outFields="*", outSR=4326, f="json", resultOffset=off,
                                          resultRecordCount=1000, orderByFields="objectid"), timeout=300).json()
        fs = r.get('features', []); feats += fs; off += len(fs)
        if not fs or not r.get('exceededTransferLimit'): break
    for f in feats:
        f['attributes'].pop('owners', None)
    json.dump(dict(where=where, pulled=time.strftime('%Y-%m-%dT%H:%M:%S'), features=feats), open(os.path.join(OUT, out), 'w'))
    return feats

def pull_wprdc():
    rows = []
    for wt in ["NEW CONSTRUCTION", "New Construction"]:
        off = 0
        while True:
            r = requests.get("https://data.wprdc.org/api/3/action/datastore_search", params=dict(
                resource_id="f4d1177a-f597-4c32-8cbf-7885f56253f6", filters=json.dumps({"work_type": wt}), limit=1000, offset=off), timeout=120).json()['result']
            rows += r['records']; off += len(r['records'])
            if not r['records'] or off >= r['total']: break
    for x in rows: x.pop('owner_name', None)
    json.dump(dict(pulled=time.strftime('%Y-%m-%dT%H:%M:%S'), records=rows), open(os.path.join(OUT, 'wprdc_newcon.json'), 'w'))

def pull_agol():
    r = requests.get(AGOL + "/Development_Construction_Projects_v2/FeatureServer/0/query", params=dict(
        where="USER_TYPEOFWORKDESCRIPTION='NEW CONSTRUCTION'", outFields="*", outSR=4326, f="json", resultRecordCount=2000)).json()
    json.dump(dict(pulled=time.strftime('%Y-%m-%dT%H:%M:%S'), features=r['features']), open(os.path.join(OUT, 'agol_newcon.json'), 'w'))

def pull_poly(svc, fields, out):
    feats = []; off = 0
    while True:
        r = requests.get(AGOL + "/%s/FeatureServer/0/query" % svc, params=dict(where="1=1", outFields=fields, outSR=4326, f="geojson",
                                                                              resultOffset=off, resultRecordCount=500), timeout=300).json()
        fs = r['features']; feats += fs; off += len(fs)
        if len(fs) < 500: break
    json.dump(dict(type="FeatureCollection", features=feats), open(os.path.join(OUT, out), 'w'))

def pull_context(parcels):
    out = []
    ps = sorted(set(p for p in parcels if p))
    for i in range(0, len(ps), 50):
        w = "parc_num IN (%s) AND work_desc IS NOT NULL AND type NOT IN ('ELECTRICAL','MECHANICAL')" % ",".join("'%s'" % p for p in ps[i:i + 50])
        r = requests.post(OSPI, data=dict(where=w, outFields="record_id,parc_num,type,type_work_desc,work_desc,status,issue_date",
                                          f="json", returnGeometry="false"), timeout=300).json()
        out += [f['attributes'] for f in r['features']]
    json.dump(out, open(os.path.join(OUT, 'ospi_parcel_context.json'), 'w'))

if __name__ == '__main__':
    nc = pull_ospi(NEWCON, 'ospi_newcon.json')
    pull_ospi(CONV, 'ospi_conv.json')
    pull_wprdc(); pull_agol()
    pull_poly('PGHWebZoning', 'zon_new,full_zoning_type', 'zoning.geojson')
    pull_poly('PGHWebNeighborhoods', 'hood', 'hoods.geojson')
    # context: every new-construction parcel (superset of what was used on 2026-09-26, which was
    # parcels of records with an empty or generic description)
    pull_context([f['attributes'].get('parc_num') for f in nc])
