import zipfile,re,xml.etree.ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def col2n(c):
    n=0
    for ch in c: n=n*26+ord(ch)-64
    return n-1
def read(path,sheet):
    z=zipfile.ZipFile(path)
    try: ss=[''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',NS)]
    except KeyError: ss=[]
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    rels={r.get('Id'):r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    for s in wb.find('m:sheets',NS):
        if s.get('name')==sheet: tgt=rels[s.get('{%s}id'%NS['r'])]
    tgt=tgt.lstrip('/'); tgt=tgt if tgt.startswith('xl/') else 'xl/'+tgt
    x=ET.fromstring(z.read(tgt)); rows=[]
    for r in x.iter('{%s}row'%NS['m']):
        out={}
        for c in r.findall('m:c',NS):
            ref=re.match(r'[A-Z]+',c.get('r')).group(0); v=c.find('m:v',NS)
            if v is None:
                t=c.find('m:is',NS); val=''.join(t.itertext()) if t is not None else ''
            else:
                val=v.text
                if c.get('t')=='s': val=ss[int(val)]
            out[col2n(ref)]=val
        rows.append([out.get(i,'') for i in range(max(out)+1)] if out else [])
    return rows
