import { Button } from "@HouseHack/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@HouseHack/ui/components/dialog";
import { Textarea } from "@HouseHack/ui/components/textarea";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { setPillarWeights } from "@/components/map/pillar-weights-store";
import { AUDIENCE_OPTIONS, type AudienceId, CONTEXT_MAX, PRESET_LABEL, PRESET_NOTE, presetWeights } from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

type Profile = { audience: string | null; context: string | null; weightsPreset: string | null };

function Choice({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn("rounded-md border p-2 text-left transition-colors hover:bg-accent/40", selected && "border-brass bg-brass/10")}
    >
      <span className="block font-medium">{title}</span>
      {hint && <span className="block text-muted-foreground">{hint}</span>}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-medium">
        <span className="tnum mr-2 text-brass">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Onboarding questions, shown over the dashboard. First run can't be dismissed; editing can. */
export function OnboardingDialog({ open, onClose, profile, name }: { open: boolean; onClose: () => void; profile: Profile | null; name?: string }) {
  const queryClient = useQueryClient();
  const firstRun = profile == null;
  const [audience, setAudience] = useState<AudienceId | null>(null);
  const [preset, setPreset] = useState<string | null>("equal");
  const [context, setContext] = useState("");

  // Editing: start from the saved answers.
  useEffect(() => {
    if (!open || !profile) return;
    setAudience(profile.audience as AudienceId | null);
    setPreset(profile.weightsPreset);
    setContext(profile.context ?? "");
  }, [open, profile]);

  const save = useMutation(
    orpc.me.saveProfile.mutationOptions({
      onSuccess: async (_, input) => {
        const weights = presetWeights(input.weightsPreset);
        if (weights) setPillarWeights(weights);
        await queryClient.invalidateQueries({ queryKey: orpc.me.profile.key() });
        onClose();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !firstRun && onClose()} disablePointerDismissal={firstRun}>
      <DialogContent
        showCloseButton={!firstRun}
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-none"
        className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-base">{firstRun ? `Welcome${name ? `, ${name}` : ""}` : "Your preferences"}</DialogTitle>
          <DialogDescription>A few questions to set up your dashboard and Parceltongue. You can change these any time.</DialogDescription>
        </DialogHeader>

        <Step n={1} title="Which best describes you?">
          <div className="grid gap-2 sm:grid-cols-2">
            {AUDIENCE_OPTIONS.map((a) => (
              <Choice key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)} title={a.label} />
            ))}
          </div>
        </Step>

        <Step n={2} title="What should scores weigh most?">
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.keys(PRESET_LABEL).map((id) => (
              <Choice key={id} selected={preset === id} onClick={() => setPreset(id)} title={PRESET_LABEL[id]!} hint={PRESET_NOTE[id]} />
            ))}
          </div>
          <p className="text-muted-foreground">Weights are value judgments. Adjust them later from the scale icon in the rail.</p>
        </Step>

        <Step n={3} title="Anything else Parceltongue should know? (optional)">
          <Textarea
            value={context}
            maxLength={CONTEXT_MAX}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            placeholder="Your goal, job or the tasks you're working on. For example: I'm scouting lots in Hazelwood for a 20-unit affordable project."
          />
          <p className="text-muted-foreground">
            The chat assistant uses this to tailor its answers. Don't include private details about other people.
          </p>
        </Step>

        <DialogFooter>
          <Button
            disabled={!audience || save.isPending}
            onClick={() => audience && save.mutate({ audience, weightsPreset: preset, context: context.trim() || null })}
          >
            {save.isPending ? "Saving…" : firstRun ? "Show my dashboard" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
