import { createFileRoute } from "@tanstack/react-router";

import { ParcelMap } from "@/components/parcel-map";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <ParcelMap />;
}
