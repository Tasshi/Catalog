import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Upload from './pages/Upload';
import Groups from './pages/Groups';
import FileDetail from './pages/FileDetail';
import Settings from './pages/Settings';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  loadingScreen: [
    'min-h-screen flex items-center justify-center',
    'bg-[var(--navy)] text-[var(--text3)]',
  ].join(' '),
  loadingInner: 'text-center',
  loadingIcon:  'text-4xl mb-3',
  loadingText:  'text-sm',
} as const;

// ─── Loading screen (shared by both guards) ───────────────────────────────────

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

// ─── Guards ───────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Wait for Supabase to resolve the session (including OAuth redirects)
  // before deciding whether to render children or redirect to /auth.
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Bug fix: the original code used `user` without checking `loading` here.
  // When Google redirects back, user is null while loading is still true —
  // so <Auth /> rendered immediately, and the session arrived too late.
  // Waiting for loading=false before evaluating user fixes the redirect loop.
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

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

// ─── App ──────────────────────────────────────────────────────────────────────

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
