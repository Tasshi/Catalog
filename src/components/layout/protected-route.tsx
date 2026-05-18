// import { Navigate, Outlet } from 'react-router';
// import { useSession } from '@/features/auth/api/use-session';

// export const ProtectedRoute = () => {
//   const { data: session, isLoading } = useSession();

//   if (isLoading) return null; // replace with a loading spinner once you have one
//   if (!session) return <Navigate to="/login" replace />;

//   return <Outlet />;
// };
// components/ProtectedRoute.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Wraps routes that require specific permissions.
// If the user lacks access they are redirected rather than shown a blank page.
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Usage in your router (React Router v6):
//
// import { ProtectedRoute } from './components/ProtectedRoute';
//
// <Routes>
//   {/* Dashboard — admin only; members land on /catalog instead */}
//   <Route
//     path="/"
//     element={
//       <ProtectedRoute requires="canViewDashboard">
//         <DashboardPage />
//       </ProtectedRoute>
//     }
//   />
//
//   {/* Catalog — everyone */}
//   <Route path="/catalog" element={<CatalogPage />} />
//
//   {/* Groups / Cohorts — everyone */}
//   <Route path="/groups" element={<GroupsPage />} />
//
//   {/* Admin dashboard — admin only */}
//   <Route
//     path="/admin"
//     element={
//       <ProtectedRoute requires="canAccessAdmin">
//         <AdminPage />
//       </ProtectedRoute>
//     }
//   />
// </Routes>
// ─────────────────────────────────────────────────────────────────────────────