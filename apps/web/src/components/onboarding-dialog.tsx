import { Button } from "@HouseHack/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@HouseHack/ui/components/dialog";
import { Textarea } from "@HouseHack/ui/components/textarea";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, HandHeart, Landmark, Loader2, type LucideIcon, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LogoMark } from "@/components/logo-mark";
import { setPillarWeights } from "@/components/map/pillar-weights-store";
import { AUDIENCE_OPTIONS, type AudienceId, CONTEXT_MAX, PRESET_HINT, PRESET_LABEL, presetWeights } from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

export type Profile = { audience: string | null; context: string | null; weightsPreset: string | null; onboardedAt: Date | string | null };

const STEPS = ["Who you are", "Scoring baseline", "Context for Parceltongue"] as const;
const AUDIENCE_ICON: Record<AudienceId, LucideIcon> = { planner: Landmark, cdc: HandHeart, developer: Building2, public: Users };

/** The first step still unanswered, so a skipped onboarding resumes where it stopped. */
export function resumeStep(profile: Profile | null) {
  if (!profile?.audience) return 0;
  if (!profile.weightsPreset) return 1;
  return 2;
}

function ProgressSegments({ step }: { step: number }) {
  return (
    <div className="grid h-1 w-full gap-1" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
      {STEPS.map((label, i) => (
        <div key={label} className={cn("h-full rounded-sm", i <= step ? "bg-brass" : "bg-accent")} />
      ))}
    </div>
  );
}

function Choice({ selected, onClick, title, hint, icon: Icon }: { selected: boolean; onClick: () => void; title: string; hint?: string; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn("group flex gap-3 rounded-xl p-3 text-left transition-colors", selected ? "bg-secondary ring-1 ring-brass" : "bg-card hover:bg-secondary")}
    >
      {Icon && (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            selected ? "bg-brass/20 text-brass" : "bg-accent text-muted-foreground group-hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      )}
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        {hint && <span className="mt-0.5 block text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

/**
 * Onboarding over the dashboard, one step at a time. Each step saves as you
 * go, so "Skip for now" (or closing it) keeps what's answered and the dashboard
 * offers to resume. Reopened from Edit once finished.
 */
export function OnboardingDialog({ open, onClose, profile, name }: { open: boolean; onClose: () => void; profile: Profile | null; name?: string }) {
  const queryClient = useQueryClient();
  const finished = profile?.onboardedAt != null;
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<AudienceId | null>(null);
  const [preset, setPreset] = useState<string | null>("equal");
  // "Balanced" starts selected; only a real pick (or Continue) counts as answering step 2.
  const [presetPicked, setPresetPicked] = useState(false);
  const [context, setContext] = useState("");

  // On open: load saved answers and jump to the first unanswered step.
  useEffect(() => {
    if (!open) return;
    setAudience((profile?.audience as AudienceId | null) ?? null);
    setPreset(profile?.weightsPreset ?? "equal");
    setPresetPicked(profile?.weightsPreset != null);
    setContext(profile?.context ?? "");
    setStep(finished ? 0 : resumeStep(profile));
    // Only when it opens: later profile refetches shouldn't reset the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation(
    orpc.me.saveProfile.mutationOptions({
      onSuccess: (_, input) => {
        const weights = presetWeights(input.weightsPreset);
        if (weights) setPillarWeights(weights);
        void queryClient.invalidateQueries({ queryKey: orpc.me.profile.key() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  // Only this step's answer, so going back and forth never clears another.
  const answer = (skipping = false) =>
    step === 0
      ? audience
        ? { audience }
        : {}
      : step === 1
        ? skipping && !presetPicked
          ? {}
          : { weightsPreset: preset }
        : { context: context.trim() || null };
  const last = step === STEPS.length - 1;
  const next = () =>
    save.mutate({ ...answer(), ...(last ? { finish: "complete" as const } : {}) }, { onSuccess: () => (last ? onClose() : setStep(step + 1)) });
  const skip = () => save.mutate({ ...answer(true), finish: "skip" }, { onSuccess: onClose });
  // Closing a first run counts as skipping; closing an edit discards it.
  const dismiss = () => (finished ? onClose() : skip());
  const canContinue = step !== 0 || audience != null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-none"
        className="max-h-[calc(100svh-4rem)] gap-5 overflow-y-auto rounded-xl p-6 sm:max-w-2xl"
      >
        <div className="flex flex-col gap-2 pr-6">
          <div className="flex items-center justify-between text-xs">
            <span className="tnum flex items-center gap-2 font-semibold tracking-wider text-foreground uppercase">
              <LogoMark className="size-4 text-brass" />
              Step 0{step + 1} / 0{STEPS.length}
            </span>
            <span className="text-muted-foreground">{STEPS[step]}</span>
          </div>
          <ProgressSegments step={step} />
        </div>

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {step === 0 ? (finished ? "Your preferences" : `Welcome${name ? `, ${name}` : ""}`) : step === 1 ? "What should scores weigh most?" : "Anything else Parceltongue should know?"}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {step === 0
              ? "Which best describes you? This tailors your dashboard and Parceltongue."
              : step === 1
                ? "This sets your default scoring weights. Weights are value judgments; adjust them any time from the scale icon in the rail."
                : "Optional. Your goal, job or the tasks you're working on; the chat assistant uses it to tailor its answers."}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div role="radiogroup" aria-label="Which best describes you" className="grid gap-2 sm:grid-cols-2">
            {AUDIENCE_OPTIONS.map((a) => (
              <Choice key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)} title={a.label} icon={AUDIENCE_ICON[a.id]} />
            ))}
          </div>
        )}
        {step === 1 && (
          <div role="radiogroup" aria-label="Scoring weights" className="grid gap-2 sm:grid-cols-3">
            {Object.keys(PRESET_LABEL).map((id) => (
              <Choice
                key={id}
                selected={preset === id}
                onClick={() => {
                  setPreset(id);
                  setPresetPicked(true);
                }} title={PRESET_LABEL[id]!} hint={PRESET_HINT[id]} />
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-1.5">
            <Textarea
              value={context}
              maxLength={CONTEXT_MAX}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              className="rounded-lg bg-background"
              placeholder="For example: I'm scouting lots in Hazelwood for a 20-unit affordable project."
            />
            <p className="text-muted-foreground">Don't include private details about other people.</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 text-xs tracking-wider text-muted-foreground uppercase hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
            {!finished && (
              <button
                type="button"
                disabled={save.isPending}
                onClick={skip}
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground disabled:opacity-50"
              >
                Skip for now
              </button>
            )}
          </div>
          <Button className="rounded-lg px-5 font-semibold" disabled={!canContinue || save.isPending} onClick={next}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {last ? (finished ? "Save" : "Finish") : "Continue"}
            {!last && <ArrowRight />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
