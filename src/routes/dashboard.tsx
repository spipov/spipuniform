import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider className="dashboard">
        <DashboardSidebar />
        <SidebarInset className="dashboard__main">
          <header className="dashboard__header flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="dashboard__header-content flex items-center gap-2 px-4">
              <SidebarTrigger className="dashboard__sidebar-trigger -ml-1" />
              <Separator orientation="vertical" className="dashboard__separator mr-2 h-4" />
              <Breadcrumb className="dashboard__breadcrumb">
                <BreadcrumbList className="dashboard__breadcrumb-list">
                  <BreadcrumbItem className="dashboard__breadcrumb-item hidden md:block">
                    <BreadcrumbLink href="#" className="dashboard__breadcrumb-link">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="dashboard__breadcrumb-separator hidden md:block" />
                  <BreadcrumbItem className="dashboard__breadcrumb-item">
                    <BreadcrumbPage className="dashboard__breadcrumb-page">Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="dashboard__content flex flex-1 flex-col gap-4 p-4 pt-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
