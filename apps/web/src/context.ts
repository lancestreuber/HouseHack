import type { Context as ApiContext } from "@HouseHack/api/context";

import { ENV } from "./env.server";
import { db } from "./services";
import { auth } from "./services";

export async function createContext({ req }: { req: Request }): Promise<ApiContext> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    db,
    session,
    geminiApiKey: ENV.GEMINI_API_KEY,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
