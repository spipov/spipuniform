import type * as React from "react";
import { LayoutDashboard, BarChart3, FileText, Settings, Users, Shield, Key, Palette, Mail, FolderOpen, HardDrive } from "lucide-react";
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

const dashboardNavigation = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

const userManagementNavigation = [
  {
    title: "Users",
    url: "/dashboard/user-management/users",
    icon: Users,
  },
  {
    title: "Roles",
    url: "/dashboard/user-management/roles",
    icon: Shield,
  },
  {
    title: "Permissions",
    url: "/dashboard/user-management/permissions",
    icon: Key,
  },
];

const systemAdminNavigation = [
  {
    title: "Branding",
    url: "/dashboard/branding",
    icon: Palette,
  },
  {
    title: "Email Management",
    url: "/dashboard/email",
    icon: Mail,
  },
  {
    title: "File Manager",
    url: "/dashboard/file-manager",
    icon: FolderOpen,
  },
  {
    title: "Storage Settings",
    url: "/dashboard/storage-settings",
    icon: HardDrive,
  },
];

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
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
        <SidebarGroup className="dashboard-sidebar__nav-group">
          <SidebarMenu className="dashboard-sidebar__nav-menu">
            {dashboardNavigation.map((item) => {
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
        <SidebarGroup className="dashboard-sidebar__user-management-group">
          <SidebarGroupLabel className="dashboard-sidebar__group-label">
            User Management
          </SidebarGroupLabel>
          <SidebarMenu className="dashboard-sidebar__user-management-menu">
            {userManagementNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem
                  key={item.title}
                  className="dashboard-sidebar__user-management-item"
                >
                  <SidebarMenuButton asChild className="dashboard-sidebar__user-management-button">
                    <Link
                      to={item.url}
                      className="dashboard-sidebar__user-management-link font-medium"
                    >
                      <Icon className="dashboard-sidebar__user-management-icon size-4" />
                      <span className="dashboard-sidebar__user-management-text">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="dashboard-sidebar__system-admin-group">
          <SidebarGroupLabel className="dashboard-sidebar__group-label">
            System Administration
          </SidebarGroupLabel>
          <SidebarMenu className="dashboard-sidebar__system-admin-menu">
            {systemAdminNavigation.map((item) => {
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
      </SidebarContent>
      <SidebarFooter className="dashboard-sidebar__footer">
        <SidebarMenu className="dashboard-sidebar__footer-menu">
          <SidebarMenuItem className="dashboard-sidebar__footer-menu-item">
            <UserLogoutCard />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className="dashboard-sidebar__rail" />
    </Sidebar>
    </BrandingProvider>
  );
}
