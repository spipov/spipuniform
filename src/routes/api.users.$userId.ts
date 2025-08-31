import { createServerFn } from "@tanstack/start";
import { json } from "@tanstack/start";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateUserSchema } from "@/schemas/user-management";
import { auth } from "@/lib/auth";
import * as v from "valibot";

export const GET = createServerFn({ method: "GET" }).handler(async ({ request, params }) => {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    // Get user (simplified for auth schema)
    const [userResult] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userResult) {
      return json({ error: "User not found" }, { status: 404 });
    }

    return json({ user: userResult });
  } catch (error) {
    console.error("Error fetching user:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = createServerFn({ method: "PUT" }).handler(async ({ request, params }) => {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    // Check if user has permission to manage users or is updating their own profile
    const currentUser = await db
      .select({
        id: user.id,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isOwnProfile = session.user.id === userId;
    const canManageUsers = currentUser[0]?.role === "admin";

    if (!isOwnProfile && !canManageUsers) {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = v.parse(updateUserSchema, body);

    // If updating email, check if it already exists
    if (validatedData.email) {
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        return json({ error: "Email already exists" }, { status: 400 });
      }
    }

    // If not admin, restrict certain fields
    if (!canManageUsers) {
      delete validatedData.role;
      delete validatedData.banned;
      delete validatedData.banReason;
      delete validatedData.banExpires;
    }

    // Update user
    const [updatedUser] = await db
      .update(user)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        updatedAt: user.updatedAt,
      });

    if (!updatedUser) {
      return json({ error: "User not found" }, { status: 404 });
    }

    return json({ user: updatedUser });
  } catch (error) {
    if (error instanceof v.ValiError) {
      return json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("Error updating user:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = createServerFn({ method: "DELETE" }).handler(async ({ request, params }) => {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    // Check if user has permission to delete users
    const currentUser = await db
      .select({
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser[0] || currentUser[0].role !== "admin") {
      return json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
      return json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete user
    const [deletedUser] = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning({ id: user.id });

    if (!deletedUser) {
      return json({ error: "User not found" }, { status: 404 });
    }

    return json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
});
