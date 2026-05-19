import { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import GroupList from '../groups/GroupList';
import type { Group } from '../layout/ui/cons';

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Main app sidebar (light) ── */}
      <Sidebar />

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-slate-900 leading-6">
            {selectedGroup ? selectedGroup.name : 'All Groups'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {selectedGroup
              ? `Members and activity in ${selectedGroup.name}`
              : 'All your collaboration groups'}
          </p>
        </div>

        <GroupList onSelect={(g) => setSelectedGroup(g)} />
      </main>
    </div>
  );
}
