import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/components/user-management/roles-page";

export const Route = createFileRoute("/dashboard/user-management/roles")({
  component: RolesPage,
});
