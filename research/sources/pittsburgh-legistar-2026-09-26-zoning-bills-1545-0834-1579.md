# Pittsburgh City Council (Legistar): Bills 2025-1545, 2026-0834, 2025-1579. Records and key text

Accessed 2026-09-26 through the Legistar Web API (`https://webapi.legistar.com/v1/pittsburgh/`) and the attachments on `pittsburgh.legistar1.com`. The API responses were queried and inspected directly. Staff names, emails and councilmember names have been removed, and people are referred to by role. Vote tallies are counts only.

Endpoints used:
- `matters?$filter=MatterFile eq '<file>'`
- `matters/{MatterId}/histories`
- `matters/{MatterId}/attachments`
- `matters/{MatterId}/versions`
- `matters/{MatterId}/texts/{TextId}`
- `events/{EventId}/eventitems`
- `eventitems/{EventItemId}/votes`
- `events?$filter=EventDate ge datetime'2026-09-15'`

---

## 1. Bill 2025-1545 (MatterId 31504). "Housing Needs Assessment Bill"

- **Type/status:** Ordinance. MatterStatusName **"Held In Council"**. MatterPassedDate **null**. MatterEnactmentNumber **null**. MatterVersion **2**. Body: Committee on Land Use and Economic Development. Requester: City Council. Intro date 2025-02-21. Agenda date 2025-07-15. Last modified 2026-09-24T19:55Z.
- **Sponsors** (from the 9/23/26 minutes): four councilmembers.
- **Current title (v2), abridged:** "Ordinance amending the Pittsburgh Code, Title Nine - Zoning … Chapter 902 … to add Inclusionary Zoning and Zoning; Article III … to add a sunset clause to 907.04.A IZ-O, Inclusionary Housing Overlay District; … 915.07, Performance Points System; … Chapter 912 Accessory Uses and Structures; … Chapter 914 Parking Loading and Access; … Chapter 916 …; Chapter 922 … to remove minimum off-street parking from the Zoning Code; … Chapter 925, Measurements; and Chapter 926, Definitions. (Public Hearing held 9/10/25) (Sent to the Planning Commission for a Report & Recommendation on 10/15/25) (Report & Recommendation received on 6/12/26) (Public Hearing held 9/23/26)"
- **v1 title differences** (text id 33051): v1 also covered "Chapter 903 Residential Zoning Districts, to amend minimum lot sizes", and v1 would **remove** 907.04.A IZ-O. v2 (text id 33906) drops the lot-size piece and **adds a sunset clause** to IZ-O instead.

### Action history (API `histories`)

| Date | Body | Action | Result | Tally (counts) |
|---|---|---|---|---|
| 2025-07-15 | City Council | Read and referred (to Land Use & Economic Development) | n/a | n/a |
| 2025-07-23 | Standing Committees | Held for Cablecast Public Hearing | Pass | n/a |
| 2025-09-10 | Committee on Hearings and Policy | Public Hearing Held | n/a | n/a |
| 2025-10-15 | Standing Committees | Referred for Report and Recommendation (to Planning Commission) | Pass | voice |
| 2025-10-15 | Standing Committees | AMENDED BY SUBSTITUTE | Pass | 5 Aye – 4 No – 0 Abstain |
| 2026-07-29 | Standing Committees | Held for Cablecast Public Hearing | Pass | n/a |
| 2026-09-23 | Committee on Hearings and Policy | Public Hearing Held | n/a | n/a |

- There is **no "Affirmatively Recommended", "Passed Finally" or "Signed by the Mayor" entry** as of 2026-09-26.
- 2025-1545 is **not an item** on the Standing Committees agenda for 2026-09-30 (event 12089 eventitems checked) or on the City Council agenda for 2026-09-29 (event 12093).

### Attachments
- 2025-1545 Cover Letter (docx). Dated Feb 18, 2025, from the Zoning Administrator. It lists the Planning Commission's 1/29/25 conditions.
- Housing Needs Assessment PC Decision 2025-01-29 (pdf)
- Housing Needs Assessment Text Amendments Hearing Report (pdf)
- Summary 2025-1545 (docx). The fiscal impact statement reads: "Implements … accessory dwelling units (ADU), inclusionary zoning (IZ), parking reform and minimum lot size reform". Total cost $0.
- 2025-1545 VERSION 2 PLEASE USE FOR FULL TEXT (pdf, 145 pp)
- 2025-1545 Report and Recommendation from Planning Commission "June 2025" (pdf). The file was uploaded 2026-06-12 and the letter inside is dated June 11, **2026**, so the "2025" in the file name appears to be a typo.
- 2025-1545 Planning Commission Recommendations to be Amended by Substitute from June 2 2026 (pdf)

### Planning Commission Report & Recommendation (letter dated June 11, 2026). Verbatim excerpts
> "Legislation amending the Pittsburgh Zoning Code regarding parking requirements, accessory dwelling units, and affordable housing bonuses was referred back to the City Planning Commission for its report and recommendation on October 15, 2025. The Planning Commission held a public hearing on the proposed legislation on June 5, 2026." [Note: the decision page says Meeting/Decision Date June 2, 2026.]

> "the Planning Commission made a positive recommendation to Council on 2025-1545 with the conditions that the legislation be amended by substitute with the attached text, along with the two additional conditions:
> 1. Both the payment in lieu of for parking and the payment in lieu for affordable units not be legislated in the code, in regards to those dollar amounts, but rather be designed and accepted annually as part of the fee schedule determined by the Zoning Administrator with City Council.
> 2. The affordability period for the voluntary program only, not for the mandatory program, is set to 20 years, and that the mandatory program stays unchanged."

> "Upon conclusion of the public hearing required to be held by City Council, the bill may be enacted with five affirmative votes."

> "120 days from June 2, 2026 is September 30, 2026."

Findings of Fact (hearing report, June 2, 2026), excerpts:
> "1. The City of Pittsburgh engaged HR&A Consultants to conduct a comprehensive Housing Needs Assessment (HNA) as an update to the 2017 HNA … The findings, published in January 2022 …"

> "4. On March 4, 2025, Council Bill 2025-1579 was introduced at City Council that moved the provisions of the minimum lot size reform out of 2025-1545. … approved at City Council on May 5, 2025, and signed by the Mayor on May 7, 2025." [Note: the Legistar history shows the final passage on 2025-05-06.]

> "5. … October 15, 2025, the bill was heard at City Council Standing Committee and was Amended by Substitute. The bill was then referred back to the Planning Commission, because it was substantively different … The amended version kept the provisions for Accessory Dwelling Units and Parking Reform but replaced the City-wide Inclusionary Zoning provisions with an Affordable Housing Bonus program."

> "7. Accessory Dwelling Units (ADUs). … allow ADUs by-right on any lot where a primary use is a residential use, Community Center use or Religious Assembly use. The update allows a maximum of two ADUs per zoning lot containing a residential use, with each ADU permitted to be up to two stories and 30 feet in height. For lots with a community center or religious assembly use, there is no limit to the number of ADUs, although developments with more than 10 units will be subject to Site Plan Review."

> "8. Parking Requirement. … a) Removal of Parking Minimums for all uses/districts b) Reworking of Parking Maximums i. Changed from specific use types to broader use categories ii. Parking Maximum tiers set by access to frequent transit rather than zoning districts c) To exceed the Parking Maximums, option to pay into Mobility Trust Fund d) Requirement for Transportation Demand Management (TDM) for developments above a certain size threshold"

> "9. Affordable Housing Bonus Program – as amended by Substitution at City Council. … removes the requirement for affordability but allows residential projects extra density if affordable housing is provided, except in areas in the existing Inclusionary Zoning Overlay (IZ-O). a. … minimum of 20 units … and 10 percent of units must be affordable. b. Rental units … no more than 50 percent AMI and be affordable for 20 years. c. For sale … no more than 80 percent AMI and resale prices may increase 2 percent per year. d. Bonus is up to 30 additional feet of height and 2 FAR, except for projects already eligible for 915.07 Performance Points … e. Off-site units are permitted, with 12 percent required. f. Payment in Lieu of $25 per square foot … g. Requires City Planning to provide City Council a report on the program within two years"

> "11. Accessory Dwelling Unit. In the version to be Amended by Substitution, there is one change proposed to the ADU section. It maintains the maximum height but removes the restriction on stories."
> "12. Parking Reform. … remove the delayed start date for the TDM program."
> "13. Affordable Housing Bonus. Staff is recommending an Amendment by Substitution to simplify the AHBP … apply the existing system citywide. a. Expands the districts eligible to use Affordable Housing Performance Points - RM, NDO, LNC, NDI, UNC, UI, and select GPR subdistricts. b. Updates districts already eligible … RIV, UPR, UC-MU, UC-E, and R-MU. c. Includes both on-site and off-site affordable housing options. d. Modifies points for deeper affordability levels. e. Adds a payment-in-lieu option as an alternative compliance pathway."

### 2025-10-15 Standing Committee minutes (event 11721)
"A motion was made that this matter be AMENDED BY SUBSTITUTE. The motion carried by the following vote: Aye: 5 … No: 4 … Abstain: 0" (names removed).

### 2026-09-23 Committee on Hearings and Policy minutes (event 12056, 2 pp)
Title block "Bill 2025-1545 Inclusionary Zoning and Parking Minimums". Action: "Public Hearing Held to the Committee on Land Use and Economic Development". No vote was recorded.

---

## 2. Bill 2026-0834 (MatterId 33576). EO 2026-01 Phase One zoning amendments

- **Type/status:** Ordinance. **"Held In Council"**. Body: Committee on Hearings. Requester: **Department of City Planning**. Intro 2026-08-28. Agenda 2026-09-01. Version 1. Title ends "(Public Hearing scheduled for 10/13/26)".
- **Title (abridged):** amends Chapters 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 915, 916, 918, 919, 920, 921, 922, 925 and 926.

### Action history
| Date | Body | Action | Result |
|---|---|---|---|
| 2026-09-01 | City Council | Read and referred (to Land Use & Economic Development) | n/a |
| 2026-09-09 | Standing Committees | Held for Cablecast Public Hearing | Pass |
| (scheduled) 2026-10-13 | Committee on Hearings and Policy | event 12083, item listed, no agenda file yet | n/a |

### Attachments
- Cover Letter (docx), July 31, 2026, from the Zoning Administrator: "the first phase of the Mayor's Executive Order No. 2026-01 … a comprehensive 60-day review of all aspects of the permitting system … The Planning Commission, at its meeting on July 28, 2026, made a positive recommendation … 120 days from July 28, 2026 is November 25, 2026."
- EO First Phase Zoning Code Text Amendment Hearing Report 2026-07-28 (pdf)
- Planning Commission Decision (docx). Decision date July 29, 2026, positive recommendation.
- Summary (fiscal impact $0): "the first phase of zoning code updates coming from Executive Order No. 2026-01"

### Hearing report Findings of Fact (July 28, 2026), excerpts
> "1. On January 6, 2026 [the Mayor] introduced Executive Order No. 2026-01 to add predictability and efficiency to the City's permitting system."
> "3. This Zoning Text and Map Amendment is the first phase of that zoning reform. Two additional zoning reform phases … 4. … the second phase will be a comprehensive overhaul of the Zoning Code. Then, the third and final phase will be adopting the new Zoning Code and implementing a system for regular maintenance"
> "b. Simplify height requirements … removes the redundant limit for height-in-stories while keeping height-in-feet and the redundant Floor Area Ratio (FAR) while keeping height in feet, lot coverage, and setback requirements. ii. Simplify the height in feet requirements of the Urban Neighborhood Commercial (UNC) zoning district from multiple base options to a single base option."
> "e. Remove Chapter 913, all of which is either redundant or obsolete."
> "f. … reduce the existing setback requirement from 15 feet to 10 feet for larger scale development projects that are adjacent or across a Way from a residential or hillside district, or 5 Ft. if across a street."
> "h. Rezone a portion of the Golden Triangle Subdistrict D to subdistrict C"
> "8. a. Chapter 903 Residential Zoning Districts to remove the limit on stories, limiting maximum height to measured in feet. b. Chapter 904 … ii. To remove FAR requirements in all districts. iii. 904.04 Urban Neighborhood Commercial District … setting the district-wide base height maximum to 60 feet, previously limited to only within 1,500 feet of a Major Transit Facility. … Special Exception for Height in the UNC district, remove the story limit but maintains the maximum height of 85 feet. iv. 904.07 Urban Industrial … replaces the height in stories with the height in feet and maintains a maximum FAR."
> "12. b. Chapter 916 … Primary structures subject to Residential Compatibility Standards must be setback: 1. 10 feet from any property line abutting R1D, R1A, R2, R3, or Hillside … 2. 10 feet … across a Way … 3. 5 feet … across a Street … ii. Height … limited to: 1. 40 feet when located within 25 feet of any property zoned R1D, R1A, R2, R3, or Hillside. 2. 55 feet when located within 26 to 50 feet … 3. 65 feet when located within 51 to 75 feet"
> "9. a. Chapter 906 … removes the View Protectional Overlay in its entirety" / "10. a. iii. Remove the Oakland Public Realm (908.03)"

---

## 3. Bill 2025-1579 = Ordinance 10 of 2025 (MatterId 31538). Minimum lot size

- **Status:** **"Passed Finally"**. MatterPassedDate 2025-05-06. MatterEnactmentDate 2025-05-06. **MatterEnactmentNumber "10"**. MatterDate2 2025-05-07 (signed). Intro 2025-03-03. Requester: City Council.
- **Title:** "Ordinance amending and supplementing the Pittsburgh Code of Ordinances, Title Nine, Zoning, Article Two, Base Zoning Districts, Chapter 903, Residential Zoning Districts, to reduce required minimum lot sizes. (Public Hearing held 4/23/25)"

### Action history
| Date | Body | Action | Result | Tally |
|---|---|---|---|---|
| 2025-03-04 | City Council | Read and referred | n/a | n/a |
| 2025-03-12 | Standing Committees | Held for Cablecast Public Hearing | Pass | n/a |
| 2025-04-23 | Committee on Hearings and Policy | Public Hearing Held | n/a | n/a |
| 2025-04-30 | Standing Committees | Affirmatively Recommended | Pass | 5 Aye, 1 No, 2 Abstain, 1 Out of Room |
| 2025-04-30 | Standing Committees | Held in Committee (motion to hold to 5/14/25) | **Fail** | 4 Aye, 5 No |
| 2025-05-06 | City Council | Passed Finally | Pass | 8 Aye, 1 Absent |
| 2025-05-07 | Mayor | Signed by the Mayor | n/a | n/a |

### Text changes (recovered from the RTF strike/underline in matter text 33085: ~~struck~~ → __added__)
| 903.03 subdistrict | Minimum Lot Size | Minimum Lot Size per Unit | Other |
|---|---|---|---|
| A Very Low-Density (VL) | ~~8,000 s.f.~~ → **6,000 s.f.** | row deleted (~~8,000 s.f.~~) | n/a |
| B Low-Density (L) | ~~5,000 s.f.~~ → **3,000 s.f.** | row deleted (~~3,000 s.f.~~) | n/a |
| C Moderate-Density (M) | ~~3,200 s.f.~~ → **2,400 s.f.** | row deleted (~~1,800 s.f.~~) | n/a |
| D High-Density (H) | ~~1,800 s.f.~~ → **1,200 s.f.** | row deleted (~~750 s.f.~~) | n/a |
| E Very-High Density (VH) | row deleted (~~1,200 s.f.~~) | row deleted (~~400 s.f.~~) | RM max height ~~no limit~~ → **180 ft.** |

Sections 2–5 turn the density definitions in 926 into "Reserved": High-Density Residential (750 du/acre), Low Density Residential (3,000 sf/unit), Moderate-Density Residential (1,800 sf/unit), Very High-Density Residential (400 sf/unit) and Very Low-Density Residential (8,000 sf/unit).

---

## Related matters seen while scanning events (not researched in depth)
- **2025-2224.** Site rezoning in Banksville to RP. Public hearing 9/17/26, affirmatively recommended 9/23/26, on the City Council agenda for 9/29/26.
- **2026-0892.** "Resolution adopting Plan Revision to the City of Pittsburgh's Official Sewage Facilities Plan for 929 Liberty Avenue". Requester: Department of Law. Status: In Standing Committee. On the 9/30/26 Standing Committees agenda. This is a live example of the Council-resolution step in the DEP Sewage Facilities Planning Module process.
