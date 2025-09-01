import { createFileRoute } from "@tanstack/react-router";
import { BrandingManagement } from "@/components/branding/branding-management";

export const Route = createFileRoute("/dashboard/branding")({  
  component: BrandingPage,
});

function BrandingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branding Management</h1>
          <p className="text-gray-600 mt-2">Manage your application's branding and visual identity</p>
        </div>
      </div>
      <BrandingManagement />
    </div>
  );
}