import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { getAuthBaseUrl } from "@/lib/utils/url";

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, admin } = authClient;
