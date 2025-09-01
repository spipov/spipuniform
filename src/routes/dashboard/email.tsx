import { createFileRoute } from "@tanstack/react-router";
import { EmailManagement } from "@/components/email/email-management";

export const Route = createFileRoute("/dashboard/email")({  
  component: EmailPage,
});

function EmailPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
          <p className="text-gray-600 mt-2">Configure email settings, templates, and monitor email activity</p>
        </div>
      </div>
      <EmailManagement />
    </div>
  );
}