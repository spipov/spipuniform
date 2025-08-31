import { createFileRoute } from "@tanstack/react-router";
import { AdminTest } from "@/components/admin/admin-test";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <AdminTest />
      </div>
    </div>
  );
}
