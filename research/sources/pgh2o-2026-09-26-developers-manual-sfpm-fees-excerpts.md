# Pittsburgh Water (PWSA): Developer's Manual (rev. March 6, 2026), SFPM page, permit page, 2026 fee schedule, 2025 Development Services Report. Excerpts

Accessed 2026-09-26. The web pages were fetched with curl and the PDFs extracted with pdftotext. Staff contact names and emails are omitted.

Sources:
- https://www.pgh2o.com/developers-contractors-vendors/permits/dep-sewage-facilities-planning-module
- https://www.pgh2o.com/developers-contractors-vendors/permits
- https://www.pgh2o.com/developers-contractors-vendors/permits/water-and-sewer-tap-plan-review
- https://www.pgh2o.com/developers-contractors-vendors/developers-manual-standard-details
- Manual PDF: https://www.pgh2o.com/sites/default/files/2026-03/2026%20Developer%27s%20Manual.pdf (47 pp, "Revised March 6, 2026")
- Fee schedule: https://www.pgh2o.com/sites/default/files/2026-01/Fee%20Schedule%202026_0.pdf
- Planning Workflow Diagram: https://www.pgh2o.com/sites/default/files/2025-04/WSUse_PlanningWorkflowDiagram.pdf
- 2025 report: https://www.pgh2o.com/sites/default/files/2026-01/Development%20Services%20Report%202025%20For%20Website.pdf

## Developer's Manual, Section 3 (SFPM), verbatim
> "The Official Plan for the City of Pittsburgh was originally approved by the DEP on May 15, 1972. The Sewage Facilities Planning Module (SFPM) is the instrument for legally amending the Official Plan to account for flows from new/unforeseen subdivisions and land developments. The SFPM requires review/approval from each Facility Owner within the sewerage system, including Collection (Pittsburgh Water), Conveyance (ALCOSAN) and Treatment (ALCOSAN). … Each Facility Owner conducts a review to understand how the proposed development will impact available dry-weather capacity and whether the proposed flows will create a dry-weather hydraulic overload within the next five (5) years."

> "Amendments to Act 537 have created a process by which certain developments may be exempt from the planning module process. However, in accordance with 25 Pa. Code 71.51(2), the exemption process requires that the existing collection, conveyance and treatment facilities are in compliance with the Clean Streams Law. On March 2, 2011, the DEP issued a determination that, due to an ongoing consent order regarding the discharge of untreated wastewater, the Pittsburgh Water and ALCOSAN do not comply with the Clean Streams Law. As a result, the DEP does not accept SFPM exemptions for any development located within the Pittsburgh Water service area."

> "Please note that the SFPM requires approval from Pittsburgh Water, ALCOSAN, City Planning, City Council and the DEP. As a result, the approval process, from start to finish, can take several months. The DEP has up to 90 days to respond upon receipt of the completed SFPM."

> "Pittsburgh Water will determine the need for sewage planning during the initial review of the development permit application … sewage planning is not required for every development. … The primary criteria are summarized, as follows: Lot Creation Date, Existing and Proposed Flows, Historical SFPM Approvals, and Additional Lot Creation. Please note that lot consolidations and lot line revisions do not necessarily result in the need to complete sewage planning. However, subdivisions which result in additional lots, as compared to the existing configuration, will always result in the need for sewage planning."

SFPM steps:
1. PWSA determines the need for sewage planning and, if planning is required, gives the location of the **most limited capacity sewer (MLCS)**.
2. The applicant submits the DEP Mailer.
3. PWSA approves the collection portion.
4. ALCOSAN approves conveyance and treatment.
5. City Planning reviews, and the Law Department drafts a **City Council resolution**.
6. DEP gives final approval.

> "Pittsburgh Water cannot issue the Development Permit until the DEP approves the SFPM."

MLCS present-flow method:
- **Method #1** (project flows ≤ 4,000 gpd): at least five peak flow depth measurements over one hour, 6–8 AM or 6–8 PM.
- **Method #2** (> 4,000 gpd): professional flow monitoring for at least 30 calendar days.
- Manning n values: brick 0.016, concrete 0.013, DI 0.012, plastic 0.010, VCP 0.015.
- Peaking factor: combined 3.5, separate 3.0.
- Capacity is assessed for **dry weather**, 5-year horizon.

## Planning Workflow Diagram (text of decision tree)
- Lot created **before May 15, 1972**?
  - **Yes** → Existing flows > 799 gpd?
    - Yes → Net flows > 399 gpd? Yes: planning required. No: not required.
    - No → Project flows > 799 gpd? Yes: required. No: not required.
  - **No** → Has the lot previously received planning approval?
    - No → planning required.
    - Yes → Have additional lots been created since May 15, 1972?
      - Yes → planning required.
      - No → Do project flows exceed the planning approval? Yes: required. No: not required.

(The branch layout was reconstructed from the PDF's extracted text. Treat the exact arrows as [skimmed] and check against the graphic.)

## Developer's Manual, Section 1, verbatim
> "Water and Sewer Availability Letter Request. Projects requiring the submittal of a DEP Sewage Facilities Planning Module must submit a Water and Sewer Availability Letter Request. … Pittsburgh Water staff will review and return a will-serve letter with detailed available infrastructure and infrastructure maps. Some lenders may also require a will-serve letter. The water and sewer availability letter is not a permit …"

> "Baseline review times are 30 business days per review. … Expedited reviews will guarantee a review within 15 business days after the review fees have been paid and the required plans have been submitted."

> "Pittsburgh Water does not provide a preliminary cost estimation prior to completing the development permit review process"

> "Applications in progress will be invalid after one (1) year of inactivity. Issued permits are valid for a period of five (5) years from date of issuance."

> "Maps and Records Request … A staff member will answer the request within 15 business days. Large or complicated data requests may require 30 days or more"

## Permits page, verbatim excerpts
- "Residential permits are for single-family homes that require new water and/or sewer taps or are reconnecting to an existing water and/or sewer service. … Residential permits do not require tap-in drawings. The residential permit application fee is $40. … Typical connections for a single-family home are 1" service line and 5/8" meter at a total cost of $570."
- A development permit is required if the project has: "A single-family home with fire protection service / A lot has been subdivided / More than 2 homes are being constructed as part of a planned development / More than 2 taps are to be terminated / Taps located on more than one lot are to be terminated"
- "All developments, regardless of the scope, are required to attend a pre-development meeting."
- "Most developments proposing an increase in flows or subdividing lots will be subject to a DEP SFPM review."
- SFPM page: "After Pittsburgh Water review, the application must be reviewed and approved by several other agencies prior to submission to the DEP. … This process could take 3-6 months to complete." "No Pittsburgh Water tap-in permits will be issued until final approval from DEP has been obtained."
- Tap-in plan review page: "Any development or redevelopment proposing new taps, increasing flow to existing taps, or increasing storm flow to a new or existing storm system is required to submit tap-in plans stamped by a Pennsylvania certified engineer"

## 2026 Permitting Fee Schedule (selected)
| Item | Fee |
|---|---|
| Residential Tap-in Permit | $40 |
| Water and Sewer Availability Letter Request | $40 |
| Development Permit (includes DEP SFPM review and tap-in plan review) | $740 (expedited $1,290) |
| DEP SFPM Review Only | $320 (expedited $550) |
| Tap-in Drawing Review Only | $420 (expedited $740) |
| Development Permit Revisions | $140 (expedited $250) |
| Private Construction of Public Facilities Review | $680 (expedited $1,190) |
| Hydrant Flow Test | $410 |
| Maps and Records Request | $40 |
| Connection fee, 1" water tap | $340 |
| Connection fee, 4"–12" water tap | $400 |
| Domestic meter, 5/8" | $190 |

"**Expedited guarantees review within 15 business days of payment"

## 2025 Development Services Report (published Jan 2026), verbatim excerpts
- "401 Total Permits issued / 63 Development Permits / 89 Pre-Development Meetings / 32 Water and Sewer Availability requests / … 14 Development Agreements executed"
- "Development permits were completed in an average of just 6 to 8 months, factoring in developer-initiated delays that can extend review periods. The fastest permit was issued in 68 days, with an expedited review completed in 9 days."
- "In 2025, our Engineering Technicians processed 61 residential permits. … These permits are typically issued within two weeks of the initial application."

## Capacity map
No public sewer or water **capacity** map was found on pgh2o.com or in an ArcGIS Online search (2026-09-26). The public layers found are sewersheds, "PWSA_Sanitary_Sewer_Areas" (feature service, from search metadata only) and project locations. The MLCS location is provided per project, inside the permitting portal.
