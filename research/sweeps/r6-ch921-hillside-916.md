# Sweep: Nonconforming lots (Ch. 921), hillside standards, Ch. 916
Round 6 · 2026-09-26 · real browser

Sources saved:
- `sources/ecode360-2026-09-26-pittsburgh-921-nonconformities.md`
- `sources/ecode360-2026-09-26-pittsburgh-916-residential-compatibility.md`
- `sources/ecode360-2026-09-26-pittsburgh-hillside-development-standards.md`

## Answer: is a vacant lot below the district minimum lot size buildable by right?

**Not strictly "by right" (P). It is buildable for a single-unit house through an Administrator Exception, which the Zoning Administrator "shall approve", when all of the following hold:**
1. The lot is a legal lot of record: "a lot shown on an approved and recorded subdivision plat or a parcel shown on the Allegheny County Record Of Deed's records as a separate parcel" (§921.04). [read]
2. It "was vacant on the date which this code became applicable to it". [read]
3. It "is in separate ownership from abutting lots or parcels". [read]
4. The house complies "with all applicable dimensional requirements of the code to the extent practicable" (§921.04.A.1). [read]

Operative language (§921.04.A, verbatim): "the Zoning Administrator shall approve the use of the lot as an Administrator Exception for a single-unit residential use, or the Zoning Board of Adjustment shall approve, as a special exception, the lot for a conforming use permitted in the district".

So:
- **Single-unit house:** Administrator Exception (the "A" tier). It is mandatory ("shall approve") if the conditions are met. It is ministerial in effect, but it is a separate approval, not a plain P permit. [read]
- **Any other conforming use (two-unit, multi-unit where allowed):** ZBA special exception, which needs a hearing. §921.04.A.2 further limits this: if some uses or intensities would meet setbacks and others would not, "only the uses or intensities that would conform with the applicable setback requirements are permitted." [read]
- **Setbacks, height, and coverage still apply "to the extent practicable".** The chapter does not exempt a substandard lot from setbacks. A setback that cannot practicably be met falls into the "to the extent practicable" discretion. Otherwise it needs a variance. That second path is an inference, not stated in the text. [read]

**Merger / common ownership:** Ch. 921 has **no** rule that merges contiguous substandard lots in common ownership. The only merger language is §921.02.A.1(a)(2), which bars merging a lot with a nonconforming *use* to enlarge that use. [read] The ownership condition cuts the other way. §921.04.A covers only lots "in separate ownership from abutting lots or parcels". A substandard vacant lot whose owner also owns an abutting parcel **does not qualify** for the §921.04.A route. The code does not say what happens to such a lot: no merger, no alternative path. The practical reading is that it would need a variance (§922.09) or a lot consolidation. [inferred; not stated]

**Drafting defects to flag:**
- "on such date" in §921.04 has no antecedent date, so the relevant date is the date "this code became applicable to it". [read]
- §921.04 has no history line. [read]
- §921.06.A makes nonconformity rights "conditioned on the receipt of a valid Certificate of Occupancy". It is unclear how that applies to a vacant lot. [read]

## Findings by task

1. **Ch. 921 Nonconformities** [read]: full chapter (§921.01–.06) read in the print view. See the answer above. Nonconforming uses (§921.02) can expand only by ZBA special exception, capped at 15% (residential) or 25% (non-residential). The use is lost after 1 year of discontinuance (rebuttable).
2. **Hillside Development Standards** [inaccessible]: not codified on eCode360. The eCode360 full-text search for "hillside development" returns only §906.04. The zoning code calls them "the Planning Commission's Subdivision Regulations" (§926.01.179). Planning Commission minutes (2023 volume, posted 03-11-2025) say staff "presented the new subdivision regulations". That PDF did not render and was not read. **40% slope rule: still NOT FOUND**, so keep it out of the rules engine. [found] a related codified rule instead: **§905.02 H (Hillside) district**: min lot 3,200 sf, no setbacks, 40 ft / 3 stories, **"Maximum Area of Disturbance: 50% of total lot area"**, and Site Plan Review is required for building permits.
3. **Ch. 916 Residential Compatibility** [read]: height and setback rules are triggered for development in **RM-M/RM-H/RM-VH and all non-residential base districts** (and non-residential development in R districts). The trigger is being adjacent to, across the street from, or within 100 ft of R1D/R1A/R2/R3/H. Screening, noise, and lighting rules reach out to 200 ft. Height step-down: **40 ft / 3 stories within 50 ft; 50 ft / 4 stories at 51–100 ft; none beyond 100 ft.** Setbacks: 15 ft minimum interior side and rear (or the R district's setback if greater). Front setback matches the R district for the first 50 ft. Exempt: GT, Riverfront, and Planned Development districts. **Any development subject to Ch. 916 requires Site Plan Review (§922.04).** Single-unit houses in R1D/R1A/R2/R3 are not subject to Ch. 916.
4. **District PDP thresholds** [read]:
   - UC-MU (§904.08), UC-E (§904.09) and R-MU (§904.10): PDP (Planning Commission, §922.10) for new construction of **≥15,000 sf GFA**, additions of ≥15,000 sf, commercial structured parking of ≥40 spaces, and demolition of a primary structure of ≥15,000 sf or of ≥5 primary structures.
   - RIV (§905.04.C.3): PDP for **any new primary structure fully or partly within 200 ft of the river's Project Pool Elevation**, and for ≥15,000 sf GFA, ≥15,000 sf additions, or structured parking of ≥50 spaces. Other new primary structures in RIV get Site Plan Review. Existing single-family detached houses are exempt from Site Plan Review.
   - The source of the "15,000 sf / 40 spaces" figure that r5 could not find in §922.10 is these district chapters.
   - GT (Ch. 910) [not checked].

## Implications for scoring the 3,260 city lots
- **Do not score "lot area < §903.03 minimum" as unbuildable.** For a single-unit house it is an Administrator Exception pathway (A tier, "shall approve"). Score it as a small approval-friction penalty, not as a kill.
- **Add an ownership-adjacency flag.** If the parcel's owner also owns an abutting parcel, the §921.04.A route is unavailable. Lots in city, URA, or Land Bank inventories are a special case, because the same public owner often holds adjacent lots. Treat these as "consolidate or variance" and flag them rather than failing them. This needs owner-name joins on adjacent parcels.
- **Separate lot of record from vacant-since-code-date.** The data cannot prove the "vacant on the date this code became applicable" condition. Assume it is met for lots never built on. For lots vacant after a demolition, the demolished structure's history matters, so flag them as uncertain.
- **Anything above one unit on a substandard lot = ZBA special exception** (hearing, months). Score multi-unit on substandard lots in the ZBA tier.
- **Setbacks still bind "to the extent practicable".** Keep the buildable-envelope check (width minus side setbacks). Very narrow lots (for example under ~15 ft wide) remain practically constrained. Rate them as a penalty, not a legal bar.
- **H-zoned lots:** cap disturbance at 50% of lot area, require Site Plan Review, and use a 3,200 sf minimum lot. LS-O lots additionally hit the unlocated Hillside Development Standards, so keep that as an "unknown extra review" flag.
- **Ch. 916 matters only for RM-M/H/VH and non-residential-district lots** within 100 ft of R1D/R1A/R2/R3/H: height cap of 40 ft within 50 ft, and 15 ft side and rear setbacks. It also forces Site Plan Review. It does not apply to single-unit houses in R districts.
- **PDP is irrelevant for infill houses.** It starts at 15,000 sf GFA, except in **RIV within 200 ft of the river**, where any new primary structure needs a PDP.

## Browser notes
- eCode360 print view worked. Text was extracted by rewriting my own tab's DOM to the target slice and reading it with get_page_text, which avoids the javascript_tool truncation.
- Midway, my first working tab was navigated to x.com by something outside this session. I stopped using it and did not interact with that page. It was left open, not closed.
- Opening the Planning Commission minutes PDF URL did not render, and it may have triggered a browser download. That is not verified.
