import { Outlet, useLocation } from "@tanstack/react-router";

import { NavRail } from "./nav-rail";
import { ShellHeader } from "./shell-header";

/** App shell: vertical nav rail + console header + routed content. The login
 * page stays a standalone centered card outside the shell. */
export function AppShell() {
  const { pathname } = useLocation();

  if (pathname === "/login") {
    return <div className="flex h-svh items-center justify-center bg-background p-4"><Outlet /></div>;
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
