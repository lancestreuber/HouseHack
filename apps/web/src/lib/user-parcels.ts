import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

// Favorite and recently viewed parcels, and favorite lists, for the signed-in
// user. Signed out, nothing is fetched or recorded.

export type Favorite = { pin: string; zoning: string | null; listId: string | null; position: number; createdAt: Date };

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

export function useLists() {
  const signedIn = useSignedIn();
  return useQuery({ ...orpc.me.lists.queryOptions(), enabled: signedIn });
}

export function useSetFavorite() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.me.setFavorite.mutationOptions({
      onSettled: () => queryClient.invalidateQueries({ queryKey: orpc.me.favorites.key() }),
    }),
  );
}

/** Moves (or favorites) a parcel into a list at a position, updating the favorites cache right away. */
export function useMoveFavorite() {
  const queryClient = useQueryClient();
  const key = orpc.me.favorites.queryKey();
  return useMutation(
    orpc.me.moveFavorite.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: key });
        const before = queryClient.getQueryData<Favorite[]>(key);
        const position = input.position ?? -Date.now();
        const moved = { pin: input.pin, zoning: input.zoning ?? null, listId: input.listId, position, createdAt: new Date() };
        const rest = (before ?? []).filter((f) => f.pin !== input.pin);
        const existing = before?.find((f) => f.pin === input.pin);
        const next = [...rest, existing ? { ...existing, listId: input.listId, position } : moved].sort((a, b) => a.position - b.position);
        queryClient.setQueryData(key, next);
        return { before };
      },
      onError: (_error, _input, ctx) => {
        if (ctx?.before) queryClient.setQueryData(key, ctx.before);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: orpc.me.favorites.key() }),
    }),
  );
}

export function useListMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: orpc.me.lists.key() });
    void queryClient.invalidateQueries({ queryKey: orpc.me.favorites.key() });
  };
  return {
    create: useMutation(orpc.me.createList.mutationOptions({ onSettled: refresh })),
    rename: useMutation(orpc.me.renameList.mutationOptions({ onSettled: refresh })),
    remove: useMutation(orpc.me.deleteList.mutationOptions({ onSettled: refresh })),
  };
}

// Record a view once zoning is known, or after this long even if it isn't
// (the City-scope lookup can be slow or fail, and the view still happened).
const VIEW_WAIT_MS = 2000;

/** Records one view per selected parcel. */
export function useRecordView(pin: string | null, zoning: string | null | undefined) {
  const signedIn = useSignedIn();
  const queryClient = useQueryClient();
  const { mutate } = useMutation(
    orpc.me.recordView.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.me.viewed.key() }),
    }),
  );
  const ready = zoning !== undefined;
  // The parcel whose view was last sent, so the timer and a late zoning don't both count.
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (!pin) sent.current = null;
    if (!signedIn || !pin || sent.current === pin) return;
    const send = (z: string | null) => {
      sent.current = pin;
      mutate({ pin, zoning: z });
    };
    if (ready) return send(zoning ?? null);
    const timer = window.setTimeout(() => send(null), VIEW_WAIT_MS);
    return () => window.clearTimeout(timer);
    // zoning is read only once it's ready; mutate is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, pin, ready]);
}
