import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";

const updateMeSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1, "Name is required"), v.maxLength(100, "Name must be less than 100 characters"))),
});

export const ServerRoute = createServerFileRoute("/api/me").methods({
  GET: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const [row] = await db
        .select({ id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!row) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ user: row }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("GET /api/me error", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
  PUT: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const body = await request.json();
      const data = v.parse(updateMeSchema, body);

      if (!data.name) {
        return new Response(JSON.stringify({ error: "Nothing to update" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const [updated] = await db
        .update(user)
        .set({ name: data.name, updatedAt: new Date() })
        .where(eq(user.id, session.user.id))
        .returning({ id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, updatedAt: user.updatedAt });

      return new Response(JSON.stringify({ user: updated }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ error: "Validation error", details: error.issues }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      console.error("PUT /api/me error", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
});