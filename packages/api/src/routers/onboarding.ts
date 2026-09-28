import { onboardingProfile } from "@HouseHack/db/schema/onboarding";
import { eq } from "drizzle-orm";
import z from "zod";

import type { Context } from "../context";
import { protectedProcedure } from "../index";

export const onboardingRoleSchema = z.enum(["regulator", "developer"]);
export const pillarPrioritySchema = z.enum(["low", "medium", "high"]);

export const onboardingPrioritiesSchema = z.object({
  demand: pillarPrioritySchema,
  feasibility: pillarPrioritySchema,
  affordability: pillarPrioritySchema,
  opportunity: pillarPrioritySchema,
  climate: pillarPrioritySchema,
});

export const onboardingLocationSchema = z.object({
  jurisdiction: z.string().min(1).max(200).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lon: z.number().min(-180).max(180).nullable(),
});

type ProfileValues = Partial<typeof onboardingProfile.$inferInsert>;

async function upsertProfile(context: Context, values: ProfileValues) {
  const userId = context.session?.user.id;
  if (!userId) return null;
  const rows = await context.db
    .insert(onboardingProfile)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: onboardingProfile.userId, set: values })
    .returning();
  return rows[0] ?? null;
}

export const onboardingRouter = {
  getProfile: protectedProcedure.handler(async ({ context }) => {
    const rows = await context.db
      .select()
      .from(onboardingProfile)
      .where(eq(onboardingProfile.userId, context.session.user.id));
    return rows[0] ?? null;
  }),

  saveRole: protectedProcedure
    .input(z.object({ role: onboardingRoleSchema }))
    .handler(async ({ context, input }) => {
      return upsertProfile(context, { role: input.role });
    }),

  savePriorities: protectedProcedure
    .input(onboardingPrioritiesSchema)
    .handler(async ({ context, input }) => {
      return upsertProfile(context, {
        demandPriority: input.demand,
        feasibilityPriority: input.feasibility,
        affordabilityPriority: input.affordability,
        opportunityPriority: input.opportunity,
        climatePriority: input.climate,
      });
    }),

  saveLocation: protectedProcedure.input(onboardingLocationSchema).handler(async ({ context, input }) => {
    return upsertProfile(context, {
      jurisdiction: input.jurisdiction,
      jurisdictionLat: input.lat,
      jurisdictionLon: input.lon,
    });
  }),

  complete: protectedProcedure.handler(async ({ context }) => {
    return upsertProfile(context, { completedAt: new Date() });
  }),
};
