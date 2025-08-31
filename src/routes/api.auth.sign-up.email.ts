import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

export const ServerRoute = createServerFileRoute("/api/auth/sign-up/email").methods({
  POST: async ({ request }) => {
    return auth.handler(request);
  },
});