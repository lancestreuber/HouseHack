import re, glob, json, datetime, csv
from parse import parse
W={'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'single':1}
SEC=r'9\d\d\.\d\d(?:[.\-]?[A-Za-z0-9]+)*(?:\([a-z0-9]\))?'
def norm_case(z):
    if not z: return None
    m=re.search(r'(\d+)\s*of\s*(\d{4})',z,re.I)
    return f"{int(m.group(1))} of {m.group(2)}" if m else z.strip()
def table_items(tab):
    items=[];cur=None
    for line in tab.split('\n'):
        s=line.strip()
        if not s: continue
        m=re.match(r'^(Variances?|Special\s+Exceptions?|Protest\s+Appeal|Appeals?|Reviews?|Use\s+Variance|Administrator\s+Exception|Nonconforming\s+\w+|Expansion\s+of\s+Nonconforming\s+Use|Variance\s+or\s+Special\s+Exception)\b',s,re.I)
        if m:
            cur=m.group(1).lower()
            cur='V' if cur.startswith('var') or cur.startswith('use var') else 'SE' if cur.startswith('special') else 'APPEAL' if 'appeal' in cur else 'REVIEW' if cur.startswith('review') or cur.startswith('noncon') else 'AE' if cur.startswith('admin') else 'SE' if cur.startswith('expan') else cur
        for sm in re.finditer(SEC,s):
            if cur: items.append((cur,sm.group(0).rstrip('.')))
    out=[]
    for i in items:
        if i not in out: out.append(i)
    return out
def dec_items(dt):
    """types mentioned in decision paragraph with sections"""
    out=[]
    if not dt: return out
    for m in re.finditer(r'(variances?|special exceptions?|appeal)[^.;]*?(?:Sections?|§)\s*((?:'+SEC+r'(?:[,\s]*(?:and|&)?\s*)?)+)',dt,re.I):
        t=m.group(1).lower(); t='V' if t.startswith('var') else 'SE' if t.startswith('spec') else 'APPEAL'
        for s in re.findall(SEC,m.group(2)): out.append((t,s.rstrip('.')))
    return out
def outcome(dt,req,items):
    if not dt: return ('UNK','Unknown (no decision paragraph parsed)')
    d=dt
    ap=bool(re.search(r'\b(APPROVED|APROVED|GRANTED|APPROVES|GRANTS)\b',d)) or bool(re.search(r'hereby (approved|granted)',d,re.I))
    sents=re.split(r'(?<=\.)\s+(?=[A-Z])',d)
    dsents=[x for x in sents if re.search(r'\bDENIED\b|\bDENIES\b|hereby denied',x)]
    dn=bool(dsents)
    if dn and ap and all(re.search(r'appellant|protest appeal|appeal of',x,re.I) for x in dsents) and not re.search(r'\bappeal',(req or ''),re.I): dn=False
    wp=bool(re.search(r'without prejudice',d,re.I))
    wd=bool(re.search(r'\bWITHDRAWN\b|withdrawn',d)) 
    dis=bool(re.search(r'DISMISSED|dismissed',d))
    cond=bool(re.search(r'subject to|condition',d,re.I))
    isappeal=bool(re.search(r'\bappeal',(req or '')+' '+d[:300],re.I)) and not re.search(r'variance|special exception',d[:200],re.I)
    isreview=any(t=='REVIEW' for t,_ in items) and not ap and not dn
    if isappeal:
        if dn and not ap: return ('APD','Appeal denied')
        if ap and not dn: return ('APG','Appeal granted')
        if ap and dn: return ('S','Split (appeal granted in part)')
    if wd and not ap and not dn: return ('W','Withdrawn')
    if dis and not ap and not dn: return ('DISM','Dismissed')
    if ap and dn: return ('S','Split')
    if dn: return ('DWP','Denied without prejudice') if wp else ('D','Denied')
    if ap: return ('AC','Approved with conditions') if cond else ('A','Approved')
    if re.search(r'may continue|legally non-?\s?conforming|is a legal',d,re.I): return ('NC','Nonconforming status confirmed')
    if re.search(r'no (additional )?relief is required|allowed by-right|permitted by right',d,re.I): return ('NR','No relief required')
    return ('UNK','Unclear')
def relief_types(items):
    ts=set()
    for t,s in items:
        if t=='V': ts.add('use_variance' if s.startswith('911') else 'dimensional_variance')
        elif t=='SE': ts.add('aapp_parking' if s.startswith('914.07') else 'special_exception')
        elif t=='APPEAL': ts.add('appeal')
        elif t=='REVIEW': ts.add('nonconforming_review')
        elif t=='AE': ts.add('administrator_exception')
    return ts
def num(s):
    s=s.lower(); return int(s) if s.isdigit() else W.get(s)
NUMW=r'(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)'
def units_mentions(text):
    out=[]
    for m in re.finditer(NUMW+r'[\s-]*(?:\(\d+\)\s*)?(?:new\s+|additional\s+|residential\s+|dwelling\s+|apartment\s+)?(?:-?\s*)?(?:dwelling\s+)?(units?|unit\b|family|apartments?)',text,re.I):
        n=num(m.group(1))
        if n: out.append(n)
    return out
def typology(text,units):
    t=text.lower()
    if re.search(r'assisted living|personal care|nursing home|skilled nursing',t): return 'assisted_living/personal_care'
    if re.search(r'community home|group home|recovery house|halfway',t): return 'community_home'
    if re.search(r'senior|elderly|age-restricted|older adult',t): return 'senior/elderly'
    if re.search(r'dormitor|student living|student housing|rooming|fraternit|sororit',t): return 'other_residential'
    if units:
        u=max(units)
        if u>=4: return 'multi_unit'
        if u==3: return 'three_unit'
        if u==2 and re.search(r'two[\s-]unit|2[\s-]unit|duplex|two dwelling units|two residential units|two units|2 units|two-family|two family',t): return 'two_unit'
    if re.search(r'multi[\s-]?unit|apartment',t): return 'multi_unit'
    if re.search(r'three[\s-]unit|3[\s-]unit|triplex',t): return 'three_unit'
    if re.search(r'two[\s-]unit|2[\s-]unit|duplex|two dwelling units|two residential units|two-family|two family|second (dwelling|residential) unit',t): return 'two_unit'
    if re.search(r'attached house|townhouse|townhome|row ?house|single[\s-]unit attached|attached single',t): return 'single_attached'
    if re.search(r'single[\s-]family|single[\s-]unit|house|dwelling|residence|home\b',t): return 'single_detached'
    return None
UNIT_RX=r'new construction|construction of|construct|conversion|convert|change of use|change use|use of (the )?(existing )?(building|structure|property|site)|occupancy|dwelling units?|residential units?|two[\s-]unit|multi[\s-]unit|duplex|subdivision|houses?|townhouse'
ACC_RX=r'fence|deck|parking pad|garage|porch|addition|generator|wall|shed|pool|carport|patio|stair|dormer|trellis|greenhouse|chicken|playground|retaining'
def scope(req,dt,typ,district):
    t=(req or '')+' '+(dt or '')
    tl=t.lower()
    resid=bool(re.search(r'residential|dwelling|house|home\b|unit|duplex|apartment|family|dormitor|student living|senior|assisted|personal care',tl))
    if re.search(r'\bsigns?\b|signage',(req or '').lower()) and not re.search(r'unit|dwelling',(req or '').lower()): return 'none'
    if resid and re.search(r'(new construction|construction of|construct|conversion|convert|change (of )?(the )?use|use of|occupancy|legaliz|additional (dwelling|residential)? ?units?|two dwelling|units?\b.*(residential|dwelling)|subdivision|review)',tl) and not re.search(r'^(fence|deck|parking pad|garage)',(req or '').lower().strip()):
        if typ: return 'units'
    if typ and re.search(ACC_RX,tl): return 'residential_accessory'
    if typ and (district or '').upper().startswith(('R1','R2','R3','RM','H')): return 'residential_accessory'
    return 'none'
