import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import GroupMemberModal from '../components/groups/GroupMemberModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import { GroupCard } from '../components/groups/GroupCard';
import GroupDetail from '../components/groups/GroupDetail';
import { Button } from '../components/layout/ui/index';
import { Plus, Search, X, AlertTriangle } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { usePermissions } from '../hooks/Usepermissions';
import { useAuth } from '../contexts/AuthContext';
import type { Group } from '../components/layout/ui/cons';

// ─── Styles ───────────────────────────────────────────────────────────────────

const pillBase = [
  'inline-flex items-center h-8 px-4 rounded-full text-sm font-medium',
  'transition-all duration-150 cursor-pointer border whitespace-nowrap',
].join(' ');

const pillActive =
  'text-white border-transparent shadow-md bg-[#1E3A8A] [box-shadow:0_4px_12px_rgba(30,58,138,0.35)]';
const pillInactive =
  'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Groups() {
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortDismissed, setCohortDismissed] = useState(false);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 6;

  const { groups, loading } = useGroups();
  const { canManageGroups } = usePermissions();
  const { profile } = useAuth();

  const noCohort = !cohortDismissed && !profile?.cohort && profile?.role !== 'admin';

  function handleSelectGroup(group: Group | null) {
    if (group) {
      navigate(`/groups/${group.id}`);
    } else {
      setSelectedGroup(null);
    }
  }

  // Filter by group name pill AND search query
  const visibleGroups = useMemo(() => {
    let result = filterGroupId ? groups.filter((g) => g.id === filterGroupId) : groups;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (g) => g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [groups, filterGroupId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(visibleGroups.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedGroups = visibleGroups.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Layout selectedGroupId={selectedGroup?.id ?? null} onSelectGroup={handleSelectGroup}>
      <Header
        title={selectedGroup ? `${selectedGroup.icon ?? '📁'} ${selectedGroup.name}` : 'Groups'}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedGroup && (
              <Button variant="ghost" onClick={() => handleSelectGroup(null)}>
                ← Back
              </Button>
            )}
            {canManageGroups && (
              <Button
                variant="primary"
                onClick={() => setCreateOpen(true)}
                style={{ background: '#1E3A8A' }}
              >
                <Plus size={13} /> New Cohort
              </Button>
            )}
          </div>
        }
      />

      {noCohort && (
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3">
          <AlertTriangle size={15} className="shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-bold text-amber-900">Oops! No cohort selected</span>
            <span className="ml-2 text-[12px] text-amber-700">
              Please choose your cohort in Settings to upload or manage files.
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="h-7 shrink-0 cursor-pointer rounded-lg border-0 px-3 text-[12px] font-semibold whitespace-nowrap text-white transition-colors"
            style={{ background: '#EB5800' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#CC4D00')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#EB5800')}
          >
            Go to Settings
          </button>
          <button
            onClick={() => setCohortDismissed(true)}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-amber-100 text-amber-400 hover:bg-amber-200"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="animate-slideIn">
        {!selectedGroup ? (
          loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#4a6080',
              }}
            >
              Loading groups…
            </div>
          ) : groups.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#4a6080',
                gap: 8,
              }}
            >
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
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search cohorts…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 2,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter pills — one per group name */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterGroupId(null)}
                    className={[pillBase, filterGroupId === null ? pillActive : pillInactive].join(
                      ' ',
                    )}
                  >
                    All
                  </button>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFilterGroupId((prev) => (prev === g.id ? null : g.id))}
                      className={[
                        pillBase,
                        filterGroupId === g.id ? pillActive : pillInactive,
                      ].join(' ')}
                    >
                      {g.icon && <span className="mr-1">{g.icon}</span>}
                      {g.name}
                      {(g.files?.[0]?.count ?? 0) > 0 && (
                        <span
                          className={[
                            'ml-1.5 text-[11px]',
                            filterGroupId === g.id ? 'opacity-70' : 'text-slate-400',
                          ].join(' ')}
                        >
                          {g.files![0].count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Group grid ── */}
              {visibleGroups.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: 64,
                    gap: 10,
                    color: '#94a3b8',
                  }}
                >
                  <span style={{ fontSize: 36 }}>🔍</span>
                  <p style={{ fontSize: 13, margin: 0 }}>No cohorts match your search</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterGroupId(null);
                    }}
                    style={{
                      fontSize: 12,
                      color: '#6366f1',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {pagedGroups.map((g) => (
                      <GroupCard key={g.id} group={g} onClick={handleSelectGroup} />
                    ))}
                  </div>

                  {/* ── Pagination ── */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-[12px] text-slate-400">
                        {(safePage - 1) * PAGE_SIZE + 1}–
                        {Math.min(safePage * PAGE_SIZE, visibleGroups.length)} of{' '}
                        {visibleGroups.length} cohorts
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500 transition-colors hover:border-[#054159] hover:bg-[#054159] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                        >
                          ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                              n === safePage
                                ? 'border-[#054159] bg-[#054159] text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-[#054159] hover:bg-[#054159] hover:text-white'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500 transition-colors hover:border-[#054159] hover:bg-[#054159] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}
                </>
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
        <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
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
