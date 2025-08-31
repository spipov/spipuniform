import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

export const ServerRoute = createServerFileRoute("/api/auth/get-session").methods({
  GET: async ({ request }) => {
    return auth.handler(request);
  },
});