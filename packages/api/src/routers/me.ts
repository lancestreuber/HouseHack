import type { Database } from "@HouseHack/db";
import { favoriteParcel, parcelList, userProfile, viewedParcel } from "@HouseHack/db/schema/user-data";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
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
  if (!row?.role) return undefined;
  const audience = AUDIENCE_TEXT[row.audience as Audience];
  const who = `They are ${audience ?? row.role.replace("_", " ")} (role: ${row.role.replace("_", " ")}).`;
  return row.context ? `${who} In their words: "${row.context}"` : who;
}

const pin = z.string().regex(/^[0-9A-Z]{8,20}$/);
const zoning = z.string().max(20).nullable().optional();
// How many recently viewed parcels the dashboard keeps per user.
const VIEWED_LIMIT = 50;
const listName = z.string().trim().min(1).max(60);
const listId = z.string().uuid();
// New favorites go to the top of their list.
const topPosition = () => -Date.now();

// Starred for every account on first visit so the dashboard isn't empty. City
// parcels in different neighborhoods and zoning districts; nicknames name the
// place only. Zoning is from the parcel score data (2026-09-27 build).
export const DEMO_FAVORITES = [
  { pin: "0010R00175000001", zoning: "RM-M", nickname: "Hill District: Centre Ave" },
  { pin: "0174J00379000000", zoning: "LNC", nickname: "Homewood: Frankstown Ave" },
  { pin: "0056K00182000002", zoning: "R1D-M", nickname: "Hazelwood: Second Ave" },
  { pin: "0049B00287000000", zoning: "R1A-H", nickname: "Lawrenceville: near Butler St" },
  { pin: "0084B00121000000", zoning: "UNC", nickname: "East Liberty: Penn Ave" },
  { pin: "0035F00261000000", zoning: "LNC", nickname: "Beechview: Broadway Ave" },
];

/** Adds the demo favorites once per account (existing ones included). */
async function seedDemoFavorites(db: Database, userId: string) {
  const [row] = await db.select({ seeded: userProfile.demoSeededAt }).from(userProfile).where(eq(userProfile.userId, userId));
  if (row?.seeded) return;
  await db
    .insert(favoriteParcel)
    .values(DEMO_FAVORITES.map((f, i) => ({ userId, ...f, position: i + 1 })))
    .onConflictDoNothing();
  await db
    .insert(userProfile)
    .values({ userId, demoSeededAt: new Date() })
    .onConflictDoUpdate({ target: userProfile.userId, set: { demoSeededAt: new Date() } });
}

async function assertOwnList(db: Database, userId: string, id: string) {
  const [row] = await db.select({ id: parcelList.id }).from(parcelList).where(and(eq(parcelList.id, id), eq(parcelList.userId, userId)));
  if (!row) throw new ORPCError("NOT_FOUND", { message: "List not found" });
}

// Every field is optional: each onboarding step saves only its own answer.
const profileInput = z.object({
  audience: z.enum(AUDIENCES).optional(),
  context: z.string().trim().max(CONTEXT_MAX).nullable().optional(),
  weightsPreset: z.string().max(40).nullable().optional(),
  /** "complete" finishes onboarding; "skip" puts it off (answers so far are kept). */
  finish: z.enum(["complete", "skip"]).optional(),
});

/** The signed-in user's own data: onboarding answers, favorite and recently viewed parcels. */
export const meRouter = {
  profile: protectedProcedure.handler(async ({ context }) => {
    const [row] = await context.db.select().from(userProfile).where(eq(userProfile.userId, context.session.user.id));
    return row ?? null;
  }),

  saveProfile: protectedProcedure.input(profileInput).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const { finish, ...answers } = input;
    const values = {
      ...answers,
      ...(answers.audience ? { role: ROLE_OF[answers.audience] } : {}),
      ...(finish === "complete" ? { onboardedAt: new Date() } : {}),
      ...(finish === "skip" ? { skippedAt: new Date() } : {}),
    };
    await context.db
      .insert(userProfile)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: userProfile.userId, set: values });
    return { ok: true };
  }),

  favorites: protectedProcedure.handler(async ({ context }) => {
    await seedDemoFavorites(context.db, context.session.user.id);
    return context.db
      .select({
        pin: favoriteParcel.pin,
        zoning: favoriteParcel.zoning,
        nickname: favoriteParcel.nickname,
        listId: favoriteParcel.listId,
        position: favoriteParcel.position,
        createdAt: favoriteParcel.createdAt,
      })
      .from(favoriteParcel)
      .where(eq(favoriteParcel.userId, context.session.user.id))
      .orderBy(asc(favoriteParcel.position), desc(favoriteParcel.createdAt));
  }),

  setFavorite: protectedProcedure
    .input(z.object({ pin, zoning, favorite: z.boolean() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      if (input.favorite) {
        await context.db
          .insert(favoriteParcel)
          .values({ userId, pin: input.pin, zoning: input.zoning ?? null, position: topPosition() })
          .onConflictDoNothing();
      } else {
        await context.db.delete(favoriteParcel).where(and(eq(favoriteParcel.userId, userId), eq(favoriteParcel.pin, input.pin)));
      }
      return { pin: input.pin, favorite: input.favorite };
    }),

  /** Put a parcel in a list (null = Favorites) at a position, favoriting it first if needed. Drag and drop and the list menu use this. */
  moveFavorite: protectedProcedure
    .input(z.object({ pin, zoning, listId: listId.nullable(), position: z.number().finite().optional() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      if (input.listId) await assertOwnList(context.db, userId, input.listId);
      const position = input.position ?? topPosition();
      await context.db
        .insert(favoriteParcel)
        .values({ userId, pin: input.pin, zoning: input.zoning ?? null, listId: input.listId, position })
        .onConflictDoUpdate({ target: [favoriteParcel.userId, favoriteParcel.pin], set: { listId: input.listId, position } });
      return { ok: true };
    }),

  /** Names (or, with null, un-names) one of the user's favorites. */
  setNickname: protectedProcedure
    .input(z.object({ pin, nickname: z.string().trim().max(80).nullable() }))
    .handler(async ({ input, context }) => {
      await context.db
        .update(favoriteParcel)
        .set({ nickname: input.nickname || null })
        .where(and(eq(favoriteParcel.userId, context.session.user.id), eq(favoriteParcel.pin, input.pin)));
      return { ok: true };
    }),

  lists: protectedProcedure.handler(async ({ context }) => {
    return context.db
      .select({ id: parcelList.id, name: parcelList.name, createdAt: parcelList.createdAt })
      .from(parcelList)
      .where(eq(parcelList.userId, context.session.user.id))
      .orderBy(asc(parcelList.createdAt));
  }),

  createList: protectedProcedure.input(z.object({ name: listName })).handler(async ({ input, context }) => {
    const [row] = await context.db
      .insert(parcelList)
      .values({ id: crypto.randomUUID(), userId: context.session.user.id, name: input.name })
      .returning({ id: parcelList.id, name: parcelList.name, createdAt: parcelList.createdAt });
    return row!;
  }),

  renameList: protectedProcedure.input(z.object({ id: listId, name: listName })).handler(async ({ input, context }) => {
    await context.db
      .update(parcelList)
      .set({ name: input.name })
      .where(and(eq(parcelList.id, input.id), eq(parcelList.userId, context.session.user.id)));
    return { ok: true };
  }),

  /** Deletes the list; its parcels stay favorites and move back to Favorites. */
  deleteList: protectedProcedure.input(z.object({ id: listId })).handler(async ({ input, context }) => {
    await context.db.delete(parcelList).where(and(eq(parcelList.id, input.id), eq(parcelList.userId, context.session.user.id)));
    return { ok: true };
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
