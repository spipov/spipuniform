import * as React from 'react';

// Tiny runtime that applies branding fonts and colors in a Tailwind-safe way by
// setting CSS variables and injecting only required font loaders.
// - --branding-font-sans and --branding-font-heading are mapped in styles.css
// - Primary, secondary, and accent colors are applied to Tailwind theme variables
// - No global CSS overrides of Tailwind rules; only variables are set

type ActiveBranding = {
  fontFamily?: string | null;
  headingFont?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
};

function isFontFile(spec?: string | null): boolean {
  if (!spec) return false;
  return /\.(woff2?|ttf|otf)$/i.test(spec);
}

function cleanFamilyName(spec: string): string {
  // Mirror server logic: drop timestamp prefix, extension, replace separators
  return spec
    .replace(/^\d+_/, '')
    .replace(/\.(woff2|woff|otf|ttf)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

function computeCssFont(spec?: string | null): string {
  if (!spec) return 'Inter, sans-serif';
  if (isFontFile(spec)) {
    return `'${cleanFamilyName(spec)}', sans-serif`;
  }
  // Treat as a web/system font name
  const name = spec.split(',')[0].trim().replace(/["']/g, '');
  return `'${name}', sans-serif`;
}

function googleImportUrl(family: string): string {
  const name = family.split(',')[0].trim().replace(/["']/g, '');
  const encoded = name.replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700&display=swap`;
}

function ensureGoogleLink(family: string) {
  const id = `branding-google-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = googleImportUrl(family);
  document.head.appendChild(link);
}

function ensureFontFaceForFile(fileName: string) {
  const id = `branding-fontface-${fileName}`;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  const ext = fileName.split('.').pop()?.toLowerCase();
  let format = 'woff2';
  if (ext === 'woff') format = 'woff';
  if (ext === 'otf') format = 'opentype';
  if (ext === 'ttf') format = 'truetype';
  const family = cleanFamilyName(fileName).replace(/["']/g, '');
  style.textContent = `@font-face {\n  font-family: '${family}';\n  src: url('/uploads/fonts/${fileName}') format('${format}');\n  font-weight: 300 800;\n  font-style: normal;\n  font-display: swap;\n}`;
  document.head.appendChild(style);
}

async function fetchActiveBranding(): Promise<ActiveBranding | null> {
  try {
    const res = await fetch('/api/branding/active');
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export function BrandingRuntime() {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchActiveBranding();
      if (cancelled) return;

      // Persist first so next refresh can use it pre-paint
      try { localStorage.setItem('branding:active', JSON.stringify(data || {})); } catch {}

      // Briefly disable transitions to avoid any color flip
      const html = document.documentElement;
      html.classList.add('no-theme-transitions');

      const bodyFont = data?.fontFamily ?? 'Inter';
      const headingFont = data?.headingFont ?? bodyFont;

      // Load fonts
      if (isFontFile(bodyFont)) {
        ensureFontFaceForFile(bodyFont);
      } else {
        ensureGoogleLink(bodyFont);
      }
      if (headingFont && headingFont !== bodyFont) {
        if (isFontFile(headingFont)) ensureFontFaceForFile(headingFont);
        else ensureGoogleLink(headingFont);
      }

      // Set CSS vars Tailwind maps to
      const root = document.documentElement.style;
      root.setProperty('--branding-font-sans', computeCssFont(bodyFont));
      root.setProperty('--branding-font-heading', computeCssFont(headingFont));
      if (data?.primaryColor) root.setProperty('--primary', data.primaryColor);
      if (data?.secondaryColor) root.setProperty('--secondary', data.secondaryColor);
      if (data?.accentColor) root.setProperty('--accent', data.accentColor);

      // Re-enable transitions next frame
      requestAnimationFrame(() => {
        html.classList.remove('no-theme-transitions');
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export default BrandingRuntime;

