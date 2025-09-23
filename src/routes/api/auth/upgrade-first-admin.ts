import { createServerFileRoute } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const ServerRoute = createServerFileRoute("/api/auth/upgrade-first-admin").methods({
  POST: async ({ request }) => {
    try {
      const { userId } = await request.json();

      // Safety check: ensure no admin exists
      const existingAdmins = await db.select()
        .from(user)
        .where(eq(user.role, "admin"))
        .limit(1);

      if (existingAdmins.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Admin already exists"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Promote user to admin
      const [updatedUser] = await db.update(user)
        .set({
          role: "admin",
          approved: true,
          emailVerified: true
        })
        .where(eq(user.id, userId))
        .returning();

      return new Response(JSON.stringify({
        success: true,
        data: updatedUser
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to upgrade user"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
});