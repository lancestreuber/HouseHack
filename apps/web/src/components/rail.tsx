import { Tooltip, TooltipContent, TooltipTrigger } from "@HouseHack/ui/components/tooltip";
import { cn } from "@HouseHack/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Map } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";
import UserMenu from "./user-menu";

const NAV = [
  { to: "/", label: "Home", icon: Map },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/todos", label: "Todos", icon: ListChecks },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavButton({ to, label, icon: Icon }: (typeof NAV)[number]) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = isActive(pathname, to);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={to}
            aria-label={label}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-md transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}
            <Icon className="size-5" aria-hidden />
          </Link>
        }
      />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function Logo() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link to="/" aria-label="Groundwork" className="flex size-10 items-center justify-center">
            <span className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-hue-teal to-hue-blue text-sm font-semibold text-primary-foreground">
              G
            </span>
          </Link>
        }
      />
      <TooltipContent side="right">Groundwork</TooltipContent>
    </Tooltip>
  );
}

/** The fixed 48px strip on the far left: logo top, route nav, then theme and
 * user controls pinned to the bottom. Opaque canvas, hairline right border. */
export function Rail() {
  return (
    <aside className="flex h-full w-full flex-col items-center gap-2 border-r border-glass-border bg-canvas py-2">
      <Logo />
      {NAV.map((item) => (
        <NavButton key={item.to} {...item} />
      ))}
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu />
    </aside>
  );
}