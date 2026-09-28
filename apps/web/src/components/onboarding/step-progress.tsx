import { cn } from "@HouseHack/ui/lib/utils";

/** The 4-segment progress track: brass through the current step, dark after. */
export function ProgressSegments({ step, className }: { step: number; className?: string }) {
  return (
    <div className={cn("grid h-1 w-full grid-cols-4 gap-1", className)}>
      {[1, 2, 3, 4].map((segment) => (
        <div
          key={segment}
          className={cn("h-full rounded-sm", segment <= step ? "bg-brass" : "bg-accent")}
        />
      ))}
    </div>
  );
}

/** Step row used by steps 2-4: "STEP 0N / 04" left, phase label right, track
 * below. Step 1 composes ProgressSegments with its own centered row. */
export function StepProgress({
  step,
  label,
  className,
}: {
  step: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="tnum font-semibold tracking-wider text-foreground uppercase">
          Step 0{step} / 04
        </span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <ProgressSegments step={step} />
    </div>
  );
}
