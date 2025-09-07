import { createFileRoute, useSearch, useNavigate, redirect } from "@tanstack/react-router";
import { BrandingManager } from "@/components/branding/branding-manager";
import { EmailManagement } from "@/components/email/email-management";
import { StorageSettingsManagement } from "@/components/file-system/storage-settings-management";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuthSettingsPanel } from "@/components/settings/auth-settings";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings")({
  beforeLoad: async (opts) => {
    const isServer = typeof window === "undefined";

    if (isServer) {
      return;
    }

    try {
      // Wait for a real session after hydration to avoid race
      let tries = 0;
      let sess = await getSession();
      while (!sess && tries < 20) {
        await new Promise((r) => setTimeout(r, 100));
        tries += 1;
        sess = await getSession();
      }
      if (!sess) {
        return; // let layout/session guard handle
      }

      // Client-side permission check
      const res = await fetch("/api/auth/permissions", { credentials: "include" });

      if (res.status === 401) return; // let layout guard handle
      if (!res.ok) {
        return; // avoid loop
      }

      const data = (await res.json()) as { permissions: Record<string, boolean> };
      if (!data.permissions?.viewDashboardSettings) throw redirect({ to: "/" });
    } catch (err) {
      return; // avoid accidental homepage redirect
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "branding",
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { tab } = useSearch({ from: "/dashboard/settings" });
  const navigate = useNavigate({ from: "/dashboard/settings" });

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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your application settings</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <BrandingManager />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailManagement />
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <StorageSettingsManagement />
        </TabsContent>

        <TabsContent value="auth" className="space-y-6">
          <AuthSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}