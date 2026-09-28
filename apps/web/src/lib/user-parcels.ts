import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

// Favorite and recently viewed parcels for the signed-in user. Signed out,
// nothing is fetched or recorded.

export function useSignedIn() {
  const { data: session } = authClient.useSession();
  return session != null;
}

export function useFavorites() {
  const signedIn = useSignedIn();
  return useQuery({ ...orpc.me.favorites.queryOptions(), enabled: signedIn });
}

export function useViewed() {
  const signedIn = useSignedIn();
  return useQuery({ ...orpc.me.viewed.queryOptions(), enabled: signedIn });
}

export function useSetFavorite() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.me.setFavorite.mutationOptions({
      onSettled: () => queryClient.invalidateQueries({ queryKey: orpc.me.favorites.key() }),
    }),
  );
}

/** Records one view per selected parcel, once its zoning is known (or known missing). */
export function useRecordView(pin: string | null, zoning: string | null | undefined) {
  const signedIn = useSignedIn();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    orpc.me.recordView.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.me.viewed.key() }),
    }),
  );
  const ready = zoning !== undefined;
  useEffect(() => {
    if (signedIn && pin && ready) mutate({ pin, zoning });
    // Once per parcel: a later zoning update shouldn't count as a second view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, pin, ready]);
}
