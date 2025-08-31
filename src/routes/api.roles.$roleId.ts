import { createServerFn } from "@tanstack/start";
import { json } from "@tanstack/start";
import { db } from "@/db";
import { user, roles } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { updateRoleSchema } from "@/schemas/user-management";
import { auth } from "@/lib/auth";
import * as v from "valibot";

export const GET = createServerFn({ method: "GET" }).handler(async ({ request, params }) => {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view roles (simplified for auth schema)
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

    const { roleId } = params;

    // Get role with user count
    const [role] = await db
      .select({
        id: roles.id,
        name: roles.name,
        permissions: roles.permissions,
        color: roles.color,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      return json({ error: "Role not found" }, { status: 404 });
    }

    // Get user count for this role
    const [userCount] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, role.name));

    return json({
      role: {
        ...role,
        userCount: userCount.count,
      },
    });
  } catch (error) {
    console.error("Error fetching role:", error);
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

    // Check if user has permission to manage roles
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

    const { roleId } = params;
    const body = await request.json();
    const validatedData = v.parse(updateRoleSchema, body);

    // If updating name, check if it already exists
    if (validatedData.name) {
      const existingRole = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, validatedData.name))
        .limit(1);

      if (existingRole.length > 0 && existingRole[0].id !== roleId) {
        return json({ error: "Role name already exists" }, { status: 400 });
      }
    }

    // Update role
    const [updatedRole] = await db
      .update(roles)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId))
      .returning({
        id: roles.id,
        name: roles.name,
        permissions: roles.permissions,
        color: roles.color,
        updatedAt: roles.updatedAt,
      });

    if (!updatedRole) {
      return json({ error: "Role not found" }, { status: 404 });
    }

    return json({ role: updatedRole });
  } catch (error) {
    if (error instanceof v.ValiError) {
      return json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("Error updating role:", error);
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

    // Check if user has permission to manage roles
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

    const { roleId } = params;

    // Get role first to check name
    const [role] = await db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      return json({ error: "Role not found" }, { status: 404 });
    }

    // Check if role has users assigned
    const [userCount] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, role.name));

    if (userCount.count > 0) {
      return json(
        { error: "Cannot delete role with assigned users. Please reassign users first." },
        { status: 400 }
      );
    }

    // Check if it's a system role (Admin or User)

    if (role && (role.name === "Admin" || role.name === "User")) {
      return json({ error: "Cannot delete system roles (Admin/User)" }, { status: 400 });
    }

    // Delete role
    const [deletedRole] = await db
      .delete(roles)
      .where(eq(roles.id, roleId))
      .returning({ id: roles.id });

    if (!deletedRole) {
      return json({ error: "Role not found" }, { status: 404 });
    }

    return json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
});
