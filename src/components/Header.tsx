import { Link } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/server-funcs">Start - Server Functions</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/api-request">Start - API Request</Link>
        </div>
      </nav>

      <div className="flex items-center gap-2 min-h-9">
        {isPending ? (
          // Stable placeholders while session status is loading to avoid wording flicker
          <div className="flex items-center gap-2 animate-pulse">
            <span className="h-6 w-40 bg-gray-200 rounded" />
            <span className="h-9 w-24 bg-gray-200 rounded" />
          </div>
        ) : session?.user ? (
          <>
            <span className="text-sm text-gray-600">
              Welcome, {session.user.name || session.user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await signOut();
                } finally {
                  // Always navigate to home after sign out
                  router.navigate({ to: "/" });
                }
              }}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Link to="/auth/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
