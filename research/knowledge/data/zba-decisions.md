# Zoning Board of Adjustment decisions

**Type:** data
**One line:** ⚠ The ZBA variance and special-exception decisions we found are per-case PDFs on pittsburghpa.gov; the one we parsed is well structured, and they must be crawled and parsed. We have not checked minutes, Legistar or a records request for other forms *(corrected 2026-09-26 per docs/04-critique.md row 21)*.
**Why we care:** Variance history is the only direct evidence of how often dimensional or use relief is granted, which is what a "needs a variance" flag should be calibrated against. There is no structured dataset.
**Last checked:** 2026-09-26

## What exists
- **No structured ZBA or variance dataset on WPRDC** (searches for "zoning board" and "variance" found none) `[read]`.
- `ZoningApplications` FeatureServer exists but returns **0 records** `[read]`.
- OneStopPGH `OSPI_H` exposes no ZBA step; keyword hits are 49 "variance" and 11 "ZBA" ([permits](permits-and-outcomes.md)).
- Decisions are per-case PDFs under `pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/`; agendas and per-hearing pages under `.../City-Planning-Meetings/ZBA-Agendas/ZBA-<date>/Decisions`.
- The organizer catalog lists ZBA decisions as a **Useful** source for Feasibility and Permit Navigator, caveat: "Documents may be PDFs and inconsistent over time; outcomes require careful extraction" ([organizer catalog](organizer-data-catalog.md)).

## Document structure `[read]` (one decision parsed)
The 1137 Pennsylvania Ave decision has labeled fields:
- Date of Hearing, Date of Decision (44 days apart in this case)
- Zone Case "N of YYYY"
- Address, Lot/Block (parcel ID), Zoning District, Ward, Neighborhood
- Request, **Application BDA-xxxx** (joins directly to `OSPI_H`)
- Table of Variance/SE items with section number and requirement
- Closing "Decision:" paragraph (this one: approved with conditions)

⚠ Looks regex-friendly, but that is generalized from **one parsed PDF**; template consistency across years is unknown *(corrected 2026-09-26 per docs/04-critique.md row 21)*. One other decision PDF (`e-jefferson-street-3-of-2026-zba-decision.pdf`) was fetched in Round 1.

## Crawling
- **Filenames are inconsistent** (`bda-2024-07715-1137-pennsylvania-ave-zba-decision.pdf`, `bda-2026-05389_5743-walnut-st-zba-2026-9-3.pdf`, `e-jefferson-street-3-of-2026-zba-decision.pdf`), so crawl per-meeting pages rather than guess URLs.
- The Sept 3, 2026 meeting page lists 5 cases with PDF links plus the agenda `[read]`. Some linked PDFs may be staff reports rather than decisions (unverified). At least one "/Decisions" subpage was empty.
- **Partial blocker:** the site's CDN (Akamai) returns **403 to curl**, but browser-like fetches (WebFetch) retrieved the pages. A scraper needs browser-like requests; untested at crawl volume.
- Hearings: first three Thursdays of each month (PublicSource Board Explorer, `[skimmed]` in the approval sweep).

## Volume and statistics
- Estimated ~5 cases/meeting × ~36 meetings/yr ≈ **150–200 cases/yr** (estimate, unverified).
- **No published ZBA approval rates found.** PublicSource Board Explorer shows members and cadence only. A cited "Lenze et al. 2024" could not be found by this sweep. ⚠ Another sweep reached its **abstract only**, so it is `[skimmed]` everywhere, and its findings are "per the abstract" *(corrected 2026-09-26 per docs/04-critique.md row 29)* (see [approval pathway](../policy/approval-pathway.md)).

## Process facts (from the ZBA handout, Dec 2024) `[read]`
$400 fee on top of zoning fees; ≥21-day posted notice; decision within 45 days after the record closes; appeal to Common Pleas within 30 days; approval expires in 1 year. Full pathway: [approval pathway](../policy/approval-pathway.md).

## Open questions
- How many years of decision PDFs are online, and do older ones share the same template?
- Share of linked PDFs that are staff reports vs decisions.
- Does a browser-like client get past the Akamai 403 at crawl volume?
- Actual annual case count (the 150–200 figure is an estimate).
- Whether any external study has tabulated Pittsburgh ZBA outcomes.

## Connects to
- [Permits and outcomes](permits-and-outcomes.md): BDA join key
- [Approval pathway](../policy/approval-pathway.md): special exception / variance step
- [Permit timelines](../policy/permit-timelines.md)
- [Backtest and calibration](../methods/backtest-and-calibration.md)
- [LLM role](../methods/llm-role.md): PDF field extraction
- [Organizer data catalog](organizer-data-catalog.md)

## Sources
- [ZBA decision, E Jefferson Street, 3 of 2026 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf) `[read]` *(accessed 2026-09-26)*
- ZBA decision `bda-2024-07715-1137-pennsylvania-ave-zba-decision.pdf` (same directory) `[read]` *(accessed 2026-09-26)*: parsed fields
- [ZBA September 3, 2026 meeting page](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-September-3-2026) `[read]` *(accessed 2026-09-26)*
- [ZBA process handout 2024 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf) `[read]` *(accessed 2026-09-26)*
- PublicSource Board Explorer `[skimmed]` *(accessed 2026-09-26)*: cadence and members only; URL not recorded
- City `ZoningApplications` FeatureServer `[read]` *(accessed 2026-09-26)*: 0 records
- [ZBA page (organizer catalog URL)](https://pittsburghpa.gov/dcp/zba) `[found]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- [Lenze, Hinojos and Grady 2024](https://ascelibrary.com/doi/full/10.1061/JUPDDM.UPENG-4474) `[skimmed]` *(accessed 2026-09-26)*: abstract only
- [Adversarial critique](../../docs/04-critique.md) — rows 21, 29
