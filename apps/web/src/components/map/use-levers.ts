import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { orpc } from "@/utils/orpc";

import { computeLevers, loadLeverData } from "./levers";

export function useLevers(pin: string | null, zoning: string | null, typologyId: string) {
  const centroid = useQuery({
    ...orpc.parcels.getCentroid.queryOptions({ input: { pin: pin ?? "" } }),
    enabled: Boolean(pin),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const data = useQuery({ queryKey: ["lever-data"], queryFn: loadLeverData, staleTime: Number.POSITIVE_INFINITY });
  const loaded = data.data;
  const waiting = centroid.isLoading;
  const at = centroid.data;
  const levers = useMemo(() => {
    if (!pin || zoning == null || !loaded || waiting) return null;
    return computeLevers(pin, zoning, typologyId, at ? [at.lng, at.lat] : null, loaded);
  }, [pin, zoning, typologyId, loaded, waiting, at]);
  return { levers, isError: data.isError };
}
