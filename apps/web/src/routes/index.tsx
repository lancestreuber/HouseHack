import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ParcelMap } from "@/components/parcel-map";

const searchSchema = z.object({
  pin: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  component: HomeComponent,
});

function HomeComponent() {
  const { pin } = Route.useSearch();
  return <ParcelMap initialPin={pin} />;
}
