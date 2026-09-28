import { defineRelationsPart } from "drizzle-orm";
import { doublePrecision, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const onboardingRole = pgEnum("onboarding_role", ["regulator", "developer"]);

export const pillarPriority = pgEnum("pillar_priority", ["low", "medium", "high"]);

export const onboardingProfile = pgTable("onboarding_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  role: onboardingRole("role"),
  demandPriority: pillarPriority("demand_priority"),
  feasibilityPriority: pillarPriority("feasibility_priority"),
  affordabilityPriority: pillarPriority("affordability_priority"),
  opportunityPriority: pillarPriority("opportunity_priority"),
  climatePriority: pillarPriority("climate_priority"),
  jurisdiction: text("jurisdiction"),
  jurisdictionLat: doublePrecision("jurisdiction_lat"),
  jurisdictionLon: doublePrecision("jurisdiction_lon"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const onboardingRelations = defineRelationsPart({ user, onboardingProfile }, (r) => ({
  user: {
    onboardingProfile: r.one.onboardingProfile({
      from: r.user.id,
      to: r.onboardingProfile.userId,
    }),
  },
  onboardingProfile: {
    user: r.one.user({
      from: r.onboardingProfile.userId,
      to: r.user.id,
    }),
  },
}));
