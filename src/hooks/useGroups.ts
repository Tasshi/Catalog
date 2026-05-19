import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Group, GroupMember, SubGroup } from '../components/layout/ui/cons';

type GroupInsert = {
  name: string;
  owner_id: string;
  description?: string;
  icon?: string;
};

type GroupMemberInsert = {
  group_id: string;
  user_id: string;
  role: string;
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
        const { data, error } = await supabase
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
  }, [user?.id, authLoading]);  // ← user?.id not user — stable string, no false re-runs

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

    const { data, error } = await supabase
      .from('groups')
      .insert(payload as unknown as never)
      .select()
      .single();

    if (error) {
      console.error('[createGroup] insert failed:', error);
      throw new Error(error.message);
    }

    const group = data as Group;

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'owner' } as unknown as never);

    if (memberError) throw new Error(memberError.message);

    await fetchGroups();
    return group;
  }

  async function deleteGroup(groupId: string) {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
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
        const { data: memberData, error } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId as string);

        if (cancelled) return;
        if (error) { console.error('[fetchMembers]', error); return; }

        const userIds = memberData.map((m) => m.user_id);

        const { data: profileData } = userIds.length
          ? await supabase
              .from('profiles')
              .select('id, full_name, email, phone, avatar_url')
              .in('id', userIds)
          : { data: [] };

        const merged = memberData.map((m) => ({
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
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role } as unknown as never);
    if (error) throw new Error(error.message);
    await fetchMembers();
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from('group_members').delete().eq('id', memberId);
    if (error) throw new Error(error.message);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  async function updateRole(memberId: string, role: string) {
    const { error } = await supabase
      .from('group_members')
      .update({ role } as unknown as never)
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
        const { data, error } = await supabase
          .from('subgroups')
          .select('id, group_id, name, created_at')
          .eq('group_id', groupId as string)
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
    const { data, error } = await supabase
      .from('subgroups')
      .insert({ group_id: groupId, name: name.trim() } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await refetch();
    return data as SubGroup;
  }

  async function deleteSubGroup(subGroupId: string) {
    const { error } = await supabase.from('subgroups').delete().eq('id', subGroupId);
    if (error) throw new Error(error.message);
    setSubGroups(prev => prev.filter(s => s.id !== subGroupId));
  }

  return { subGroups, loading, refetch, createSubGroup, deleteSubGroup };
}