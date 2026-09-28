import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { BrandWordmark } from "@/components/brand-wordmark";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center">
      <BrandWordmark className="mb-8" />
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </div>
  );
}
