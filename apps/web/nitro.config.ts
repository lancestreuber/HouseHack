import evlog from "evlog/nitro/v3";
import { defineConfig } from "nitro";

export default defineConfig({
  // Nitro defaults serverDir to false; without this, server/plugins/* is
  // never scanned and the evlog plugins silently never run.
  serverDir: "./server",
  experimental: {
    asyncContext: true,
  },
  modules: [
    evlog({
      env: { service: "HouseHack-web" },
    }),
  ],
  vercel: {
    functions: {
      // The chat's Gemini client retries across up to 3 models, each with its
      // own timeout -- worst case is comfortably longer than Vercel's default
      // function duration (10-15s depending on plan), which silently kills
      // the request before Gemini answers. 60s is the max Hobby allows.
      maxDuration: 60,
    },
  },
});
