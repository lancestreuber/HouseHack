# Special districts: residential use permissions, use definitions, ADU status

**One line:** Fills the `unknown` rows in `typology-district-matrix.csv` for the SP, PUD (AP/CP/RP), public-realm (GPR, UPR) and Golden Triangle districts, plus MTOBOR. Also records what separates each residential use, and where ADUs stand.
**As of:** 2026-09-26. eCode360 banner: "Includes legislation through 09-16-2026." This is working research, not legal advice.

## Files

| File | Rows | What |
|---|---|---|
| `special-district-residential-permissions.csv` | 315 (21 `zon_new` × 15 uses) | `zon_new,use,code,section,source_url,confidence,note`. `code` ∈ P, A, S, C, not_permitted, per_plan, unknown, not_city_jurisdiction |
| `use-definitions.csv` | 19 | `use,definition_summary,threshold,section,source_url,confidence` |

## Method

1. Read the code of record on eCode360 using the **print view** of whole articles (Article IV = Ch. 908–910, Article V = Ch. 911–913, Article IX = Ch. 925–926) and the §911.02 table. The print view includes each section's history line.
2. Parsed the §911.02 HTML table by cell position (25 district columns; header `…EMI, GT, [blank DT column], RIV…`). Where a special district adopts another district's use list (GT, LNC, HC), the codes come from that §911.02 column.
3. Read each district's own use text and applied it on top of the adopted column.
4. Coding rules:
   - A use that is not in a closed list ("for only the uses listed") is `not_permitted`.
   - `per_plan` = no general table. The Planning Commission approves uses through a unit development plan (PUDs).
   - **Where subdistricts differ, `code` shows the most permissive subdistrict.** The note starts with `SUBDISTRICT-DEPENDENT` and gives each subdistrict's code, because `zon_new` does not identify subdistricts. This differs from the README's P/S rule (stricter code) because here the parcel is in one subdistrict or the other, and the map cannot tell which.
5. Legistar web API (curl + certifi) was used for ADU history. The City ArcGIS overlay layer was queried for an ADU overlay polygon.

## Access log (2026-09-26)

| Source | Result |
|---|---|
| Claude-in-Chrome extension | **Not connected**. Unusable. |
| Browserbase | Session started. `extract`/`observe` failed with "Insufficient Balance". Unusable. |
| curl to eCode360 | 403 (Cloudflare "Just a moment…") |
| **Local Playwright + installed Google Chrome, headless** | **Worked.** Loaded TOC `ecode360.com/45474054` and print views for guids 45475424 (Art. IV), 45476514 (Art. V), 45479638 (Art. IX) and 45476524 (§911.02). The SP-10 Appendix PDF (`/attachment/336977/PI6865-009a SP-10 Appendix.pdf`) downloaded through the same browser context. |
| zoneomics mirror | Not needed. **No row uses `low_mirror`.** |
| Legistar web API | Worked: matters 22870 (2018-0558), 31504 (2025-1545 v1/v2 text), plus title searches |
| Legistar attachments (legistar1.com) | 2018-0558 summary and Planning Commission report downloaded (HTTP 200) |
| `PGHWebZoningOverlays/FeatureServer/0` | Worked. No ADU overlay value among distinct `overlay` values. |

Section guids (print view `https://ecode360.com/print/PI6865?guid=<id>`): §908.02 45475462 · §908.04 45475575 · §909.01 45475623 · §909.02 45476287 · §910.01 45476380 · §911.02 45476524 · §911.04 45476528 · §912.08 45477942 · §926.01 45479737.

## Per-district summary (P = by right; A = Administrator Exception; S = ZBA Special Exception; C = Conditional Use)

| District | Rule source | Residential summary |
|---|---|---|
| **GT-A…GT-E** | §910.01.C.1(a): uses per §911.02 GT column; history ends Ord. 27-2022 | Same for all five subdistricts. SUD/SUA **not permitted**. 2-, 3-, multi-unit P. Elderly Ltd A; **Elderly General not permitted**. Assisted Living A/B/C P. PCR Small A, Large S. Community Home S. Multi-Suite Ltd/Gen P. GT-A limits street-level direct-access space to retail/restaurant (§910.01.F.2). |
| **UPR-A** | §908.04.D.1.b: GT uses, except Elderly Ltd/Gen **P** | As GT, but both elderly uses are P. The text says "Chapter 903 for the GT", a drafting slip (GT is Ch. 910). |
| **UPR-B** | §908.04.D.2.b: LNC uses, except Elderly Ltd/Gen **P** | LNC column: SUD–multi P; AL-A A; AL-B/C S; PCR Small A; Large S; CH S; MSR Ltd A, Gen S |
| **GPRA** | §908.02.D.1 | By right: SUD, SUA, 2-unit. Group uses **unknown**: exceptions "same as … Chapter 903 for the RT-3" district, a district name that does not exist in the current code |
| **GPRB, GPRC** | §908.02.D.2, D.3 | By right: SUD, SUA, 2-, 3-, multi-unit. Group uses **unknown** (exceptions refer to obsolete "RTS-3"). §911.04 standards for AL-C, PCR Small and MSR Ltd name "Grandview Public Realm Districts", so these uses were contemplated there. |
| **SP-1** | §909.01.F.1 (closed list) | Multi-unit P only |
| **SP-4** | §909.01.I.1–4 (closed lists, 4 subdistricts) | Multi-unit P in all four; everything else not permitted |
| **SP-5** | §909.01.J.1(a)–(c) | SUA and multi-unit P (subdistricts A–C alike) |
| **SP-8** | §909.01.O.4: GT uses "as amended from time to time" + additions | GT column, plus SUA P and Elderly General **A** (§922.08) |
| **SP-9** | §909.01.P.1 (5 subdistricts) | A: multi only. B: SUD, SUA, 2-, 3-, multi. C/D/E: multi, AL A/B/C, Elderly L/G, MSR L/G, PCR S/L. Community Home nowhere. |
| **SP-10** | §909.01.Q.3.A + SP-10 Appendix Table 1 (Ord. 2-2019; 68-2021) | Uses by **density band**, not by §911.02 type: Residential Low (25–38 du/acre, only HG Blocks 62–63), Medium (39–62), High (63+). Dwelling types coded P as an interpretation (`unconfirmed` except multi-unit); care/group uses `unknown` |
| **SP-11** | §909.01.R.3 | Subdistrict 1 (closed list): SUA, 2-, 3-, multi, Elderly Ltd P; Elderly Gen S. Subdistricts 2–3: GT list plus Elderly L/G P, SUA P, PCR Small S (conflicts with GT's A; flagged). SUD not permitted anywhere. |
| **RP** | §909.02.D.2, D.6 | **Defers to the approved unit development plan** (`per_plan`) for all dwelling types. Elderly (either size) **C**. Assisted Living **S**. Community Home listed as both C and S (internal conflict, coded S). PCR and Multi-Suite not permitted. |
| **CP** | §909.02.E.2 | **Defers to the approved plan.** Planning Commission may approve any use allowed in HC. Result: no dwelling types; elderly, AL-A/B, PCR and Community Home are `per_plan`; AL-C and Multi-Suite not permitted. |
| **AP** | §909.02.F.2 | **Defers to the approved plan.** Planning Commission may approve any RP or CP use. Result: every use `per_plan` except Multi-Suite (not permitted). |
| **MTOBOR** | none | `not_city_jurisdiction` (Mount Oliver Borough) |

**Explicit PUD statement:** AP, CP and RP have no general use table. Uses are permitted only as approved by the Planning Commission in a unit development plan with a recorded improvement subdivision site plan (§909.02.D.2, E.2, F.2). A parcel's buildable residential types therefore depend on its own plan, and they are coded `per_plan`. The SP districts do have code-listed uses, but development in them is also governed by a Planning-Commission-approved Final Land Development Plan (§909.01.B.3).

## Use definitions: what separates them (details in `use-definitions.csv`)

- **Elderly Limited vs General:** fewer than 30 units vs 30 or more (§911.02). Both are subject to §911.04.A.35: common dining and social rooms, 40% ground-level usable open space, and transit access. The parent term "Housing for the Elderly" has no separate definition in §911.02 or §926.01.
- **Assisted Living A/B/C:** patient beds under 9, 9–17, and 18 or more. Lot area is 5,000 sf plus 500 sf (A) or 300 sf (B, C) per sleeping room over 3. One per building. **800 ft spacing** from other assisted living, group residence or group care facilities (§911.04.A.66).
- **Personal Care Residence Small vs Large:** Small has 3–10 persons, 8 clients maximum. Large has up to 19 persons, 17 clients maximum. Both need **800 ft spacing** from other personal care or health-care facilities, and 80% of clients must be 62 or older or disabled (§911.04.A.95A/B).
- **Community Home:** more than 8 unrelated disabled persons. Eight or fewer is a "Family" (§926.01). The limit is 1 disabled person per bedroom on average. There is no fixed spacing rule, only a "saturation" finding (§911.04.A.84).
- **Multi-Suite Limited vs General:** fewer than 8 sleeping rooms vs 8 or more. Every 2 beds count as 1 sleeping room. Parking is at least 1 space per 2 sleeping rooms in RM, Grandview and LNC (§911.04.A.41).
- **Interim Housing:** has no size threshold. The Approving Body may waive underlying zoning if §911.04.A.101 is met.
- **SUD, SUA, 2-, 3- and multi-unit:** 1 detached unit; 1 attached unit on its own lot; 2 or 3 units in one building; 4 or more in one building. SUA in R1D is by right if the lot is 35 ft wide or less, SE if wider (§911.04.A.69A).

## ADUs: status today

- **ADU is not in the §911.02 use table.** The only ADU provision is **§912.08 "Accessory Dwelling Unit Overlay District"** (Ord. 32-2018, eff. 9-10-2018; Council bill 2018-0558, Legistar 22870, passed 2018-09-04). §912.08 allows ADUs only inside a mapped overlay. An ADU must be under 800 sf, with 1 per lot and the owner living on site. Leases must be at least 30 days. Height is capped at 2 stories / 30 ft. ADUs are exempt from minimum lot size and parking, and are allowed only on lots whose structure has no more than one legal dwelling unit (§912.08.D–E).
- **Where it applied:** a **Garfield** pilot of 1,493 parcels in the predominantly R1-zoned part of Garfield (Zone Change Petition No. 804, Planning Commission report dated April 3, 2018, attached to 2018-0558).
- **Is it still in force? Unconfirmed; it appears to have lapsed.** §912.08.B makes an interim overlay last 24 months, i.e. to about 2020-09-10. No Legistar matter making it permanent was found in a title search for "912.08", "Dwelling Unit Overlay" or "accessory dwelling". `PGHWebZoningOverlays` has no ADU overlay value (queried 2026-09-26). The §912.08 text is still in the code.
- **Other ADU matters:**
  - Resolution 2022-0672 (passed 2022-09-06) calls for exploring ADU/DADU expansion.
  - Bill 2024-0984 is "Not Introduced". It would amend §912.08 and others for Fair Housing Act consistency.
- **Pending Bill 2025-1545 (Held In Council; Planning Commission substitute recommended June 2, 2026; hearing held 9/23/26):**
  - It rewrites §912.08 (v1 Section 38, v2 Section 36). The overlay, interim and adoption language would go, and ADUs would be allowed **on any lot whose primary use is Residential, Community Center or Religious Assembly**.
  - Size would be **up to 1,000 sf** (from under 800 sf).
  - The accessory relationship would change from "a single dwelling unit" to a "primary use".
  - Lots with a residential use could have **up to 2 ADUs**. Community Center and Religious Assembly lots would have no cap, with Site Plan Review above 10 units.
  - Height would be 2 stories / 30 ft, with garage height counted. The Planning Commission substitute keeps 30 ft but drops the story limit.
  - ADUs would be exempt from Ch. 916. Some garage conversions and above-garage units in setbacks would not need an Administrator Exception.
  - Otherwise ADUs would follow §912.04.
  - Source: Legistar plain-text extraction of v2, where struck and added text cannot be told apart. The owner-occupancy and 30-day-lease clauses appear in the extraction but seem to belong to the replaced block. **Unconfirmed until the redline is read visually.**

## Caveats

- Code version: eCode360 "legislation through 09-16-2026", accessed 2026-09-26. History lines:
  - §909.01 ends with Ord. 19-2025 (eff. 7-22-2025).
  - §908.04 ends with Ord. 13-2024.
  - §909.02 ends with Ord. 40-2005.
  - §911.02 and §911.04 end with Ord. 18-2026 (eff. 6-11-2026).
  - §926.01 ends with Ord. 10-2025.
- **Pending Bill 2026-0834** (Council hearing 10/13/26) amends Ch. 901–913, 915–916, 918–922, 925 and 926, including 908–911 and 926. Its hearing report says it would remove the Oakland Public Realm (§908.03), rezone part of GT-D to GT-C, and remove Ch. 913. Every row here may change if it passes.
- **Pending Bill 2025-1545** amends Ch. 908, 909, 911, 912 and 926 as well as ADUs and parking. Its Affordable Housing Performance Points would extend to "select GPR subdistricts" and update UPR.
- The §911.02 column alignment (GT, LNC, HC) comes from our HTML cell-position parse, which matches the earlier round-5 screenshot check. The blank-header second "DT" column is empty for every residential row.
- Grandview's reference to obsolete district names (RT-3, RTS-3) is a real gap in the code text. Treat GPR group-use rows as unresolved until the Zoning Administrator's reading is known.
- Rows flagged "legal review": SP-11 PCR Small (S vs A) and RP Community Home (S vs C).
