import { createFileRoute, redirect } from "@tanstack/react-router";
import { UsersPage } from "@/components/user-management/users-page";

export const Route = createFileRoute("/dashboard/user-management/users")({
  beforeLoad: async () => {
    const res = await fetch("/api/my-permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewUserManagementUsers) throw redirect({ to: "/" });
  },
  component: UsersPage,
});
