import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminTest } from "@/components/admin/admin-test";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/" });
    }
    return { session };
  },
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
