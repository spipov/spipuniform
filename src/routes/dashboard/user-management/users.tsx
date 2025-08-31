import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/components/user-management/users-page";

export const Route = createFileRoute("/dashboard/user-management/users")({
  component: UsersPage,
});
