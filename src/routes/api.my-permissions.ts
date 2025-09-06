import { createServerFileRoute } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const ServerRoute = createServerFileRoute("/api/my-permissions").methods({
  GET: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get current user's role
      const [current] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const roleName = current?.role || null;

      // Default minimal permissions: allow viewing dashboard
      let permissions: Record<string, boolean> = { viewDashboard: true } as Record<string, boolean>;

      if (roleName) {
        const [roleRow] = await db
          .select({ permissions: roles.permissions })
          .from(roles)
          .where(eq(roles.name, roleName))
          .limit(1);

        if (roleRow?.permissions && typeof roleRow.permissions === "object") {
          permissions = { viewDashboard: true, ...(roleRow.permissions as Record<string, boolean>) };
        }
      }

      return new Response(
        JSON.stringify({
          role: roleName,
          permissions,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching my permissions:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});