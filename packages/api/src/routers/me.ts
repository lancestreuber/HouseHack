import { favoriteParcel, userProfile, viewedParcel } from "@HouseHack/db/schema/user-data";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure } from "../index";

export const ROLES = ["resident", "developer", "nonprofit", "city_staff", "advocate", "researcher"] as const;

const pin = z.string().regex(/^[0-9A-Z]{8,20}$/);
const zoning = z.string().max(20).nullable().optional();
// How many recently viewed parcels the dashboard keeps per user.
const VIEWED_LIMIT = 50;

const profileInput = z.object({
  role: z.enum(ROLES),
  typology: z.string().max(40).nullable(),
  weightsPreset: z.string().max(40).nullable(),
});

/** The signed-in user's own data: onboarding answers, favorite and recently viewed parcels. */
export const meRouter = {
  profile: protectedProcedure.handler(async ({ context }) => {
    const [row] = await context.db.select().from(userProfile).where(eq(userProfile.userId, context.session.user.id));
    return row ?? null;
  }),

  saveProfile: protectedProcedure.input(profileInput).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    await context.db
      .insert(userProfile)
      .values({ userId, ...input })
      .onConflictDoUpdate({ target: userProfile.userId, set: input });
    return { ok: true };
  }),

  favorites: protectedProcedure.handler(async ({ context }) => {
    return context.db
      .select({ pin: favoriteParcel.pin, zoning: favoriteParcel.zoning, createdAt: favoriteParcel.createdAt })
      .from(favoriteParcel)
      .where(eq(favoriteParcel.userId, context.session.user.id))
      .orderBy(desc(favoriteParcel.createdAt));
  }),

  setFavorite: protectedProcedure
    .input(z.object({ pin, zoning, favorite: z.boolean() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      if (input.favorite) {
        await context.db
          .insert(favoriteParcel)
          .values({ userId, pin: input.pin, zoning: input.zoning ?? null })
          .onConflictDoNothing();
      } else {
        await context.db.delete(favoriteParcel).where(and(eq(favoriteParcel.userId, userId), eq(favoriteParcel.pin, input.pin)));
      }
      return { pin: input.pin, favorite: input.favorite };
    }),

  viewed: protectedProcedure.handler(async ({ context }) => {
    return context.db
      .select({ pin: viewedParcel.pin, zoning: viewedParcel.zoning, views: viewedParcel.views, lastViewedAt: viewedParcel.lastViewedAt })
      .from(viewedParcel)
      .where(eq(viewedParcel.userId, context.session.user.id))
      .orderBy(desc(viewedParcel.lastViewedAt))
      .limit(VIEWED_LIMIT);
  }),

  recordView: protectedProcedure.input(z.object({ pin, zoning })).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    await context.db
      .insert(viewedParcel)
      .values({ userId, pin: input.pin, zoning: input.zoning ?? null })
      .onConflictDoUpdate({
        target: [viewedParcel.userId, viewedParcel.pin],
        set: { views: sql`${viewedParcel.views} + 1`, lastViewedAt: sql`now()`, zoning: input.zoning ?? sql`${viewedParcel.zoning}` },
      });
    return { ok: true };
  }),

  clearViewed: protectedProcedure.handler(async ({ context }) => {
    await context.db.delete(viewedParcel).where(eq(viewedParcel.userId, context.session.user.id));
    return { ok: true };
  }),
};
