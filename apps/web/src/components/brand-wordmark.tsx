import { cn } from "@HouseHack/ui/lib/utils";

/** Yinzone wordmark with the pulsing brass node, used above the login card
 * and in the onboarding header. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)}>
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-brass" />
      </span>
      <span className="text-lg font-semibold tracking-[0.35em] text-foreground uppercase">
        Yinzone
      </span>
    </div>
  );
}
