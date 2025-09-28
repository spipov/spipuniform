import React from 'react';
import { useRouter } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute component that checks user permissions before rendering children
 * Redirects to fallback path if user lacks required permission or is not authenticated
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  fallbackPath = '/',
  requireAuth = true
}: ProtectedRouteProps) {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const isSignedIn = !!session?.user;

  const { data: myPerms, isPending: permsPending, isError: permsError } = useQuery({
    queryKey: ["my-permissions", isSignedIn],
    queryFn: async () => {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load permissions");
      return res.json() as Promise<{ role: string | null; permissions: Record<string, boolean> }>;
    },
    staleTime: 60_000,
    enabled: isSignedIn, // prevent pre-session fetch that would 401
    retry: 2,
  });

  // Show loading while checking authentication and permissions
  if (sessionPending || (isSignedIn && permsPending)) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isSignedIn) {
    router.navigate({ to: '/auth/signin', search: { redirect: window.location.pathname } });
    return null;
  }

  // Check permission requirement
  if (requiredPermission && isSignedIn && !permsError) {
    const hasPermission = myPerms?.permissions?.[requiredPermission] === true;
    if (!hasPermission) {
      router.navigate({ to: fallbackPath });
      return null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes with permissions
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string,
  fallbackPath?: string,
  requireAuth?: boolean
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredPermission={requiredPermission}
        fallbackPath={fallbackPath}
        requireAuth={requireAuth}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}