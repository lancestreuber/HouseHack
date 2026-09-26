import re, datetime
MONTHS='January|February|March|April|May|June|July|August|September|October|November|December'
def pdate(s):
    if not s: return None
    s=s.replace(',',', ').replace('  ',' ')
    m=re.search(r'('+MONTHS+r')\s*(\d{1,2}),?\s*(\d{4})',s)
    if not m: return None
    try: return datetime.datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}",'%B %d %Y').date()
    except: return None
def field(t,label):
    m=re.search(r'^\s*'+label+r'\s*:?[ \t]*(.*)$',t,re.M|re.I)
    return m.group(1).strip() if m else None
def parse(t):
    r={}
    head=t[:6000]
    r['hearing_raw']=(re.search(r'Dates? of Hearings?\s*:?[ \t]*(.*)',head,re.I) or [None,None])[1]
    r['decision_raw']=field(head,r'Date of Decision')
    r['zone_case']=field(head,r'Zone Cases?')
    r['address']=field(head,r'Address(?:es)?')
    r['lot_block']=field(head,r'Lots? and Blocks?')
    r['zoning_district']=field(head,r'Zoning Districts?')
    r['ward']=field(head,r'Wards?')
    r['neighborhood']=field(head,r'Neighborhoods?')
    # request: may span lines until Application
    m=re.search(r'^\s*Request\s*:\s*(.*?)\n\s*\n',head,re.M|re.S|re.I)
    r['request']=re.sub(r'\s+',' ',m.group(1)).strip() if m else None
    m=re.search(r'^\s*Application\s*(?:No\.?|Number)?\s*:?\s*(.*)$',head,re.M|re.I)
    r['application']=m.group(1).strip() if m else None
    # hearing dates: all dates in hearing line(s)
    hd=[]
    m=re.search(r'Dates? of Hearings?\s*:?(.*?)Date of Decision',head,re.S|re.I)
    if m:
        for mm in re.finditer(r'('+MONTHS+r')\s+(\d{1,2}),?\s*(\d{4})',m.group(1)):
            d=pdate(mm.group(0)); 
            if d: hd.append(d)
        # handle "May 1 and 15, 2025"
    r['hearing_dates']=hd
    r['decision_date']=pdate(r['decision_raw'] or '')
    # relief table
    m=re.search(r'^\s*Application\s*.*?$(.*?)^\s*(Appearances|Findings of Fact|APPEARANCES)',head,re.M|re.S|re.I)
    r['table']=m.group(1) if m else ''
    # decision paragraph
    m=re.search(r'\n\s*(?:Decision|DECISION)\s*:\s*(.*?)(?:\n\s*s/|\n\s*\n\s*\n|\n\s*_{5,}|\Z)',t,re.S)
    r['decision_text']=re.sub(r'\s+',' ',m.group(1)).strip() if m else None
    return r
