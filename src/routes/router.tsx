// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from '../contexts/AuthContext';
// import { AppProvider } from '../contexts/AppContext';
// import { GroupsProvider } from '../contexts/GroupsContext';        // ← added
// import Auth from '../pages/Auth';
// import Dashboard from '../pages/Dashboard';
// import Catalog from '../pages/Catalog';
// import Upload from '../pages/Upload';
// import Groups from '../pages/Groups';
// import FileDetail from '../pages/FileDetail';
// import Settings from '../pages/Settings';
// import ChangePassword from '../pages/ChangePassword';
// import SubfoldersView from '../pages/SubfoldersView';

// const styles = {
//   loadingScreen: 'min-h-screen flex items-center justify-center bg-[var(--navy)] text-[var(--text3)]',
//   loadingInner: 'text-center',
//   loadingIcon:  'text-4xl mb-3',
//   loadingText:  'text-sm',
// } as const;

// function LoadingScreen() {
//   return (
//     <div className={styles.loadingScreen}>
//       <div className={styles.loadingInner}>
//         <div className={styles.loadingIcon}>🗄</div>
//         <div className={styles.loadingText}>Loading FileVault…</div>
//       </div>
//     </div>
//   );
// }

// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return <LoadingScreen />;
//   return user
//     ? <GroupsProvider>{children}</GroupsProvider>   // ← wrapped
//     : <Navigate to="/auth" replace />;
// }

// function PublicRoute({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   if (loading) return <LoadingScreen />;
//   return user ? <Navigate to="/" replace /> : <>{children}</>;
// }

// // function AppRoutes() {
// //   return (
// //     <Routes>
// //       <Route path="/auth"            element={<PublicRoute><Auth /></PublicRoute>} />
// //       <Route path="/"                element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// //       <Route path="/catalog"         element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
// //       <Route path="/upload"          element={<ProtectedRoute><Upload /></ProtectedRoute>} />
// //       <Route path="/groups"          element={<ProtectedRoute><Groups /></ProtectedRoute>} />
// //       <Route path="/files/:id"       element={<ProtectedRoute><FileDetail /></ProtectedRoute>} />
// //       <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
// //       <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
// //       <Route path="*"                element={<Navigate to="/" replace />} />
// //     </Routes>
// //   );
// // }
// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/auth"                      element={<PublicRoute><Auth /></PublicRoute>} />
//       <Route path="/"                          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//       <Route path="/catalog"                   element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
//       <Route path="/catalog/:fileId/subfolders" element={<ProtectedRoute><SubfoldersView /></ProtectedRoute>} />
//       <Route path="/upload"                    element={<ProtectedRoute><Upload /></ProtectedRoute>} />
//       <Route path="/groups"                    element={<ProtectedRoute><Groups /></ProtectedRoute>} />
//       <Route path="/files/:id"                 element={<ProtectedRoute><FileDetail /></ProtectedRoute>} />
//       <Route path="/settings"                  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
//       <Route path="/change-password"           element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
//       <Route path="*"                          element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <AppProvider>
//           <AppRoutes />
//         </AppProvider>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { GroupsProvider } from '../contexts/GroupsContext';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import Catalog from '../pages/Catalog';
import Upload from '../pages/Upload';
import Groups from '../pages/Groups';
import FileDetail from '../pages/FileDetail';
import Settings from '../pages/Settings';
import ChangePassword from '../pages/ChangePassword';
import SubfoldersView from '../pages/SubfoldersView';
import ResetPassword from '../pages/ResetPassword'; // ← ADDED

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
  return user
    ? <GroupsProvider>{children}</GroupsProvider>
    : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth"                       element={<PublicRoute><Auth /></PublicRoute>} />

      {/* ← ADDED: no guard at all — ResetPassword reads the token from the
           URL hash itself. Must NOT be inside PublicRoute or ProtectedRoute. */}
      <Route path="/reset-password"             element={<ResetPassword />} />

      <Route path="/"                           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/catalog"                    element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
      <Route path="/catalog/:fileId/subfolders" element={<ProtectedRoute><SubfoldersView /></ProtectedRoute>} />
      <Route path="/upload"                     element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/groups"                     element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/files/:id"                  element={<ProtectedRoute><FileDetail /></ProtectedRoute>} />
      <Route path="/settings"                   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/change-password"            element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="*"                           element={<Navigate to="/" replace />} />
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