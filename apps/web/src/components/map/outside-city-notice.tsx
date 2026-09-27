import { MapPinOff } from "lucide-react";

import type { ParcelScope } from "@/lib/use-parcel-scope";

function placeName(scope: ParcelScope | undefined) {
  return scope?.status === "outside" && scope.name ? scope.name : "another municipality";
}

/** Shown in place of scores, verdicts and zoning when the selected parcel is
 * outside the City: other municipalities have their own zoning codes, which
 * the app doesn't encode. */
export function OutsideCityNotice({ scope, compact = false }: { scope: ParcelScope | undefined; compact?: boolean }) {
  const place = placeName(scope);
  if (compact) {
    return (
      <p className="text-muted-foreground">
        Outside the City of Pittsburgh ({place}). This tool covers City parcels only.
      </p>
    );
  }
  return (
    <section className="space-y-1.5 rounded border border-border/60 bg-foreground/5 p-3">
      <p className="flex items-center gap-1.5 font-medium">
        <MapPinOff className="size-3.5 shrink-0" />
        Outside the City of Pittsburgh
      </p>
      <p>
        This parcel is in <span className="font-medium">{place}</span>.
      </p>
      <p className="text-muted-foreground">
        Yinzone only covers the City of Pittsburgh's zoning code. {place === "another municipality" ? "Each municipality" : place} has its own
        zoning rules, which we don't encode, so we show no scores, verdicts or zoning here. Check with the municipality's zoning office.
      </p>
    </section>
  );
}
