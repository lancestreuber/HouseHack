import type { Database } from "@HouseHack/db";
import { favoriteParcel, userProfile, viewedParcel } from "@HouseHack/db/schema/user-data";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure } from "../index";

export const AUDIENCES = ["planner", "cdc", "developer", "public"] as const;
type Audience = (typeof AUDIENCES)[number];
export const CONTEXT_MAX = 1000;

// The four onboarding audiences fold into two roles: people who set the rules and people who build.
const ROLE_OF: Record<Audience, "zoning_regulator" | "developer"> = {
  planner: "zoning_regulator",
  public: "zoning_regulator",
  cdc: "developer",
  developer: "developer",
};

const AUDIENCE_TEXT: Record<Audience, string> = {
  planner: "a municipal planner testing zoning and infrastructure scenarios",
  cdc: "with a community development corporation, choosing projects that meet local needs",
  developer: "a developer evaluating product type and likely market demand",
  public: "a resident or public official comparing alternative growth patterns",
};

/** The chat assistant's note about who's asking, from their saved onboarding answers. */
export async function userChatNote(db: Database, userId: string): Promise<string | undefined> {
  const [row] = await db.select().from(userProfile).where(eq(userProfile.userId, userId));
  if (!row) return undefined;
  const audience = AUDIENCE_TEXT[row.audience as Audience];
  const who = `They are ${audience ?? row.role.replace("_", " ")} (role: ${row.role.replace("_", " ")}).`;
  return row.context ? `${who} In their words: "${row.context}"` : who;
}

const pin = z.string().regex(/^[0-9A-Z]{8,20}$/);
const zoning = z.string().max(20).nullable().optional();
// How many recently viewed parcels the dashboard keeps per user.
const VIEWED_LIMIT = 50;

const profileInput = z.object({
  audience: z.enum(AUDIENCES),
  context: z.string().trim().max(CONTEXT_MAX).nullable(),
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
    const values = { ...input, role: ROLE_OF[input.audience] };
    await context.db
      .insert(userProfile)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: userProfile.userId, set: values });
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
