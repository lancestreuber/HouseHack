import { createSystemOne } from "@HouseHack/api/system-one/index";
import { createAuth } from "@HouseHack/auth";
import { createDb } from "@HouseHack/db";

import { ENV } from "./env.server";

// Vercel sets these hostnames on every deployment (system environment
// variables); a preview is reachable on its own URL and on its branch alias.
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter((host): host is string => Boolean(host))
  .map((host) => `https://${host}`);

export const db = createDb(ENV);
export const auth = createAuth(ENV, db, vercelOrigins);
export const systemOne = createSystemOne({
  apiKey: ENV.OPENROUTER_API_KEY,
  baseURL: ENV.SYSTEM_ONE_BASE_URL,
  model: ENV.SYSTEM_ONE_MODEL,
});
