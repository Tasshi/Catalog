import { createContext, useContext } from 'react';
import { useGroups as useGroupsHook } from '../hooks/useGroups';
import type { Group } from '../components/ui/cons';

interface GroupsContextType {
  groups: Group[];
  loading: boolean;
  refetch: () => Promise<void>;
  createGroup: (args: { name: string; description?: string; icon?: string }) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | null>(null);

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  const value = useGroupsHook();
  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups(): GroupsContextType {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}