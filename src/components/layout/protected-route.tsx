import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/features/auth/api/use-session';

export const ProtectedRoute = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading) return null; // replace with a loading spinner once you have one
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
};
