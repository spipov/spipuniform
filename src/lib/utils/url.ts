export function getBaseUrl(): string {
  // 1. Check for explicit environment variable
  const envVar = import.meta.env.VITE_BASE_URL;
  if (envVar) return envVar;

  // 2. In browser, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 3. Server-side fallbacks
  if (import.meta.env.VITE_VERCEL_URL) return `https://${import.meta.env.VITE_VERCEL_URL}`;
  if (import.meta.env.VITE_NETLIFY_URL) return import.meta.env.VITE_NETLIFY_URL;

  // 4. Development fallback
  return 'http://localhost:3350'; // Adjust port as needed
}

export function getAuthBaseUrl(): string {
  const authVar = import.meta.env.VITE_BETTER_AUTH_URL;
  return authVar || getBaseUrl();
}