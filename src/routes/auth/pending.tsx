import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/pending")({
  component: PendingPage,
  meta: () => [
    { title: "Pending Approval" },
  ],
});

function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Thanks for signing up!</h1>
        <p className="text-gray-600">Your account is awaiting admin approval. We’ll email you once it’s approved. You can try signing in later.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/auth/signin" className="text-blue-600 hover:underline">Go to Sign in</Link>
        </div>
      </div>
    </div>
  );
}

