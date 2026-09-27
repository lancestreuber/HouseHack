import names from "./municipalities.generated.json";

// Parcel MUNICODEs are the County's municipality codes, except that the four
// cities are split into wards: Pittsburgh is 101-132 (the boundary layer has
// it as 100), and Clairton, Duquesne and McKeesport are 2xx, 3xx and 4xx.
const WARD_CITIES: Record<number, number> = { 100: 32, 200: 20, 300: 20, 400: 20 };

export function isCityParcel(municode: number | null | undefined) {
  return municode != null && municode >= 101 && municode <= 132;
}

export function municipalityName(municode: number | null | undefined): string | null {
  if (municode == null) return null;
  const exact = (names as Record<string, string>)[String(municode)];
  if (exact) return exact;
  const base = Math.floor(municode / 100) * 100;
  const ward = municode % 100;
  const maxWard = WARD_CITIES[base];
  return maxWard && ward >= 1 && ward <= maxWard ? (names as Record<string, string>)[String(base)] ?? null : null;
}
