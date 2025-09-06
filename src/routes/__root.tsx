import React from "react";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import appCss from "../app/styles/app.css?url";

import Header from "../components/Header";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">Page not found</p>
      <a href="/" className="text-blue-600 hover:text-blue-800 underline">
        Go back home
      </a>
    </div>
  );
}

// Apply branding CSS variables and font hints from a branding object
function applyBrandingVars(b: any) {
  if (!b) return;
  const doc = document.documentElement;
  const r = doc.style;
  try { localStorage.setItem('branding:active', JSON.stringify(b || {})); } catch {}
  if (b.primaryColor) r.setProperty('--primary', b.primaryColor);
  if (b.secondaryColor) r.setProperty('--secondary', b.secondaryColor);
  if (b.accentColor) r.setProperty('--accent', b.accentColor);
  const setFont = (key: string, val?: string | null) => {
    if (!val) return;
    const n = String(val).split(',')[0].replace(/["']/g, '').trim();
    if (!n) return;
    r.setProperty(key, `'${n}', sans-serif`);
  };
  setFont('--branding-font-sans', b.fontFamily);
  setFont('--branding-font-heading', b.headingFont || b.fontFamily);
}

function ensureGoogleLink(family: string) {
  const name = family.split(',')[0].trim().replace(/["']/g, '');
  if (!name) return;
  const id = `branding-google-${name.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const encoded = name.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function applyFontHints(b: any) {
  if (!b) return;
  if (b.fontFamily && !/\.(woff2?|ttf|otf)$/i.test(b.fontFamily)) ensureGoogleLink(b.fontFamily);
  if (b.headingFont && !/\.(woff2?|ttf|otf)$/i.test(b.headingFont)) ensureGoogleLink(b.headingFont);
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add('no-theme-transitions');

    // 1) Apply cached branding immediately to avoid FOUC
    try {
      const raw = localStorage.getItem('branding:active');
      if (raw) {
        const cached = JSON.parse(raw);
        applyBrandingVars(cached);
        applyFontHints(cached);
      }
    } catch {}

    // 2) Reveal UI using cached values right away
    setReady(true);

    // 3) Fetch latest branding in background and update if needed
    (async () => {
      try {
        const res = await fetch('/api/branding/active');
        if (res.ok) {
          const json = await res.json();
          const b = json?.data;
          if (b) {
            applyBrandingVars(b);
            applyFontHints(b);
          }
        }
      } catch {}
      // Re-enable transitions next frame to prevent jank
      requestAnimationFrame(() => {
        html.classList.remove('no-theme-transitions');
      });
    })();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

export const Route = createRootRoute({
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
        title: "TanStack Start Starter",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),

  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AppBootstrap>
            <Header />
            {children}
            <Toaster richColors position="top-right" />
            {process.env.NODE_ENV === "development" && (
              <TanStackDevtools
                config={{
                  position: "bottom-left",
                }}
                plugins={[
                  {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            )}
          </AppBootstrap>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
