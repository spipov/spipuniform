import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const ServerRoute = createServerFileRoute("/api/change-password").methods({
  POST: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = await request.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return new Response(
          JSON.stringify({ success: false, error: "Current password and new password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (newPassword.length < 8) {
        return new Response(
          JSON.stringify({ success: false, error: "New password must be at least 8 characters long" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get user's current password hash
      const [user] = await db
        .select({ id: userTable.id, password: userTable.password })
        .from(userTable)
        .where(eq(userTable.id, session.user.id))
        .limit(1);

      if (!user || !user.password) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found or no password set" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Current password is incorrect" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await db
        .update(userTable)
        .set({ 
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(userTable.id, session.user.id));

      return new Response(
        JSON.stringify({ success: true, message: "Password changed successfully" }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("[POST] /api/change-password error", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to change password" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});