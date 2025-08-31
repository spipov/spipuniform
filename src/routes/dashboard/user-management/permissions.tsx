import { createFileRoute } from "@tanstack/react-router";
import { PermissionsPage } from "@/components/user-management/permissions-page";

export const Route = createFileRoute("/dashboard/user-management/permissions")({
  component: PermissionsPage,
});
