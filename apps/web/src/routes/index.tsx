import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { LandingPage } from "@/landing/landing-page";

const searchSchema = z.object({
  pin: z.string().optional(),
  w: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,

  loader: ({ location }) => {
    const params = new URLSearchParams(location.search);
    const pin = params.get("pin");
    const w = params.get("w");
    if (pin || w) {
      throw redirect({
        to: "/app",
        search: { ...(pin ? { pin } : {}), ...(w ? { w } : {}) },
      });
    }
  },

  head: () => ({
    meta: [
      {
        title: "YINZONE — Viability intelligence from parcel to precinct",
      },
      {
        name: "description",
        content:
          "Yinzone unifies municipal land records, 3D contour topography, environmental hazards, and codified statutes into a deterministic clearance pipeline. Automate site feasibility at scale.",
      },
    ],
  }),

  component: LandingPage,
});
