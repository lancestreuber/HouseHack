import { Link, Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";
import { getUser } from "@/functions/get-user";
import { STEPS, firstIncompleteStepPath } from "@/lib/onboarding";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ location }) => {
    const session = await getUser();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    const profile = await client.onboarding.getProfile();
    if (profile?.completedAt) {
      throw redirect({ to: "/dashboard" });
    }
    const isIndex = location.pathname === "/onboarding" || location.pathname === "/onboarding/";
    if (isIndex) {
      const target = firstIncompleteStepPath(profile);
      if (target !== "/onboarding") {
        throw redirect({ to: target });
      }
    }
    return { session };
  },
  component: OnboardingLayout,
});

/** Standalone full-screen flow: wordmark header with per-step Back, then the
 * step page. The app shell (nav rail, console header) stays out of the way. */
function OnboardingLayout() {
  const { pathname } = useLocation();
  const stepIndex =
    STEPS.find((step) => pathname === step.path || pathname === `${step.path}/`)?.index ?? 1;
  // The confirmation step is terminal: no way back, matching the mock.
  const previous = stepIndex > 1 && stepIndex < 4 ? STEPS[stepIndex - 2] : undefined;

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex w-24 items-center sm:w-32">
          {previous && (
            <Link
              className="flex items-center gap-1 text-xs tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
              to={previous.path}
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
          )}
        </div>
        <BrandWordmark />
        <div className="w-24 sm:w-32" />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
