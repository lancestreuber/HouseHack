import { Button } from "@HouseHack/ui/components/button";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, Landmark, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { ProgressSegments } from "@/components/onboarding/step-progress";
import { authClient } from "@/lib/auth-client";
import { ROLES, type OnboardingRole } from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding/")({
  component: RoleStep,
});

function RoleStep() {
  const navigate = useNavigate();
  const profile = useQuery(orpc.onboarding.getProfile.queryOptions());
  // The mock preselects Developer.
  const [role, setRole] = useState<OnboardingRole>("developer");

  useEffect(() => {
    if (profile.data?.role) setRole(profile.data.role);
  }, [profile.data]);

  const saveRole = useMutation(
    orpc.onboarding.saveRole.mutationOptions({
      onSuccess: () => {
        void profile.refetch();
        void navigate({ to: "/onboarding/priorities" });
      },
    }),
  );

  const handleSignOut = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          void navigate({ to: "/login" });
        },
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex cursor-not-allowed items-center gap-1 text-xs tracking-wider uppercase opacity-30">
            <ArrowLeft className="size-4" />
            Back
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] text-brass uppercase">
            Step 1 of 4 • Role Identification
          </span>
          <button
            className="text-xs tracking-wider uppercase transition-colors hover:text-foreground"
            onClick={handleSignOut}
            type="button"
          >
            Sign Out
          </button>
        </div>
        <ProgressSegments className="pt-1" step={1} />
      </div>

      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Who are you?</h1>
        <p className="text-[15px] text-muted-foreground">This helps us tailor your dashboard</p>
      </div>

      <div
        aria-label="Role Identification"
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2"
        role="radiogroup"
      >
        {ROLES.map((option) => {
          const selected = role === option.id;
          const Icon = option.id === "regulator" ? Landmark : Building2;
          return (
            <button
              aria-checked={selected}
              className={cn(
                "group flex cursor-pointer flex-col justify-between rounded-xl p-4 text-left transition-colors",
                selected ? "bg-secondary ring-1 ring-brass" : "bg-card hover:bg-secondary",
              )}
              key={option.id}
              onClick={() => setRole(option.id)}
              role="radio"
              type="button"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg",
                      selected
                        ? "bg-brass/20 text-brass"
                        : "bg-accent text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full",
                      selected ? "bg-brass" : "bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        selected ? "bg-background" : "bg-transparent",
                      )}
                    />
                  </span>
                </div>
                <div>
                  <div className="mb-1 text-[15px] font-semibold text-foreground">
                    {option.label}
                  </div>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Lock className="size-4 text-faint" />
          <span>Permissions and workspace modules calibrate based on this profile.</span>
        </div>
        <Button
          className="ml-auto rounded-lg px-4 py-2 font-semibold"
          disabled={saveRole.isPending}
          onClick={() => saveRole.mutate({ role })}
        >
          {saveRole.isPending ? <Loader2 className="animate-spin" /> : null}
          <span>Continue</span>
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
