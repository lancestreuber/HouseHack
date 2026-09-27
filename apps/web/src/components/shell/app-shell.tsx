import { Outlet, useLocation } from "@tanstack/react-router";

import { LayersSidebar } from "../explorer/layers-sidebar";
import { NavRail } from "./nav-rail";
import { ShellHeader } from "./shell-header";
import { useShellState } from "./shell-store";

/** App shell: vertical nav rail + console header + routed content. The
 * explorer docks the layers sidebar between rail and content; the login page
 * stays a standalone centered card outside the shell. */
export function AppShell() {
  const { pathname } = useLocation();
  const { sidebarOpen } = useShellState();

  if (pathname === "/login") {
    return <div className="flex h-svh items-center justify-center bg-background p-4"><Outlet /></div>;
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <NavRail />
      {pathname === "/" && sidebarOpen && <LayersSidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
