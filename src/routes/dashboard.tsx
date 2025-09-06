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

  const { data: myPerms, isPending: permsPending } = useQuery({
    queryKey: ["my-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/my-permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load permissions");
      return res.json() as Promise<{ role: string | null; permissions: Record<string, boolean> }>;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.navigate({ to: "/" });
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!isPending && session && !permsPending) {
      if (!myPerms?.permissions?.viewDashboard) {
        router.navigate({ to: "/" });
      }
    }
  }, [isPending, session, permsPending, myPerms, router]);

  if (isPending || !session) return null;
  if (permsPending) return null;

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
