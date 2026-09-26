import { createAuthMiddleware, type BetterAuthInstance } from "evlog/better-auth";
import type { H3EventContext } from "evlog";
import { definePlugin } from "nitro";

import { auth } from "../../src/services";

const identify = createAuthMiddleware(auth as BetterAuthInstance, {
  exclude: ["/api/auth/**"],
  maskEmail: true,
});

export default definePlugin((nitroApp) => {
  // Runs on `response`, not `request`: Nitro scans server/plugins/* before
  // installModules(), so evlog's own `request` hook is registered after ours
  // and ctx.log does not exist yet during `request`. By `response` time it
  // does, and this hook still runs before evlog's emits the wide event.
  nitroApp.hooks.hook("response", async (_res, event) => {
    const { log } = (event.req.context ?? {}) as H3EventContext;
    if (!log) return;

    await identify(log, event.req.headers, new URL(event.req.url).pathname);
  });
});
