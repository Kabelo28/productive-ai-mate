import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const NAV = [
  { to: "/", icon: "◧", label: "Overview" },
  { to: "/email", icon: "✉", label: "Smart Email" },
  { to: "/notes", icon: "▤", label: "Meeting Notes" },
  { to: "/planner", icon: "◷", label: "Task Planner" },
  { to: "/research", icon: "✦", label: "Research" },
  { to: "/chat", icon: "❏", label: "Chatbot" },
] as const;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-ink">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-mute">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-mute">
          Something went wrong on our end. You can try refreshing or head back to the
          dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg ring-1 ring-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-panel/70"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Meridian — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Meridian automates repetitive workplace tasks: draft emails, summarize meetings, plan work and research faster.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="border-b border-line md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen flex md:flex-col bg-surface z-10">
      <div className="flex items-center gap-2.5 px-5 py-4 md:py-5">
        <div className="size-7 rounded-md bg-gradient-to-br from-accent/90 to-accent/30 grid place-items-center ring-1 ring-white/10">
          <span className="size-2 rounded-full bg-surface" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-semibold tracking-tight text-[15px]">Meridian</p>
          <p className="text-[11px] text-faint">Workplace Intelligence</p>
        </div>
      </div>
      <nav className="flex gap-1 px-3 pb-3 md:pb-0 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-mute hover:text-ink hover:bg-white/[.03]"
            activeProps={{ className: "bg-white/[.05] text-ink ring-1 ring-white/5" }}
          >
            <span className="size-4 shrink-0 grid place-items-center">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="hidden md:block mt-auto px-5 py-4 border-t border-line">
        <p className="text-[11px] text-faint mb-2.5 uppercase tracking-[0.12em]">
          Responsible AI
        </p>
        <p className="text-[11px] leading-relaxed text-mute">
          AI outputs may contain errors. Verify important information before business use or
          external sending. Never enter confidential data.
        </p>
      </div>
    </aside>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface text-ink text-sm">
        <div className="mx-auto max-w-[1440px] md:grid md:grid-cols-[248px_1fr]">
          <Sidebar />
          <main className="px-5 py-6 md:px-8 md:py-7 min-w-0">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
