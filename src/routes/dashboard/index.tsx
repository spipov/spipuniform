import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Key, BarChart3, FileText, Settings, Activity, Mail, Database, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardCards } from "@/components/dashboard/admin-dashboard-cards";
import { UserDashboardCards } from "@/components/dashboard/user-dashboard-cards";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;

  // Get user permissions
  const { data: permissions } = useQuery({
    queryKey: ["my-permissions", isSignedIn],
    queryFn: async () => {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load permissions");
      return res.json() as Promise<{ role: string | null; permissions: Record<string, boolean> }>;
    },
    enabled: isSignedIn,
  });

  // Determine admin status BEFORE using it below
  const isAdmin = permissions?.permissions?.viewUserManagement || permissions?.role === 'admin';

  // Get admin dashboard stats if user has admin permissions
  const { data: adminStats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard-stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load admin stats");
      return res.json();
    },
    enabled: isSignedIn && isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const userName = session?.user?.name || 'User';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg border bg-card text-card-foreground p-6">
         <h1 className="text-3xl font-bold mb-2">
           Welcome back, {userName}!
         </h1>
         <p className="text-muted-foreground">
           {isAdmin 
             ? "Monitor your system, manage users, and oversee all platform operations."
             : "Access your personalized dashboard and manage your account settings."
           }
         </p>
       </div>

      {/* Dashboard Cards */}
      {isAdmin ? (
        <AdminDashboardCards adminStats={adminStats} />
      ) : (
        <UserDashboardCards />
      )}

      {/* Quick Actions removed to avoid duplication. Admin/User cards already include their own action shortcuts. */}
    </div>
  );
}
