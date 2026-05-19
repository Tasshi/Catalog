// import { useState, useMemo } from 'react';
// import Layout from '../components/layout/Layout';
// import Header from '../components/layout/Header';
// import GroupMemberModal from '../components/groups/GroupMemberModal';
// import CreateGroupModal from '../components/groups/CreateGroupModal';
// import { GroupCard } from '../components/groups/GroupCard';
// import GroupDetail from '../components/groups/GroupDetail';
// import { Button } from '../components/layout/ui/index';
// import { Plus } from 'lucide-react';
// import { useGroups } from '../hooks/useGroups';
// import { usePermissions } from '../hooks/Usepermissions';
// import type { Group } from '../components/layout/ui/cons';

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const pillBase = [
//   'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium',
//   'transition-all duration-150 cursor-pointer border whitespace-nowrap',
// ].join(' ');

// const pillActive   = 'bg-indigo-500 text-white border-indigo-500 shadow-sm';
// const pillInactive = 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900';

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function Groups() {
//   const [createOpen,    setCreateOpen]    = useState(false);
//   const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
//   const [membersOpen,   setMembersOpen]   = useState(false);
//   const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
//   const { groups, loading } = useGroups();
//   const { canManageGroups } = usePermissions();

//   function handleSelectGroup(group: Group | null) {
//     setSelectedGroup(group);
//   }

//   const visibleGroups = useMemo(() => {
//     return filterGroupId
//       ? groups.filter(g => g.id === filterGroupId)
//       : groups;
//   }, [groups, filterGroupId]);

//   return (
//     <Layout
//       selectedGroupId={selectedGroup?.id ?? null}
//       onSelectGroup={handleSelectGroup}
//     >
//       <Header
//         title={
//           selectedGroup
//             ? `${selectedGroup.icon ?? '📁'} ${selectedGroup.name}`
//             : 'Groups'
//         }
//         actions={
//           <div style={{ display: 'flex', gap: 8 }}>
//             {selectedGroup && (
//               <Button variant="ghost" onClick={() => handleSelectGroup(null)}>
//                 ← Back
//               </Button>
//             )}
//             {canManageGroups && (
//               <Button variant="primary" onClick={() => setCreateOpen(true)}>
//                 <Plus size={13} /> New Cohort
//               </Button>
//             )}
//           </div>
//         }
//       />

//       <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="animate-slideIn">
//         {!selectedGroup ? (
//           loading ? (
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a6080' }}>
//               Loading groups…
//             </div>
//           ) : groups.length === 0 ? (
//             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a6080', gap: 8 }}>
//               <span style={{ fontSize: 40 }}>👥</span>
//               <p>No groups yet{canManageGroups ? ' — create one to collaborate' : ''}</p>
//             </div>
//           ) : (
//             <>
//               {/* ── Pills row ── */}
//               <div className="flex items-center gap-2 flex-wrap mb-5">
//                 {/* All pill */}
//                 <button
//                   type="button"
//                   onClick={() => setFilterGroupId(null)}
//                   className={[pillBase, filterGroupId === null ? pillActive : pillInactive].join(' ')}
//                 >
//                   All
//                 </button>

//                 {/* One pill per group */}
//                 {groups.map(g => (
//                   <button
//                     key={g.id}
//                     type="button"
//                     onClick={() => setFilterGroupId(prev => prev === g.id ? null : g.id)}
//                     className={[pillBase, filterGroupId === g.id ? pillActive : pillInactive].join(' ')}
//                   >
//                     {g.icon && <span className="mr-1">{g.icon}</span>}
//                     {g.name}
//                     {(g.files?.[0]?.count ?? 0) > 0 && (
//                       <span className={[
//                         'ml-1.5 text-[11px]',
//                         filterGroupId === g.id ? 'opacity-70' : 'text-slate-400',
//                       ].join(' ')}>
//                         {g.files![0].count}
//                       </span>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               {/* ── Group grid ── */}
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
//                 {visibleGroups.map(g => (
//                   <GroupCard key={g.id} group={g} onClick={handleSelectGroup} />
//                 ))}
//               </div>
//             </>
//           )
//         ) : (
//           <GroupDetail
//             group={selectedGroup}
//             onBack={() => handleSelectGroup(null)}
//             onMembers={() => setMembersOpen(true)}
//           />
//         )}
//       </div>

//       {canManageGroups && (
//         <CreateGroupModal
//           open={createOpen}
//           onClose={() => setCreateOpen(false)}
//         />
//       )}

//       {selectedGroup && (
//         <GroupMemberModal
//           group={selectedGroup}
//           open={membersOpen}
//           onClose={() => setMembersOpen(false)}
//         />
//       )}
//     </Layout>
//   );
// }
import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import GroupMemberModal from '../components/groups/GroupMemberModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { GroupCard } from '../components/groups/GroupCard';
import GroupDetail from '../components/groups/GroupDetail';
import { Button } from '../components/layout/ui/index';
import { Plus, Search } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { usePermissions } from '../hooks/Usepermissions';
import type { Group } from '../components/layout/ui/cons';

// ─── Styles ───────────────────────────────────────────────────────────────────

const pillBase = [
  'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium',
  'transition-all duration-150 cursor-pointer border whitespace-nowrap',
].join(' ');

const pillActive   = 'bg-indigo-500 text-white border-indigo-500 shadow-sm';
const pillInactive = 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Groups() {
  const [createOpen,    setCreateOpen]    = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [membersOpen,   setMembersOpen]   = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const { groups, loading } = useGroups();
  const { canManageGroups } = usePermissions();

  function handleSelectGroup(group: Group | null) {
    setSelectedGroup(group);
  }

  // Filter by pill selection AND search query
  const visibleGroups = useMemo(() => {
    let result = filterGroupId
      ? groups.filter(g => g.id === filterGroupId)
      : groups;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [groups, filterGroupId, searchQuery]);

  return (
    <Layout
      selectedGroupId={selectedGroup?.id ?? null}
      onSelectGroup={handleSelectGroup}
    >
      <Header
        title={
          selectedGroup
            ? `${selectedGroup.icon ?? '📁'} ${selectedGroup.name}`
            : 'Groups'
        }
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedGroup && (
              <Button variant="ghost" onClick={() => handleSelectGroup(null)}>
                ← Back
              </Button>
            )}
            {canManageGroups && (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={13} /> New Cohort
              </Button>
            )}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="animate-slideIn">
        {!selectedGroup ? (
          loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a6080' }}>
              Loading groups…
            </div>
          ) : groups.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a6080', gap: 8 }}>
              <span style={{ fontSize: 40 }}>👥</span>
              <p>No groups yet{canManageGroups ? ' — create one to collaborate' : ''}</p>
            </div>
          ) : (
            <>
              {/* ── Search + Pills row ── */}
              <div style={{ marginBottom: 20 }}>

                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: 12, maxWidth: 320 }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute', left: 10, top: '50%',
                      transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search cohorts…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      paddingLeft: 30,
                      paddingRight: 12,
                      borderRadius: 8,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 13,
                      color: '#1e293b',
                      background: '#fff',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute', right: 8, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 2,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* All pill */}
                  <button
                    type="button"
                    onClick={() => setFilterGroupId(null)}
                    className={[pillBase, filterGroupId === null ? pillActive : pillInactive].join(' ')}
                  >
                    All
                  </button>

                  {/* One pill per group/cohort name */}
                  {groups.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFilterGroupId(prev => prev === g.id ? null : g.id)}
                      className={[pillBase, filterGroupId === g.id ? pillActive : pillInactive].join(' ')}
                    >
                      {g.icon && <span className="mr-1">{g.icon}</span>}
                      {g.name}
                      {(g.files?.[0]?.count ?? 0) > 0 && (
                        <span className={[
                          'ml-1.5 text-[11px]',
                          filterGroupId === g.id ? 'opacity-70' : 'text-slate-400',
                        ].join(' ')}>
                          {g.files![0].count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Group grid ── */}
              {visibleGroups.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, gap: 10, color: '#94a3b8' }}>
                  <span style={{ fontSize: 36 }}>🔍</span>
                  <p style={{ fontSize: 13, margin: 0 }}>No cohorts match your search</p>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterGroupId(null); }}
                    style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {visibleGroups.map(g => (
                    <GroupCard key={g.id} group={g} onClick={handleSelectGroup} />
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          <GroupDetail
            group={selectedGroup}
            onBack={() => handleSelectGroup(null)}
            onMembers={() => setMembersOpen(true)}
          />
        )}
      </div>

      {canManageGroups && (
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {selectedGroup && (
        <GroupMemberModal
          group={selectedGroup}
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
        />
      )}
    </Layout>
  );
}