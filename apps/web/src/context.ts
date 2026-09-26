import type { Context as ApiContext } from "@HouseHack/api/context";

import { db } from "./services";
import { auth } from "./services";
import { systemOne } from "./services";

export async function createContext({ req }: { req: Request }): Promise<ApiContext> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    db,
    session,
    systemOne,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
