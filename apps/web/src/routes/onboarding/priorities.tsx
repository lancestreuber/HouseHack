import { Button } from "@HouseHack/ui/components/button";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, Loader2 } from "lucide-react";
import { useState } from "react";

import { StepProgress } from "@/components/onboarding/step-progress";
import {
  DEFAULT_PRIORITIES,
  PILLARS,
  PRIORITY_COLUMN,
  type OnboardingPillarId,
  type Priority,
} from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding/priorities")({
  component: PrioritiesStep,
});

const PRIORITY_CHOICES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

type PriorityValues = Record<OnboardingPillarId, Priority>;

function PrioritiesStep() {
  const navigate = useNavigate();
  const profile = useQuery(orpc.onboarding.getProfile.queryOptions());
  const [overrides, setOverrides] = useState<Partial<PriorityValues>>({});

  // Edited values win, then anything already stored, then the mock defaults.
  const valueOf = (pillar: OnboardingPillarId): Priority => {
    const stored = profile.data?.[PRIORITY_COLUMN[pillar]];
    return overrides[pillar] ?? stored ?? DEFAULT_PRIORITIES[pillar];
  };

  const currentValues = (): PriorityValues => ({
    demand: valueOf("demand"),
    feasibility: valueOf("feasibility"),
    affordability: valueOf("affordability"),
    opportunity: valueOf("opportunity"),
    climate: valueOf("climate"),
  });

  const savePriorities = useMutation(
    orpc.onboarding.savePriorities.mutationOptions({
      onSuccess: () => {
        void profile.refetch();
        void navigate({ to: "/onboarding/location" });
      },
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <StepProgress label="Scoring Model Baseline" step={2} />

      <div className="flex flex-col gap-1 pt-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          What matters most to you?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          We'll use this to set your default scoring weights across regional land parcels.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {PILLARS.map((pillar) => (
          <div
            className="flex flex-col justify-between gap-4 rounded-xl bg-card p-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center"
            key={pillar.id}
          >
            <div className="flex flex-col gap-1 pr-0 sm:pr-4">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-foreground">{pillar.label}</span>
                <span className="tnum text-[11px] text-faint">[{pillar.code}]</span>
              </div>
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                {pillar.description}
              </p>
            </div>
            <div
              aria-label={`${pillar.label} priority`}
              className="flex shrink-0 items-center self-start rounded-lg bg-background p-1 sm:self-center"
              role="radiogroup"
            >
              {PRIORITY_CHOICES.map((choice) => {
                const active = valueOf(pillar.id) === choice.value;
                return (
                  <button
                    aria-checked={active}
                    className={cn(
                      "cursor-pointer rounded px-2.5 py-1 text-xs transition-colors",
                      active
                        ? "bg-brass font-semibold text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    key={choice.value}
                    onClick={() => setOverrides((prev) => ({ ...prev, [pillar.id]: choice.value }))}
                    role="radio"
                    type="button"
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between">
          <button
            className="cursor-pointer text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={savePriorities.isPending}
            onClick={() => savePriorities.mutate(DEFAULT_PRIORITIES)}
            type="button"
          >
            Skip for now
          </button>
          <Button
            className="rounded-lg px-5 py-2 font-semibold"
            disabled={savePriorities.isPending}
            onClick={() => savePriorities.mutate(currentValues())}
          >
            {savePriorities.isPending ? <Loader2 className="animate-spin" /> : null}
            Continue
          </Button>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Info className="size-4 shrink-0 text-faint" />
          <p className="text-xs">
            Weights can be adjusted manually on any parcel or saved as custom presets later.
          </p>
        </div>
      </div>
    </div>
  );
}
