import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FileService } from "@/lib/services/file-system/file-service";

function toEmailSlug(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sanitizePath(p: string): string {
  const cleaned = (p || "/").replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/\/+/, "/");
  if (!cleaned.startsWith("/")) return "/" + cleaned;
  return cleaned;
}

function joinPaths(base: string, sub: string): string {
  const a = base.replace(/\/+$/g, "");
  const b = sub.replace(/^\/+|\/+$/g, "");
  const joined = `${a}/${b}`.replace(/\/+/, "/");
  return joined === "" ? "/" : joined;
}

async function getCurrentUserAndRole(headers: Headers): Promise<{ userId: string; email: string; role: string | null } | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const uid = session.user.id;
  const email = session.user.email;
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, uid))
    .limit(1);
  return { userId: uid, email, role: row?.role ?? null };
}

function isAdmin(role: string | null, email: string): boolean {
  return (role?.toLowerCase() === "admin") || email === "admin@admin.com";
}

export const ServerRoute = createServerFileRoute("/api/user-files").methods({
  GET: async ({ request }) => {
    try {
      const me = await getCurrentUserAndRole(request.headers);
      if (!me) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const url = new URL(request.url);
      const reqPath = sanitizePath(url.searchParams.get("path") || "/");

      // Admin override: allow specifying userEmail to inspect a user's files
      const targetEmailParam = url.searchParams.get("userEmail");
      let targetUserId = me.userId;
      let basePath = `/users/${toEmailSlug(me.email)}`;

      if (targetEmailParam && isAdmin(me.role, me.email)) {
        const targetEmail = targetEmailParam.trim();
        basePath = `/users/${toEmailSlug(targetEmail)}`;
        // Attempt to find target user id for owner scoping, fall back to current if not found
        const [target] = await db
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, targetEmail))
          .limit(1);
        if (target?.id) targetUserId = target.id;
      }

      const effectivePath = reqPath === "/" ? basePath : joinPaths(basePath, reqPath);

      const { files, totalCount, hasMore, currentPath } = await FileService.listFiles(effectivePath, { userId: targetUserId, limit: 100 });

      // Map DB records to a simplified shape expected by clients
      const items = files.map((f) => {
        // display path relative to the user's base
        let displayParent = f.path.startsWith(basePath) ? f.path.slice(basePath.length) : f.path;
        if (!displayParent.startsWith("/")) displayParent = "/" + displayParent;
        const item: any = {
          id: f.id,
          name: f.name,
          type: f.type,
          path: joinPaths(displayParent, f.name),
          size: f.size ?? undefined,
          url: f.url ?? undefined,
          mimeType: f.mimeType ?? undefined,
          createdAt: (f as any).createdAt ?? undefined,
          modifiedAt: (f as any).updatedAt ?? undefined,
        };
        return item;
      });

      return new Response(JSON.stringify({ success: true, data: { path: reqPath, files: items, totalCount, hasMore } }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("[GET] /api/user-files error", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to list files" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },

  POST: async ({ request }) => {
    try {
      const me = await getCurrentUserAndRole(request.headers);
      if (!me) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const formData = await request.formData();
      const files = formData.getAll("files") as unknown as File[];
      const reqPath = sanitizePath((formData.get("path") as string) || "/");
      const targetEmailParam = (formData.get("userEmail") as string) || null;

      let targetUserId = me.userId;
      let basePath = `/users/${toEmailSlug(me.email)}`;

      if (targetEmailParam && isAdmin(me.role, me.email)) {
        const targetEmail = targetEmailParam.trim();
        basePath = `/users/${toEmailSlug(targetEmail)}`;
        const [target] = await db
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, targetEmail))
          .limit(1);
        if (target?.id) targetUserId = target.id;
      }

      if (!files || files.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "No files provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const effectivePath = reqPath === "/" ? basePath : joinPaths(basePath, reqPath);

      const uploads = await Promise.all(
        files.map(async (file) => {
          const buf = Buffer.from(await file.arrayBuffer());
          return {
            name: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            data: buf,
          };
        })
      );

      const { uploadedFiles, errors } = await FileService.uploadFiles(uploads, { path: effectivePath, ownerId: targetUserId });

      const uploaded = uploadedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        path: joinPaths(effectivePath.startsWith(basePath) ? effectivePath.slice(basePath.length) || "/" : effectivePath, f.name),
        size: f.size ?? undefined,
        url: f.url ?? undefined,
        mimeType: f.mimeType ?? undefined,
        createdAt: (f as any).createdAt ?? undefined,
        modifiedAt: (f as any).updatedAt ?? undefined,
      }));

      return new Response(JSON.stringify({ success: true, data: { uploadedFiles: uploaded, errors } }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("[POST] /api/user-files error", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to upload files" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },

  DELETE: async ({ request }) => {
    try {
      const me = await getCurrentUserAndRole(request.headers);
      if (!me) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      const targetEmailParam = url.searchParams.get("userEmail");

      let targetUserId = me.userId;
      if (targetEmailParam && isAdmin(me.role, me.email)) {
        const targetEmail = targetEmailParam.trim();
        const [target] = await db
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, targetEmail))
          .limit(1);
        if (target?.id) targetUserId = target.id;
      }

      if (!id) {
        return new Response(JSON.stringify({ success: false, error: "Missing id" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const ok = await FileService.deleteFile(id, targetUserId);
      return new Response(JSON.stringify({ success: ok }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("[DELETE] /api/user-files error", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to delete file" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
});