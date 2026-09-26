import type { Session } from "@HouseHack/auth";
import type { Database } from "@HouseHack/db";

export type Context = {
  session: Session | null;
  db: Database;
};
