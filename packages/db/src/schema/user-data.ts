import { index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

// Per-user app data. Parcels are stored by PIN only (plus the zoning code seen
// at the time, for display); never owner names or other parcel PII.

/** Answers from the onboarding page. A row exists once onboarding is done. */
export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "zoning_regulator" or "developer". */
  role: text("role").notNull(),
  /** Which onboarding option they picked (a finer-grained audience within the role). */
  audience: text("audience"),
  /** Free text about their goal, job or tasks; given to the chat assistant as context. */
  context: text("context"),
  /** Pillar-weight preset picked during onboarding (a pillars.config.json preset name). */
  weightsPreset: text("weights_preset"),
  onboardedAt: timestamp("onboarded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const favoriteParcel = pgTable(
  "favorite_parcel",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pin: text("pin").notNull(),
    zoning: text("zoning"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.pin] }), index("favorite_parcel_userId_idx").on(table.userId)],
);

export const viewedParcel = pgTable(
  "viewed_parcel",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pin: text("pin").notNull(),
    zoning: text("zoning"),
    views: integer("views").default(1).notNull(),
    lastViewedAt: timestamp("last_viewed_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.pin] }), index("viewed_parcel_user_last_idx").on(table.userId, table.lastViewedAt)],
);

