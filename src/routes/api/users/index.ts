import { createServerFileRoute } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user, roles } from "@/db/schema";
import { eq, like, and, desc, asc, count, or, isNotNull, isNull } from "drizzle-orm";
import { userSearchSchema, createUserSchema, updateUserSchema } from "@/schemas/user-management";
import { auth } from "@/lib/auth";
// Dynamic imports will be used inside functions to avoid SSR issues
import * as v from "valibot";

export const ServerRoute = createServerFileRoute("/api/users/").methods({
  GET: async ({ request }) => {
    try {
      // Check authentication
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const searchParams = {
        search: url.searchParams.get("search") || undefined,
        role: url.searchParams.get("role") || undefined,
        banned: url.searchParams.get("banned")
          ? url.searchParams.get("banned") === "true"
          : undefined,
        page: parseInt(url.searchParams.get("page") || "1"),
        limit: parseInt(url.searchParams.get("limit") || "10"),
        sortBy: url.searchParams.get("sortBy") || "createdAt",
        sortOrder: url.searchParams.get("sortOrder") || "desc",
      };

      const validatedParams = v.parse(userSearchSchema, searchParams);
      const { search, role, banned, page, limit, sortBy, sortOrder } = validatedParams;

      // Build where conditions
      const conditions = [];
      if (search) {
        conditions.push(or(like(user.name, `%${search}%`), like(user.email, `%${search}%`)));
      }
      if (role) {
        conditions.push(eq(user.role, role));
      }
      if (banned !== undefined) {
        conditions.push(banned ? isNotNull(user.banExpires) : isNull(user.banExpires));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [totalResult] = await db.select({ count: count() }).from(user).where(whereClause);

      // Get users with roles
      const orderBy =
        sortOrder === "asc"
          ? asc(user[sortBy as keyof typeof user])
          : desc(user[sortBy as keyof typeof user]);

      const usersList = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit);

      return new Response(
        JSON.stringify({
          users: usersList,
          pagination: {
            page,
            limit,
            total: totalResult.count,
            pages: Math.ceil(totalResult.count / limit),
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  POST: async ({ request }) => {
    try {
      // Check authentication and permissions
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user has admin role (simplified permission check)
      const currentUser = await db
        .select({
          role: user.role,
        })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!currentUser[0] || currentUser[0].role !== "admin") {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await request.json();
      const validatedData = v.parse(createUserSchema, body);

      // Check if email already exists
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return new Response(JSON.stringify({ error: "Email already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Hash password using scrypt with dynamic imports
      const crypto = await import("node:crypto");
      const { promisify } = await import("node:util");
      const scryptAsync = promisify(crypto.scrypt);
      
      const salt = crypto.randomBytes(16).toString("hex");
      const derivedKey = (await scryptAsync(validatedData.password, salt, 64)) as Buffer;
      const hashedPassword = salt + ":" + derivedKey.toString("hex");

      // Create user using Better Auth admin API
      const newUser = await auth.api.adminCreateUser({
        body: {
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
          role: validatedData.role || "user",
        },
      });

      if (!newUser) {
        return new Response(JSON.stringify({ error: "Failed to create user" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            banned: newUser.banned || false,
            banReason: newUser.banReason || null,
            banExpires: newUser.banExpires || null,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ error: "Validation error", details: error.issues }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.error("Error creating user:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
