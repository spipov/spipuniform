import { createFileRoute, redirect } from "@tanstack/react-router";
import { PermissionsPage } from "@/components/user-management/permissions-page";

export const Route = createFileRoute("/dashboard/user-management/permissions")({
  beforeLoad: async () => {
    const isServer = typeof window === "undefined";
    if (isServer) {
      return;
    }
    const res = await fetch("/api/auth/permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewPermissions) throw redirect({ to: "/" });
  },
  component: PermissionsPage,
});
