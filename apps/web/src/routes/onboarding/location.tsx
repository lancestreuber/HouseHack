import { Button } from "@HouseHack/ui/components/button";
import { cn } from "@HouseHack/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LocationPreviewMap } from "@/components/onboarding/location-preview-map";
import { StepProgress } from "@/components/onboarding/step-progress";
import { DEFAULT_JURISDICTION, JURISDICTIONS } from "@/lib/onboarding";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/onboarding/location")({
  component: LocationStep,
});

type Coordinates = { lat: number; lon: number; zoom: number; epsg: string | null };

const toCoordinates = (jurisdiction: (typeof JURISDICTIONS)[number]): Coordinates => ({
  lat: jurisdiction.lat,
  lon: jurisdiction.lon,
  zoom: jurisdiction.zoom,
  epsg: jurisdiction.epsg,
});

const DEFAULT_COORDINATES = toCoordinates(DEFAULT_JURISDICTION);

function formatCoordinates(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${
    lon >= 0 ? "E" : "W"
  }`;
}

function LocationStep() {
  const navigate = useNavigate();
  const profile = useQuery(orpc.onboarding.getProfile.queryOptions());

  const [text, setText] = useState(DEFAULT_JURISDICTION.label);
  const [coords, setCoords] = useState<Coordinates | null>(DEFAULT_COORDINATES);
  const initialized = useRef(false);

  // Pre-fill once from the stored profile (resume after sign-out).
  useEffect(() => {
    if (initialized.current || profile.isPending) return;
    initialized.current = true;
    const data = profile.data;
    if (!data?.jurisdiction) return;
    setText(data.jurisdiction);
    const chip = JURISDICTIONS.find((candidate) => candidate.label === data.jurisdiction);
    if (chip) {
      setCoords(toCoordinates(chip));
    } else if (data.jurisdictionLat != null && data.jurisdictionLon != null) {
      setCoords({ lat: data.jurisdictionLat, lon: data.jurisdictionLon, zoom: 10, epsg: null });
    } else {
      setCoords(null);
    }
  }, [profile.isPending, profile.data]);

  const saveLocation = useMutation(
    orpc.onboarding.saveLocation.mutationOptions({
      onSuccess: () => {
        void profile.refetch();
        void navigate({ to: "/onboarding/done" });
      },
    }),
  );

  const handleTextChange = (value: string) => {
    setText(value);
    const chip = JURISDICTIONS.find((candidate) => candidate.label === value.trim());
    setCoords(chip ? toCoordinates(chip) : null);
  };

  const handleChipSelect = (jurisdiction: (typeof JURISDICTIONS)[number]) => {
    setText(jurisdiction.label);
    setCoords(toCoordinates(jurisdiction));
  };

  const handleClear = () => {
    setText("");
    setCoords(null);
  };

  const jurisdiction = text.trim() || null;
  const coordLabel = coords
    ? `${coords.epsg ? `${coords.epsg} • ` : ""}${formatCoordinates(coords.lat, coords.lon)}`
    : "Awaiting coordinate lock...";
  const layerLabel =
    coords && jurisdiction ? `${jurisdiction} Cadastre Layer v4.2` : "Awaiting selection";
  // The viewport always shows somewhere: fall back to Pittsburgh when the
  // free text has no coordinate lock.
  const view = coords ?? DEFAULT_COORDINATES;

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6 px-4 py-8 sm:px-6">
      <StepProgress label="Geographic Scope" step={3} />

      <div className="flex flex-col gap-6 rounded-xl bg-card p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Where do you work?
          </h1>
          <p className="text-[15px] text-muted-foreground">
            We'll center your map here — you can change this anytime
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-12 w-full items-center rounded-xl bg-background px-4 shadow-sm transition-all focus-within:ring-1 focus-within:ring-brass">
            <Search className="mr-2 size-[18px] shrink-0 text-faint" />
            <input
              className="w-full bg-transparent text-[15px] text-foreground placeholder:text-faint focus:outline-none"
              onChange={(event) => handleTextChange(event.target.value)}
              placeholder="Search a city, region, or ZIP code..."
              type="text"
              value={text}
            />
            {text && (
              <button
                aria-label="Clear search"
                className="ml-2 cursor-pointer p-0.5 text-faint transition-colors hover:text-foreground"
                onClick={handleClear}
                type="button"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="mr-1 text-xs text-faint select-none">Quick bounds:</span>
            {JURISDICTIONS.map((option) => {
              const active = text.trim() === option.label;
              return (
                <button
                  className={cn(
                    "cursor-pointer rounded-lg px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  key={option.label}
                  onClick={() => handleChipSelect(option)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative h-56 w-full overflow-hidden rounded-xl bg-background shadow-inner">
          <LocationPreviewMap lat={view.lat} lon={view.lon} zoom={view.zoom} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-brass/10">
                <div className="size-2.5 rounded-full bg-brass" />
              </div>
              <div className="h-6 w-px bg-brass/40" />
              <div className="mt-1 rounded bg-card/90 px-2 py-0.5 text-[11px] tracking-wider text-foreground uppercase backdrop-blur-sm">
                Focal Origin
              </div>
            </div>
          </div>
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-lg bg-card/90 px-2 py-1 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-brass" />
            <span className="text-[11px] tracking-wider text-muted-foreground uppercase">
              {layerLabel}
            </span>
          </div>
          <div className="absolute right-2 bottom-2 z-10 rounded-lg bg-card/90 px-2 py-1 backdrop-blur-sm">
            <span className="tnum font-mono text-[11px] text-muted-foreground">{coordLabel}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            className="cursor-pointer py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saveLocation.isPending}
            onClick={() => saveLocation.mutate({ jurisdiction: null, lat: null, lon: null })}
            type="button"
          >
            Skip for now
          </button>
          <Button
            className="rounded-lg px-5 py-2 font-semibold"
            disabled={saveLocation.isPending}
            onClick={() =>
              saveLocation.mutate({
                jurisdiction,
                lat: coords?.lat ?? null,
                lon: coords?.lon ?? null,
              })
            }
          >
            {saveLocation.isPending ? <Loader2 className="animate-spin" /> : null}
            Continue
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-1 text-muted-foreground">
        <Info className="size-4 shrink-0 text-faint" />
        <span className="text-xs">
          Coverage extends across all major US metropolitan cadastre registries and GIS parcel
          servers.
        </span>
      </div>
    </div>
  );
}
