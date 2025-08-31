import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3100",
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, admin } = authClient;
