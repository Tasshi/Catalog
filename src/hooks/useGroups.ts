// import { useState, useEffect, useCallback, useRef } from 'react';
// import { supabase } from '../lib/supabase';
// import { useAuth } from '../contexts/AuthContext';
// import type { Group, GroupMember, SubGroup } from '../components/layout/ui/cons';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const db = supabase as any;

// type GroupInsert = {
//   name: string;
//   owner_id: string;
//   description?: string;
//   icon?: string;
// };

// // ---------------------------------------------------------------------------
// // useGroups
// // ---------------------------------------------------------------------------
// export function useGroups() {
//   const { user, loading: authLoading } = useAuth();
//   const [groups, setGroups] = useState<Group[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchGroupsRef = useRef<(() => Promise<void>) | undefined>(undefined);

//   useEffect(() => {
//     if (authLoading) return;
//     if (!user) {
//       setLoading(false);
//       return;
//     }

//     let cancelled = false;
//     let inflight = 0;

//     async function loadGroups() {
//       inflight += 1;
//       if (inflight === 1) setLoading(true);

//       try {
//         const { data, error } = await db
//           .from('groups')
//           .select(`
//             *,
//             group_members:group_members(count),
//             files:files(count)
//           `)
//           .order('created_at', { ascending: false });

//         if (cancelled) return;
//         if (error) { console.error('[fetchGroups]', error); return; }

//         setGroups((data as Group[]) ?? []);
//       } finally {
//         inflight -= 1;
//         if (!cancelled && inflight === 0) setLoading(false);
//       }
//     }

//     fetchGroupsRef.current = loadGroups;
//     loadGroups();

//     return () => {
//       cancelled = true;
//       fetchGroupsRef.current = undefined;
//     };
//   }, [user?.id, authLoading]);

//   const fetchGroups = useCallback(() => {
//     return fetchGroupsRef.current?.() ?? Promise.resolve();
//   }, []);

//   async function createGroup({
//     name, description, icon,
//   }: {
//     name: string;
//     description?: string;
//     icon?: string;
//   }) {
//     if (!user) throw new Error('Not authenticated');

//     const payload: GroupInsert = { name, owner_id: user.id };
//     if (description?.trim()) payload.description = description.trim();
//     if (icon)                 payload.icon        = icon;

//     const { data, error } = await db
//       .from('groups')
//       .insert(payload)
//       .select()
//       .single();

//     if (error) {
//       console.error('[createGroup] insert failed:', error);
//       throw new Error(error.message);
//     }

//     const group = data as Group;

//     const { error: memberError } = await db
//       .from('group_members')
//       .insert({ group_id: group.id, user_id: user.id, role: 'owner' });

//     if (memberError) throw new Error(memberError.message);

//     await fetchGroups();
//     return group;
//   }

//   async function deleteGroup(groupId: string) {
//     const { error } = await db.from('groups').delete().eq('id', groupId);
//     if (error) throw new Error(error.message);
//     await fetchGroups();
//   }

//   return {
//     groups,
//     loading: loading || authLoading,
//     refetch: fetchGroups,
//     createGroup,
//     deleteGroup,
//   };
// }

// // ---------------------------------------------------------------------------
// // useGroupMembers
// // ---------------------------------------------------------------------------
// export function useGroupMembers(groupId: string | null) {
//   const [members, setMembers] = useState<GroupMember[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchMembersRef = useRef<(() => Promise<void>) | undefined>(undefined);

//   useEffect(() => {
//     if (!groupId) return;

//     let cancelled = false;
//     let inflight = 0;

//     async function loadMembers() {
//       inflight += 1;
//       if (inflight === 1) setLoading(true);

//       try {
//         const { data: memberData, error } = await db
//           .from('group_members')
//           .select('*')
//           .eq('group_id', groupId) as {
//             data: { id: string; user_id: string; role: string; [key: string]: unknown }[] | null; // ✅ typed
//             error: unknown;
//           };

//         if (cancelled) return;
//         if (error) { console.error('[fetchMembers]', error); return; }

//         const userIds = (memberData ?? []).map((m) => m.user_id);

//         const { data: profileData } = userIds.length
//           ? await db
//               .from('profiles')
//               .select('id, full_name, email, phone, avatar_url')
//               .in('id', userIds) as {
//                 data: { id: string; full_name?: string | null; email?: string | null; phone?: string | null; avatar_url?: string | null }[] | null
//               }
//           : { data: [] };

//         const merged = (memberData ?? []).map((m) => ({
//           ...m,
//           profile: profileData?.find((p) => p.id === m.user_id) ?? null,
//         }));

//         setMembers((merged as GroupMember[]) ?? []);
//       } finally {
//         inflight -= 1;
//         if (!cancelled && inflight === 0) setLoading(false);
//       }
//     }

//     fetchMembersRef.current = loadMembers;
//     loadMembers();

//     return () => {
//       cancelled = true;
//       fetchMembersRef.current = undefined;
//     };
//   }, [groupId]);

//   const fetchMembers = useCallback(() => {
//     return fetchMembersRef.current?.() ?? Promise.resolve();
//   }, []);

//   async function addMember(userId: string, role = 'viewer') {
//     if (!groupId) throw new Error('No group selected');
//     const { error } = await db
//       .from('group_members')
//       .insert({ group_id: groupId, user_id: userId, role });
//     if (error) throw new Error(error.message);
//     await fetchMembers();
//   }

//   async function removeMember(memberId: string) {
//     const { error } = await db.from('group_members').delete().eq('id', memberId);
//     if (error) throw new Error(error.message);
//     setMembers(prev => prev.filter(m => m.id !== memberId));
//   }

//   async function updateRole(memberId: string, role: string) {
//     const { error } = await db
//       .from('group_members')
//       .update({ role })
//       .eq('id', memberId);
//     if (error) throw new Error(error.message);
//     setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, role } : m)));
//   }

//   return { members, loading, addMember, removeMember, updateRole, refetch: fetchMembers };
// }

// // ---------------------------------------------------------------------------
// // useSubGroups
// // ---------------------------------------------------------------------------
// export function useSubGroups(groupId: string | null) {
//   const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
//   const [loading, setLoading] = useState(!!groupId);

//   const fetchRef = useRef<(() => Promise<void>) | undefined>(undefined);

//   useEffect(() => {
//     if (!groupId) {
//       setSubGroups([]);
//       setLoading(false);
//       return;
//     }

//     let cancelled = false;

//     async function loadSubGroups() {
//       setLoading(true);
//       try {
//         const { data, error } = await db
//           .from('subgroups')
//           .select('id, group_id, name, created_at')
//           .eq('group_id', groupId)
//           .order('created_at', { ascending: true });

//         if (cancelled) return;
//         if (error) { console.error('[fetchSubGroups]', JSON.stringify(error)); setSubGroups([]); return; }

//         setSubGroups((data as SubGroup[]) ?? []);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     fetchRef.current = loadSubGroups;
//     loadSubGroups();

//     return () => {
//       cancelled = true;
//       fetchRef.current = undefined;
//     };
//   }, [groupId]);

//   const refetch = useCallback(() => {
//     return fetchRef.current?.() ?? Promise.resolve();
//   }, []);

//   async function createSubGroup(name: string) {
//     if (!groupId) throw new Error('No group selected');
//     const { data, error } = await db
//       .from('subgroups')
//       .insert({ group_id: groupId, name: name.trim() })
//       .select()
//       .single();
//     if (error) throw new Error(error.message);
//     await refetch();
//     return data as SubGroup;
//   }

//   async function deleteSubGroup(subGroupId: string) {
//     const { error } = await db.from('subgroups').delete().eq('id', subGroupId);
//     if (error) throw new Error(error.message);
//     setSubGroups(prev => prev.filter(s => s.id !== subGroupId));
//   }

//   return { subGroups, loading, refetch, createSubGroup, deleteSubGroup };
// }
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Group, GroupMember, SubGroup } from '../components/layout/ui/cons';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type GroupInsert = {
  name: string;
  owner_id: string;
  description?: string;
  icon?: string;
};

// ---------------------------------------------------------------------------
// useGroups
// ---------------------------------------------------------------------------
export function useGroups() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupsRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let inflight = 0;

    async function loadGroups() {
      inflight += 1;
      if (inflight === 1) setLoading(true);

      try {
        const { data, error } = await db
          .from('groups')
          .select(`
            *,
            group_members:group_members(count),
            files:files(count)
          `)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error) { console.error('[fetchGroups]', error); return; }

        setGroups((data as Group[]) ?? []);
      } finally {
        inflight -= 1;
        if (!cancelled && inflight === 0) setLoading(false);
      }
    }

    fetchGroupsRef.current = loadGroups;
    loadGroups();

    return () => {
      cancelled = true;
      fetchGroupsRef.current = undefined;
    };
  }, [user?.id, authLoading]);

  const fetchGroups = useCallback(() => {
    return fetchGroupsRef.current?.() ?? Promise.resolve();
  }, []);

  async function createGroup({
    name, description, icon,
  }: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    if (!user) throw new Error('Not authenticated');

    const payload: GroupInsert = { name, owner_id: user.id };
    if (description?.trim()) payload.description = description.trim();
    if (icon)                 payload.icon        = icon;

    const { data, error } = await db
      .from('groups')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[createGroup] insert failed:', error);
      throw new Error(error.message);
    }

    const group = data as Group;

    const { error: memberError } = await db
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'owner' });

    if (memberError) throw new Error(memberError.message);

    await fetchGroups();
    return group;
  }

  async function deleteGroup(groupId: string) {
    const { error } = await db.from('groups').delete().eq('id', groupId);
    if (error) throw new Error(error.message);
    await fetchGroups();
  }

  return {
    groups,
    loading: loading || authLoading,
    refetch: fetchGroups,
    createGroup,
    deleteGroup,
  };
}

// ---------------------------------------------------------------------------
// useGroupMembers
// ---------------------------------------------------------------------------
export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembersRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;
    let inflight = 0;

    async function loadMembers() {
      inflight += 1;
      if (inflight === 1) setLoading(true);

      try {
        const { data: memberData, error } = await db
          .from('group_members')
          .select('*')
          .eq('group_id', groupId) as {
            data: { id: string; user_id: string; role: string; [key: string]: unknown }[] | null;
            error: unknown;
          };

        if (cancelled) return;
        if (error) { console.error('[fetchMembers]', error); return; }

        const userIds = (memberData ?? []).map((m) => m.user_id);

        const { data: profileData } = userIds.length
          ? await db
              .from('profiles')
              .select('id, full_name, email, phone, avatar_url')
              .in('id', userIds) as {
                data: { id: string; full_name?: string | null; email?: string | null; phone?: string | null; avatar_url?: string | null }[] | null
              }
          : { data: [] };

        const merged = (memberData ?? []).map((m) => ({
          ...m,
          profile: profileData?.find((p) => p.id === m.user_id) ?? null,
        }));

        setMembers((merged as GroupMember[]) ?? []);
      } finally {
        inflight -= 1;
        if (!cancelled && inflight === 0) setLoading(false);
      }
    }

    fetchMembersRef.current = loadMembers;
    loadMembers();

    return () => {
      cancelled = true;
      fetchMembersRef.current = undefined;
    };
  }, [groupId]);

  const fetchMembers = useCallback(() => {
    return fetchMembersRef.current?.() ?? Promise.resolve();
  }, []);

  async function addMember(userId: string, role = 'viewer') {
    if (!groupId) throw new Error('No group selected');
    const { error } = await db
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role });
    if (error) throw new Error(error.message);
    await fetchMembers();
  }

  async function removeMember(memberId: string) {
    const { error } = await db.from('group_members').delete().eq('id', memberId);
    if (error) throw new Error(error.message);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  async function updateRole(memberId: string, role: string) {
    const { error } = await db
      .from('group_members')
      .update({ role })
      .eq('id', memberId);
    if (error) throw new Error(error.message);
    setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, role } : m)));
  }

  return { members, loading, addMember, removeMember, updateRole, refetch: fetchMembers };
}

// ---------------------------------------------------------------------------
// useSubGroups
// ---------------------------------------------------------------------------
export function useSubGroups(groupId: string | null) {
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [loading, setLoading] = useState(!!groupId);

  const fetchRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    if (!groupId) {
      setSubGroups([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSubGroups() {
      setLoading(true);
      try {
        const { data, error } = await db
          .from('subgroups')
          .select('id, group_id, name, created_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (error) { console.error('[fetchSubGroups]', JSON.stringify(error)); setSubGroups([]); return; }

        setSubGroups((data as SubGroup[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRef.current = loadSubGroups;
    loadSubGroups();

    return () => {
      cancelled = true;
      fetchRef.current = undefined;
    };
  }, [groupId]);

  const refetch = useCallback(() => {
    return fetchRef.current?.() ?? Promise.resolve();
  }, []);

  async function createSubGroup(name: string) {
    if (!groupId) throw new Error('No group selected');
    const { data, error } = await db
      .from('subgroups')
      .insert({ group_id: groupId, name: name.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await refetch();
    return data as SubGroup;
  }

  async function deleteSubGroup(subGroupId: string) {
    const { error } = await db.from('subgroups').delete().eq('id', subGroupId);
    if (error) throw new Error(error.message);
    setSubGroups(prev => prev.filter(s => s.id !== subGroupId));
  }

  return { subGroups, loading, refetch, createSubGroup, deleteSubGroup };
}

// ---------------------------------------------------------------------------
// useUserGroupIds
// Returns a Set of group IDs the current user belongs to (via group_members).
// Used for permission checks: upload allowed only if user is a member.
// ---------------------------------------------------------------------------
export function useUserGroupIds() {
  const { user, loading: authLoading } = useAuth();
  const [userGroupIds, setUserGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    db
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .then(({ data }: { data: { group_id: string }[] | null }) => {
        if (cancelled) return;
        setUserGroupIds(new Set((data ?? []).map(r => r.group_id)));
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  return { userGroupIds, loading: loading || authLoading };
}

// ---------------------------------------------------------------------------
// useProfileCohort
// Reads and writes the current user's selected cohort on the profiles table.
// cohort column stores the display name e.g. 'Cohort 2' matching groups.cohort
// ---------------------------------------------------------------------------
export function useProfileCohort() {
  const { user, loading: authLoading } = useAuth();
  const [cohort,  setCohort]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Fetch current cohort from profiles ──────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    db
      .from('profiles')
      .select('cohort')
      .eq('id', user.id)
      .single()
      .then(({ data }: { data: { cohort: string | null } | null }) => {
        if (cancelled) return;
        setCohort(data?.cohort ?? null);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  // ── Write selected cohort back to profiles ──────────────────────────
  // Pass the groups.cohort slug value e.g. 'cohort2', or null to clear.
  // The FK + view handle the join to groups automatically.
  async function saveCohort(cohortValue: string | null) {
    if (!user) { setError('Not logged in'); return false; }
    setSaving(true);
    setError(null);

    const { error: err } = await db
      .from('profiles')
      .update({ cohort: cohortValue })
      .eq('id', user.id);

    setSaving(false);

    if (err) {
      console.error('[saveCohort]', err);
      setError(err.message);
      return false;
    }

    setCohort(cohortValue);
    return true;
  }

  return { cohort, loading: loading || authLoading, saving, error, saveCohort };
}