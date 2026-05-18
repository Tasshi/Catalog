// hooks/usePermissions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central place for all role-based permission checks.
// Consume this hook in any component that needs to gate UI actions.
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'admin' | 'member';

export interface Permissions {
  // ── Catalog / Projects ────────────────────────────────────────────────────
  /** Can view the catalog and browse all projects */
  canViewCatalog: boolean;
  /** Can view individual project details and subproject folders */
  canViewProjects: boolean;
  /** Can upload a new project and assign it to a group */
  canUpload: boolean;
  /** Can edit project metadata (title, description, tags…) */
  canEditProject: boolean;
  /** Can delete a project entirely */
  canDeleteProject: boolean;
  /** Can create, rename, or delete subproject folders */
  canManageSubfolders: boolean;

  // ── Groups / Cohorts ──────────────────────────────────────────────────────
  /** Can see the Team section and browse all cohorts — all authenticated users */
  canViewGroups: boolean;
  /** Can create, edit, or delete groups */
  canManageGroups: boolean;

  // ── Admin ─────────────────────────────────────────────────────────────────
  /** Can access the main Dashboard page (/) — admin only */
  canViewDashboard: boolean;
  /** Can access the admin dashboard */
  canAccessAdmin: boolean;

  // ── Convenience ───────────────────────────────────────────────────────────
  isAdmin: boolean;
  role: UserRole | null;
}

export function usePermissions(): Permissions {
  const { profile } = useAuth();
  const role = (profile?.role ?? 'member') as UserRole;
  const isAdmin = role === 'admin';

  return {
    // Catalog
    canViewCatalog:      true,        // every authenticated user
    canViewProjects:     true,        // every authenticated user
    canUpload:           true,        // every authenticated user (members upload their own work)
    canEditProject:      isAdmin,     // admin only
    canDeleteProject:    isAdmin,     // admin only
    canManageSubfolders: isAdmin,     // admin only — the key restriction you asked for

    // Groups — all authenticated users can view cohorts; only admins manage them
    canViewGroups:   true,
    canManageGroups: isAdmin,

    // Admin
    canViewDashboard: isAdmin,   // members are redirected away from /
    canAccessAdmin:   isAdmin,

    // Convenience
    isAdmin,
    role: profile ? role : null,
  };
}