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
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const isSignedIn = !!session?.user;

  const { data: myPerms, isPending: permsPending, isError: permsError } = useQuery({
    queryKey: ["my-permissions", isSignedIn],
    queryFn: async () => {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load permissions");
      return res.json() as Promise<{ role: string | null; permissions: Record<string, boolean> }>;
    },
    staleTime: 60_000,
    enabled: isSignedIn, // prevent pre-session fetch that would 401
    retry: 2,
  });

  // Diagnostics
  // console.log("[DashboardLayout] isPending=", isPending, "session=", !!session, "permsPending=", permsPending, "permsError=", permsError, "role=", myPerms?.role);

  useEffect(() => {
    if (!isPending && !session) {
      // When unauthenticated, send user to sign-in and preserve intended destination
      const redirect = typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : "/dashboard";
      router.navigate({ to: "/auth/signin", search: { redirect } as any });
    }
  }, [isPending, session, router]);

  useEffect(() => {
    // Only enforce permission redirect when we have a concrete permissions object and no query error
    if (!isPending && session && !permsPending && !permsError) {
      if (myPerms && myPerms.permissions && myPerms.permissions.viewDashboard !== true) {
        // console.warn("[DashboardLayout] Missing viewDashboard -> redirect to /");
        router.navigate({ to: "/" });
      }
    }
  }, [isPending, session, permsPending, permsError, myPerms, router]);

  if (isPending || !session) return null;
  if (permsPending) return null;
  // If perms errored, avoid hard redirect loop; allow UI to render, sidebar will guard its own links
  // Optionally, could show a toast here

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
