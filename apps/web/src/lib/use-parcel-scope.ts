import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

import { isCityParcel, municipalityName } from "./city-scope";

export type ParcelScope =
  | { status: "loading" }
  // The lookup failed or the code is missing: fall back to the score data.
  | { status: "unknown" }
  | { status: "city"; municode: number }
  | { status: "outside"; municode: number; name: string | null };

/** Whether a selected parcel is inside the City, from the assessor's
 * municipality code. Pending counts as "loading", so panels don't flash
 * City content for a suburban parcel. */
export function useParcelScope(pin: string | null): ParcelScope {
  const query = useQuery({
    ...orpc.parcels.getMunicode.queryOptions({ input: { pin: pin ?? "" } }),
    enabled: Boolean(pin),
    staleTime: Number.POSITIVE_INFINITY,
  });
  if (query.isError) return { status: "unknown" };
  if (!query.data) return { status: "loading" };
  const { municode } = query.data;
  if (municode == null) return { status: "unknown" };
  if (isCityParcel(municode)) return { status: "city", municode };
  return { status: "outside", municode, name: municipalityName(municode) };
}
