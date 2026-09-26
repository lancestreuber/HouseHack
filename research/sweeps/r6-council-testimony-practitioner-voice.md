# Sweep: Council and board testimony: practitioner voice
Round 6 · 2026-09-26 · Legistar API, pittsburghpa.gov PC minutes, Granicus probe, YouTube auto-captions, Land Bank minutes

Excerpts saved: `sources/pittsburgh-legistar-2026-09-26-hearing-testimony-excerpts.md`. It holds excerpt IDs E01 to E37 and links to every original. Quotes below are **machine captions**: check them against the video before publishing verbatim. Speakers are identified by role and organization type only.

## Bottom line

- **Legistar has no written testimony for these bills.** It has no public-comment attachments, no speaker lists and no transcripts. The minutes record only "Public Hearing Held".
- **The primary testimony exists as hearing video.** That covers 3 Council hearings and 4 Planning Commission sessions, about 22 hours in total. Auto-captions for all 7 were retrievable.
- **Practitioner speakers, public testimony:** 42 speaker-appearances by practitioners were read in full or in targeted windows.
  - 25 from nonprofit developers, CDCs, CLTs or neighborhood development orgs
  - 6 from industry associations
  - 3 from for-profit developers or real-estate firms
  - 2 from architects
  - 6 from builders or trades
  - City Planning staff presentations (5) are counted separately.
- **What the practitioners actually named, most often first:**
  1. The financing gap and cost to build: $350k to $568k per unit.
  2. Process complexity and delay: planning, zoning, PWSA, permits, a 3 to 5 year timeline.
  3. Parking minimums, and the parking lenders require.
  4. Variances forced by minimum lot size.
  5. Residential-compatibility setbacks and height step-backs. Staff say these make some lots "can't build anything".
  6. Title and acquisition delays: Land Bank records, "tangled" property.
  7. Slopes and soils: raised once, by one developer, for one large site.
- **Inclusionary zoning dominated the floor time.** IZ is a policy fight, not a site obstacle. Practitioners split on it by business model: for-profit, industry and trades against; CDCs and CLTs for. The table counts it separately.
- **Gap for the product.** Almost nobody testified about site-level physical constraints: slope, sewer capacity, landslide. That absence reflects the venue (text-amendment hearings), not evidence that the constraints don't matter.

## Method and access log

**Legistar Web API** (`https://webapi.legistar.com/v1/pittsburgh/`, no key):

- `matters?$filter=MatterFile eq '2025-1545'` returned MatterId 31504. The same query found 2025-1579 (MatterId 31538, passed 5/6/2025, Ord. 10) and 2026-0834 (MatterId 33576; Council public hearing **scheduled 10/13/26**, not yet held).
- `matters/{id}/attachments`:
  - 31504 has 7 attachments: cover letter, PC decision 1/29/25, hearing report, summary, Version 2 text, PC report and recommendation June 2025, PC substitute June 2026.
  - 31538 has **0** attachments.
  - 33576 has 4 attachments: cover letter, hearing report 7/28/26, PC decision, summary.
  - **None of the 11 attachments is testimony.**
- `matters/{id}/histories` gave the hearing event IDs: 11642 (9/10/25), 12056 (9/23/26) and 11505 (4/23/25).
- `events/{id}` and `events/{id}/eventitems?AgendaNote=1&MinutesNote=1&Attachments=1` for those 3 events: agenda notes and minutes notes are **empty**. The minutes PDFs (1 to 2 pages each) say only "Public Hearing Held to the Committee on Land Use and Economic Development".
- The **MeetingDetail.aspx** pages for 12056 and 11642 have only agenda, minutes and a Granicus video link. There is no eComment or attachment link.
- Speakers on 9/23/26 said they had sent full statements "from the city clerk" and "submitted a written statement". Those written statements **are not published** in Legistar.

**Granicus** (`pittsburgh.granicus.com/player/clip/{7888,7428,7357}`):

- The player pages load. `videos/{id}/captions.vtt` returned 8 bytes (empty). The index points hold only the agenda item, with no speaker index.
- The archive-stream m3u8 returned **403 CloudFront**. [inaccessible]

**YouTube.** Channel listings came through yt-dlp flat-playlist. The City Channel Pittsburgh videos match the Legistar hearing dates exactly (4/23/25, 9/10/25, 9/23/26). Transcripts came from youtube-transcript-api because yt-dlp subtitle download was blocked with "video not available".

| Session | Video length | Caption words |
|---|---|---|
| Council hearing, 4/23/25 | 1.5 h | 16.6k |
| Council hearing, 9/10/25 | 4.5 h | 48.8k |
| Council hearing, 9/23/26 | 1.5 h | 16.1k |
| Planning Commission, 1/28/25 | 11.2 h | 115.7k |
| Planning Commission, 6/2/26 (full) | 3.1 h | 32.3k |
| Planning Commission, 6/2/26 (1545 excerpt) | n/a | 19.4k |
| Planning Commission, 7/28/26 (full) | 4.4 h | 44.7k |
| Planning Commission, 7/28/26 (EO Phase 1 item) | n/a | 12.0k |
| DCP Q&A session, Aug 2026 | n/a | 6.5k |

**Reading depth:**
- Read in full: the 3 Council hearings, the 6/2/26 public-testimony section and the EO Phase 1 item.
- Read in targeted windows: the 1/28/25 PC session (11 h). Windows were chosen by speaker self-identification against the org list in the approved PC minutes.

**pittsburghpa.gov.** Direct curl returns 403 (bot block). WebFetch retrieved the PDFs.
- PC minutes 1/28/25 (6 pp.) and 6/2/26 (4 pp.) were read. They list speakers, affiliations and correspondence senders, but summarize content only as "comments".
- Correspondence letters (14 senders on 1/28/25, 11 on 6/2/26) are **not posted** on the meeting pages.
- DCP says 2024 outreach included "industry focus groups". No published summary was found.

**Land Bank.** Fifteen minutes files (Feb 2025 to Jun 2026) were downloaded from pghlandbank.org and their public-comment sections read.

**Not done:**
- URA board minutes: listing found, not read.
- PHFA and County hearing records.
- The 1/28/25 session was not read end to end; about 140 speakers there were residents or advocates.

## Findings: obstacles × stakeholder type

**Count unit:** one speaker-appearance at one hearing that raised the obstacle. The same person at two hearings counts twice.

**This is a count of testimony, not a survey.** Testifiers self-select, and most came to argue about IZ, so counts reflect what the agenda invited as much as what matters. "Staff" means City Planning presenters. Commissioners and Council members are not counted and appear in the Notes column.

| Obstacle | Stakeholder type (count) | Example quote (<25 words) | Source | Notes |
|---|---|---|---|---|
| **Financing gap, construction cost, returns** | CDC/CLT/nonprofit dev (7) · industry assoc (4) · for-profit dev (2) · architect (1) | "a new construction home cost us almost $500,000 in total development cost to build" (CLT real-estate director) | E17 | Also: a Homewood rental at $568k/unit with >$300k subsidy (E26); +50% costs since COVID and ~$1,000/unit/month interest (E12, E13); "construction in the city of Pittsburgh is really, really, really hard" (E19). A commissioner put a 50% AMI unit's value at ~$150k against ~$350k mid-rise cost (E35). |
| **Process complexity, permits, delay (incl. PWSA)** | CDC/nonprofit (4) · for-profit dev (1) · architect (1) · small builder (1) · staff (2) | "this long complex process between planning and zoning between the funding approaches between PWSA it is designed to stop housing" | E06 | Also: "3 to 5 years" per apartment project (E21); a fence permit condition delayed move-in and cost "thousands" (E22); "issues with PWSA" (E16); clients "choose to go to other places" (E20); staff consult "an old copy of the code" (E32). **Counter-voice:** an Oakland CDC said a permit shot clock "would be enormously damaging" (E10). |
| **Parking minimums / lender-required parking** | CDC/CLT (4) · RCO (1) · staff (2) | "financers will often require that a development provide a certain number of parking spaces" (staff) | E27, E18, E03 | A Council member made the same point: financing drives parking more than code does. The RCO example is a city-owned R2 lot <20 ft wide that would still need a two-car garage (E03). |
| **Minimum lot size → variance** | CDC/nonprofit (2) · staff (1) | "Almost all of the affordable community land trust homes built in Lawrenceville have needed variances for minimum lot size" | E01, E05, E04 | Mostly addressed by Ord. 10 of 2025. A 4/23/25 speaker noted a 2,266 sf R1A lot still can't be split. |
| **Variance / ZBA / discretionary uncertainty** | CDC/nonprofit (3) · staff (1) | "you shouldn't have to hire a team of lawyers and make a lot of political contributions to get housing built" | E07, E02 | Also "zoning hell" (a Lawrenceville nonprofit, 9/10/25). Advocates (not counted) cited the Bloomfield ShurSave project dying in variance hearings. |
| **Residential compatibility setbacks and height step-backs** | staff (1) · CDC (1). **Opposite direction:** architect (1), CDC (2) want *more* height limits | "essentially that lot you can't build anything because these setbacks are so severe" (Zoning Administrator) | E30, E31, E29, E28 | Staff: 100-ft lot depth plus the step-back limits "the majority, if not all of parcels". EO Phase 1 (Bill 2026-0834) loosens this. |
| **Title, acquisition, land assembly** | nonprofit assembler (1) · Land Bank public commenters (3) · Land Bank staff (recurring) | "property is tangled" in redlined, "blight lined" neighborhoods | E09; Land Bank minutes | Commenters describe years-long acquisition: a church "navigating between the city and URA", a family trying "since 2018". Resolutions routinely budget title quieting, up to $20k. |
| **Slopes, soils, site conditions** | for-profit dev (1) · staff report (1) | "we have soils issues that require significant earth movement and undercutting" | E33, E34 | A 26-acre site with slopes >20%. Density was concentrated on the flattest area, and access was limited by "steep topography". The only site-physical testimony found. |
| **Community opposition / public process** | nonprofit (1) · CDC (1, as protection) | "if a developer proposes a project that a neighborhood hates it gets stopped" (nonprofit assembler, V4 5:12) | excerpts file, E05 speaker | A Hill CDC asked that citywide rules not override community master plans. Residents at the Lytle St hearing said developers present at routine meetings rather than dedicated ones. |
| **Labor cost / non-union and unpermitted competition** | trades (4) | "construction costs are not adjusted for these artificially low rents" … developers "build non-union" | E24 | A carpenters' rep alleged unpermitted LLC construction and unpaid taxes. That claim is unverified. |
| **ADU feasibility** | CDC (1) · CLT (1) | Informal ADUs are "an obstacle to the redevelopment of the lower density housing types into the more dense housing forms" | E15, E17 speaker | A Council member said the earlier ADU pilot produced none because ADUs are "cost prohibitive". |
| **IZ mandate as cost / uncertainty** (policy, not site) | industry assoc (6, incl. pending litigation) · trades (4) · for-profit dev (2) · architect (1) | "Business people are more confident, more willing to invest in a climate of higher certainty" (small builder, arguing *for* uniform IZ) | E23 | **Against IZ:** NAIOP (4 appearances), apartment association (pending federal suit by the builders' association), Allegheny Conference, trades, 2 firms, 1 architect. **Say IZ is not the obstacle:** CDC/CLT/nonprofit (12 appearances), 1 builder. A Lawrenceville CDC reports 35 IZ units built and 80 in the pipeline (9/10/25). |

## Tools and data practitioners said they wish existed

- **Pro-forma inputs by neighborhood** (industry association, E11, E12):
  - cost per unit by construction type
  - hard and soft costs
  - operating expenses
  - rent and density by neighborhood
  - current lending costs
  - Its board president called the city's cost models "woefully out of date".
- **Market-specific feasibility** (business association, E14): requirements tailored "to reflect neighborhood specific market conditions", with ongoing "assessing the feasibility".
- **Rules predictable enough to act on** (E08, E23): "buy property show up know the rules get a permit and start building in six months or less". This is the closest ask to a site-screening tool.
- **Demand data the HNA omitted** (Oakland CDC, V4 8:35): student housing demand. "We need specific tools".
- **Show the numbers** (Lawrenceville nonprofit, 9/10/25): challenged developers to share pro formas showing IZ kills projects. Both sides want project-level financial data; neither has published it.
- **Pipeline and permit transparency:**
  - DCP says a housing dashboard will report "all housing units … in review" and permitted, flagged affordable or market (E37). Two Council members said on 9/23/26 that it had not yet been released.
  - A Council member asked for semiannual reports on who uses the height bonuses.
  - Advocates asked how IZ affordability is monitored. Staff could not answer on the spot.
- **Existing tool worth reusing:** DCP showed a GIS dashboard of lots that are nonconforming under old versus new minimum lot sizes (V1, 0:07). That is a site-inventory layer already built by the city.

## Caveats

- **Self-selection and framing.** Hearings were about IZ, ADUs and parking, so obstacles outside the bills' scope (sewer capacity, slopes, title) were rarely raised. Absence is not evidence of irrelevance.
- **Advocacy framing.**
  - Industry and trades speakers argued a position, and their cost figures were not checked against pro formas.
  - Pro-IZ CDCs also argued a position.
  - Several speakers accused the other side of reading coordinated talking points.
  - Treat dollar figures as claims.
- **Caption accuracy.** Everything here comes from auto-captions: names and numbers can be mis-heard. The $568,000, 3 to 5 years and 50% figures should be checked in the video.
- **Coverage.**
  - The 1/28/25 11-hour PC session was sampled by speaker affiliation, not read in full.
  - Written correspondence to PC and Council was not public.
  - URA minutes were not read.
- **Date correction.** An earlier sweep (r3) dated the first 1545 Council hearing "Sept 11, 2025". Legistar and the video title both say **9/10/2025**.
- **Not counted as testimony:** Council members' and commissioners' remarks. Counts are testimony instances, not people or organizations.

## Sources

- Legistar Web API, matters 31504, 31538, 33576: attachments and histories. https://webapi.legistar.com/v1/pittsburgh/matters/31504/attachments [read] (accessed 2026-09-26)
- Legistar events 11642, 12056, 11505 and their eventitems. https://webapi.legistar.com/v1/pittsburgh/events/12056 [read] (accessed 2026-09-26)
- Council hearing minutes, 2026-09-23. https://pittsburgh.legistar1.com/pittsburgh/meetings/2026/9/12056_M_Committee_on_Hearings_and_Policy__26-09-23_Meeting_Minutes.pdf [read] (accessed 2026-09-26)
- Council hearing transmittal, 2025-09-10. https://pittsburgh.legistar1.com/pittsburgh/meetings/2025/9/11642_M_Committee_on_Hearings_and_Policy__25-09-10_Transmittal_Letter.pdf [read] (accessed 2026-09-26)
- Council hearing minutes, 2025-04-23. https://pittsburgh.legistar1.com/pittsburgh/meetings/2025/4/11505_M_Committee_on_Hearings_and_Policy__25-04-23_Meeting_Minutes.pdf [read] (accessed 2026-09-26)
- 2025-1545 hearing report, Jan 2025. https://pittsburgh.legistar1.com/pittsburgh/attachments/b922611c-14a6-41c7-8c9d-9e1027aebc33.pdf [read] (accessed 2026-09-26)
- 2025-1545 PC report and recommendation, June 2026. https://pittsburgh.legistar1.com/pittsburgh/attachments/1aea03bb-c723-4b1d-bff2-f7b61b7766db.pdf [skimmed] (accessed 2026-09-26)
- 2026-0834 hearing report with DCP engagement report. https://pittsburgh.legistar1.com/pittsburgh/attachments/3db4d4bd-73a6-4791-bff7-c02657c58913.pdf [skimmed] (accessed 2026-09-26)
- Legistar MeetingDetail pages for 12056 and 11642. https://pittsburgh.legistar.com/MeetingDetail.aspx?LEGID=12056&GID=115&G=B84377D7-CD7F-434A-A5AB-A7BCD775D91D [read] (accessed 2026-09-26)
- Granicus clip 7888: player works, but the captions are empty and the stream returns 403. https://pittsburgh.granicus.com/player/clip/7888 [inaccessible] (accessed 2026-09-26)
- Council public hearing, 2025-04-23 (video). https://www.youtube.com/watch?v=X_qOHCfbZ4U [read] (accessed 2026-09-26)
- Council public hearing, 2025-09-10 (video). https://www.youtube.com/watch?v=i9DFsOOAoXs [read] (accessed 2026-09-26)
- Council public hearing, 2026-09-23 (video). https://www.youtube.com/watch?v=HjQes-a7OZ0 [read] (accessed 2026-09-26)
- Planning Commission, 2025-01-28 (video). https://www.youtube.com/watch?v=k4ONtF5cr34 [skimmed] (accessed 2026-09-26)
- PC hearing on 2025-1545, 2026-06-02 (video). https://www.youtube.com/watch?v=mF3pxXVmnZ8 [read] (accessed 2026-09-26)
- PC full meeting, 2026-06-02 (video). https://www.youtube.com/watch?v=W1KBJfJxP8A [skimmed] (accessed 2026-09-26)
- PC full meeting, 2026-07-28 (video). https://www.youtube.com/watch?v=etVrDzHzsXw [skimmed] (accessed 2026-09-26)
- PC EO Phase 1 item, 2026-07-28 (video). https://www.youtube.com/watch?v=I-kclztmEl4 [read] (accessed 2026-09-26)
- DCP Q&A on CB 2025-1545 (video). https://www.youtube.com/watch?v=vyo1hk6L7Xo [read] (accessed 2026-09-26)
- Council hearing 9/10/25, standing committees video (not transcribed). https://www.youtube.com/watch?v=tW_gDkGImKE [found] (accessed 2026-09-26)
- PC minutes, 2025-01-28. https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/2025-meetings/01-28-2025-meeting/approved-planning-commission-minutes-2025-01-28.pdf [read] (accessed 2026-09-26)
- PC minutes, 2026-06-02. https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/pc-june-2nd-2026/pc-minutes-06022026.pdf [read] (accessed 2026-09-26)
- PC meeting page, June 2, 2026 (no correspondence posted). https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/PC-Agendas/Planning-Commission-June-2-2026 [read] (accessed 2026-09-26)
- PC meeting page, Jan 28, 2025 (no correspondence posted). https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/PC-Agendas/PC-January-28-2025 [read] (accessed 2026-09-26)
- Pittsburgh Land Bank agendas and minutes, Feb 2025 to Jun 2026 (15 files). https://pghlandbank.org/agendas-and-minutes-2/ [read] (accessed 2026-09-26)
- URA board notices, agendas and minutes. https://www.ura.org/pages/board-meeting-notices-agendas-and-minutes [found] (accessed 2026-09-26)
- Citizen Portal AI summaries of the hearings (secondary, not used for counts). https://citizenportal.ai/articles/6465695/Pennsylvania/Allegheny-County/Pittsburgh/City-Council-hears-hours-of-testimony-on-Bill-1545-citywide-inclusionary-zoning-ADUs-and-parking-reform [found] (accessed 2026-09-26)
