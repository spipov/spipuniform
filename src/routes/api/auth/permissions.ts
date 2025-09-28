import { createServerFileRoute } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { RoleService } from "@/lib/services/role-service";

export const ServerRoute = createServerFileRoute("/api/auth/permissions").methods({
  GET: async ({ request }) => {
    try {
      const req = request;
      const cookie = req.headers.get("cookie");
      const cookiePresent = Boolean(cookie && cookie.length > 0);
      const src = req.headers.get("x-src") || "unknown";
      const referer = req.headers.get("referer") || "";
      const ua = req.headers.get("user-agent") || "";
      // console.log(
      //   `[api/auth/permissions] start method=${req.method} src=${src} cookiePresent=${cookiePresent} referer=${referer} ua=${ua}`
      // );

      // Validate session from request headers
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        // console.warn("[api/auth/permissions] Unauthorized. cookiePresent=", cookiePresent);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get current user's role (hybrid: stored in users table)
      const [current] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const roleName = current?.role || null;
      const normalizedRole = roleName?.toLowerCase();

      // Admin override: grant ALL permissions explicitly
      if (normalizedRole === "admin" || session.user.email === "admin@admin.com") {
        // console.log("[api/auth/permissions] Admin override granted.");
        const allPerms = RoleService.getAllPermissions();
        const permissions: Record<string, boolean> = {};
        for (const p of allPerms) permissions[p.key] = true;
        return new Response(
          JSON.stringify({ role: roleName || "admin", permissions }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Default permissions - no permissions for users without roles
      let permissions: Record<string, boolean> = {} as Record<string, boolean>;

      if (roleName) {
        // console.log("[api/auth/permissions] role=", roleName);
        const [roleRow] = await db
          .select({ permissions: roles.permissions })
          .from(roles)
          .where(eq(roles.name, roleName))
          .limit(1);

        if (roleRow?.permissions && typeof roleRow.permissions === "object") {
          permissions = { ...(roleRow.permissions as Record<string, boolean>) };
        }
      } else {
        // console.log("[api/auth/permissions] No role set for user. Using minimal permissions.");
      }

      return new Response(
        JSON.stringify({ role: roleName, permissions }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("[api/auth/permissions] Error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});