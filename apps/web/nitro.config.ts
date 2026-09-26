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
});
