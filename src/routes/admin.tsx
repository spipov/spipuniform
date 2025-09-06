import { createFileRoute } from "@tanstack/react-router";
import { AdminTest } from "@/components/admin/admin-test";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Keep hooks order stable; navigate away in effect when not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.navigate({ to: "/" });
    }
  }, [isPending, session, router]);

  // Avoid rendering during loading or when unauthenticated
  if (isPending || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <AdminTest />
      </div>
    </div>
  );
}
