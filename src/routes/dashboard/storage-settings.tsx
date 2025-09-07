import { createFileRoute, redirect } from "@tanstack/react-router";
import { StorageSettingsManagement } from "@/components/file-system/storage-settings-management";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/storage-settings")({
  beforeLoad: async (opts) => {
    const isServer = typeof window === "undefined";

    try {
      if (isServer) {
        return; // Defer permission enforcement to client to avoid missing cookies on SSR
      }

      // Wait until a session is actually available after hydration to avoid a race
      let tries = 0;
      let sess = await getSession();
      while (!sess && tries < 20) { // ~2s max
        await new Promise((r) => setTimeout(r, 100));
        tries += 1;
        sess = await getSession();
      }
      if (!sess) {
        // Let the layout/session guards handle redirect; don't force a redirect here
        return;
      }

      // Client-side permission check once session is present
      const res = await fetch("/api/auth/permissions", {
        credentials: "include",
      });

      if (res.status === 401) {
        // Likely a transient or logged-out state. Allow layout to handle navigation.
        return;
      }
      if (!res.ok) {
        // Non-OK (500, etc). Avoid redirect loop; allow page to mount and other guards handle UX.
        return;
      }

      const data = (await res.json()) as { permissions: Record<string, boolean> };
      if (!data.permissions?.viewDashboardSettings) throw redirect({ to: "/" });
    } catch (err) {
      // Avoid redirecting on generic errors to prevent accidental home navigation
      return;
    }
  },
  component: StorageSettingsPage,
});

function StorageSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Settings</h1>
          <p className="text-gray-600 mt-2">Configure your storage providers (Local, S3, pCloud)</p>
        </div>
      </div>
      <StorageSettingsManagement />
    </div>
  );
}