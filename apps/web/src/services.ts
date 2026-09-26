import { createAuth } from "@HouseHack/auth";
import { createDb } from "@HouseHack/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
