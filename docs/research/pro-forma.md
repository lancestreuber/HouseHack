# Pro Forma Lite: Defaults, Formulas, Subsidy Stack (Pittsburgh)

Research date: **2026-09-26**. Every number below has a source, a date, and a low/mid/high range. In the UI, show ranges by default and let the user edit every input. Anything marked **[ASSUMPTION]** is analyst judgment where no Pittsburgh source was found; say so in the UI.

## 1. Hard construction cost ($/gross sq ft, 2026 dollars)

| Typology | Low | Mid | High | Basis |
|---|---|---|---|---|
| ADU (400–800 sf) | 225 | 300 | 375 | Pittsburgh builder range $225–375/sf; 1BR 600–800 sf costs $135k–240k ([Shannon Staley, Jul 2025](https://www.shannonstaleyandsons.com/blog/how-much-does-an-adu-cost-in-pittsburgh-and-nearby-areas)) |
| SF / duplex / triplex (wood) | 185 | 225 | 300 | HUD 2024 Pittsburgh HCC, detached 3BR $239,813 (≈$171/sf at 1,400 sf, escalated ~8%); Pittsburgh builders quote $200–250 standard and $250–325 mid-range ([Incline Homes, May 2026](https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/)); US average $162/sf in 2024 ([NAHB, Jan 2025](https://www.nahb.org/news-and-economics/housing-economics-plus/special-studies/special-studies-pages/cost-of-constructing-a-home-in-2024)) |
| Townhome (row) | 180 | 215 | 285 | HUD 2024 Pittsburgh HCC, row house 3BR $219,650 |
| Small MF, 4–19 units (walk-up) | 190 | 250 | 325 | HUD 2024 Pittsburgh HCC, walk-up 2BR $173,632; RSMeans 2026 range for 1–3 story apartments is $220–575 ([RSMeans](https://www.rsmeans.com/resources/how-much-does-it-cost-to-build-an-apartment-complex)) |
| Mid-rise, 20+ units (elevator/podium) | 220 | 300 | 400 | HUD 2024 Pittsburgh HCC, elevator 2BR $204,880; RSMeans 2026 range for 4–7 story is $210–475 |

- **HUD numbers.** Source is the [HUD 2024 Unit TDC Limits](https://www.hud.gov/sites/dfiles/PIH/documents/2024_Units_TDC_Limits.pdf), Region III, Pittsburgh (p. 18). These are "moderate design" costs, so they anchor the **low** column. The 2025 and 2026 PDFs were blocked from download.
- **Escalation.** Assume about 3.5–4%/yr. The RSMeans historical index rose from 293.9 in Jan 2025 to 304.2 in Oct 2025 ([RSMeans 2025 index](https://www.rsmeans.com/landing-pages/2025-rsmeans-cost-index)).
- **RSMeans city index for Pittsburgh.** Not publicly readable (paywalled). Do not hard-code roughly 1.0; use the ranges above.
- **Reality check against recent Pittsburgh all-in costs (total development cost, TDC):**
  - LIHTC new construction: Hill Top Villas $22.9M / 48 units = **$477k per unit**. Woodlawn Lofts $24.4M / 46 = **$530k per unit** ([PublicSource, 2025](https://www.publicsource.org/pittsburgh-ura-affordable-housing-funds-hazelwood-hill-fairywood/)).
  - Office-to-residential conversion: Smithfield Lofts $26.06M / 46 = $567k per unit ([URA board minutes, Jun 2025](https://www.ura.org/media/W1siZiIsIjIwMjUvMDcvMTAvZWkxeWNpY3Y4X0pVTkVfMjAyNV9VUkFfUkVHVUxBUl9CT0FSRF9NRUVUSU5HX01JTlVURVMucGRmIl1d/JUNE%202025%20URA%20REGULAR%20BOARD%20MEETING%20MINUTES.pdf)).
  - Garfield: 6 new modular single-family homes, TDC $3,101,800 = **$517k per home, about $381 per gross sf** ([URA board agenda, May 2025](https://www.ura.org/media/W1siZiIsIjIwMjUvMDUvMDYvNm1lcjBoNWI3Ml9NQVlfMjAyNV9VUkFfUkVHVUxBUl9CT0FSRF9NRUVUSU5HX0FHRU5EQV9GSU5BTC5wZGYiXV0/MAY%202025%20URA%20REGULAR%20BOARD%20MEETING%20AGENDA%20-FINAL.pdf)).

## 2. Soft costs, fees, contingency, site work

- **Soft costs:** 10–20% of construction cost for single-family and small buildings ([Incline Homes](https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/)). Defaults:
  - ADU and 1–3 unit buildings: 15%
  - Townhome and small MF: 25% **[ASSUMPTION]**
  - Mid-rise (includes construction interest): 30% **[ASSUMPTION]**
- **Hard-cost contingency:** 5% / 7.5% / 10% (low / mid / high) **[ASSUMPTION; industry norm]**. Use 10% for hillside, undermined, or rehab sites.
- **Developer fee:**
  - Market deals: 5% / 8% / 10% of costs other than land **[ASSUMPTION]**.
  - LIHTC deals are capped by PHFA at **15% of the first $10M** of replacement cost excluding acquisition, then 10% above that ([PHFA 2025–26 QAP §3.5](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf)).
- **Site premiums** ([Incline Homes, May 2026](https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/)):
  - Hillside or slope work: **+$30k–$80k per lot**, including retaining walls and drainage
  - Utility connections in older neighborhoods: $5k–20k
  - Demolition of a standard 2-story house: $4k–14k
  - Tight 25-ft-wide lots add logistics cost
- **ADU utility tie-ins:** $15k–30k; permits $5k–20k ([Shannon Staley](https://www.shannonstaleyandsons.com/blog/how-much-does-an-adu-cost-in-pittsburgh-and-nearby-areas)).
- **Undermined land (old mines) and landslide-prone slopes:** no public $/sf figure found. Flag these parcels "geotech required" and add +10% of hard cost at the high end only **[ASSUMPTION]**. Do not present a point estimate.

## 3. Land

- **City-, URA-, or Land Bank-owned parcels:** the price is nominal, but closing costs are not.
  - The Land Bank minimum is **$500** per parcel; side yards are exempt from that minimum ([PLB Policies](https://pghlandbank.org/wp-content/uploads/2019/06/plb-inaugural-pol-pro-rev-june8.pdf); policies amended by Ord. 32-2025, eff. 10-29-2025).
  - URA sold 2 parcels at "$500 plus costs per parcel (estimated to total $16,290)" ([Mar 2025 agenda](https://www.ura.org/media/W1siZiIsIjIwMjUvMDMvMTEvMjU4ZTI2OXBkdl9NQVJDSF8yMDI1X1VSQV9SRUdVTEFSX0JPQVJEX0FHRU5EQV9GSU5BTC5wZGYiXV0/MARCH%202025%20URA%20REGULAR%20BOARD%20AGENDA%20FINAL.pdf)).
  - URA sold 7 lots for "$1.00 plus costs (≈$65,000)" (May 2025 agenda).
  - **Default: $500 + $8,500 closing costs ≈ $9,000 per parcel** (range $1–$10k).
- **Private parcels:** use the Allegheny County assessed FMV (2012 base year) ÷ the **Common Level Ratio of 50.14%** for 2026 (STEB, [summarized here](https://hometaxappeal.us/pa/q/pa-allegheny-2026-clr/)). In other words, market value is roughly 2× assessed FMV. Show it as a range (×1.5 to ×2.5), because the ratio varies by neighborhood.

## 4. Revenue

**HUD FY2026 Fair Market Rents, Pittsburgh HMFA** (effective 10/1/2025, [HUD FMR](https://www.huduser.gov/portal/datasets/fmr.html), FY26 FMR file): 0BR $1,001 · 1BR $1,077 · 2BR $1,299 · 3BR $1,661 · 4BR $1,789. Use these as the **low-tier market rent** and the Housing Choice Voucher (HCV) ceiling.

**Market median (mid tier):** 1BR $1,238, 2BR $1,508, overall $1,420, +1.1% year over year ([Apartment List, Oct 2026](https://www.apartmentlist.com/rent-report/pa/pittsburgh)). Zillow's citywide average is $1,545 ([Zillow](https://www.zillow.com/rental-manager/market-trends/pittsburgh-pa/)). For high-tier new construction, use the median × 1.3 **[ASSUMPTION]**.

**LIHTC / AMI maximum gross rents** (tenant rent + utility allowance), computed from HUD FY2026 income limits for Pittsburgh (MFI $110,400; 50% limits for 1–6 persons: $38,650 / $44,200 / $49,700 / $55,200 / $59,650 / $64,050; [HUD IL](https://www.huduser.gov/portal/datasets/il.html)):
- Method: household size is 1 person for a studio and 1.5 persons per bedroom otherwise. Rent = 30% × limit ÷ 12.
- Cross-check against PHFA's MTXR041 chart ([PHFA limits](https://www.phfa.org/mhp/rent_and_income_limits/)) before submission.

| AMI | 0BR | 1BR | 2BR | 3BR |
|---|---|---|---|---|
| 30% | 579 | 621 | 745 | 861 |
| 50% | 966 | 1,035 | 1,242 | 1,435 |
| 60% | 1,159 | 1,242 | 1,491 | 1,722 |
| 80% | 1,546 | 1,657 | 1,988 | 2,297 |

**Key insight:** in Pittsburgh, the 60% AMI rent is roughly the market median, and 80% AMI rents *exceed* the market. So set net rent to `min(AMI rent − utility allowance, market rent)`. The utility allowance defaults to $110 (1BR) or $140 (2BR) **[ASSUMPTION; use HACP schedule]**.

**For-sale price ($/sf):**

| Tier | Low | Mid | High | Basis |
|---|---|---|---|---|
| Weak market, new affordable | 100 | 125 | 145 | Garfield CLT new homes priced $155k–185k for 1,280–1,512 sf (URA, May 2025); resale in Homewood South is $92/sf ([Redfin](https://www.redfin.com/neighborhood/156571/PA/Pittsburgh/Homewood-South/housing-market)) |
| Citywide median (resale) | 170 | 189 | 210 | [Redfin, Aug 2026](https://www.redfin.com/city/15702/PA/Pittsburgh/housing-market): median $275k, $189/sf |
| Strong market | 244 | 256 | 314 | Upper / Central / Lower Lawrenceville ([Redfin](https://www.redfin.com/neighborhood/156343/PA/Pittsburgh/Lower-Lawrenceville/housing-market)) |

New construction usually sells at a premium to resale medians, but no Pittsburgh source was found; treat this as the user's input. Cost of sale defaults to 6% **[ASSUMPTION]**.

## 5. Operations and capital markets

- **Operating expenses:** national average $8,657 per unit per year in 2024, including $2,998 for taxes and insurance ([NAA, Dec 2025](https://naahq.org/news/momentum-management-navigating-elevated-costs-constrained-operating-environment)).
  - Defaults: 1–4 units $7,000 **[ASSUMPTION: self-managed, tenant pays utilities]**; small MF $8,650; mid-rise $9,500.
  - Range: ±20%.
- **Property tax, Pittsburgh 2026:** County 6.43 + City 9.67 + School 10.25 = **26.35 mills** on assessed value ([Allegheny Treasurer](https://alleghenycountytreasurer.us/real-estate-tax/local-and-school-district-tax-millage/)). The City rose from 8.06 mills ([WESA, Dec 2025](https://www.wesanews.org/politics-government/2025-12-23/pittsburgh-property-taxes-calculator)).
- **Vacancy:** 5% default (range 4–8%). US vacancy was 4.8% in Q1 2026 ([CBRE](https://www.cbre.com/insights/figures/q1-2026-us-multifamily-figures)). Pittsburgh's central submarket vacancy fell 100 bp year over year ([Northmarq Q2 2026](https://www.northmarq.com/insights/insights/rent-growth-persists-supply-pressure-eases-pittsburgh-multifamily-market-q2-2026)).
- **Cap rate:** 6.0% mid (range 5.1–7.0%).
  - An aggregator shows Pittsburgh Class B at 5.10% and Class C at 5.64% as of 9/26/2026 ([ApartmentLoanStore](https://apartmentloanstore.com/pittsburgh/pennsylvania/cap-rate)). That is low confidence: it implies negative leverage with the 10-year Treasury near 4.8–5.1%, so the mid is set at 6.0% **[ASSUMPTION]**.
- **Permanent loan:**
  - Rates as of 9/26/2026 ([SelectCommercial](https://selectcommercial.com/commercial-mortgage-rates.php)): multifamily loans over $6M at 6.13%; apartment loans under $6M at 6.53%; Freddie small-balance 6.39%. All are 5-year fixed.
  - Terms: 30-year amortization, **DSCR 1.20** (team spec). Agency tiers run 1.25x at 75–80% LTV.
  - For 1–4 unit investor loans, use 7.0%. The 30-year owner-occupant rate is 7.03% (Freddie Mac PMMS, 9/24/2026, [NAA](https://naahq.org/news/freddie-mac-mortgage-rates-september-2026)).
- **Construction loan:** prime is 6.75% (fed funds 3.50–3.75% + 3.00). Loans price at prime + 1.0–1.5%, so **7.75–8.25%**. Model interest as about 50% average draw × rate × months.

## 6. Subsidy stack (Pittsburgh)

| Source | Typical amount | Eligibility / notes |
|---|---|---|
| URA **Rental Gap Program** | **$30k per unit at ≤60% AMI, $50k at ≤50%, $75k at ≤30%** (waivable) | ≥4 affordable units at ≤60% AMI; 40-yr deed restriction ([URA RGP](https://www.ura.org/pages/rental-gap-program); limits quoted in [Jun 2025 minutes](https://www.ura.org/media/W1siZiIsIjIwMjUvMDcvMTAvZWkxeWNpY3Y4X0pVTkVfMjAyNV9VUkFfUkVHVUxBUl9CT0FSRF9NRUVUSU5HX01JTlVURVMucGRmIl1d/JUNE%202025%20URA%20REGULAR%20BOARD%20MEETING%20MINUTES.pdf)). Recent 9% deals got $2M each |
| URA **For-Sale Development Program** | Grant **up to $130k per unit new construction, $100k rehab** (Garfield was waived up to $145k per unit) | Buyers ≤80% AMI; nonprofit, or for-profit with a nonprofit MOU; 15–99 yr affordability. 2026 round 2 closes **Oct 16, 2026** ([URA FSDP](https://www.ura.org/pages/for-sale-development-program); May 2025 agenda) |
| URA Housing Opportunity Fund | Homeowner assistance up to $35k; down-payment help; Small Landlord Fund; Demonstration Program | [URA HOF](https://www.ura.org/pages/housing-opportunity-fund-programs) |
| PHFA **9% LIHTC** (competitive) | Credits = eligible basis × 130% boost (QCT/DDA) × 9% × 10 yrs; equity **≈$0.84 per credit** (range 0.78–0.92) | Max basis **$320k per unit** (9%) or **$380k** (4%) ([QAP §3.4](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf)); pricing per [TaxCreditAdvisor, Apr 2026](https://www.taxcreditadvisor.com/articles/q2-2026-syndicator-roundup/). OBBBA raised 9% allocations 12% from 2026 ([Bisnow](https://www.bisnow.com/national/news/affordable-housing/affordable-housing-gaps-funding-lihtc-134169)). Six Pittsburgh awards in Oct 2025 ([URA](https://www.ura.org/news/pittsburgh-awarded-six-low-income-housing-tax-credits-to-bring-309-affordable-homes-to-the-city)) |
| PHFA **4% LIHTC + bonds** | Same formula at 4%; bond test now 25% | Rarely efficient below about 60 units **[ASSUMPTION]** |
| **PHARE** (state housing trust fund) | $100k–$500k per project for Allegheny awards in 2026 | [2026 PHARE awards](https://www.phfa.org/forms/phare_program_phare_fund/funding_announcements/2026_phare_reservation_of_funds.pdf) |
| HOME / CDBG (City via URA; County via AHDF) | Per-unit cap = HUD HOME limits | [DCED 2025 HOME limits](https://dced.pa.gov/download/2025-home-limits-effective-06-01-2025/); [County AHDF](https://www.alleghenycounty.us/Projects-and-Initiatives/Economic-Development/Developers/Allegheny-Housing-Development-Fund-AHDF). Amounts **not verified** |
| **Chapter 265 abatement** | Standard: 3 yrs, cap $247,786 per year. **Enhanced: 10 yrs, cap $250,000** | Enhanced applies in CDBG-eligible areas, or to for-sale / owner-occupied projects with ≥10% of units ≤80% AMI ([City RE forms, updated 9/1/2026](https://www.pittsburghpa.gov/City-Government/Finance-Budget/Taxes/Real-Estate-Taxes/Real-Estate-Forms)). Downtown LERTA: 20 yrs ([URA](https://www.ura.org/news/revitalizing-pittsburgh-downtown-lerta-program-passes-in-landmark-collaboration-among-pittsburgh-school-district-allegheny-county-and-city-of-pittsburgh)) |
| HACP project-based vouchers | Lifts rent to the payment standard | Example: Smithfield Lofts got 16 vouchers (Jun 2025 minutes) |
| **ADU** | **No Pittsburgh ADU subsidy program found** | By-right ADUs are pending in the 2025-1545 package (Planning Commission recommended in June 2026; Council vote pending). The Garfield overlay is the only precedent |

Local benchmark: Main + Elm estimates **$200k–300k of subsidy per affordable unit** ([ELDI, Aug 2025](https://www.eastliberty.org/spotlight-the-hidden-cost-of-affordable-homeownership-what-it-takes-to-build-and-scale-affordability-in-pittsburgh/)).

## 7. Formulas and defaults (TypeScript-ready)

```ts
// Units: lotSf, gsf, $/yr unless noted. All inputs user-editable; UI shows [low, mid, high].
type Range = { low: number; mid: number; high: number; source: string; asOf: string; assumption?: boolean };
type Typology = "adu" | "duplex" | "triplex" | "townhome" | "smallMf" | "midRise";

export const PRO_FORMA_DEFAULTS = {
  hardCostPsf: {
    adu:      { low: 225, mid: 300, high: 375, source: "https://www.shannonstaleyandsons.com/blog/how-much-does-an-adu-cost-in-pittsburgh-and-nearby-areas", asOf: "2025-07-07" },
    duplex:   { low: 185, mid: 225, high: 300, source: "https://www.hud.gov/sites/dfiles/PIH/documents/2024_Units_TDC_Limits.pdf ; https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/", asOf: "2024-11/2026-05" },
    triplex:  { low: 185, mid: 225, high: 300, source: "same as duplex", asOf: "2026-05" },
    townhome: { low: 180, mid: 215, high: 285, source: "HUD 2024 TDC Limits, Pittsburgh row house (escalated 8%)", asOf: "2024-11" },
    smallMf:  { low: 190, mid: 250, high: 325, source: "HUD 2024 TDC walkup; https://www.rsmeans.com/resources/how-much-does-it-cost-to-build-an-apartment-complex", asOf: "2026" },
    midRise:  { low: 220, mid: 300, high: 400, source: "HUD 2024 TDC elevator; RSMeans 4-7 story $210-475", asOf: "2026" },
  } satisfies Record<Typology, Range>,
  gsfPerUnit: { adu: 600, duplex: 1200, triplex: 1100, townhome: 1500, smallMf: 1000, midRise: 1050 }, // [ASSUMPTION] net ≈ 85% (smallMf) / 80% (midRise)
  softCostPct: { low: 0.10, mid: 0.20, high: 0.30, source: "https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/ (10-20% SF); MF 25-30% assumption", asOf: "2026-05", assumption: true },
  contingencyPct: { low: 0.05, mid: 0.075, high: 0.10, source: "industry norm", asOf: "2026-09", assumption: true },
  developerFeePct: { low: 0.05, mid: 0.08, high: 0.15, source: "PHFA QAP §3.5 caps LIHTC at 15% (first $10M)", asOf: "2025" },
  siteWorkPerLot: { low: 10_000, mid: 30_000, high: 80_000, source: "https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/ (utilities $5-20k; hillside +$30-80k)", asOf: "2026-05" },
  demolition: { low: 4_000, mid: 9_000, high: 14_000, source: "Incline Homes (2-story house)", asOf: "2026-05" },
  landPublicParcel: { low: 1, mid: 9_000, high: 16_000, source: "PLB $500 min + URA closing costs (URA agendas Mar/May 2025)", asOf: "2025-05" },
  assessedToMarket: { low: 1.5, mid: 1 / 0.5014, high: 2.5, source: "STEB 2026 CLR 50.14% via https://hometaxappeal.us/pa/q/pa-allegheny-2026-clr/", asOf: "2026" },
  fmr: { br0: 1001, br1: 1077, br2: 1299, br3: 1661, br4: 1789, source: "https://www.huduser.gov/portal/datasets/fmr.html (FY26, Pittsburgh HMFA)", asOf: "2025-10-01" },
  marketRentMedian: { br1: 1238, br2: 1508, source: "https://www.apartmentlist.com/rent-report/pa/pittsburgh", asOf: "2026-10" },
  mfi: 110_400, vli50: [38650, 44200, 49700, 55200, 59650, 64050], // HUD FY2026 IL, https://www.huduser.gov/portal/datasets/il.html
  utilityAllowance: { br0: 90, br1: 110, br2: 140, br3: 170, source: "placeholder; replace with HACP schedule", asOf: "2026-09", assumption: true },
  salePsf: {
    weak:   { low: 100, mid: 125, high: 145, source: "URA May 2025 agenda (Garfield CLT); Redfin Homewood South $92", asOf: "2025-05" },
    median: { low: 170, mid: 189, high: 210, source: "https://www.redfin.com/city/15702/PA/Pittsburgh/housing-market", asOf: "2026-08" },
    strong: { low: 244, mid: 256, high: 314, source: "Redfin Lawrenceville neighborhoods", asOf: "2026" },
  },
  costOfSalePct: 0.06, // [ASSUMPTION]
  opexPerUnit: { low: 6_000, mid: 8_657, high: 10_500, source: "https://naahq.org/news/momentum-management-navigating-elevated-costs-constrained-operating-environment (2024 avg)", asOf: "2025-12-22" },
  vacancy: { low: 0.04, mid: 0.05, high: 0.08, source: "CBRE Q1 2026 US 4.8%", asOf: "2026-Q1" },
  capRate: { low: 0.051, mid: 0.06, high: 0.07, source: "https://apartmentloanstore.com/pittsburgh/pennsylvania/cap-rate (low); mid is assumption", asOf: "2026-09-26", assumption: true },
  permRate: { low: 0.0613, mid: 0.0653, high: 0.07, source: "https://selectcommercial.com/commercial-mortgage-rates.php", asOf: "2026-09-26" },
  amortYears: 30, dscr: 1.20, maxLtv: 0.75,
  constructionRate: { low: 0.0775, mid: 0.08, high: 0.0825, source: "prime 6.75% (FF 3.50-3.75%) + 1-1.5%", asOf: "2026-09" },
  lihtc: { rate9: 0.09, rate4: 0.04, basisBoost: 1.30, price: { low: 0.78, mid: 0.84, high: 0.92 },
           maxBasisPerUnit9: 320_000, maxBasisPerUnit4: 380_000, eligibleBasisShare: 0.90,
           source: "PHFA 2025-26 QAP §3.4/3.5; https://www.taxcreditadvisor.com/articles/q2-2026-syndicator-roundup/", asOf: "2026-04" },
  subsidy: {
    uraRentalGapPerUnit: { ami60: 30_000, ami50: 50_000, ami30: 75_000, source: "URA Jun 2025 board minutes", asOf: "2025-06" },
    uraForSaleGrantPerUnit: { newConstruction: 130_000, rehab: 100_000, source: "URA May 2025 agenda; https://www.ura.org/pages/for-sale-development-program", asOf: "2025-05" },
    ch265Enhanced: { years: 10, annualCap: 250_000, source: "pittsburghpa.gov Real Estate Forms", asOf: "2026-09-01" },
  },
  millage2026: { county: 6.43, city: 9.67, school: 10.25, source: "https://alleghenycountytreasurer.us/real-estate-tax/local-and-school-district-tax-millage/", asOf: "2026" },
} as const;

// ---- formulas ----
export const amiRent = (vli50: readonly number[], br: number, amiPct: number) => {
  const persons = br === 0 ? 1 : br * 1.5;
  const lo = vli50[Math.floor(persons) - 1], hi = vli50[Math.ceil(persons) - 1];
  const limit50 = lo + (hi - lo) * (persons - Math.floor(persons));
  return Math.floor((limit50 * (amiPct / 50) * 0.30) / 12);
};
export const mortgageConstant = (rate: number, years: number) => {
  const r = rate / 12, n = years * 12;
  return (12 * r) / (1 - Math.pow(1 + r, -n));
};
// units = min(zoning cap for typology, floor(buildableFootprint * floors * efficiency / nsfPerUnit))
export function proForma(i: {
  units: number; gsf: number; hardPsf: number; sitework: number; land: number;
  softPct: number; contPct: number; feePct: number;
  monthlyRents: number[]; vacancy: number; opexPerUnit: number;
  rate: number; dscr: number; capRate: number; maxLtv: number;
  lihtc?: { credRate: number; price: number; boost: number; maxBasisPerUnit: number; eligibleShare: number };
  otherSubsidy?: number; saleValue?: number; costOfSalePct?: number;
}) {
  const hard = i.gsf * i.hardPsf + i.sitework;
  const contingency = hard * i.contPct;
  const soft = hard * i.softPct;
  const fee = (hard + contingency + soft) * i.feePct;
  const tdc = i.land + hard + contingency + soft + fee;
  const gpr = i.monthlyRents.reduce((a, b) => a + b, 0) * 12;
  const noi = gpr * (1 - i.vacancy) - i.opexPerUnit * i.units;
  const value = noi / i.capRate;
  const debt = Math.max(0, Math.min(noi / i.dscr / mortgageConstant(i.rate, 30), value * i.maxLtv));
  let lihtcEquity = 0;
  if (i.lihtc) {
    const basis = Math.min((tdc - i.land) * i.lihtc.eligibleShare, i.lihtc.maxBasisPerUnit * i.units);
    lihtcEquity = basis * i.lihtc.boost * i.lihtc.credRate * 10 * i.lihtc.price;
  }
  const gap = tdc - debt - lihtcEquity - (i.otherSubsidy ?? 0); // >0 = needs equity/subsidy
  const saleMargin = i.saleValue != null ? i.saleValue * (1 - (i.costOfSalePct ?? 0.06)) - tdc : undefined;
  return { tdc, tdcPerUnit: tdc / i.units, noi, yieldOnCost: noi / tdc, value, debt, lihtcEquity, gap, gapPerUnit: gap / i.units, saleMargin };
}
```

Run the model three times (low, mid, high inputs) and display the result as a band. Note that "low cost" and "high rent" belong to the same optimistic scenario, so pair them that way.

## 8. Worked examples (mid inputs)

**A. Homewood, 3,000 sf city-owned R2 lot, duplex** (2 units × 1,200 gsf = 2,400 gsf)

| Line | Amount |
|---|---|
| Land (public parcel) | $8,500 |
| Hard cost (2,400 gsf × $225) | $540,000 |
| Site work | $30,000 |
| Contingency (7%) | $39,900 |
| Soft costs (18%) | $102,600 |
| Developer fee (10%) | $71,250 |
| **TDC** | **$792,250** ($396k per unit, $330/gsf) |

This is below the Garfield CLT benchmark of $517k per home.

- **Rental:** 2 × 2BR at FMR $1,299 → gross potential rent $31,176. At 5% vacancy, less $7,000 opex per unit → **NOI $15,617**. Debt at 7.0% / 30 years / 1.20 DSCR = **$163k**. **Gap ≈ $629k ($315k per unit)**. Yield on cost 2.0% versus a 6% cap rate: infeasible without subsidy. Rental Gap doesn't apply (it needs ≥4 affordable units).
- **For-sale** (weak tier, $140/sf): 2 × 1,100 sf → $308k; net of 6% cost of sale = $289.5k. **Margin −$503k**. The For-Sale Development Program adds up to $260k (2 × $130k), leaving **≈$121k per unit** still unfunded. Add the Enhanced Chapter 265 abatement (10 yrs; Homewood is CDBG-eligible) and down-payment assistance. This matches Main + Elm's $200–300k-per-unit subsidy estimate.

**B. 10,000 sf RM-M lot, 12 units** (3-story walk-up, 12,000 gsf; 6 × 1BR + 6 × 2BR; private land at $15/sf **[ASSUMPTION]**)

| Line | Amount |
|---|---|
| Land | $150,000 |
| Hard cost (12,000 gsf × $250) | $3,000,000 |
| Site work | $120,000 |
| Contingency (7%) | $218,400 |
| Soft costs (25%) | $780,000 |
| Developer fee (10%) | $411,840 |
| **TDC** | **$4.68M** ($390k per unit) |

- **Market rate** (Apartment List medians): gross potential rent $197,712 → at 5% vacancy, less $8,657 per unit opex → **NOI $83.9k**. Debt at 6.53% / 1.20 DSCR = **$919k**. **Gap $3.76M ($313k per unit)**; yield on cost 1.8%.
- **60% AMI, 9% LIHTC:**
  - Net rents: $1,132 (1BR) and $1,351 (2BR) → NOI $66.0k → debt $722k.
  - Eligible basis is capped at $320k × 12 = $3.84M. Times the 1.3 boost × 9% × 10 years × $0.84 = **$3.77M equity**.
  - **Gap ≈ $184k ($15k per unit)**. That is fillable with Rental Gap at $30k per unit (up to $360k).
  - Caveat: 9% awards are scarce, and real Pittsburgh LIHTC TDC runs $477–530k per unit, which reopens a gap of about $1M+.
- **4% LIHTC:** equity $1.78M → **gap $2.18M ($181k per unit)**. Not viable at this scale.

## 9. Caveats and how to label uncertainty

- **Missing from a first-pass model:**
  - Construction-period interest and lease-up (only roughly included in soft costs)
  - Prevailing wage (Davis-Bacon on HOME, or URA-funded work)
  - Parking and structured podium
  - Stormwater management and utility authority (PWSA) requirements
  - Undermining, landslide, and fill conditions
  - Environmental (Phase I/II) findings
  - Tax re-assessment after completion
  - Rent-up concessions
  - Appraisal gaps
  - Buyer mortgage qualification (7.03% rate)
  - Scattered-site economies of scale
  - Permit timing (8–9 months reported)
  - The competitiveness of 9% LIHTC and URA funds (discretionary and oversubscribed)
- **Label outputs as ranges:**
  - Show `gapPerUnit` as a low–high band with the mid highlighted.
  - Tag each input as **Sourced** (link + date) or **Assumption**.
  - Show a "confidence" chip: High means HUD, PHFA, or URA figures; Medium means market reports; Low means aggregators or assumptions.
  - Never display a single "feasible" verdict. Say "gap closes with {programs}" or "gap exceeds known subsidy by $X."
- **Staleness:** FMRs and income limits reset every Oct/Apr–Jun, and loan rates move weekly. Store `asOf` dates and warn when a value is more than 12 months old.
