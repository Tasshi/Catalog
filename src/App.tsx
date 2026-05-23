import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { GroupsProvider } from './contexts/GroupsContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Upload from './pages/Upload';
import Groups from './pages/Groups';
import FileDetail from './pages/FileDetail';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import SubfoldersView from './pages/SubfoldersView';
import ProjectDetail from './pages/ProjectDetail';
import ResetPassword from './pages/ResetPassword';

const styles = {
  loadingScreen: 'min-h-screen flex items-center justify-center bg-[var(--navy)] text-[var(--text3)]',
  loadingInner:  'text-center',
  loadingIcon:   'text-4xl mb-3',
  loadingText:   'text-sm',
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
  return user
    ? <GroupsProvider>{children}</GroupsProvider>
    : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/catalog" replace /> : <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <LoadingScreen />;
  return profile.role === 'admin'
    ? <GroupsProvider>{children}</GroupsProvider>
    : <Navigate to="/catalog" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth"           element={<PublicRoute><Auth /></PublicRoute>} />

      {/* No guard — reads token from URL hash */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin only */}
      <Route path="/"               element={<AdminRoute><Dashboard /></AdminRoute>} />

      {/* Protected — any logged-in user */}
      <Route path="/catalog"                    element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
      <Route path="/catalog/:fileId/subfolders" element={<ProtectedRoute><SubfoldersView /></ProtectedRoute>} />
      <Route path="/upload"                     element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/groups"                     element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/groups/:groupId"            element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/files/:id"                  element={<ProtectedRoute><FileDetail /></ProtectedRoute>} />
      <Route path="/settings"                   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/change-password"            element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*"               element={<Navigate to="/catalog" replace />} />
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