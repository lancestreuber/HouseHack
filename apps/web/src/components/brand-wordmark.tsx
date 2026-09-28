import { cn } from "@HouseHack/ui/lib/utils";

import { LogoMark } from "./logo-mark";

/** Yinzone wordmark: the brass logo mark and the name, used above the login card. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)}>
      <LogoMark className="size-6 text-brass" />
      <span className="text-lg font-semibold tracking-[0.35em] text-foreground uppercase">
        Yinzone
      </span>
    </div>
  );
}
