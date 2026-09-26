import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { chatRouter } from "./chat";
import { parcelsRouter } from "./parcels";
import { todoRouter } from "./todo";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  // TEMPORARY diagnostic for the "gemini key not reaching prod" investigation.
  // Remove once resolved.
  debugEnv: publicProcedure.handler(({ context }) => ({
    contextHasKey: Boolean(context.geminiApiKey),
    contextKeyLen: context.geminiApiKey?.length ?? 0,
    rawProcessHasKey: Boolean(process.env.GEMINI_API_KEY),
    rawProcessKeyLen: process.env.GEMINI_API_KEY?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  })),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  todo: todoRouter,
  parcels: parcelsRouter,
  chat: chatRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
