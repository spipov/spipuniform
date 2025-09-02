import { createFileRoute } from "@tanstack/react-router";
import { BrandingManager } from "@/components/branding/branding-manager";

export const Route = createFileRoute("/dashboard/branding")({  
  component: BrandingPage,
});

function BrandingPage() {
  return <BrandingManager />;
}