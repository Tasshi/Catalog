
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  mini_cohort_id?: string | null; // ✅ FK to mini_cohorts table
};

// ---------------------------------------------------------------------------
// useGroups
// ---------------------------------------------------------------------------
export function useGroups() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const key = ['groups', user?.id ?? null] as const;

  const { data: groups = [], isLoading } = useQuery({
    queryKey:  key,
    queryFn:   async () => {
      const { data, error } = await db
        .from('groups')
        .select(`*, group_members:group_members(count), files:files(count)`)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as Group[]) ?? [];
    },
    enabled:   !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  async function createGroup({ name, description, icon, mini_cohort_id }: {
    name: string;
    description?: string;
    icon?: string;
    mini_cohort_id?: string | null; // ✅ added
  }) {
    if (!user) throw new Error('Not authenticated');

    const payload: GroupInsert = { name, owner_id: user.id };
    if (description?.trim())  payload.description    = description.trim();
    if (icon)                  payload.icon           = icon;
    if (mini_cohort_id)        payload.mini_cohort_id = mini_cohort_id; // ✅ added

    const { data, error } = await db.from('groups').insert(payload).select().single();

    if (error) {
      console.error('[createGroup] insert failed:', error);
      throw new Error(error.message);
    }

    const group = data as Group;

    const { error: memberError } = await db
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'owner' });

    if (memberError) throw new Error(memberError.message);

    await queryClient.invalidateQueries({ queryKey: key });
    return group;
  }

  async function deleteGroup(groupId: string) {
    const { error } = await db.from('groups').delete().eq('id', groupId);
    if (error) throw new Error(error.message);
    queryClient.setQueryData(key, (old: Group[] = []) => old.filter(g => g.id !== groupId));
  }

  return {
    groups,
    loading: isLoading || authLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: key }),
    createGroup,
    deleteGroup,
  };
}

// ---------------------------------------------------------------------------
// useGroupMembers
// ---------------------------------------------------------------------------
export function useGroupMembers(groupId: string | null) {
  const queryClient = useQueryClient();
  const key = ['group-members', groupId] as const;

  const { data: members = [], isLoading: loading } = useQuery({
    queryKey:  key,
    queryFn:   async () => {
      const { data: memberData, error } = await db
        .from('group_members').select('*').eq('group_id', groupId);
      if (error) throw new Error(error.message);

      const userIds = (memberData ?? []).map((m: { user_id: string }) => m.user_id);

      const { data: profileData } = userIds.length
        ? await db.from('profiles').select('id, full_name, email, phone, avatar_url').in('id', userIds)
        : { data: [] };

      return (memberData ?? []).map((m: { user_id: string }) => ({
        ...m,
        profile: (profileData ?? []).find((p: { id: string }) => p.id === m.user_id) ?? null,
      })) as GroupMember[];
    },
    enabled:   !!groupId,
    staleTime: 5 * 60 * 1000,
  });

  async function addMember(userId: string, role = 'viewer') {
    if (!groupId) throw new Error('No group selected');
    const { error } = await db.from('group_members').insert({ group_id: groupId, user_id: userId, role });
    if (error) throw new Error(error.message);
    await queryClient.invalidateQueries({ queryKey: key });
  }

  async function removeMember(memberId: string) {
    const { error } = await db.from('group_members').delete().eq('id', memberId);
    if (error) throw new Error(error.message);
    queryClient.setQueryData(key, (old: GroupMember[] = []) => old.filter(m => m.id !== memberId));
  }

  async function updateRole(memberId: string, role: string) {
    const { error } = await db.from('group_members').update({ role }).eq('id', memberId);
    if (error) throw new Error(error.message);
    queryClient.setQueryData(key, (old: GroupMember[] = []) =>
      old.map(m => (m.id === memberId ? { ...m, role } : m)),
    );
  }

  return {
    members,
    loading,
    addMember,
    removeMember,
    updateRole,
    refetch: () => queryClient.invalidateQueries({ queryKey: key }),
  };
}

// ---------------------------------------------------------------------------
// useSubGroups
// ---------------------------------------------------------------------------
export function useSubGroups(groupId: string | null) {
  const queryClient = useQueryClient();
  const key = ['subgroups', groupId] as const;

  const { data: subGroups = [], isLoading: loading } = useQuery({
    queryKey:  key,
    queryFn:   async () => {
      const { data, error } = await db
        .from('subgroups').select('id, group_id, name, created_at')
        .eq('group_id', groupId).order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data as SubGroup[]) ?? [];
    },
    enabled:   !!groupId,
    staleTime: 5 * 60 * 1000,
  });

  async function createSubGroup(name: string) {
    if (!groupId) throw new Error('No group selected');
    const { data, error } = await db
      .from('subgroups').insert({ group_id: groupId, name: name.trim() }).select().single();
    if (error) throw new Error(error.message);
    await queryClient.invalidateQueries({ queryKey: key });
    return data as SubGroup;
  }

  async function deleteSubGroup(subGroupId: string) {
    const { error } = await db.from('subgroups').delete().eq('id', subGroupId);
    if (error) throw new Error(error.message);
    queryClient.setQueryData(key, (old: SubGroup[] = []) => old.filter(s => s.id !== subGroupId));
  }

  return {
    subGroups,
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey: key }),
    createSubGroup,
    deleteSubGroup,
  };
}

// ---------------------------------------------------------------------------
// useUserGroupIds
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// ---------------------------------------------------------------------------
export function useProfileCohort() {
  const { user, loading: authLoading } = useAuth();
  const [cohort,  setCohort]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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