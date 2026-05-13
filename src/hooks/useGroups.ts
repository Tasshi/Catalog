import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Group, GroupMember } from '../components/ui/cons';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups]   = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members(count),
        files(count)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error('[fetchGroups]', error);
    setGroups(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  async function createGroup({ name, description, icon }: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    if (!user) throw new Error('Not authenticated');

    // Only include optional fields if they have a value —
    // sending undefined for a column that doesn't exist causes a 400.
    const payload: Record<string, string> = {
      name,
      owner_id: user.id,
    };
    if (description?.trim()) payload.description = description.trim();
    if (icon)                 payload.icon        = icon;

    const { data, error } = await supabase
      .from('groups')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Log the full error object — error.details and error.hint
      // will tell you exactly which column Supabase rejected.
      console.error('[createGroup] insert failed:', {
        message: error.message,
        details: error.details,
        hint:    error.hint,
        code:    error.code,
      });
      throw new Error(error.message);
    }

    // Step 2: add creator as owner member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, user_id: user.id, role: 'owner' });

    if (memberError) {
      console.error('[createGroup] member insert failed:', memberError);
      throw new Error(memberError.message);
    }

    await fetchGroups();
    return data;
  }

  async function deleteGroup(groupId: string) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw new Error(error.message);
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }

  return { groups, loading, refetch: fetchGroups, createGroup, deleteGroup };
}

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('group_members')
      .select(`*, profile:profiles(full_name, avatar_url)`)
      .eq('group_id', groupId);

    if (error) console.error('[fetchMembers]', error);
    setMembers(data || []);
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function addMember(userId: string, role = 'viewer') {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role });

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
      .update({ role })
      .eq('id', memberId);

    if (error) throw new Error(error.message);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  }

  return { members, loading, addMember, removeMember, updateRole, refetch: fetchMembers };
}