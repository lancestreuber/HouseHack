import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { CircleDot, FileText, LayoutGrid, Map, PanelRightOpen } from "lucide-react";
import type { ReactNode } from "react";

import UserMenu from "../user-menu";
import { EngineSettings } from "./engine-settings";
import { toggleInspector, toggleSidebar, useShellState } from "./shell-store";

function RailButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-10 w-full items-center justify-center rounded-lg transition-colors ${
        active ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      }`}
    >
      {active && <span className="absolute top-1 bottom-1 left-0 w-[2px] rounded-r bg-brass" aria-hidden />}
      {children}
    </button>
  );
}

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

/** Fixed vertical navigation rail: the app's only chrome-level navigation.
 * The map button doubles as the layers-sidebar restore toggle while on the
 * explorer, and a conditional icon restores a collapsed inspector. */
export function NavRail() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, inspectorOpen } = useShellState();
  const onExplorer = pathname === "/";

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3">
      <Link
        to="/"
        aria-label="Yinzone home"
        className="mb-2 flex size-9 shrink-0 items-center justify-center rounded-lg border border-brass/40 bg-brass/10 text-brass"
      >
        <CircleDot className="size-5" />
      </Link>
      <RailButton
        active={onExplorer}
        label={onExplorer && sidebarOpen ? "Hide layers sidebar" : "Explorer and layers sidebar"}
        onClick={() => (onExplorer ? toggleSidebar() : void navigate({ to: "/" }))}
      >
        <Map className="size-5" />
      </RailButton>
      <RailLink to="/dashboard" active={pathname.startsWith("/dashboard")} label="Dashboard">
        <LayoutGrid className="size-5" />
      </RailLink>
      <RailLink to="/resources" active={pathname.startsWith("/resources")} label="Resources & methodology">
        <FileText className="size-5" />
      </RailLink>
      {onExplorer && !inspectorOpen && (
        <RailButton label="Show parcel inspector" onClick={toggleInspector}>
          <PanelRightOpen className="size-5" />
        </RailButton>
      )}
      <div className="flex-1" />
      <EngineSettings />
      <UserMenu />
    </nav>
  );
}
