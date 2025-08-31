import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export function Dashboard() {
  return (
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
          <div className="dashboard__welcome mb-4">
            <h2 className="dashboard__welcome-title text-3xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h2>
            <p className="dashboard__welcome-description text-gray-600">Here's an overview of your system status and quick actions.</p>
          </div>

          {/* Stats Grid */}
          <div className="dashboard__stats-grid grid auto-rows-min gap-4 md:grid-cols-3">
            <Card className="dashboard__stats-card dashboard__stats-card--users">
              <CardHeader className="dashboard__stats-card-header flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="dashboard__stats-card-title text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent className="dashboard__stats-card-content">
                <div className="dashboard__stats-card-value text-2xl font-bold">1,234</div>
                <p className="dashboard__stats-card-change text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>

            <Card className="dashboard__stats-card dashboard__stats-card--sessions">
              <CardHeader className="dashboard__stats-card-header flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="dashboard__stats-card-title text-sm font-medium">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="dashboard__stats-card-content">
                <div className="dashboard__stats-card-value text-2xl font-bold">89</div>
                <p className="dashboard__stats-card-change text-xs text-muted-foreground">+12.5% from last hour</p>
              </CardContent>
            </Card>

            <Card className="dashboard__stats-card dashboard__stats-card--status">
              <CardHeader className="dashboard__stats-card-header flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="dashboard__stats-card-title text-sm font-medium">System Status</CardTitle>
              </CardHeader>
              <CardContent className="dashboard__stats-card-content">
                <div className="dashboard__stats-card-value text-2xl font-bold text-green-600">Online</div>
                <p className="dashboard__stats-card-change text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="dashboard__actions-card">
            <CardHeader className="dashboard__actions-card-header">
              <CardTitle className="dashboard__actions-card-title">Quick Actions</CardTitle>
              <CardDescription className="dashboard__actions-card-description">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="dashboard__actions-card-content">
              <div className="dashboard__actions-list flex flex-wrap gap-4">
                <Button asChild className="dashboard__action-button dashboard__action-button--signin">
                  <Link to="/login" className="dashboard__action-link">Sign In</Link>
                </Button>
                <Button variant="outline" asChild className="dashboard__action-button dashboard__action-button--signup">
                  <Link to="/signup" className="dashboard__action-link">Sign Up</Link>
                </Button>
                <Button variant="secondary" asChild className="dashboard__action-button dashboard__action-button--admin">
                  <Link to="/admin" className="dashboard__action-link">Admin Panel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}