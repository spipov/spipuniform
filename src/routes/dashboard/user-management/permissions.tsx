import { createFileRoute, redirect } from "@tanstack/react-router";
import { PermissionsPage } from "@/components/user-management/permissions-page";

export const Route = createFileRoute("/dashboard/user-management/permissions")({
  beforeLoad: async () => {
    const res = await fetch("/api/my-permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewUserManagementPermissions) throw redirect({ to: "/" });
  },
  component: PermissionsPage,
});
