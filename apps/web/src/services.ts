import { createSystemOne } from "@HouseHack/api/system-one/index";
import { createAuth } from "@HouseHack/auth";
import { createDb } from "@HouseHack/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
export const systemOne = createSystemOne({
  apiKey: ENV.OPENROUTER_API_KEY,
  baseURL: ENV.SYSTEM_ONE_BASE_URL,
  model: ENV.SYSTEM_ONE_MODEL,
});
