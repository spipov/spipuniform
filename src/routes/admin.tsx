import { createFileRoute } from "@tanstack/react-router";
import { ShopVerificationDashboard } from "@/components/admin/shop-verification-dashboard";
import { ReportManagementDashboard } from "@/components/admin/report-management-dashboard";
import { UserRoleManagementDashboard } from "@/components/admin/user-role-management-dashboard";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertTriangle, Building } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("shop-verification");

  useEffect(() => {
    if (!isPending && !session) {
      router.navigate({ to: "/" });
    }
  }, [isPending, session, router]);

  if (isPending || !session) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full admin-dashboard">
        <DashboardSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 admin-dashboard__header">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 p-4 admin-dashboard__main">
            <div className="rounded-lg border bg-card text-card-foreground p-6 admin-dashboard__intro">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage platform moderation and user administration</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 admin-dashboard__tabs">
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
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
