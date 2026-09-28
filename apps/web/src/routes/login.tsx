import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";

import { BrandWordmark } from "@/components/brand-wordmark";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: RouteComponent,
});

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in. */
function safeRedirect(target: string | undefined) {
  return target && target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/login") ? target : "/dashboard";
}

function RouteComponent() {
  const redirectTo = safeRedirect(Route.useSearch().redirect);
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center">
      <BrandWordmark className="mb-8" />
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {showSignIn ? (
          <SignInForm redirectTo={redirectTo} onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm redirectTo={redirectTo} onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </div>
  );
}
