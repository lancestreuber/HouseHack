import { createFileRoute } from "@tanstack/react-router";

import { StepProgress } from "@/components/onboarding/step-progress";

export const Route = createFileRoute("/onboarding/location")({
  component: LocationStep,
});

function LocationStep() {
  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6 px-4 py-8 sm:px-6">
      <StepProgress label="Geographic Scope" step={3} />
    </div>
  );
}
