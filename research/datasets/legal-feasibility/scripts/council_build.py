import json, re, collections, datetime, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
M = json.load(open("matters_cat.json"))
H = json.load(open("hist.json"))
V = json.load(open("votes.json"))
USE_TABLE_SRC = "/Users/lancestreuber/Desktop/HouseHack/.worktrees/20260926-research/research/sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md"


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


DEN = r"(?:VL|L|M|H|VH)"
CODE_RE = re.compile(
    r"\b(R1D-" + DEN + r"|R1A-" + DEN + r"|R2-" + DEN + r"|R3-" + DEN + r"|RM-" + DEN +
    r"|UC-MU|UC-E|R-MU|RIV-(?:RM|MU|NS|GI|IMU)|GT-[A-E]|SP-\d+|GPR-?[ABC]|UPR-?[AB]|OPR-?[A-D]"
    r"|LNC|UNC|NDO|NDI|HC|GI|UI|EMI|AP|CP|RP|PO|RT-?\d|RSD-?\d|RSA-?\d|RM-?\d|RP-?\d)\b")
NAME_MAP = [
    (r"urban neighborhood commercial", "UNC"), (r"local neighborhood commercial|\bLN\.", "LNC"),
    (r"neighborhood office", "NDO"), (r"neighborhood industrial", "NDI"),
    (r"highway commercial", "HC"), (r"general industrial(?! subdistrict)", "GI"),
    (r"urban industrial", "UI"), (r"educational[/ -]?medical|education medical", "EMI"),
    (r"urban center mixed", "UC-MU"), (r"urban center employment", "UC-E"),
    (r"residential[- ]+mixed use", "R-MU"), (r"\bparks?\b(?! and open)", "P"), (r"parks? and open space", "P"),
    (r"hillside", "H"), (r"commercial planned unit", "CP"), (r"residential planned unit", "RP"),
    (r"mixed-use planned unit|residential/commercial planned", "AP"),
    (r"golden triangle", "GT"), (r"specially planned", "SP"),
]


def codes_in(seg):
    found = []
    for m in CODE_RE.finditer(seg):
        c = m.group(1)
        c = re.sub(r"^GPR-?", "GPR-", c); c = "P" if c == "PO" else c; c = re.sub(r"^RM(\d)$", r"RM-\1", c)
        c = re.sub(r"^UPR-?", "UPR-", c); c = re.sub(r"^OPR-?", "OPR-", c)
        if c not in found:
            found.append(c)
    for pat, c in NAME_MAP:
        if re.search(pat, seg, re.I):
            if c in ("GT", "SP") and any(x.startswith(c) for x in found):
                continue
            if c not in found:
                found.append(c)
    return found


STOP_RE = re.compile(r"(?:,?\s+(?:certain|all that|all certain|a certain|a portion|the remainder|property|properties|parcels?|on property|in the|roughly|approximately|several|\d+ (?:separate )?parcels|two parcels|three|sixteen|3 parcels|a \d|and to amend)\b|;|\.\s|$)", re.I)
NAME_START = re.compile(r"[\"“(]*\s*(?:" + "|".join(p for p, c in NAME_MAP) + r"|Residential|Single|Multi|Two|Three|Grandview|Uptown|Oakland|Golden|Riverfront|Specially|Commercial|Educational|Mixed)", re.I)


def split_from_to(t):
    pairs = []
    chunks = re.split(r"\bfrom\b", t, flags=re.I)[1:]
    for ch in chunks:
        cut = None
        for m in re.finditer(r"\bto\s+(?:the\s+)?", ch, re.I):
            rest = ch[m.end():]
            if CODE_RE.search(rest[:25]) or NAME_START.match(rest) or re.match(r"[\"“(]*\s*[PH]\b", rest):
                cut = m; break
        if not cut:
            continue
        f = ch[:cut.start()]
        rest = ch[cut.end():]
        sm = STOP_RE.search(rest, 3)
        to = rest[:sm.start()] if sm else rest
        pairs.append((f, to))
    return pairs


TABLE = {}
def _load_table():
    cols = None
    for line in open(USE_TABLE_SRC):
        if line.startswith("Columns:"):
            cols = line.split(":", 1)[1].strip().split("|")
        elif cols and "|" in line and not line.startswith(("Source", "NOTE")):
            parts = line.rstrip("\n").split("|")
            TABLE[parts[0]] = dict(zip(cols[1:], parts[1:]))
_load_table()


def col_for(code):
    if re.match(r"^(R1D|R1A|R2|R3|RM)-(VL|L|M|H|VH)$", code): return code.split("-")[0]
    if code.startswith("GT"): return "GT"
    if code in ("NDO", "LNC", "NDI", "UNC", "HC", "GI", "UI", "UC-MU", "UC-E", "R-MU", "P", "H", "EMI", "RIV-RM", "RIV-MU", "RIV-NS", "RIV-GI", "RIV-IMU"): return code
    return None


def level(code):
    """By-right residential unit ceiling under TODAY's §911.02: 0 none, 1 single-unit, 2, 3, 4 = multi-unit."""
    if re.match(r"^RT-?\d", code): return 2
    if re.match(r"^RM-?\d$", code): return 4
    if re.match(r"^RS[DA]-?\d", code): return 1
    c = col_for(code)
    if c is None: return None
    for lv, use in ((4, "Multi-Unit Residential"), (3, "Three-Unit Residential"), (2, "Two-Unit Residential")):
        if TABLE[use].get(c) == "P": return lv
    if TABLE["Single-Unit Detached Residential"].get(c) == "P" or TABLE["Single-Unit Attached Residential"].get(c) in ("P", "P/S"): return 1
    return 0


def mu_code(code):
    c = col_for(code)
    if c is None: return "?"
    return TABLE["Multi-Unit Residential"].get(c) or "-"


ADDR_RE = re.compile(
    r"(?<![\w/-])(\d{1,5}(?:\s*[-/]\s*\d{1,5})?\s+(?:[NSEW]\.?\s+|North |South |East |West )?(?:\d{1,3}(?:st|nd|rd|th)|[A-Z][A-Za-z'\.]+)(?:\s+[A-Z][A-Za-z'\.]+)?\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Way(?: West| East)?|Boulevard|Blvd\.?|Drive|Dr\.?|Place|Pl\.?|Lane|Ln\.?|Terrace|Court|Ct\.?|Square|Highway|Pike))(?![A-Za-z])")
PARCEL_RE = re.compile(r"(?<![\w-])(\d{1,3}-[A-Z]-\d{1,4}(?:-[A-Z0-9]{1,4}){0,3})(?![\w-])")
BLOCKLOT_RE = re.compile(r"Block\s+(?:No\.?|Number|#)?\s*(\d{1,3})\s*-\s*([A-Z])\s*,?\s*(?:and\s+)?Lots?\s+(?:No\.?|Numbers?|#)?\s*(\d{1,4})", re.I)


def addresses(t):
    out = []
    for m in ADDR_RE.finditer(t):
        a = clean(m.group(1))
        if re.match(r"^\d+\s+(?:ft|feet|sq|cubic|stories|story|beds|students|parking|Primary|Secondary|Tertiary)", a, re.I):
            continue
        if a not in out:
            out.append(a)
    return out


def parcels(t):
    out = []
    for m in PARCEL_RE.finditer(t):
        p = m.group(1)
        if re.match(r"^(19|20)\d{2}-", p):
            continue
        if p not in out: out.append(p)
    for m in BLOCKLOT_RE.finditer(t):
        p = f"{int(m.group(1))}-{m.group(2).upper()}-{int(m.group(3))}"
        if p not in out: out.append(p)
    return out


TYPO = [
    ("student_housing_dormitory", r"dormitor|student housing|beds for student"),
    ("multi_suite_residential", r"multi-suite residential"),
    ("senior_elderly", r"housing for the elderly|senior (?:housing|living|apartments)|elderly"),
    ("assisted_living", r"assisted living"),
    ("personal_care", r"personal care"),
    ("community_home", r"community home"),
    ("custodial_care_group_residential", r"custodial care"),
    ("multi_unit", r"apartment|\bmulti-?family (?:housing|development|building)|\bdwelling units\b|residential units|condominium|\bmixed[- ]income\b"),
    ("single_or_townhouse", r"townho(?:use|me)|single-family homes|single family homes|rowhouse"),
    ("mixed_use_with_residential", r"mixed[- ]use (?:development|project|building)"),
]
UNITS_RE = re.compile(r"(\d[\d,]*)\s+(?:new\s+)?(?:dwelling|residential|housing|apartment|affordable|for-sale|rental)?\s*units\b", re.I)
BEDS_RE = re.compile(r"(\d[\d,]*)\s+(?:beds|residents|adult males|adolescent girls|students)\b", re.I)

STATUS = {
    "Passed Finally": "adopted", "Approved": "adopted",
    "Defeated": "failed", "Veto was Sustained": "failed",
    "Withdrawn": "withdrawn",
    "Died due to expiration of legislative council session": "expired_end_of_session",
    "Held In Council": "held", "Held in Standing Committee": "held", "In Standing Committee": "pending",
    "Reported from Standing Committee": "pending", "To Be Presented": "pending", "TABLED": "tabled",
    "Read, Received and Filed": "filed_not_action", "Meeting Held": "filed_not_action",
}
FINAL_ACTIONS = ("Passed Finally", "Passed pursuant", "Defeated", "Vetoed", "Overridden", "Withdrawn", "TABLED", "Died due", "Returned Unsigned", "Approved", "Adopted")


def days(a, b):
    try:
        return (datetime.date.fromisoformat(b) - datetime.date.fromisoformat(a)).days
    except Exception:
        return ""


rows = []
for m in M:
    mid = str(m["MatterId"])
    if mid not in H:
        continue
    title = clean(m["MatterTitle"])
    text = H[mid]["text"] or ""
    body = clean(text.split("..body")[-1]) if "..body" in text else clean(text)
    both = title + " " + body
    cat = m["_cat"]
    tl = title.lower()
    sub = ""
    if cat == "conditional_use":
        if "transfer of development rights" in tl: sub = "cu_transfer_of_development_rights"
        elif re.search(r"922\.06i|direct that a new application", tl) or not re.search(r"(?:to|for|by)\s", tl): sub = "cu_other_or_procedural"
        else: sub = "cu_use_approval"
    elif cat == "map_amendment":
        if re.search(r"specially planned district by creating|creating a new district|adding a new specially planned|add(?:ing)? sp-\d", tl): sub = "sp_district_created"
        elif re.search(r"various zoning district classifications|remapping", tl): sub = "area_wide_remap"
        elif re.search(r"apply for a grant", tl): sub = "text_amendment_other"
        elif re.search(r"overlay|ipod|inclusionary|accessory dwelling unit overlay", tl): sub = "overlay_map_and_text"
        elif re.search(r"from|rezone", tl): sub = "site_rezoning"
        else: sub = "text_amendment_other"
        if re.search(r"^(ordinance amending and supplementing the pittsburgh code, title nine, zoning code, article v|ordinance amending and supplementing the pittsburgh code of ordinances, title nine - zoning, chapter 915)", tl): sub = "text_amendment_other"
    elif cat == "sp_pud":
        if re.search(r"accepting the dedication|vacation", tl): sub = "sp_street_dedication"
        elif re.search(r"communication", tl): sub = "communication"
        else: sub = "sp_text_amendment"

    pairs = split_from_to(title) or (split_from_to(body) if cat == "map_amendment" else [])
    fr, to = [], []
    for f, t_ in pairs:
        for c in codes_in(f):
            if c not in fr: fr.append(c)
        for c in codes_in(t_):
            if c not in to: to.append(c)
    if sub == "sp_district_created":
        for c in re.findall(r"SP-\d+", title):
            if c not in to: to.append(c)
    zoned = []
    if cat == "conditional_use":
        for mz in re.finditer(r"zoned\s*[\"“”]?\s*([A-Z0-9\-]+)|to be zoned\s+([A-Z0-9/\- ]+)", title):
            z = (mz.group(1) or mz.group(2) or "").strip(" /")
            z = re.split(r"[ /]", z)[0]
            if z and z not in zoned: zoned.append(z)

    effect = ""
    pair_strs, mu_changes = [], []
    if cat == "map_amendment" and sub in ("site_rezoning", "sp_district_created"):
        verdicts = []
        for f, t_ in pairs:
            fc, tc = codes_in(f), codes_in(t_)
            if sub == "sp_district_created" and not tc:
                tc = re.findall(r"SP-\d+", title)
            for x in fc:
                for y in tc:
                    if x == y: continue
                    pair_strs.append(f"{x}>{y}")
                    mu_changes.append(f"{mu_code(x)}>{mu_code(y)}")
                    lx, ly = level(x), level(y)
                    if lx is None or ly is None: verdicts.append("special")
                    elif ly > lx: verdicts.append("up")
                    elif ly < lx: verdicts.append("down")
                    else: verdicts.append("same")
        vs = set(verdicts)
        if not verdicts: effect = "unparsed"
        elif "special" in vs: effect = "involves_district_not_in_911_02"
        elif vs <= {"up", "same"} and "up" in vs: effect = "increases_byright_residential_ceiling"
        elif vs <= {"down", "same"} and "down" in vs: effect = "decreases_byright_residential_ceiling"
        elif vs == {"same"}: effect = "same_residential_ceiling"
        else: effect = "mixed"

    descr = title if (cat == "conditional_use" and sub != "cu_transfer_of_development_rights") else both
    descr_noz = re.sub(r"(Residential\s+)?(Multi-Unit|Multi-Family|Single[- ]Unit|Two-Unit|Three-Unit|Two-Family|One-Unit)[^,;)]*?(District|Density|Residential)", " ", descr, flags=re.I)
    typos = [name for name, pat in TYPO if re.search(pat, descr_noz, re.I)]
    units = list(dict.fromkeys(u.replace(",", "") for u in UNITS_RE.findall(descr_noz)))
    beds = list(dict.fromkeys(b.replace(",", "") for b in BEDS_RE.findall(descr_noz)))

    if cat == "conditional_use":
        if typos and sub == "cu_use_approval":
            res = "group_quarters_use" if set(typos) <= {"student_housing_dormitory", "custodial_care_group_residential"} else "residential_use"
        elif sub == "cu_transfer_of_development_rights":
            res = "tdr_dwelling_units" if re.search(r"dwelling units", both, re.I) else "tdr_unspecified"
        else:
            res = "non_residential"
    elif cat == "map_amendment":
        if sub in ("site_rezoning", "sp_district_created"):
            res = {"increases_byright_residential_ceiling": "enables_more_housing_byright",
                   "decreases_byright_residential_ceiling": "reduces_housing_byright",
                   "involves_district_not_in_911_02": "unclear_special_district",
                   "same_residential_ceiling": "no_change_in_residential_ceiling",
                   "mixed": "mixed_up_and_down"}.get(effect, "unparsed")
            if typos and res != "enables_more_housing_byright": res += "+text_mentions_housing"
        elif sub == "area_wide_remap": res = "area_wide_remap_mixed"
        elif sub == "overlay_map_and_text": res = "overlay"
        else: res = "not_a_map_change"
    else:
        res = "sp_text_or_other" + ("+text_mentions_housing" if typos else "")

    hs = sorted(H[mid]["histories"], key=lambda h: (h["MatterHistoryActionDate"] or "", h["MatterHistoryId"]))
    final = None
    for h in hs:
        if (h["MatterHistoryActionName"] or "").startswith(FINAL_ACTIONS):
            final = h
    if final is None and hs:
        final = hs[-1]
    case_law = any((h["MatterHistoryActionName"] or "").startswith("Passed pursuant to Case Law") for h in hs)
    vote_h = None
    for h in hs:
        if (h["MatterHistoryActionName"] or "").startswith(("Passed Finally", "Passed pursuant", "Defeated", "Overridden", "Vetoed")):
            vote_h = h
    tally = collections.Counter()
    vote_src = ""
    if vote_h is not None:
        vv = V.get(str(vote_h["MatterHistoryId"]))
        if isinstance(vv, list) and vv:
            for x in vv: tally[(x["VoteValueName"] or "unknown").strip()] += 1
            vote_src = f"eventitems/{vote_h['MatterHistoryId']}/votes"
        elif isinstance(vv, dict):
            vote_src = "votes_endpoint_http_500"
        else:
            vote_src = "no_roll_call_recorded"
    intro = (m["MatterIntroDate"] or "")[:10]
    fdate = (final["MatterHistoryActionDate"] or "")[:10] if final else ""
    passed = (m["MatterPassedDate"] or "")[:10]
    status = STATUS.get(m["MatterStatusName"], m["MatterStatusName"])
    end = passed if (status == "adopted" and passed) else (fdate if status in ("failed", "withdrawn", "expired_end_of_session", "tabled") else "")
    hearing = [h for h in hs if (h["MatterHistoryActionName"] or "").startswith("Public Hearing Held")]
    pc_ref = any("Report and Recommendation" in (h["MatterHistoryActionName"] or "") for h in hs)
    signed = [h for h in hs if (h["MatterHistoryActionName"] or "").startswith("Signed by the Mayor")]
    rows.append(dict(
        matter_id=m["MatterId"], file_number=m["MatterFile"], matter_type=m["MatterTypeName"],
        action_category=cat, action_subtype=sub, residential_relevance=res,
        title=title, intro_date=intro, status_legistar=m["MatterStatusName"], status=status,
        final_action=(final["MatterHistoryActionName"] or "").strip() if final else "", final_action_date=fdate,
        passed_date=passed, mayor_signed_date=(signed[-1]["MatterHistoryActionDate"] or "")[:10] if signed else "",
        days_intro_to_final=days(intro, end) if intro and end else "",
        passed_pursuant_to_case_law=case_law,
        public_hearing_held_date=(hearing[-1]["MatterHistoryActionDate"] or "")[:10] if hearing else "",
        referred_to_planning_commission_in_history=pc_ref,
        vote_action=(vote_h["MatterHistoryActionName"] or "").strip() if vote_h else "",
        vote_date=(vote_h["MatterHistoryActionDate"] or "")[:10] if vote_h else "",
        votes_aye=tally.get("Aye", 0) if tally else "",
        votes_nay=(tally.get("No", 0) + tally.get("Nay", 0)) if tally else "",
        votes_abstain=tally.get("Abstain", 0) if tally else "",
        votes_absent_or_other=sum(v for k, v in tally.items() if k not in ("Aye", "No", "Nay", "Abstain")) if tally else "",
        votes_other_detail="; ".join(f"{k}={v}" for k, v in sorted(tally.items()) if k not in ("Aye", "No", "Nay", "Abstain")),
        vote_source=vote_src,
        from_districts="|".join(fr), to_districts="|".join(to), from_to_pairs="|".join(pair_strs),
        multi_unit_code_change_today="|".join(mu_changes), byright_ceiling_effect_today=effect,
        cu_district_zoned="|".join(zoned),
        housing_typology="|".join(typos), units_stated="|".join(units), beds_or_residents_stated="|".join(beds),
        addresses="|".join(addresses(title) or addresses(body)), parcels="|".join(parcels(title) or parcels(body)),
        legistar_api_url=f"https://webapi.legistar.com/v1/pittsburgh/matters/{m['MatterId']}",
        legistar_web_url=f"https://pittsburgh.legistar.com/gateway.aspx?M=F&ID={m['MatterGuid']}",
    ))
rows.sort(key=lambda r: (r["intro_date"], r["file_number"]))
json.dump(rows, open("rows.json", "w"), indent=0)
print(len(rows))
print(collections.Counter((r["action_category"], r["action_subtype"]) for r in rows))
print(collections.Counter(r["residential_relevance"] for r in rows))
