import { Link, useLocation } from "@tanstack/react-router";
import { FileText, LayoutGrid, Map } from "lucide-react";
import type { ReactNode } from "react";

import { LogoMark } from "../logo-mark";
import { ThemeToggle } from "../theme-toggle";
import UserMenu from "../user-menu";
import { EngineSettings } from "./engine-settings";

function RailLink({ to, active, label, children }: { to: string; active: boolean; label: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-10 w-full items-center justify-center rounded-lg transition-colors ${
        active ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      }`}
    >
      {active && <span className="absolute top-1 bottom-1 left-0 w-[2px] rounded-r bg-brass" aria-hidden />}
      {children}
    </Link>
  );
}

/** Fixed vertical navigation rail: the app's only chrome-level navigation. */
export function NavRail() {
  const { pathname } = useLocation();

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3">
      <Link
        to="/"
        aria-label="Yinzone home"
        className="mb-2 flex size-9 shrink-0 items-center justify-center rounded-lg border border-brass/40 bg-brass/10 text-brass"
      >
        <LogoMark className="size-5" />
      </Link>
      <RailLink to="/app" active={pathname === "/app"} label="Explorer">
        <Map className="size-5" />
      </RailLink>
      <RailLink to="/dashboard" active={pathname.startsWith("/dashboard")} label="Dashboard">
        <LayoutGrid className="size-5" />
      </RailLink>
      <RailLink to="/resources" active={pathname.startsWith("/resources")} label="Resources & methodology">
        <FileText className="size-5" />
      </RailLink>
      <div className="flex-1" />
      <ThemeToggle />
      <EngineSettings />
      <UserMenu />
    </nav>
  );
}
