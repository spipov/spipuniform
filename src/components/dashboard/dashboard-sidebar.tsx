import type * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, BarChart3, FileText, Settings, Users, Shield, Key, Palette, Mail, FolderOpen, HardDrive, MapPin, School, ShoppingBag, Tags, Package, Sliders } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { UserLogoutCard } from "./user-logout-card";
import { BrandingProvider, SmartBrandingLogo } from "@/components/branding/branding-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

function PendingUsersBadge() {
  const { data } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      const res = await fetch('/api/users-approval');
      if (!res.ok) return { data: { pending: 0 } };
      return res.json();
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const count = Number(data?.data?.pending || 0);
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 text-xs rounded-full bg-amber-500 text-white px-1.5 py-0.5">{count}</span>
  );
}

const dashboardNavigation = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: "viewDashboard",
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    requiredPermission: "viewDashboardAnalytics",
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
    requiredPermission: "viewDashboardReports",
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    requiredPermission: "viewDashboardSettings",
  },
] as const;

const userManagementNavigation = [
  {
    title: "User Management",
    url: "/dashboard/user-management/consolidated",
    icon: Users,
    requiredPermission: "viewUserManagement",
  },
] as const;

const systemAdminNavigation = [
  {
    title: "File Manager",
    url: "/dashboard/file-manager",
    icon: FolderOpen,
    requiredPermission: "viewFileManager",
  },
] as const;

const productsNavigation = [
  {
    title: "Categories",
    url: "/dashboard/spipuniform/products/categories",
    icon: Tags,
    requiredPermission: "viewDashboard", // Using basic dashboard permission for now
  },
  {
    title: "Product Types",
    url: "/dashboard/spipuniform/products/types",
    icon: Package,
    requiredPermission: "viewDashboard", // Using basic dashboard permission for now
  },
  {
    title: "Attributes",
    url: "/dashboard/spipuniform/products/attributes",
    icon: Sliders,
    requiredPermission: "viewDashboard", // Using basic dashboard permission for now
  },
] as const;

const spipUniformNavigation = [
  {
    title: "Data Verification",
    url: "/dashboard/spipuniform/data-verification",
    icon: MapPin,
    requiredPermission: "viewDashboard", // Using basic dashboard permission for now
  },
] as const;

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = useSession();
  const isSignedIn = !!session?.user;

  const { data: myPerms, isPending: permsPending } = useQuery({
    queryKey: ["my-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load permissions");
      return res.json() as Promise<{ role: string | null; permissions: Record<string, boolean> }>;
    },
    staleTime: 60_000,
    enabled: isSignedIn,
  });

  const can = (key: string) => Boolean(myPerms?.permissions?.[key]);

  return (
    <BrandingProvider>
      <Sidebar variant="inset" className="dashboard-sidebar" {...props}>
        <SidebarHeader className="dashboard-sidebar__header">
          <SidebarMenu className="dashboard-sidebar__header-menu">
            <SidebarMenuItem className="dashboard-sidebar__header-menu-item">
              <SidebarMenuButton size="lg" asChild className="dashboard-sidebar__header-button">
                <Link to="/dashboard" className="dashboard-sidebar__header-link">
                  <SmartBrandingLogo 
                    size="sm" 
                    className="text-sidebar-foreground"
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="dashboard-sidebar__content">
          {isPending || (isSignedIn && permsPending) ? (
            // Skeleton placeholder to keep layout stable while session/permissions resolves
            <div className="p-2 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mt-4" />
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {isSignedIn && (
                <SidebarGroup className="dashboard-sidebar__nav-group">
                  <SidebarMenu className="dashboard-sidebar__nav-menu">
                    {dashboardNavigation
                      .filter((item) => can(item.requiredPermission))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem key={item.title} className="dashboard-sidebar__nav-item">
                            <SidebarMenuButton asChild className="dashboard-sidebar__nav-button">
                              <Link to={item.url} className="dashboard-sidebar__nav-link font-medium">
                                <Icon className="dashboard-sidebar__nav-icon size-4" />
                                <span className="dashboard-sidebar__nav-text">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroup>
              )}

              {isSignedIn && can('viewUserManagement') && (
                <SidebarGroup className="dashboard-sidebar__user-management-group">
                  <SidebarGroupLabel className="dashboard-sidebar__group-label">
                    User Management
                  </SidebarGroupLabel>
                  <SidebarMenu className="dashboard-sidebar__user-management-menu">
                    {userManagementNavigation
                      .filter((item) => can(item.requiredPermission))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem
                            key={item.title}
                            className="dashboard-sidebar__user-management-item"
                          >
                            <SidebarMenuButton asChild className="dashboard-sidebar__user-management-button">
                              <Link
                                to={item.url}
                                className="dashboard-sidebar__user-management-link font-medium relative"
                              >
                                <Icon className="dashboard-sidebar__user-management-icon size-4" />
                                <span className="dashboard-sidebar__user-management-text">{item.title}</span>
                                <PendingUsersBadge />
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroup>
              )}

              {isSignedIn && (can('viewFileManager')) && (
                <SidebarGroup className="dashboard-sidebar__system-admin-group">
                  <SidebarGroupLabel className="dashboard-sidebar__group-label">
                    System Administration
                  </SidebarGroupLabel>
                  <SidebarMenu className="dashboard-sidebar__system-admin-menu">
                    {systemAdminNavigation
                      .filter((item) => can(item.requiredPermission))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem
                            key={item.title}
                            className="dashboard-sidebar__system-admin-item"
                          >
                            <SidebarMenuButton asChild className="dashboard-sidebar__system-admin-button">
                              <Link
                                to={item.url}
                                className="dashboard-sidebar__system-admin-link font-medium"
                              >
                                <Icon className="dashboard-sidebar__system-admin-icon size-4" />
                                <span className="dashboard-sidebar__system-admin-text">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroup>
              )}

              {isSignedIn && (can('viewDashboard')) && (
                <SidebarGroup className="dashboard-sidebar__products-group">
                  <SidebarGroupLabel className="dashboard-sidebar__group-label">
                    Product Management
                  </SidebarGroupLabel>
                  <SidebarMenu className="dashboard-sidebar__products-menu">
                    {productsNavigation
                      .filter((item) => can(item.requiredPermission))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem
                            key={item.title}
                            className="dashboard-sidebar__products-item"
                          >
                            <SidebarMenuButton asChild className="dashboard-sidebar__products-button">
                              <Link
                                to={item.url}
                                className="dashboard-sidebar__products-link font-medium"
                              >
                                <Icon className="dashboard-sidebar__products-icon size-4" />
                                <span className="dashboard-sidebar__products-text">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroup>
              )}

              {isSignedIn && (can('viewDashboard')) && (
                <SidebarGroup className="dashboard-sidebar__spipuniform-group">
                  <SidebarGroupLabel className="dashboard-sidebar__group-label">
                    Geographic Data
                  </SidebarGroupLabel>
                  <SidebarMenu className="dashboard-sidebar__spipuniform-menu">
                    {spipUniformNavigation
                      .filter((item) => can(item.requiredPermission))
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem
                            key={item.title}
                            className="dashboard-sidebar__spipuniform-item"
                          >
                            <SidebarMenuButton asChild className="dashboard-sidebar__spipuniform-button">
                              <Link
                                to={item.url}
                                className="dashboard-sidebar__spipuniform-link font-medium"
                              >
                                <Icon className="dashboard-sidebar__spipuniform-icon size-4" />
                                <span className="dashboard-sidebar__spipuniform-text">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </SidebarGroup>
              )}
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="dashboard-sidebar__footer">
          {!isPending && isSignedIn && (
            <SidebarMenu className="dashboard-sidebar__footer-menu">
              <SidebarMenuItem className="dashboard-sidebar__footer-menu-item">
                <UserLogoutCard />
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
        <SidebarRail className="dashboard-sidebar__rail" />
      </Sidebar>
    </BrandingProvider>
  );
}
