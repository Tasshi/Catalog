// import { createBrowserRouter } from 'react-router';
// import { RootLayout } from '@/components/layout/root-layout';
// import { ProtectedRoute } from '@/components/layout/protected-route';
// import { HomePage } from './home-page';
// import { LoginPage } from './login-page';
// import { PostsListPage } from './posts-list-page';
// import { PostDetailPage } from './post-detail-page';
// import { NotFoundPage } from './not-found-page';

// export const router = createBrowserRouter([
//   {
//     element: <RootLayout />,
//     children: [
//       { path: '/', element: <HomePage /> },
//       { path: '/login', element: <LoginPage /> },
//       { path: '/posts', element: <PostsListPage /> },
//       { path: '/posts/:id', element: <PostDetailPage /> },

//       // Routes that require an authenticated user go inside this block
//       {
//         element: <ProtectedRoute />,
//         children: [
//           // e.g. { path: '/dashboard', element: <DashboardPage /> },
//         ],
//       },

//       { path: '*', element: <NotFoundPage /> },
//     ],
//   },
// ]);
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import Catalog from '../pages/Catalog';
import Upload from '../pages/Upload';
import Groups from '../pages/Groups';
import FileDetail from '../pages/FileDetail';
import Settings from '../pages/Settings';

const styles = {
  loadingScreen: 'min-h-screen flex items-center justify-center bg-[var(--navy)] text-[var(--text3)]',
  loadingInner: 'text-center',
  loadingIcon:  'text-4xl mb-3',
  loadingText:  'text-sm',
} as const;

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingInner}>
        <div className={styles.loadingIcon}>🗄</div>
        <div className={styles.loadingText}>Loading FileVault…</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth"      element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/catalog"   element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
      <Route path="/upload"    element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/groups"    element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/files/:id" element={<ProtectedRoute><FileDetail /></ProtectedRoute>} />
      <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}