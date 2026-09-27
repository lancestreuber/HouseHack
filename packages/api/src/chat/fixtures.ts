// MOCK data shaped like PLAN.md §2b, for building and testing the chatbot
// before `packages/scoring` fixtures and the real `parcels.report` exist.
// Values are illustrative, not real measurements.
import type { ParcelReport, TypologyEval } from "./types";

const MOCK = "Mock fixture (replace with live data)";

export const homewoodReport: ParcelReport = {
  features: {
    pin: "0174N00123000000",
    hood_id: "homewood-south",
    address: "7200 Hamilton Ave",
    zoning: "R2-L",
    lot_sqft: 3200,
    is_vacant: true,
    city_owned: true,
    slope25_share: 0.05,
    landslide_prone: false,
    landslide_events_500m: 0,
    flood_zone: false,
    undermined: false,
    emissions_2km_tpy: 14.2,
    aqi_nearest: 41,
    m_to_transit: 180,
    m_to_park: 520,
    m_to_school: 640,
    m_to_fire: 900,
    m_to_hospital: 2400,
    shops_800m: 6,
  },
  hood: {
    hood_id: "homewood-south",
    name: "Homewood South",
    pct_65_plus: 0.21,
    pct_under_18: 0.24,
    avg_hh_size: 2.1,
    pct_single_person_hh: 0.44,
    vacancy_rate: 0.29,
    median_income: 24300,
    median_rent: 690,
    permits_3yr_per_1k_units: 3.4,
  },
  considerations: [
    { id: "lot", name: "Lot size", score: 64, severity: "consider", value: "3,200 sq ft", comment: "Fits a duplex or townhome; small for apartments.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "zoning", name: "Zoning", score: 80, severity: "ok", value: "R2-L", comment: "Two-unit residential district.", source: MOCK, source_url: "https://data.wprdc.org/dataset/zoning", as_of: "2026-09-26", kind: "evidence" },
    { id: "hazards", name: "Hazards", score: 100, severity: "ok", value: "None mapped", comment: "Not in a landslide, flood or undermined area.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "slope", name: "Slope", score: 90, severity: "ok", value: "5% of lot ≥25% slope", comment: "Mostly flat.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "air", name: "Air", score: 58, severity: "consider", value: "14.2 tons/yr within 2 km", comment: "Moderate nearby industrial emissions.", source: MOCK, source_url: "https://data.wprdc.org/dataset/emissions-inventory", as_of: "2026-09-26", kind: "evidence" },
    { id: "transit", name: "Transit", score: 100, severity: "ok", value: "180 m", comment: "Bus stop within a short walk.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "parks", name: "Parks", score: 75, severity: "ok", value: "520 m", comment: "Park within a 10-minute walk.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "health", name: "Health & emergency", score: 45, severity: "consider", value: "Hospital 2,400 m", comment: "Nearest hospital is over 2 km away.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "schools", name: "Schools", score: 70, severity: "ok", value: "640 m", comment: "Public school within walking distance.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "shops", name: "Shops", score: null, severity: "consider", value: "No data", comment: "Shop counts not loaded for this parcel.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "evidence" },
    { id: "demand", name: "Demand", score: 52, severity: "consider", value: "3.4 permits per 1k units (3 yr)", comment: "Low recent building activity; high vacancy.", source: MOCK, source_url: "https://data.wprdc.org", as_of: "2026-09-26", kind: "assumption" },
  ],
  notes: [
    { severity: "consider", text: "City-owned lot: acquisition goes through the city or Land Bank." },
    { severity: "warn", text: "ADUs are not allowed in any district today.", typology: "adu" },
  ],
  context: [
    { label: "Median household income", value: "$24,300", source_url: "https://data.wprdc.org" },
    { label: "Median rent", value: "$690", source_url: "https://data.wprdc.org" },
  ],
};

export const homewoodEvals: TypologyEval[] = [
  { typology: "duplex", legal: "by_right", legal_reason: "Two-unit dwellings are permitted in R2-L.", demands: ["lot", "transit", "schools"], failing_demands: ["lot"], fit: 75, confidence: 0.81, source: "jev" },
  { typology: "townhome", legal: "needs_approval", legal_reason: "Attached single-family needs a special exception in R2-L.", demands: ["lot", "schools", "parks"], failing_demands: ["lot"], fit: 62, confidence: 0.7, source: "jev" },
  { typology: "senior", legal: "by_right", legal_reason: "Treated like a duplex, which is permitted in R2-L.", demands: ["air", "health", "transit", "slope"], failing_demands: ["air", "health"], fit: 50, confidence: 0.64, source: "jev", major_concern_p: 0.58 },
  { typology: "sfd", legal: "by_right", legal_reason: "Single-family detached is permitted in R2-L.", demands: ["lot", "schools"], failing_demands: ["lot"], fit: 58, confidence: null, source: "rules" },
  { typology: "apartments", legal: "not_allowed", legal_reason: "Four or more units are not permitted in R2-L.", demands: ["lot", "transit"], failing_demands: ["lot"], fit: null, confidence: null, source: "rules" },
  { typology: "adu", legal: "not_allowed", legal_reason: "ADUs aren't permitted in any district today. Pending Bill 2025-1545 would allow them by right.", demands: ["lot"], failing_demands: [], fit: null, confidence: null, source: "rules" },
];
