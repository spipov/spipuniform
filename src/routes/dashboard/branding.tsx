import { createFileRoute, redirect } from "@tanstack/react-router";
import { BrandingManager } from "@/components/branding/branding-manager";

export const Route = createFileRoute("/dashboard/branding")({
  beforeLoad: async () => {
    const res = await fetch("/api/my-permissions", { credentials: "include" });
    if (!res.ok) {
      throw redirect({ to: "/" });
    }
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewBranding) {
      throw redirect({ to: "/" });
    }
  },
  component: BrandingPage,
});

function BrandingPage() {
  return <BrandingManager />;
}