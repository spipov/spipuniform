import { createFileRoute, redirect } from "@tanstack/react-router";
import { EmailManagement } from "@/components/email/email-management";

export const Route = createFileRoute("/dashboard/email")({
  beforeLoad: async () => {
    const res = await fetch("/api/my-permissions", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/" });
    const data = (await res.json()) as { permissions: Record<string, boolean> };
    if (!data.permissions?.viewEmail) throw redirect({ to: "/" });
  },
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