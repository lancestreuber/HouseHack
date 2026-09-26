# Sweep: Approval steps and triggers, OneStopPGH timelines, ZBA scrapability, 2026 reforms

**Round 2** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Pittsburgh approval pathway: rules table, ZBA data and computed timelines

Labels used below: **[V]** means I read it this session in a primary source or computed it myself. **[S]** means it comes from a secondary source or a search snippet. **[U]** means I couldn't verify it.

**Correction to your brief:** Chapter 915 does not hold the rules for steep slopes, landslide-prone areas, undermined areas or floodplains. Those rules are the Chapter 906 overlays: FP-O, LS-O, UM-O and SS-O. eCode360, elaws and Municode all blocked or timed out. zoneomics.com/code/pittsburgh-PA (chapters 1–9) could be curled and read in full; how current that copy is is [U].

### 1. Rules table

| Step | Trigger (parcel + project attributes) | Decides | Duration | Fee / source |
|---|---|---|---|---|
| Zoning review, by-right | Every building permit (BDA through OneStopPGH) | Zoning staff | ~11 days median for BDA review, July 2026 (PublicSource, 9/23/26) [S]; my medians are in §3 | pittsburghpa.gov fee schedule |
| Site Plan Review §922.04 | New construction or renovation of **multi-unit with 4 or more units**; any construction in the **H (Hillside) district**; NDO/LNC/NDI/UNC/P lot ≥2,400 sf; HC/UI/GI lot ≥8,000 sf; parking >10 spaces or >2,500 sf in listed districts | Zoning Administrator. May forward to Planning Commission within 14 days | +2–6 wks [U] | §922.04 [V] |
| Administrator Exception §922.08 | Minor relief listed per section (e.g., parking alternatives §914.07.G, sustainable bonus §915.04) | Zoning Administrator | Decision due **21 days** after a complete application | [V] |
| Special Exception §922.07 / Variance §922.09 | Use listed as SE in the district table; any dimensional or use noncompliance (setback, height, lot size, parking) | **ZBA** (3 members) | ≥21-day posted notice, then hearing (first 3 Thursdays of each month), then decision within **45 days** after the record closes. Realistic total 2–4 months | **$400** on top of zoning fees. Appeal to Common Pleas within 30 days. Approval expires in 1 yr (ZBA handout, Dec 2024) [V] |
| Conditional Use §922.06 | Use listed as CU in the district | Planning Commission recommends (within 45 days of its hearing). **City Council** holds its hearing within 45 days of PC action and decides. **7 of 9 votes** needed if PC recommended denial | Minimum ~3–5 months | [V] |
| Project Development Plan §922.10 | District-specific (RIV, GT, UC, SP, LNC bonus, etc.). Snippet: new construction or addition **≥15,000 sf GFA**, or structured parking with ≥40 spaces | Planning Commission. Meets every other Tuesday; briefing, then Hearing & Action ~2 wks later | 2–4 months [U] | §922.10 [V, applicability]; 15k threshold [S]; PC handout [V] |
| **SS-O Steep Slope** §906.08 | Land with natural slope **≥25%** | **Planning Commission review for all development**. 21-day notice; hearing within 60 days of a complete application; decision within 45 days. Standards include a **50 ft setback from the ridgeline or base** of the SS-O boundary. No outright ban | +2–4 months | [V]. Whether SS-O is actually mapped citywide is [U] |
| LS-O Landslide-prone §906.04 | Parcel in the mapped LS-O layer and the work involves excavation, fill or vegetation removal | Zoning Administrator (evidence from a registered professional's field investigation); PLI Building Chief approves the construction and land-operations plans | + geotech study, weeks | [V] |
| UM-O Undermined §906.05 | Parcel in UM-O, new construction or enlargement | Zoning Administrator plus Building Chief. **Single-unit dwelling allowed if >100 ft of overburden and no subsidence history.** Anything larger or heavier, or overburden <100 ft, is **prohibited until a site investigation shows it is safe** | + study | [V] |
| FP-O Floodplain §906.02 | FEMA A/AE zone | Zoning plus PLI Floodplain Permit (494 of these in OneStop). Lowest floor at or above the regulatory flood elevation. **Floodway: no new construction unless a hydraulic analysis shows no rise AND a DEP permit is issued** (effectively no-build) | + weeks | [V] |
| §915.02 Environmental Standards (all slopes) | Cut or fill slopes >25% need a geotech report and terracing; retaining walls ≤10 ft; tree survey if site >¼ acre (10,890 sf); replace trees ≥12" DBH | Zoning Administrator | — | [V]. The "40% no-disturbance / 30% max disturbance of 25–40%" rule from a search snippet was **not** in the text I read [U] |
| RCO Development Activities Meeting | Any project needing a **public hearing** AND one of: ≥2,400 sf new or expanded; **≥4 new units**; ≥10 parking stalls; use variance; map amendment; PDP/PLDP/FLDP/MDP/IMP; HRC or Art Commission application | RCO hosts, city staff help | Must be held **≥30 days before the first hearing**; RCO gives 10 days' notice | DCP DAM page (updated 5/5/26) [V/S] |
| Historic Review Commission | Parcel in a city historic district or a city landmark. Covers new construction, demolition, exterior work | HRC (monthly), or staff over the counter | Application due ≥13 business days before the hearing | **$50** COA filing (Apply for Historic Review page) [S] |
| Art Commission (Civic Design) | Work on city property or in the ROW; DAM trigger | Commission | [U] | [U] |
| City stormwater (SWM site plan, Ch. 1303) | **Earth disturbance ≥10,000 sf OR ≥5,000 sf new impervious**; ≥5,000 sf disturbance in RIV with PDP or site plan | DCP / PLI / PWSA standards | [U] | Stormwater Permit page [S] |
| PWSA Water & Sewer Use Application | Anything bigger than **1 single-family unit**, any subdivision, any multi-unit | PWSA | [U] | pgh2o.com [S] |
| DEP Sewage Facilities Planning Module | Depends on net flow and lot history. **No planning exemptions since 2011 (ALCOSAN consent decree)**, so most net-new-unit projects need one | PWSA, ALCOSAN, DCP, Law, **City Council**, DEP | **3–6 months** | pgh2o.com [S] |
| ACCD Chapter 102 E&S / NPDES | **Disturbance ≥1 acre** | Allegheny County Conservation District | [U] | $500 plus $100 per disturbed acre [S] |
| DOMI | Curb cut, ROW or opening work | DOMI | Computable from OneStop (1,606 curb-cut records); I did not compute it | — |
| EZ Permit (pilot) | Residential single-scope work only: windows/doors, non-load-bearing walls, roof, siding, electrical, HVAC. **Excluded: floodplain, historic district or landmark, condemned, multiple scopes** | PLI | **1 business day** (vs. 15–30) | No extra fee (EZ Permits page) [V]. Does not apply to new housing |

### 2. Parking (Ch. 914) [V]
Current minimums (Table 914.02.A):

| Use | Minimum | Maximum |
|---|---|---|
| Single-unit detached | 1 per unit | 4 per unit |
| Single-unit attached | 0 | 4 per unit |
| Two-unit, three-unit, multi-unit | 1 per unit | 2 per unit |

§914.04 reductions:
- **100%:** Downtown, Lower Hill SP-11, Uptown PRD, UC-E.
- **50%:** Riverfront districts, UC-MU and R-MU.
- **East Liberty (50%) and North Side (25%) exclude residential.**

Other relief:
- Bicycle-parking swap: up to 30% of spaces.
- Shared parking: Administrator Exception.
- Transit-stop and transportation-management reductions: Special Exception.

If the parking minimum isn't met, the rule should output "Variance / ZBA".

### 3. OneStopPGH OSPI_H: computed timelines [V]
**Data pulled.** 30,775 records, fully paginated (all ZDR + BDA records). No usable top-level application date: `create_date` and `submitted_date` are empty, and ZDR records have no `issue_date`. The `workflows` JSON, however, carries dated steps: Application Submitted, Completeness Check, Perform Review (with "Revisions Required" outcomes), Issue Permit. My start date is the earliest workflow date; my end date is Issue Permit.

**Legacy zoning series.** "Zoning Development Review Application" (DCP-ZDR-*) runs 2019 to mid-2024 and is effectively dead after that. Zoning review now appears to be merged into the BDA [inference].

**ZDR, 2019–24 (n=17,129):**

| p25 | median | p75 | p90 |
|---|---|---|---|
| 9 d | 25 d | 68 d | 168 d |

The median was stable at 22–28 days every year.

**BDA, 2024–26, to issue:**

| Group | n | median | p75 | p90 | median revision cycles |
|---|---|---|---|---|---|
| Residential alteration | 6,872 | 8 d | 34 d | 95 d | 0 |
| **Residential new construction** | 74 | **153 d** | 246 d | 340 d | **5** |
| Commercial new construction | 157 | 104 d | 245 d | — | — |

- **Censoring caveat on residential new construction:** only 74 of 210 records have been issued. 78 are sitting in "Applicant Revisions", so the true median is longer. The work descriptions are mostly single-family (78), three-unit (21) and two-family (5).
- **All BDAs by start year:** median 25 d (2024), 21 d (2025), 9 d (2026). The 2026 figure is also biased down by censoring. It is directionally consistent with PublicSource's 27→11 days.

Script and data: `<scratch>/{pull.py,an2.py,ospi.json}`. The OSPI records have a `parc_num` field, so these timelines can be joined to parcels.

### 4. ZBA data scrapability
- **Documents are well structured [V].** I parsed one decision PDF (1137 Pennsylvania Ave). It has labeled fields: Date of Hearing, Date of Decision (44 days apart here), Zone Case "N of YYYY", Address, Lot/Block (parcel ID), Zoning District, Ward, Neighborhood, Request, **Application BDA-xxxx**, and a table of Variance/SE with Section number and requirement. It ends in a "Decision:" paragraph (approved with conditions). This is regex-friendly, and the BDA number joins directly to OSPI.
- **Locating the files:** all PDFs sit under `pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/`. Filenames are inconsistent (`bda-2024-07715-1137-pennsylvania-ave-zba-decision.pdf`, `bda-2026-05389_5743-walnut-st-zba-2026-9-3.pdf`), so you can't guess them; crawl the per-meeting pages instead. The Sept 3, 2026 meeting page lists 5 cases with PDF links plus the agenda. Some of those PDFs may be staff reports rather than decisions [U]. At least one "/Decisions" subpage was empty.
- **Volume:** roughly 5 cases per meeting × ~36 meetings a year ≈ 150–200 a year [estimate, U].
- **Blocker:** the site's CDN returns **403 to curl** (Akamai), but WebFetch retrieved the pages. A scraper will need browser-like requests; whether that works is untested.
- **Stats:** PublicSource Board Explorer shows only members and cadence (first 3 Thursdays; Mitinger chair since 2006), with no approval statistics. I **could not find Lenze et al. 2024**. I found no published ZBA approval rates.

### 5. 2026 reforms and bill status
- **EO 2026-01** (Jan 6): 60-day department review. The March 9 plan has 3 phases and 20+ Phase I actions: fast lane, virtual inspections, AI completeness checks, and **the city scheduling its own public-input meetings instead of RCOs** (WESA) [S]. I found no ordinance change to the DAM rules yet; the DAM page, last updated 5/5/26, still describes RCO-hosted meetings [V].
- **Phase I zoning amendment, Bill 2026-0834:** went to Planning Commission July 14/28, 2026. **Council public hearing is Oct 13, 2026.** It removes obsolete language, revises dimensional standards, simplifies height rules and adjusts residential compatibility standards [V]. The Planning Commission vote is [U].
- **Bill 2025-1545** (citywide ADUs by right, no parking minimums, optional Affordable Housing Bonus): Planning Commission gave a positive recommendation June 2, 2026, and the Council hearing was Sept 23, 2026. **I found no record of a Council vote as of 9/26.** The Engage hub still shows it as pending, and WESA said a vote would come "sometime after" [S/V]. If it passes, parking minimums drop out of the variance triggers.

Sources: [ZBA handout](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf), [PC handout](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-planning-commission-2024.pdf), [DAM](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Programs/RCO/DAM), [EZ Permits](https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/Permitting/EZ-Permits-Pilot), [Stormwater Permit](https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/Permitting/Stormwater-Permit), [PWSA SFPM](https://www.pgh2o.com/developers-contractors-vendors/permits/dep-sewage-facilities-planning-module), [PublicSource permits](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/), [WESA reforms](https://www.wesanews.org/politics-government/2026-03-09/pittsburgh-permitting-zoning-reforms), [Oct 13 hearing](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-October-13th-2026), [Sept 23 hearing](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026), [ZBA Sept 3 2026](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-September-3-2026), [zoneomics code mirror](https://www.zoneomics.com/code/pittsburgh-PA), [ACCD](https://www.accdpa.org/npdes).
