import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/pending")({
  component: PendingPage,
  meta: () => [
    { title: "Pending Approval" },
  ],
});

function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Thanks for signing up!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Your account is awaiting admin approval. We'll email you once it's approved. You can try signing in later.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/auth/signin">Go to Sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

