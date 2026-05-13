import { useGroups } from '../../hooks/useGroups';
import { GroupCard } from '../groups/GroupCard';
import { Users } from 'lucide-react';

export default function GroupList({ onSelect }) {
  const { groups, loading } = useGroups();

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ color: 'var(--text3)' }}>
      <div className="text-sm">Loading groups…</div>
    </div>
  );

  if (groups.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text3)' }}>
      <Users size={48} className="mb-3 opacity-30" />
      <div className="text-sm">No groups yet — create one to collaborate</div>
    </div>
  );

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {groups.map(g => <GroupCard key={g.id} group={g} onClick={onSelect} />)}
    </div>
  );
}
