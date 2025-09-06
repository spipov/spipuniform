import { createFileRoute, redirect } from "@tanstack/react-router";
import { RolesPage } from "@/components/user-management/roles-page";

export const Route = createFileRoute("/dashboard/user-management/roles")({
  beforeLoad: async () => {
    const res = await fetch("/api/my-permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewUserManagementRoles) throw redirect({ to: "/" });
  },
  component: RolesPage,
});
