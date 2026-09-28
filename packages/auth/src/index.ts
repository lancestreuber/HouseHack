import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@HouseHack/db";
import * as schema from "@HouseHack/db/schema/auth";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
};

/**
 * `extraOrigins`: other origins that serve this same deployment (a Vercel
 * preview answers on its deployment URL and its branch alias), trusted
 * alongside BETTER_AUTH_URL so sign-in doesn't fail with INVALID_ORIGIN there.
 */
export function createAuth(env: AuthConfig, database: Database, extraOrigins: string[] = []) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: [env.BETTER_AUTH_URL, ...extraOrigins],
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [tanstackStartCookies()],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
