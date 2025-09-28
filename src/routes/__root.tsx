import React from "react";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import appCss from "../app/styles/app.css?url";

import Header from "@/components/layout/Header";

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

function applyFontHints(b: any) {
  // Keep as a no-op for now; early font CSS injection worsened FOUT in this app.
  return;
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [cssReady, setCssReady] = React.useState(false);

  React.useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add('no-theme-transitions');

    // 0) Wait for main stylesheet to be loaded to avoid FOUC
    const link: HTMLLinkElement | null = document.querySelector(
      `link[rel="stylesheet"][href="${appCss}"]`
    );
    if (link) {
      if ((link as any).sheet) {
        setCssReady(true);
      } else {
        const onLoad = () => setCssReady(true);
        link.addEventListener('load', onLoad, { once: true });
        // Fallback safety timer
        const t = window.setTimeout(() => setCssReady(true), 2000);
        return () => {
          link.removeEventListener('load', onLoad);
          window.clearTimeout(t);
        };
      }
    } else {
      // If not found, assume ready next frame (dev/HMR edge cases)
      requestAnimationFrame(() => setCssReady(true));
    }
  }, []);

  React.useLayoutEffect(() => {
    // 1) Apply cached branding immediately to avoid FOUC
    try {
      const raw = localStorage.getItem('branding:active');
      if (raw) {
        const cached = JSON.parse(raw);
        applyBrandingVars(cached);
        applyFontHints(cached);
      }
    } catch {}

    // 2) Fetch latest branding in background and update if needed
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
        document.documentElement.classList.remove('no-theme-transitions');
      });
    })();
  }, []);

  if (!cssReady) return null;
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
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", href: appCss, as: "style" },
      { rel: "stylesheet", href: appCss },
    ],
  }),

  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Minimal pre-paint branding & transition guard */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(() => { try { var d = document.documentElement; d.classList.add('no-theme-transitions'); var raw = localStorage.getItem('branding:active'); if (!raw) return; var b = JSON.parse(raw); var r = d.style; if (b.primaryColor) r.setProperty('--primary', b.primaryColor); if (b.secondaryColor) r.setProperty('--secondary', b.secondaryColor); if (b.accentColor) r.setProperty('--accent', b.accentColor); if (b.backgroundColor) r.setProperty('--background', b.backgroundColor); if (b.textColor) r.setProperty('--foreground', b.textColor); } catch(e){} })();`,
          }}
        />
        {/* Silence console output on the client */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(() => { try { var c = window.console; if (!c) return; var noop = function(){}; ['log','info','warn','debug','trace'].forEach(function(k){ try { if (typeof c[k] === 'function') c[k] = noop; } catch(e){} }); } catch(e){} })();`,
          }}
        />
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
