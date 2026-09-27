import { createFileRoute, redirect } from "@tanstack/react-router";

// The chat's standing definitions cite "/methodology"; that content lives on /resources.
export const Route = createFileRoute("/methodology")({
  beforeLoad: () => {
    throw redirect({ to: "/resources" });
  },
});
