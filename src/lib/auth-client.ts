import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3100",
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, admin } = authClient;
