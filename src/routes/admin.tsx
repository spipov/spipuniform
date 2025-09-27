import { createFileRoute } from "@tanstack/react-router";
import { ShopVerificationDashboard } from "@/components/admin/shop-verification-dashboard";
import { ReportManagementDashboard } from "@/components/admin/report-management-dashboard";
import { UserRoleManagementDashboard } from "@/components/admin/user-role-management-dashboard";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, AlertTriangle, Building } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("shop-verification");

  // Keep hooks order stable; navigate away in effect when not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.navigate({ to: "/" });
    }
  }, [isPending, session, router]);

  // Avoid rendering during loading or when unauthenticated
  if (isPending || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform moderation and user administration</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shop-verification" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Shop Verification
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Report Management
            </TabsTrigger>
            <TabsTrigger value="user-roles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop-verification" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <ShopVerificationDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <ReportManagementDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-roles" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <UserRoleManagementDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
