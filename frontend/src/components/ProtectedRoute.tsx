import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Path pattern for this route (e.g. /customers). Used for role check. */
  path?: string;
}

/**
 * Requires user to be logged in. If not, redirects to /login?next=currentPath.
 * If user is logged in but their role cannot access this path, redirects to /.
 */
export default function ProtectedRoute({ children, path: routePath }: ProtectedRouteProps) {
  const { user, loading, isAllowed } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname || '/';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-soft">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-sm">読み込み中…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  const pathToCheck = routePath ?? currentPath;
  const normalized = pathToCheck.replace(/\/$/, '') || '/';
  if (!isAllowed(normalized)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
