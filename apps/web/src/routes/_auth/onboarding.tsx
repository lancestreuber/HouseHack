import { Button } from "@HouseHack/ui/components/button";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { setLegalFor } from "@/components/map/legal-for-store";
import { TYPOLOGIES } from "@/components/map/overlays/legal-feasibility";
import { setPillarWeights } from "@/components/map/pillar-weights-store";
import { PRESET_LABEL, PRESET_NOTE, presetWeights, ROLE_OPTIONS, type RoleId } from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/onboarding")({
  component: OnboardingPage,
});

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
      <h2 className="text-sm font-medium">
        <span className="tnum mr-2 text-brass">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** First-run questions after sign-up. Answers shape the dashboard and the explorer's defaults. */
function OnboardingPage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useQuery(orpc.me.profile.queryOptions());
  const [role, setRole] = useState<RoleId | null>(null);
  const [typology, setTypology] = useState<string | null>(null);
  const [preset, setPreset] = useState<string | null>("equal");

  // Editing again: start from the saved answers.
  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setRole(p.role as RoleId);
    setTypology(p.typology);
    setPreset(p.weightsPreset);
  }, [profile.data]);

  const save = useMutation(
    orpc.me.saveProfile.mutationOptions({
      onSuccess: async (_, input) => {
        const weights = presetWeights(input.weightsPreset);
        if (weights) setPillarWeights(weights);
        if (input.typology) setLegalFor(input.typology);
        await queryClient.invalidateQueries({ queryKey: orpc.me.profile.key() });
        navigate({ to: "/dashboard" });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 text-xs">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Welcome{session?.user.name ? `, ${session.user.name}` : ""}</h1>
        <p className="text-muted-foreground">Three quick questions to set up your dashboard. You can change these any time.</p>
      </header>

      <Step n={1} title="What brings you here?">
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((r) => (
            <Choice key={r.id} selected={role === r.id} onClick={() => setRole(r.id)} title={r.label} hint={r.hint} />
          ))}
        </div>
      </Step>

      <Step n={2} title="Which housing type are you most interested in?">
        <div className="grid gap-2 sm:grid-cols-3">
          <Choice selected={typology === null} onClick={() => setTypology(null)} title="No preference" hint="Score against the easiest type" />
          {TYPOLOGIES.map(([id, label]) => (
            <Choice key={id} selected={typology === id} onClick={() => setTypology(id)} title={label} />
          ))}
        </div>
      </Step>

      <Step n={3} title="What should scores weigh most?">
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.keys(PRESET_LABEL).map((id) => (
            <Choice key={id} selected={preset === id} onClick={() => setPreset(id)} title={PRESET_LABEL[id]!} hint={PRESET_NOTE[id]} />
          ))}
        </div>
        <p className="text-muted-foreground">Weights are value judgments. Adjust them later from the scale icon in the rail.</p>
      </Step>

      <div className="flex justify-end gap-2">
        {profile.data && (
          <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
            Cancel
          </Button>
        )}
        <Button disabled={!role || save.isPending} onClick={() => role && save.mutate({ role, typology, weightsPreset: preset })}>
          {save.isPending ? "Saving…" : profile.data ? "Save" : "Go to my dashboard"}
        </Button>
      </div>
    </div>
  );
}
