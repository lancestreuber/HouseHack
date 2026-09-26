import type { Session } from "@HouseHack/auth";
import type { Database } from "@HouseHack/db";

import type { SystemOne } from "./system-one";

export type Context = {
  session: Session | null;
  db: Database;
  systemOne: SystemOne;
};
