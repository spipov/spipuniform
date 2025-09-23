import { createServerFileRoute } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/auth/admin-exists").methods({
  GET: async () => {
    try {
      const adminUsers = await db.select()
        .from(user)
        .where(eq(user.role, "admin"))
        .limit(1);

      return new Response(JSON.stringify({
        success: true,
        exists: adminUsers.length > 0
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to check admin status"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
});