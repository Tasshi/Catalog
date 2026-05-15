import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Group, GroupMember } from '../components/ui/cons';

// ---------------------------------------------------------------------------
// Local insert types — replace with generated Database types when available.
// Run: npx supabase gen types typescript --project-id YOUR_ID > types/supabase.ts
// Then type your client: createClient<Database>(url, key)
// ---------------------------------------------------------------------------
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
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroupsRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

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

        if (error) {
          console.error('[fetchGroups]', error);
          return;
        }

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
  }, [user]);

  const fetchGroups = useCallback(() => {
    return fetchGroupsRef.current?.() ?? Promise.resolve();
  }, []);

  async function createGroup({
    name,
    description,
    icon,
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
      console.error('[createGroup] insert failed:', {
        message: error.message,
        details: error.details,
        hint:    error.hint,
        code:    error.code,
      });
      throw new Error(error.message);
    }

    // Cast after the error guard so TS knows data is non-null.
    const group = data as Group;

    const memberPayload: GroupMemberInsert = {
      group_id: group.id,
      user_id:  user.id,
      role:     'owner',
    };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert(memberPayload as unknown as never);

    if (memberError) {
      console.error('[createGroup] member insert failed:', memberError);
      throw new Error(memberError.message);
    }

    await fetchGroups();
    return group;
  }

  async function deleteGroup(groupId: string) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw new Error(error.message);

    await fetchGroups();
  }

  return { groups, loading, refetch: fetchGroups, createGroup, deleteGroup };
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
        const { data, error } = await supabase
          .from('group_members')
          .select(`*, profile:profiles(full_name, avatar_url)`)
          .eq('group_id', groupId as string);

        if (cancelled) return;

        if (error) {
          console.error('[fetchMembers]', error);
          return;
        }

        setMembers((data as GroupMember[]) ?? []);
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

    const payload: GroupMemberInsert = {
      group_id: groupId,
      user_id:  userId,
      role,
    };

    const { error } = await supabase
      .from('group_members')
      .insert(payload as unknown as never);

    if (error) throw new Error(error.message);

    await fetchMembers();
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (error) throw new Error(error.message);

    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  async function updateRole(memberId: string, role: string) {
    const { error } = await supabase
      .from('group_members')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ role } as unknown as never)
      .eq('id', memberId);

    if (error) throw new Error(error.message);

    setMembers(prev =>
      prev.map(m => (m.id === memberId ? { ...m, role } : m)),
    );
  }

  return {
    members,
    loading,
    addMember,
    removeMember,
    updateRole,
    refetch: fetchMembers,
  };
}