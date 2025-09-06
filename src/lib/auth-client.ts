import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const baseURL = (import.meta.env && import.meta.env.VITE_PUBLIC_BASE_URL)
  ? import.meta.env.VITE_PUBLIC_BASE_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3100');

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, admin } = authClient;
