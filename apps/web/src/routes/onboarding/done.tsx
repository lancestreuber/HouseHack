import { Button } from "@HouseHack/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { StepProgress } from "@/components/onboarding/step-progress";
import {
  PILLARS,
  PILLAR_LABEL,
  PRIORITY_COLUMN,
  ROLE_LABEL,
  type OnboardingProfileState,
  type Priority,
} from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding/done")({
  component: DoneStep,
});

const PRIORITY_RANK: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

/** Highest-ranked pillar label, or null while priorities are incomplete.
 * Ties resolve to the first pillar in display order. */
function topPillarLabel(profile: OnboardingProfileState): string | null {
  if (!profile) return null;
  let best: { label: string; rank: number } | null = null;
  for (const pillar of PILLARS) {
    const value = profile[PRIORITY_COLUMN[pillar.id]];
    if (!value) return null;
    const rank = PRIORITY_RANK[value];
    if (!best || rank > best.rank) best = { label: PILLAR_LABEL[pillar.id], rank };
  }
  return best?.label ?? null;
}

function DoneStep() {
  const navigate = useNavigate();
  const { session } = Route.useRouteContext();
  const profile = useQuery(orpc.onboarding.getProfile.queryOptions());
  const complete = useMutation(orpc.onboarding.complete.mutationOptions());

  // Landing on the final step marks the flow complete, once.
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || profile.isPending || !profile.data || profile.data.completedAt) return;
    fired.current = true;
    complete.mutate();
  }, [profile.isPending, profile.data, complete]);

  const name = session?.user.name?.trim();
  const roleLabel = profile.data?.role ? ROLE_LABEL[profile.data.role] : null;
  const jurisdiction = profile.data?.jurisdiction ?? null;
  const topPillar = topPillarLabel(profile.data);

  let summary = "We’ve set up your dashboard";
  if (roleLabel) summary += ` for ${roleLabel} work`;
  if (jurisdiction) summary += ` in ${jurisdiction}`;
  if (topPillar) summary += `, weighted toward ${topPillar}`;
  summary += ".";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
      <StepProgress className="mb-16 sm:mb-24" label="Workspace Ready" step={4} />

      <div className="flex w-full flex-col items-center text-center">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground">
          {name ? `Hey, ${name}! Welcome to Yinzone` : "Welcome to Yinzone"}
        </h1>
        <p className="mb-12 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          {summary}
        </p>
        <div className="flex w-full flex-col items-center sm:w-auto">
          <Button
            className="h-12 w-full min-w-[200px] rounded-xl px-8 text-[15px] font-semibold sm:w-auto"
            onClick={() => {
              void navigate({ to: "/dashboard" });
            }}
          >
            Go to dashboard
          </Button>
          <span className="mt-6 text-xs text-faint">
            Preferences can be modified anytime in Workspace Settings.
          </span>
        </div>
      </div>
    </div>
  );
}
