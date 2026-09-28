import { doublePrecision, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

// Per-user app data. Parcels are stored by PIN only (plus the zoning code seen
// at the time, for display); never owner names or other parcel PII.

/** Onboarding answers, saved step by step so onboarding can be skipped and resumed. */
export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** "zoning_regulator" or "developer"; null until the first step is answered. */
  role: text("role"),
  /** Which onboarding option they picked (a finer-grained audience within the role). */
  audience: text("audience"),
  /** Free text about their goal, job or tasks; given to the chat assistant as context. */
  context: text("context"),
  /** Pillar-weight preset picked during onboarding (a pillars.config.json preset name). */
  weightsPreset: text("weights_preset"),
  /** Set when every step is done; null while onboarding is in progress. */
  onboardedAt: timestamp("onboarded_at"),
  /** Set when the user chose "Skip for now", so the dashboard stops opening onboarding. */
  skippedAt: timestamp("skipped_at"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/** A user's named list of favorite parcels (each favorite sits in at most one list). */
export const parcelList = pgTable(
  "parcel_list",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("parcel_list_userId_idx").on(table.userId)],
);

export const favoriteParcel = pgTable(
  "favorite_parcel",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pin: text("pin").notNull(),
    zoning: text("zoning"),
    /** The user's own name for the parcel, shown instead of the PIN. */
    nickname: text("nickname"),
    /** null = the default "Favorites" list. */
    listId: text("list_id").references(() => parcelList.id, { onDelete: "set null" }),
    /** Manual order within its list (drag and drop); lower comes first. */
    position: doublePrecision("position").default(0).notNull(),
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

