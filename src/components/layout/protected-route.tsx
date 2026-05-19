import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/Usepermissions';

interface ProtectedRouteProps {
  /** The permission flag that must be true to render children */
  requires: keyof ReturnType<typeof usePermissions>;
  /** Where to send the user if they lack access. Defaults to /catalog */
  redirectTo?: string;
  children: React.ReactNode;
}

export function ProtectedRoute({
  requires,
  redirectTo = '/catalog',
  children,
}: ProtectedRouteProps) {
  const perms = usePermissions();

  if (!perms[requires]) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}