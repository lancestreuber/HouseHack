import { Toaster } from "@HouseHack/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createMiddleware } from "@tanstack/react-start";
import { evlogErrorHandler } from "evlog/nitro/v3";
import { ThemeProvider } from "next-themes";

import type { orpc } from "@/utils/orpc";

import { ChatLauncher } from "../components/chat/chat-launcher";
import { AppShell } from "../components/shell/app-shell";

import appCss from "../index.css?url";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  server: {
    middleware: [createMiddleware().server(evlogErrorHandler)],
  },

  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Yinzone - Affordable Housing Development OS",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Narrow:ital,wght@0,400..700;1,400..700&display=swap",
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const { pathname } = useLocation();
  // The landing page is its own full-bleed page: no app shell, chat or devtools.
  const isLanding = pathname === "/";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {isLanding ? (
            <Outlet />
          ) : (
            <>
              <AppShell />
              <ChatLauncher />
              <TanStackRouterDevtools position="top-right" />
              <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
            </>
          )}
          <Toaster richColors />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
