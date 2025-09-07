import { createFileRoute, useSearch, useNavigate, redirect } from "@tanstack/react-router";
import { UsersPage } from "@/components/user-management/users-page";
import { RolesPage } from "@/components/user-management/roles-page";
import { PermissionsPage } from "@/components/user-management/permissions-page";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/user-management/consolidated")({
  beforeLoad: async () => {
    const isServer = typeof window === "undefined";
    if (isServer) {
      return;
    }
    const res = await fetch("/api/auth/permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewUserManagement) throw redirect({ to: "/" });
  },
  component: UserManagementPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "users",
  }),
});

function UserManagementPage() {
  const { tab } = useSearch({ from: "/dashboard/user-management/consolidated" });
  const navigate = useNavigate({ from: "/dashboard/user-management/consolidated" });

  const handleTabChange = (value: string) => {
    navigate({
      search: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and permissions</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UsersPage />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RolesPage />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <PermissionsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}