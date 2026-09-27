import re, json, collections, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
FILES = [("min2020.txt", "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24/planning-commission-minutes-2020.pdf"),
         ("min2021.txt", "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2021.pdf"),
         ("min2022.txt", "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2022.pdf"),
         ("min2023.txt", "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2023.pdf"),
         ("min2024.txt", "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2024.pdf"),
         ("pc-min-2025.txt", "https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/approved-planning-commission-minutes-2025.pdf")]
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE_HDR = re.compile(r"(?:Meeting Minutes of\s+(?P<a>(?:" + MONTHS + r") \d{1,2}, 20\d\d))|(?:^\s*(?P<b>(?:" + MONTHS + r") \d{1,2}, 20\d\d)\s*(?:at\s*)?[\d:]*\s*(?:[AaPp]\.?[Mm]\.?)?,?\s*Meeting called to order)", re.M)
OUTCOME = re.compile(r"(MOTION\s+CARRIED|MOTION\s+FAILED|^\s*CARRIED\b|^\s*FAILED\b|MOTION\s+DENIED|MOTION\s+TABLED)", re.M | re.I)
CASE = re.compile(r"(DCP-(?:ZDR|MPZC|PDP|PAP)-\s?20\d\d-\s?\d+|ZDR-?20\d\d-?\d+)")
RES = re.compile(r"dwelling unit|residential unit|apartment|\bunits\b|housing|townho|senior|condominium|residential building|multi-unit|multifamily|multi-family|dormitor|student housing", re.I)
UNITS = re.compile(r"(\d[\d,]*)\s*(?:\(\d+\)\s*)?(?:new\s+)?(?:dwelling|residential|apartment|housing|affordable|for-sale|rental)?\s*units\b", re.I)
out = []
for fn, url in FILES:
    t = open(fn).read()
    dates = [(m.start(), m.group("a") or m.group("b")) for m in DATE_HDR.finditer(t)]
    prev = 0
    for m in OUTCOME.finditer(t):
        chunk = t[prev:m.end()]
        prev = m.end()
        hdrs = list(re.finditer(r"(?m)^\s*(?:\d+\.\s*|Hearing and Action:\s*|Briefing and Action:\s*)(?:DCP-|ZDR)", chunk))
        if hdrs:
            chunk = chunk[hdrs[-1].start():]
        cases = list(dict.fromkeys(re.sub(r"\s", "", c) for c in CASE.findall(chunk)))
        if not cases or re.search(r"Approval of (?:the )?(?:Planning Commission )?(?:meeting )?minutes", chunk, re.I):
            continue
        d = [dd for pos, dd in dates if pos <= m.start()]
        date = d[-1] if d else ""
        # the operative motion text
        mm = re.search(r"(?:That the Planning Commission[^\n]*(?:\n[^\n]+){0,6})|(?:Motion:\s*[^\n]+)", chunk)
        motion = re.sub(r"\s+", " ", mm.group(0))[:400] if mm else ""
        verb = ""
        mpos = [x.start() for x in re.finditer(r"MOTION:|Motion:|That the Planning Commission", chunk)]
        full = chunk
        chunk = chunk[mpos[0]:] if mpos else chunk[-600:]
        if re.search(r"\bDENIES\b|Motion:\s*Den|recommends?\s+(?:a\s+)?(?:negative|denial|disapproval)|NEGATIVE RECOMMENDATION|Motion:\s*Negative", chunk, re.I): verb = "deny_or_negative_recommendation"
        elif re.search(r"\bCONTINUE|\bTABLED?\b|Motion:\s*(?:To\s+)?(?:Continu|Table|Defer|Postpone)|\bDEFER|POSTPONE", chunk, re.I): verb = "continue_or_table"
        elif re.search(r"recommends?\s+(?:(?:favorabl[ey]|positive(?:ly)?|affirmative(?:ly)?)\s+)?(?:approval|adoption)|positive recommendation|favorable recommendation|Motion:\s*(?:Positive|Favorable|Affirmative)?\s*Recommend", chunk, re.I): verb = "recommend_approval_to_council"
        elif re.search(r"\bAPPROVES?\b|\bApproved?\b|Motion:\s*Approv|GRANTS", chunk, re.I): verb = "approve"
        else: verb = "unclassified_motion_carried" if "CARRIED" in m.group(1).upper() else "unclassified"
        chunk = full
        kinds = set()
        for k, pat in [("PDP", r"Project Development Plan|\bPDP\b"), ("FLDP", r"Final Land Development Plan|\bFLDP\b"), ("PLDP", r"Preliminary Land Development Plan|Project Land Development Plan|\bPLDP\b"),
                       ("site_plan", r"Site Plan"), ("steep_slope_SSO", r"steep slope|SS-O"), ("conditional_use", r"Conditional Use"),
                       ("map_amendment", r"Map Amendment|rezon|Zoning Map"), ("text_amendment", r"Text Amendment"), ("IMP", r"Institutional Master Plan|\bIMP\b"),
                       ("master_development_plan", r"Master Development Plan|\bMDP\b"), ("PUD", r"Planned Unit Development|\bPUD\b|Specially Planned|\bSP-\d")]:
            if re.search(pat, chunk, re.I): kinds.add(k)
        head = re.sub(r"\s+", " ", chunk[max(0, chunk.find(cases[0]) - 10):][:300])
        units = list(dict.fromkeys(u.replace(",", "") for u in UNITS.findall(chunk)))
        outcome = re.sub(r"\s+", " ", m.group(1)).upper()
        nay = re.search(r"(?:OPPOSED|Opposed):\s*([^\n]*)", chunk)
        out.append(dict(source_file=url, meeting_date=date, cases="|".join(cases), case_types="|".join(sorted({re.sub(r"-?20\d\d.*", "", c) for c in cases})),
                        item_kinds="|".join(sorted(kinds)), residential_mention=bool(RES.search(chunk)), units_stated="|".join(units),
                        action=verb, outcome_marker=outcome, opposed=(nay.group(1).strip() if nay else ""), head=head, motion=motion))
json.dump(out, open("pc_items.json", "w"), indent=0)
c = collections.Counter()
for r in out:
    y = r["meeting_date"][-4:]
    c[(y, r["case_types"])] += 1
print(len(out)); print(sorted(c.items()))
print(collections.Counter((r["action"], r["outcome_marker"]) for r in out))
