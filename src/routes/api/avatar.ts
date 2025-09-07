import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable, files as filesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { FileService } from "@/lib/services/file-system/file-service";

function toEmailSlug(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sanitizePath(p: string): string {
  const cleaned = (p || "/").replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/\/+/, "/");
  if (!cleaned.startsWith("/")) return "/" + cleaned;
  return cleaned;
}

async function getCurrentUser(headers: Headers): Promise<{ userId: string; email: string; role: string | null } | null> {
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

export const ServerRoute = createServerFileRoute("/api/avatar").methods({
  POST: async ({ request }) => {
    try {
      const me = await getCurrentUser(request.headers);
      if (!me) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const formData = await request.formData();
      const file = (formData.get("file") || formData.get("avatar")) as File | null;
      const targetEmailParam = (formData.get("userEmail") as string) || null;

      let targetUserId = me.userId;
      let basePath = `/users/${toEmailSlug(me.email)}/avatar`;

      if (targetEmailParam && isAdmin(me.role, me.email)) {
        const targetEmail = targetEmailParam.trim();
        basePath = `/users/${toEmailSlug(targetEmail)}/avatar`;
        const [target] = await db
          .select({ id: userTable.id })
          .from(userTable)
          .where(eq(userTable.email, targetEmail))
          .limit(1);
        if (target?.id) targetUserId = target.id;
      }

      if (!file) {
        return new Response(JSON.stringify({ success: false, error: "No file provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const mime = (file as any).type || "";
      if (!mime.startsWith("image/")) {
        return new Response(JSON.stringify({ success: false, error: "Only image files are allowed" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const buf = Buffer.from(await file.arrayBuffer());
      const uploads = [{ name: file.name, size: file.size, mimeType: mime, data: buf }];

      const { uploadedFiles, errors } = await FileService.uploadFiles(uploads, { path: basePath, ownerId: targetUserId });
      if (errors.length > 0 && uploadedFiles.length === 0) {
        return new Response(JSON.stringify({ success: false, error: errors[0].error || "Upload failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }

      const uploaded = uploadedFiles[0];

      await db
        .update(userTable)
        .set({ image: uploaded.url || null, updatedAt: new Date() })
        .where(eq(userTable.id, targetUserId));

      return new Response(JSON.stringify({ success: true, url: uploaded.url, fileId: uploaded.id }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("[POST] /api/avatar error", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to upload avatar" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },

  DELETE: async ({ request }) => {
    try {
      const me = await getCurrentUser(request.headers);
      if (!me) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const url = new URL(request.url);
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

      // Find current image URL
      const [row] = await db
        .select({ id: userTable.id, image: userTable.image })
        .from(userTable)
        .where(eq(userTable.id, targetUserId))
        .limit(1);

      const currentUrl = row?.image || null;

      if (currentUrl) {
        // Try to find corresponding file record for deletion
        const [fileRow] = await db
          .select({ id: filesTable.id })
          .from(filesTable)
          .where(and(eq(filesTable.ownerId, targetUserId), eq(filesTable.url, currentUrl), eq(filesTable.isDeleted, false)))
          .limit(1);

        if (fileRow?.id) {
          try {
            await FileService.deleteFile(fileRow.id, targetUserId);
          } catch (e) {
            console.warn("Failed to delete avatar file from storage:", e);
          }
        }
      }

      await db
        .update(userTable)
        .set({ image: null, updatedAt: new Date() })
        .where(eq(userTable.id, targetUserId));

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
      console.error("[DELETE] /api/avatar error", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to remove avatar" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
});