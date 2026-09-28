import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { chatRouter } from "./chat";
import { onboardingRouter } from "./onboarding";
import { parcelsRouter } from "./parcels";
import { todoRouter } from "./todo";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  todo: todoRouter,
  parcels: parcelsRouter,
  chat: chatRouter,
  onboarding: onboardingRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
