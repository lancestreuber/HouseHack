import { createFileRoute } from "@tanstack/react-router";

import { StepProgress } from "@/components/onboarding/step-progress";

export const Route = createFileRoute("/onboarding/done")({
  component: DoneStep,
});

function DoneStep() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <StepProgress label="Workspace Ready" step={4} />
    </div>
  );
}
