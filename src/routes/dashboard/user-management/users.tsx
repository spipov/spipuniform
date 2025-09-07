import { createFileRoute, redirect } from "@tanstack/react-router";
import { UsersPage } from "@/components/user-management/users-page";

export const Route = createFileRoute("/dashboard/user-management/users")({
  beforeLoad: async () => {
    const isServer = typeof window === "undefined";
    if (isServer) {
      return;
    }
    const res = await fetch("/api/auth/permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewUserManagementUsers) throw redirect({ to: "/" });
  },
  component: UsersPage,
});
