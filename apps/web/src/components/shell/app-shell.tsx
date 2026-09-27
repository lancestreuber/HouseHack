import { Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { LayersSidebar } from "../explorer/layers-sidebar";
import { NavRail } from "./nav-rail";
import { ShellHeader } from "./shell-header";
import { setShellState, toggleSidebar, useShellState } from "./shell-store";

/** App shell: vertical nav rail + console header + routed content. The
 * explorer docks the layers sidebar between rail and content; below 1024px
 * the sidebar becomes a slide-over drawer. The login page stays a standalone
 * centered card outside the shell. */
export function AppShell() {
  const { pathname } = useLocation();
  const { sidebarOpen } = useShellState();

  // Docked trays are desktop affordances; start collapsed on small viewports.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      if (mq.matches) setShellState({ sidebarOpen: false, inspectorOpen: false });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (pathname === "/login") {
    return <div className="flex h-svh items-center justify-center bg-background p-4"><Outlet /></div>;
  }

  const isExplorer = pathname === "/";

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <NavRail />
      {isExplorer && sidebarOpen && (
        <>
          <div className="max-lg:fixed max-lg:inset-y-0 max-lg:left-14 max-lg:z-40 max-lg:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <LayersSidebar />
          </div>
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={toggleSidebar}
            aria-hidden
          />
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
