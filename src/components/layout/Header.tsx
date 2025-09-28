import { Link } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { AuthDialog } from "@/components/auth/auth-dialog";

export default function Header() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<'signin' | 'signup'>('signin');

  const AuthButtons = () => (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setAuthTab('signin');
          setAuthOpen(true);
        }}
      >
        Sign In
      </Button>
      <Button
        size="sm"
        onClick={() => {
          setAuthTab('signup');
          setAuthOpen(true);
        }}
      >
        Sign Up
      </Button>
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );

  return (
    <header className="app-header p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        {session?.user && (
          <>
            <div className="px-2 font-bold">
              <Link to="/marketplace">Marketplace</Link>
            </div>
            <div className="px-2 font-bold">
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </>
        )}

        <div className="px-2 font-bold">
          <Link to="/demo/start/server-funcs">Start - Server Functions</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/api-request">Start - API Request</Link>
        </div>
      </nav>

      <div className="flex items-center gap-2 min-h-9">
        {isPending ? (
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
                  router.navigate({ to: "/" });
                }
              }}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <AuthButtons />
        )}
      </div>
    </header>
  );
}

