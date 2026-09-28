import { createFileRoute } from "@tanstack/react-router";

import { StepProgress } from "@/components/onboarding/step-progress";

export const Route = createFileRoute("/onboarding/priorities")({
  component: PrioritiesStep,
});

function PrioritiesStep() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <StepProgress label="Scoring Model Baseline" step={2} />
    </div>
  );
}
