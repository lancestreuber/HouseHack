import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ParcelMap } from "@/components/parcel-map";

const searchSchema = z.object({
  pin: z.string().optional(),
  w: z.string().optional(),
});

export const Route = createFileRoute("/_auth/app")({
  validateSearch: searchSchema,
  component: HomeComponent,
});

function HomeComponent() {
  const { pin, w } = Route.useSearch();
  return <ParcelMap initialPin={pin} initialWeights={w} />;
}
