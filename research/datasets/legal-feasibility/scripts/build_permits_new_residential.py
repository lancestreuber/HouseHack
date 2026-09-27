"""Build permits-new-residential.{geojson,csv} from the cache written by pull_permits_new_residential.py.
Usage: python build_permits_new_residential.py <out_dir> <cache_dir>. Needs shapely>=2."""
import json, re, csv, sys, datetime, collections, statistics, os
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

SCR = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
OUT = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
PULL_DATE = datetime.date(2026, 9, 26)

def load(p):
    return json.load(open(os.path.join(SCR, p)))

ospi_new = [f for f in load('ospi_newcon.json')['features']]
ospi_conv = [f for f in load('ospi_conv.json')['features']]
wprdc = {r['permit_id']: r for r in load('wprdc_newcon.json')['records']}
agol = load('agol_newcon.json')['features']
ctx = load('ospi_parcel_context.json')

WORDNUM = {'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
           'ELEVEN': 11, 'TWELVE': 12, 'FOURTEEN': 14, 'SIXTEEN': 16, 'TWENTY': 20}
NUM = r'(\d{1,4}|' + '|'.join(WORDNUM) + r')'

def num(s):
    s = s.strip('()')
    return int(s) if s.isdigit() else WORDNUM.get(s)

UNIT_RE = re.compile(r'\(?' + NUM + r'\)?\s*[- ]?\s*(?:(?:NEW|TOTAL|RESIDENTIAL|APARTMENT|DWELLING|CONDO\w*|RENTAL|FOR-SALE|TYPE [AB])\s+){0,3}(?:UNITS|UNTIS|UNIT(?!\s+CLUSTER)(?!\s+TYPE)|APARTMENTS|DWELLINGS|DWELLING UNITS|HOUSES|HOMES\b)')
TOTAL_RE = re.compile(r'\(TOTAL\s+' + NUM + r'\)|' + NUM + r'\s+UNITS\s+TOTAL')
UNITS_ON_RE = re.compile(NUM + r'\s+UNITS\s+ON\s+(?:FIRST|SECOND|THIRD|FOURTH|FOUR|\d)')
FAM2 = re.compile(r'\b(TWO|2)[- ]?(FAMILY|UNIT)\b(?!\s+CLUSTER)|DUPLEX|\bDOUBLE\b(?![- ]?(CAR|GARAGE|WIDE|DOOR|HUNG|STACK|BAY|STUD|HEIGHT|STOR|DECK|PORCH))')
FAM3 = re.compile(r'\b(THREE|3)[- ]?(FAMILY|UNIT)\b|TRIPLEX')
SINGLE = re.compile(r'SINGLE[- ]?FAMILY|ONE[- ]FAMILY|\b1[- ]FAMILY|\bSFD\b|SINGLE DWELLING|SINGLE[- ]UNIT')
ATTACHED = re.compile(r'TOWN ?HO(ME|USE)|ROW ?HOUSE|ROWHOME|\bATTACHED\b(?!\s+(GARAGE|TWO|ONE|2|1)[- ]?CAR)(?!\s+GARAGE)|PARTY WALL|SEMI-DETACHED|\bTOWN I')
GENERIC_SFD = re.compile(r'\bHOUSE\b|\bHOME\b|\bDWELLING\b(?!\s+UNITS)|\bRESIDENCE\b|MANUFACTURED DWELLING|DWELLING UNIT\b')
MULTI = re.compile(r'APARTMENT|MULTI[- ]?FAMILY|MULTI[- ]?UNIT|CONDOMINIUM|HIGH ?RISE|RESIDENTIAL BUILDING|PODIUM|DWELLING UNITS|MIXED[- ]USE')
SENIOR = re.compile(r'SENIOR|ELDERLY|HOUSING FOR THE ELDERLY|\b55\+|\b62\+')
ASSIST = re.compile(r'ASSISTED LIVING|PERSONAL CARE|NURSING|MEMORY CARE|SKILLED CARE')
GROUP = re.compile(r'GROUP HOME|COMMUNITY HOME|\bSRO\b|SINGLE ROOM OCCUPANCY|MULTI-SUITE|ROOMING|DORMITOR|SLEEPING ROOMS|TREATMENT FACILITY|RECOVERY HOUSE|HALFWAY')
ADU = re.compile(r'ACCESSORY DWELLING|\bADU\b|CARRIAGE HOUSE|GARAGE APARTMENT|IN-LAW|GRANNY')
DWELL_STRONG = re.compile(r'\b(TWO|THREE|2|3)[- ]FAMILY|DWELL|APARTMENT|SINGLE[- ]FAMILY|TWO[- ]FAMILY|FAMILY DWELLING|TOWN ?HO|CONDO|RESIDEN|\bHOUSE\b|\bHOUSES\b|\bHOME\b|SENIOR|ASSISTED|GROUP HOME|DORMITOR|UNITS\b|DUPLEX|PERSONAL CARE')
NONRES = re.compile(r'\bSIGN\b|WAREHOUSE|UNGULATE|ELEPHANT|PUMP STATION|STUDENT CENTER|COMMUNITY CENTER|PARK SHELTER|GREENHOUSE|LIGHT ARRAYS|HOLIDAY MARKET|TENANT FIT|FIT OUT OF TENANT|TENANT BUILD-OUT|FIT-OUT OF 1ST|RESTAURANT|OFFICE TENANT|MERCANTILE STORE|STERILE PROCESSING|HOOP HOUSE|STORAGE FOR A NURSERY|TRAINING|CLASSROOM')
ACCESSORY = re.compile(r'\bPOOL\b|SHED\b|RETAINING WAL|RETAING WAL|MICROPILE|CONCRETE FLOOR|PERGOLA|FENCE|COURTYARD|\bDECK\b')
ACCESSORY_REL = re.compile(r'^\W*(INSTALL|USE OF)|(POOL|WALLS?|FENCE|SHED|DECK)\b[^.]{0,25}?\b(AT|TO|FOR|ACCESSORY TO|OF)\s+(THE\s+)?(REAR\s+(OF\s+)?)?(SITE\s+FOR\s+)?(AN?\s+)?(EXISTING\s+|NEW\s+)?(SINGLE|TOWN|6 TOWN|THE|\d+ STORY APARTMENT|MULTI)')
_NOTDW = r'(?:(?!DWELL|HOUSE|HOME|TOWN|FAMILY|RESIDEN|UNIT|BUILDING|STRUCTURE|STORY)\S+\s+){0,9}'
ACC_START = re.compile(r'^\W*(INSTALL\w*|ADD\b|REPLACEMENT|REPAIR|DEMOLITION OF EXISTING WOOD DECK|NO WORK|SITE ?WORK|DECK\b|(CONSTRUCTION OF|CONSTRUCT|NEW)\s+' + _NOTDW + r'(DECK|POOL|FENCE|RETAINING|SHED|PERGOLA|PLAYGROUND|GARAGE))')
ACC_REL = re.compile(r'(AT|TO|FOR|OF)\s+(THE\s+)?(REAR\s+(OF\s+)?)?(SITE\s+FOR\s+)?(AN?\s+)?EXISTING\s+(SINGLE|TWO|DWELLING|HOUSE|\d STORY)|ACCESSORY TO\s+TOWN|REAR OF SINGLE[- ]FAMILY|FOR SINGLE[- ]FAMILY')
PRIMARY = re.compile(r'(CONSTRUCT\w*|NEW|BUILD)\b[^.]{0,70}?(DWELLING|HOUSE\b|HOME\b|RESIDENCE|APARTMENT|TOWNHO|UNITS\b)')
GENERIC_BLDG = re.compile(r'STOR(Y|IES)|BUILDING|STRUCTURE|MIXED')
GENERIC_NONRES = re.compile(r'GROCERY|\bSTORE\b|FIT-OUT|FIT OUT|HOTEL|OFFICE|HOSPITAL|PUMP|SOLAR|CHEMICAL|STORAGE|RELIGIOUS|GATE CONTROL|CONCERT|SHOP|SALON|KITCHEN|RESEARCH|LAB\b|TICKET|STAGE|FOOTBALL|CAR PORT|PARKING STRUCTURES|SCREENING|REPAIR|COMMERCIAL BUILDING|INNOVATION|PAVILION|WATER')
GARAGE_ONLY = re.compile(r'^(?!.*(DWELL|HOUSE|HOME|RESIDEN|APARTMENT|FAMILY|TOWN)).*(GARAGE|CARPORT)')
PHASE = re.compile(r'FOUNDATION[S]? ONLY|FOUNDATION ONLY|PHASED|PHASE \d|SUPERSTRUCTURE|SITE AND FOUNDATION|SITE WORK AND FOUNDATION|FOUNDATIONS ONLY|FIT-OUT OF UNIT|COMPLETION OF PHASED|FOUNDATION FOR FUTURE|ONLY FOR FOUNDATIONS|FOUNDATION THROUGH')

MANUAL_TYPOLOGY = {
    'BP-2020-14364': ('unknown', 1, 'med', 'manual:basement converted to one added dwelling unit; host building type not stated'),
    'BP-2022-08294': ('unknown', 2, 'med', 'manual:2 added dwelling units from storage rooms; host building type not stated'),
}
MANUAL_EXCLUDE = {
    'BDA-2024-02185': 'two-family to mixed-use business/R-2: no unit gain stated',
    'BP-2019-02549': 'garage converted to bedroom in existing 3-family: no unit added',
    'BP-2021-00981': 'accessory pool on existing multi-unit building',
    'BP-2021-13370': 'accessory courtyard/pool at apartment building',
    'BP-2022-00260': 'restaurant fit-out in existing apartment building',
    'BP-2022-13862': 'mercantile tenant fit-out in apartment building',
    'BP-2023-05803': 'accessory pool/fence to townhomes',
    'BP-2022-08225': 'townhouse community center (non-dwelling)',
    'BDA-2025-01290': 'site work only for two mixed-use structures (buildings permitted separately)',
    'BDA-2026-00271': 'garage building',
    'BP-2021-16300': 'community center',
}

def units_from_text(t):
    tot = [num(a or b) for a, b in TOTAL_RE.findall(t)]
    if tot:
        return max(x for x in tot if x), 'text_total'
    on = [num(x) for x in UNITS_ON_RE.findall(t)]
    if len(on) >= 2:
        return sum(on), 'text_units_on_levels_sum'
    vals = []
    for m in UNIT_RE.finditer(t):
        pre = t[max(0, m.start() - 12):m.start()]
        if re.search(r'TYPE\s*[AB]?\s*$|ACCESSIBLE\s*$|\(\s*$', pre) and 'UNITS' not in m.group(0) and 'HOUSES' not in m.group(0):
            continue
        v = num(m.group(1))
        seg = m.group(0)
        if re.search(r'ACCESSIBLE|TYPE [AB]', t[m.start():m.end() + 1]):
            continue
        if v and v < 2000:
            vals.append((v, 'TYPE' in m.group(0)))
    if vals:
        v = max(vals)
        return v[0], 'text_unit_count' + ('_type_ab_only' if v[1] else '')
    return None, None

def bucket(n):
    if n is None:
        return None
    if n <= 1:
        return 'single_detached'
    if n == 2:
        return 'two_unit'
    if n == 3:
        return 'three_unit'
    if n <= 19:
        return 'multi_unit_4_19'
    return 'multi_unit_20plus'

def classify(desc, prop_type, agol_units, kind):
    t = (desc or '').upper()
    if not t.strip():
        if agol_units and agol_units >= 2:
            return bucket(agol_units), agol_units, 'med', 'agol_numberofunits_no_text'
        if prop_type == 'Residential':
            return 'unknown', agol_units if agol_units == 1 else None, 'low', 'residential_new_construction_no_description'
        return None, None, None, 'no_description_commercial'
    if NONRES.search(t) and not (re.search(r'CONSTRUCT', t) and re.search(r'APARTMENT BUILDING|DWELLING UNITS|RESIDENTIAL APARTMENT', t)):
        return None, None, None, 'nonresidential_keyword'
    if kind != 'conversion' and ACCESSORY.search(t) and DWELL_STRONG.search(t) and (ACC_START.search(t) or ACC_REL.search(t)):
        return None, None, None, 'accessory_to_dwelling'
    if GARAGE_ONLY.search(t) and not re.search(r'DWELLING|HOUSE|HOME|UNIT', t):
        return None, None, None, 'garage_or_accessory_structure'
    if not DWELL_STRONG.search(t):
        if prop_type == 'Residential' and kind == 'new_construction' and re.search(r'FIXTURES|FINISHES|FRAMING|NEW CONSTRUCTION|STORY', t):
            return 'unknown', None, 'low', 'residential_new_construction_generic_text'
        if agol_units and agol_units >= 2:
            return bucket(agol_units), agol_units, 'med', 'agol_numberofunits_generic_text'
        if ACCESSORY.search(t) and not GENERIC_BLDG.search(t):
            return None, None, None, 'accessory_structure_only'
        if GENERIC_BLDG.search(t) and not GENERIC_NONRES.search(t):
            return None, None, None, 'generic_building_no_use_stated'
        return None, None, None, 'no_dwelling_terms'
    n, nrule = units_from_text(t)
    if ASSIST.search(t) and not re.search(r'CONVERT NURSING HOME TO', t):
        return 'assisted_living', n, 'high', 'kw_assisted_personal_care'
    if SENIOR.search(t):
        return 'senior', n or (agol_units if agol_units and agol_units > 1 else None), 'high', 'kw_senior_elderly'
    if GROUP.search(t):
        return 'other_group', n, 'high' if not re.search('DORMITOR|TREATMENT', t) else 'med', 'kw_group_sro_dorm'
    if ADU.search(t) or (kind == 'conversion' and re.search(r'GARAGE\s+(IN)?TO\s+(AN?\s+)?(SINGLE\s+)?(FAMILY\s+)?(ACCESSORY\s+)?(DWELLING|APARTMENT|LIVING|UNIT|OCCUP)|GARAGE TO CREATE AN? (OCCUP|DWELL|LIV)', t)):
        return 'adu', 1, 'med' if kind == 'conversion' else 'high', 'kw_adu'
    if FAM3.search(t) and not n:
        return 'three_unit', 3, 'high', 'kw_three_family'
    if FAM2.search(t) and not (n and n > 2):
        return 'two_unit', 2, 'high', 'kw_two_family'
    if ATTACHED.search(t) and not re.search(r'APARTMENT|CONDOMINIUM BUILDING', t):
        return 'single_attached', 1, 'high', 'kw_townhouse_attached' + ('_cluster' if n else '')
    if n:
        typ = bucket(n)
        if n == 1 and ATTACHED.search(t):
            typ = 'single_attached'
        if re.search(r'\bHOUSES\b|\bHOMES\b', t) and n > 1:
            return 'single_detached', n, 'med', 'text_count_of_houses_master_permit'
        conf = 'high'
        if agol_units and agol_units > 1 and agol_units != n:
            conf = 'med'
        return typ, n, conf, nrule
    if SINGLE.search(t):
        return 'single_detached', 1, 'high', 'kw_single_family'
    if MULTI.search(t):
        if agol_units and agol_units >= 2:
            return bucket(agol_units), agol_units, 'high', 'kw_apartment+agol_numberofunits'
        return 'multi_unit_size_unknown', None, 'med', 'kw_apartment_no_unit_count'
    if GENERIC_SFD.search(t):
        if agol_units and agol_units >= 2:
            return bucket(agol_units), agol_units, 'med', 'kw_generic_dwelling+agol_numberofunits'
        return 'single_detached', 1, 'med', 'kw_generic_house_dwelling'
    if agol_units and agol_units >= 2:
        return bucket(agol_units), agol_units, 'med', 'agol_numberofunits'
    return 'unknown', None, 'low', 'dwelling_term_no_type'

CONV_TARGET = re.compile(r'(?:CHANGE (?:OF|IN) USE|CONVER\w*|CONVERT\w*)\b.*?\b(?:TO|INTO|AS)\s+(?:AN?\s+)?(.{0,80})')
CONV_FROM_RES = re.compile(r'(?:FROM|CONVERT\w*|CONVERSION OF)\s+(?:AN?\s+|THE\s+)?(?:EXISTING\s+)?(SINGLE[- ]FAMILY|TWO[- ]FAMILY|2[- ]FAMILY|THREE[- ]FAMILY|3[- ]FAMILY|FOUR DWELLING|\d+ (?:DWELLING )?UNIT|[A-Z]+ DWELLING UNIT)')
NONRES_FROM = re.compile(r'COMMERCIAL|CHURCH|SCHOOL|OFFICE|STORE|RETAIL|WAREHOUSE|GARAGE|MIXED USE|BAR\b|RESTAURANT|CLUB|WORKSHOP|INDUSTRIAL|MANUFACTUR|FUNERAL|CONVENT|RECTORY|HOTEL|VACANT')

FAM_PATS = [(r'SINGLE[- ]FAMILY|ONE[- ]FAMILY|SINGLE DWELLING|SINGLE[- ]UNIT', 1), (r'TWO[- ]FAMILY|2[- ]FAMILY|\b2 (DWELLING )?UNIT|TWO (DWELLING )?UNIT|DUPLEX', 2),
            (r'THREE[- ]FAMILY|3[- ]FAMILY|\b3 (DWELLING )?UNIT|THREE (DWELLING )?UNIT', 3), (NUM + r'\s+(?:DWELLING\s+|RESIDENTIAL\s+|APARTMENT\s+)?(?:UNIT|DWELLING)', None)]
def fam_units(s):
    s = s.upper(); best = None
    for p, v in FAM_PATS:
        m = re.search(p, s)
        if m and (best is None or m.start() < best[0]):
            best = (m.start(), v if v is not None else num(m.group(1)))
    return best[1] if best else None
def _old_fam_units(s):
    s = s.upper()
    if re.search(r'SINGLE[- ]FAMILY|ONE[- ]FAMILY|SINGLE DWELLING', s): return 1
    if re.search(r'TWO[- ]FAMILY|2[- ]FAMILY|\b2 (DWELLING )?UNIT|TWO (DWELLING )?UNIT|DUPLEX', s): return 2
    if re.search(r'THREE[- ]FAMILY|3[- ]FAMILY|\b3 (DWELLING )?UNIT|THREE (DWELLING )?UNIT', s): return 3
    m = re.search(NUM + r'\s+(?:DWELLING\s+)?UNIT', s)
    if m: return num(m.group(1))
    return None

def conversion_adds_units(desc):
    t = (desc or '').upper()
    m = CONV_TARGET.search(t)
    target = fam_units(re.split(r'\bOF EXISTING\b|\bON (?:THE )?(?:FIRST|SECOND|THIRD|1ST|2ND|3RD)|[.;]', m.group(1))[0]) if m else None
    if target is None:
        m2 = re.search(r'(?:CREATE|ADD\w*)\s+(?:A\s+)?' + NUM + r'?\s*(?:NEW\s+|ADDITIONAL\s+)?(?:DWELLING\s+|APARTMENT\s+)?(?:UNITS?|DWELLING UNIT|APARTMENTS?)', t)
        if m2 and re.search(r'DWELLING|APARTMENT', t):
            return True, 'adds_units_text'
        if re.search(r'ACCESSORY DWELLING|\bADU\b|GARAGE (IN)?TO .*DWELLING|TO BE RENOVATED TO A DWELLING UNIT|CONVERTING FIRST FLOOR TO ONE APARTMENT|INTO SENIOR LOFTS|TO RESIDENTIAL|TO APARTMENTS|INTO APARTMENTS|TO (?:\d+ )?DWELLING UNITS|TO R-2', t):
            return True, 'conversion_to_residential_text'
        return False, 'no_residential_target'
    fr = CONV_FROM_RES.search(t)
    src = fam_units(t[fr.start(1):fr.start(1) + 30]) if fr else None
    if re.search(r'(FROM|CONVERT\w*|CONVERSION OF)\s+(AN?\s+|THE\s+)?(EXISTING\s+)?(COMMERCIAL\s+)?(GROUP HOME|NURSING|PERSONAL CARE|ROOMING|COMMUNITY HOME)', t):
        return False, 'group_quarters_to_household_dwelling'
    if src is not None:
        return (target > src), ('adds_units_%s_to_%s' % (src, target)) if target > src else 'reduces_or_same_units'
    if target >= 2:
        return True, 'target_%d_units_source_unstated' % target
    if re.search(r'(FROM|CONVERT\w*|CONVERSION OF)\s+(AN?\s+|THE\s+)?(EXISTING\s+|FORMER\s+)?(\S+\s+){0,6}?(COMMERCIAL|CHURCH|SCHOOL|OFFICE|STORE|RETAIL|WAREHOUSE|GARAGE|MIXED|BAR|RESTAURANT|CLUB|RECTORY|CONVENT|FUNERAL|BOILER|INDUSTRIAL|VACANT|SALON|MEDICAL)', t):
        return True, 'nonresidential_to_single_family'
    return False, 'target_single_family_source_unstated_or_residential'

def parse_dt(s):
    if not s: return None
    try:
        return datetime.datetime.fromisoformat(s[:19]).date()
    except Exception:
        return None

def durations(a):
    try:
        w = json.loads(a.get('workflows') or '{}').get('workflow', [])
    except Exception:
        w = []
    if isinstance(w, dict): w = [w]
    issue = parse_dt(a.get('issue_date'))
    if issue is None:
        iss = [parse_dt(s.get('DATECOMPLETED')) for s in w if s.get('PROCESSNAME') == 'Issue Permit' and s.get('OUTCOME') == 'Issued']
        iss = [x for x in iss if x]
        issue = min(iss) if iss else None
    ds = []
    for s in w:
        for k in ('DATECOMPLETED', 'SCHEDULEDSTARTDATE'):
            d = parse_dt(s.get(k))
            if d and d.year >= 2000:
                ds.append(d)
    start = None
    if ds:
        cand = [d for d in ds if (issue is None or d <= issue)]
        start = min(cand) if cand else None
    return start, issue, len(w)

OPEN = {'Applicant Revisions', 'Application Incomplete', 'Application Finalization', 'In Review', 'Reviews Paused', 'Submitted', 'Ready For Issue', 'Amendment Review', 'Amendment Applicant Revisions'}
CLOSED_NOT_ISSUED = {'Withdrawn', 'Denied', 'Cancelled', 'Void', 'Closed'}

def dedupe(feats):
    best = {}
    for f in feats:
        a = f['attributes']; rid = a['record_id']
        k = (1 if a.get('issue_date') else 0, a['objectid'])
        if rid not in best or k > best[rid][0]:
            best[rid] = (k, f)
    return [v[1] for v in best.values()]

agol_by_id = {}
for f in agol:
    agol_by_id[f['attributes']['USER_PERMITNUMBER']] = f

ctx_by_parcel = collections.defaultdict(list)
for c in ctx:
    if re.search(r'NEW|CONSTRUCT', (c.get('work_desc') or '').upper()) and DWELL_STRONG.search((c.get('work_desc') or '').upper()) and c['type'] in ('Zoning Development Review Application', 'Building & Development Application', 'BUILDING', ''):
        ctx_by_parcel[c['parc_num']].append(c)

records, excluded = [], collections.Counter()
excluded_examples = collections.defaultdict(list)

def conv_target_text(desc):
    t = re.sub(r'\s+', ' ', desc or '').upper()
    m = CONV_TARGET.search(t)
    if not m: return None
    seg = t[m.start(1):m.start(1) + 150]
    return seg if DWELL_STRONG.search(seg) else None

def add(a, geom, kind, src_label, target_text=None):
    rid = a['record_id']
    desc = re.sub(r'\s+', ' ', a.get('work_desc') or '').strip()
    au = None
    if rid in agol_by_id:
        au = agol_by_id[rid]['attributes'].get('USER_NUMBEROFUNITS')
    if not desc and rid in wprdc and (wprdc[rid].get('work_description') or '').strip():
        desc = wprdc[rid]['work_description'].strip()
    context_used = None; c = None
    if rid in MANUAL_EXCLUDE:
        excluded['manual_exclude'] += 1; excluded_examples['manual_exclude'].append(rid); return
    typ, n, conf, rule = classify(target_text or desc, a.get('property_type'), au, kind)
    if target_text and typ:
        rule = 'target_segment:' + rule
    if kind == 'conversion' and re.search(r'GARAGE\s+(IN)?TO\s+(AN?\s+)?(SINGLE\s+)?(FAMILY\s+)?(DWELLING|APARTMENT|UNIT)', desc.upper()):
        typ, n, conf, rule = 'adu', 1, 'med', 'kw_garage_converted_to_dwelling'
    if rid in MANUAL_TYPOLOGY:
        typ, n, conf, rule = MANUAL_TYPOLOGY[rid]
    if typ is None and (not desc or rule == 'generic_building_no_use_stated') and ctx_by_parcel.get(a.get('parc_num')):
        yr = lambda x: int((re.search(r'(20\d\d)', x) or re.search('(2000)', '2000')).group(1))
        near = [c for c in ctx_by_parcel[a['parc_num']] if abs(yr(c['record_id']) - yr(rid)) <= 3 and c['record_id'] != rid]
        c = sorted(near, key=lambda c: c['record_id'])[-1] if near else None
    if typ is None and c is not None:
        typ2, n2, conf2, rule2 = classify(c['work_desc'], a.get('property_type'), au, kind)
        if typ2:
            typ, n, conf, rule = typ2, n2, conf2, rule2
            conf = 'low'; rule = 'parcel_context:' + rule; context_used = c['record_id']
            desc = '[%s; same-parcel %s] %s' % ('no description' if not desc else 'generic: ' + desc[:80], c['record_id'], re.sub(r'\s+', ' ', c['work_desc']).strip())
    if typ is None:
        excluded[kind + ':' + rule] += 1; excluded_examples[kind + ':' + rule].append(rid); return
    start, issue, nsteps = durations(a)
    status = a.get('status') or ''
    if issue:
        censored = False; days = (issue - start).days if start else None; elapsed = None
    elif status in CLOSED_NOT_ISSUED:
        censored = False; days = None; elapsed = None
    else:
        censored = True; days = None; elapsed = (PULL_DATE - start).days if start else None
    lon = lat = None
    if geom and geom.get('x') is not None:
        lon, lat = geom['x'], geom['y']
    elif rid in wprdc and wprdc[rid].get('longitude'):
        lon, lat = float(wprdc[rid]['longitude']), float(wprdc[rid]['latitude'])
    ut = desc.upper()
    records.append(dict(
        permit_id=rid, source=src_label, record_kind=kind, permit_type=a.get('type'),
        property_type=a.get('property_type'), parcel_id=a.get('parc_num'), address=(a.get('address') or '').strip(),
        start_date=start.isoformat() if start else None, issue_date=issue.isoformat() if issue else None,
        status=status, typology=typ, units=n, agol_units=au, classification_confidence=conf, classification_rule=rule,
        phase_flag=bool(PHASE.search(ut)), days_to_issue=days, days_elapsed_if_open=elapsed, censored=censored,
        ospi_neighborhood=a.get('neighborhood'), work_desc=desc[:300], lon=lon, lat=lat,
        total_proj_value=a.get('total_proj_value')))

for f in dedupe(ospi_new):
    add(f['attributes'], f.get('geometry'), 'new_construction', 'ospi_h')
conv_seen = 0
for f in dedupe(ospi_conv):
    a = f['attributes']
    if a['record_id'] in {r['permit_id'] for r in records}: continue
    ok, why = conversion_adds_units(a.get('work_desc'))
    if not ok:
        excluded['conversion:' + why] += 1; continue
    n0 = len(records)
    add(a, f.get('geometry'), 'conversion', 'ospi_h', target_text=conv_target_text(a.get('work_desc')))
    if len(records) > n0:
        records[-1]['classification_rule'] = 'conversion(' + why + '):' + records[-1]['classification_rule']
        if records[-1]['classification_confidence'] == 'high' and 'source_unstated' in why:
            records[-1]['classification_confidence'] = 'med'

ids = {r['permit_id'] for r in records} | {f['attributes']['record_id'] for f in ospi_new}
for pid, f in agol_by_id.items():
    if pid in ids: continue
    at = f['attributes']; u = at.get('USER_NUMBEROFUNITS')
    cr = at.get('USER_COMMERCIALORRESIDENTIAL')
    if cr == 'Commercial' and not (u and u >= 2):
        excluded['agol:commercial_0_or_1_units'] += 1; continue
    if u and u >= 1:
        typ, conf, rule = bucket(u), 'med', 'agol_numberofunits'
    else:
        typ, conf, rule = 'unknown', 'low', 'agol_residential_units_0'
    g = f.get('geometry') or {}
    cd = at.get('USER_COMPLETEDDATE')
    records.append(dict(
        permit_id=pid, source='agol_dev_construction_v2', record_kind='new_construction', permit_type='BUILDING (legacy)',
        property_type=cr, parcel_id=at.get('USER_PARCELNUMBER'), address=(at.get('USER_ADDRESSABLEOBJEFORMATTEDAD') or '').strip(),
        start_date=None, issue_date=None, completed_date=cd.replace('/', '-') if cd else None,
        status='Completed', typology=typ, units=u if u else None, agol_units=u, classification_confidence=conf,
        classification_rule=rule, phase_flag=False, days_to_issue=None, days_elapsed_if_open=None, censored=False,
        ospi_neighborhood=at.get('Neighborhood'), work_desc='', lon=g.get('x'), lat=g.get('y'), total_proj_value=at.get('USER_TOTALPROJECTVALUE')))

# spatial joins
zon = [f for f in load('zoning.geojson')['features'] if f['geometry']]; hoods = [f for f in load('hoods.geojson')['features'] if f['geometry']]
zg = [shape(f['geometry']) for f in zon]; hg = [shape(f['geometry']) for f in hoods]
zt = STRtree(zg); ht = STRtree(hg)
def join(tree, geoms, feats, key, p):
    idx = tree.query(p, predicate='intersects')
    if len(idx):
        return feats[idx[0]]['properties'][key], 'within'
    j = tree.nearest(p)
    d = geoms[j].distance(p) * 111000 * 0.76
    if d <= 60:
        return feats[j]['properties'][key], 'nearest_%dm' % round(d)
    return None, 'none'
for r in records:
    if r['lon'] is None:
        r['zon_new'] = r['neighborhood'] = None; r['join_note'] = 'no_point'; continue
    p = Point(r['lon'], r['lat'])
    r['zon_new'], zj = join(zt, zg, zon, 'zon_new', p)
    r['neighborhood'], hj = join(ht, hg, hoods, 'hood', p)
    r['join_note'] = 'zoning:%s;hood:%s' % (zj, hj)

pc = collections.Counter(r['parcel_id'] for r in records if r['parcel_id'])
byp = collections.defaultdict(list)
for r in records:
    r['same_parcel_n'] = pc.get(r['parcel_id'], 0) if r['parcel_id'] else None
    if r['parcel_id']: byp[r['parcel_id']].append(r)
for r in records:
    flag = None
    if r['permit_id'].startswith('BDA-') and r['start_date']:
        kids = [x for x in byp.get(r['parcel_id'], []) if x['permit_id'].startswith('BP-') and (x['start_date'] or '') >= r['start_date']]
        if kids: flag = 'bda_umbrella_with_%d_child_bp' % len(kids)
    if flag is None and r['phase_flag']:
        flag = 'phase_or_partial_scope_permit'
    if flag is None and r['classification_rule'].startswith('parcel_context'):
        flag = 'repeat_application_same_parcel'
    r['overlap_flag'] = flag

# write geojson
FIELDS = ['permit_id', 'source', 'record_kind', 'property_type', 'parcel_id', 'address', 'start_date', 'issue_date', 'completed_date', 'status',
          'typology', 'units', 'agol_units', 'classification_confidence', 'classification_rule', 'phase_flag', 'zon_new', 'neighborhood',
          'days_to_issue', 'days_elapsed_if_open', 'censored', 'same_parcel_n', 'overlap_flag', 'join_note', 'work_desc']
feats = []
for r in sorted(records, key=lambda r: r['permit_id']):
    if r['lon'] is None: continue
    props = {k: r.get(k) for k in FIELDS}
    feats.append(dict(type='Feature', geometry=dict(type='Point', coordinates=[round(r['lon'], 6), round(r['lat'], 6)]), properties=props))
gj = dict(type='FeatureCollection', name='permits-new-residential', crs=dict(type='name', properties=dict(name='urn:ogc:def:crs:OGC:1.3:CRS84')), features=feats)
json.dump(gj, open(os.path.join(OUT, 'permits-new-residential.geojson'), 'w'), separators=(',', ':'))

def pct(xs, q):
    xs = sorted(xs)
    if not xs: return None
    k = (len(xs) - 1) * q; f = int(k); c = min(f + 1, len(xs) - 1)
    return round(xs[f] + (xs[c] - xs[f]) * (k - f), 1)

def km_median(rs):
    obs = [(r['days_to_issue'], 1) for r in rs if r['days_to_issue'] is not None]
    obs += [(r['days_elapsed_if_open'], 0) for r in rs if r['censored'] and r['days_elapsed_if_open'] is not None]
    if not obs: return None
    obs.sort(key=lambda x: (x[0], -x[1]))
    s = 1.0; atrisk = len(obs); i = 0
    while i < len(obs):
        t = obs[i][0]; d = 0; c = 0
        while i < len(obs) and obs[i][0] == t:
            d += obs[i][1]; c += 1 - obs[i][1]; i += 1
        if atrisk and d:
            s *= 1 - d / atrisk
        atrisk -= d + c
        if s <= 0.5: return t
    return None

TYP_ORDER = ['single_detached', 'single_attached', 'two_unit', 'three_unit', 'multi_unit_4_19', 'multi_unit_20plus', 'multi_unit_size_unknown',
             'senior', 'assisted_living', 'other_group', 'adu', 'unknown']
rows = []
for grp in ('zon_new', 'neighborhood'):
    g = collections.defaultdict(list)
    for r in records:
        g[(r['typology'], r.get(grp) or '(unjoined)')].append(r)
    for (typ, key), rs in sorted(g.items(), key=lambda kv: (TYP_ORDER.index(kv[0][0]), kv[0][1])):
        d = [r['days_to_issue'] for r in rs if r['days_to_issue'] is not None]
        rows.append(dict(
            group_by=grp, group_value=key, typology=typ, n=len(rs),
            n_with_timeline=sum(1 for r in rs if r['source'] == 'ospi_h'),
            n_issued=sum(1 for r in rs if r['issue_date']), n_censored=sum(1 for r in rs if r['censored']),
            n_legacy_agol_no_dates=sum(1 for r in rs if r['source'] != 'ospi_h'),
            median_days_to_issue=pct(d, .5), p75_days_to_issue=pct(d, .75), km_median_days=km_median(rs),
            n_days_known=len(d), units_sum_known=sum(r['units'] for r in rs if r['units']),
            n_units_known=sum(1 for r in rs if r['units']),
            n_high_conf=sum(1 for r in rs if r['classification_confidence'] == 'high'),
            n_conversions=sum(1 for r in rs if r['record_kind'] == 'conversion'),
            n_parcels=len({r['parcel_id'] for r in rs if r['parcel_id']}),
            n_overlap_flagged=sum(1 for r in rs if r['overlap_flag']),
            first_year=min((r['start_date'] or r['issue_date'] or r.get('completed_date') or '9999')[:4] for r in rs),
            last_year=max((r['issue_date'] or r['start_date'] or r.get('completed_date') or '0000')[:4] for r in rs)))
with open(os.path.join(OUT, 'permits-by-typology-district.csv'), 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

stats = dict(n_records=len(records), n_features=len(feats), excluded=dict(excluded),
             by_source=collections.Counter(r['source'] for r in records), by_kind=collections.Counter(r['record_kind'] for r in records),
             by_typology=collections.Counter(r['typology'] for r in records), by_conf=collections.Counter(r['classification_confidence'] for r in records),
             censored=sum(r['censored'] for r in records), issued=sum(1 for r in records if r['issue_date']),
             joins=collections.Counter(r['join_note'] for r in records), no_zon=sum(1 for r in records if not r['zon_new']),
             hood_mismatch=sum(1 for r in records if r['neighborhood'] and r['ospi_neighborhood'] and r['neighborhood'].lower() != r['ospi_neighborhood'].lower()),
             phase=sum(r['phase_flag'] for r in records), neg_days=sum(1 for r in records if r['days_to_issue'] is not None and r['days_to_issue'] < 0),
             overlap=collections.Counter((r['overlap_flag'] or 'none').split('_with_')[0] for r in records),
             no_start=sum(1 for r in records if r['source'] == 'ospi_h' and not r['start_date']))
json.dump(dict(stats=stats, excluded_examples=excluded_examples), open(os.path.join(SCR, 'stats.json'), 'w'), indent=1, default=str)
json.dump(records, open(os.path.join(SCR, 'records.json'), 'w'), default=str)
print(json.dumps(stats, indent=1, default=str))
