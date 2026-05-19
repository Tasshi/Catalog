import { useState, useRef, useEffect, useMemo } from 'react';
import { FormField, Button } from '../layout/ui';
import {
  X, ChevronDown, FolderOpen, Check,
  UserPlus, Trash2, Phone, Mail, Users, Loader2, Layers, Folder,
  FolderPlus, ChevronRight, Plus, Search, Home, SlidersHorizontal,
} from 'lucide-react';
import { useGroups, useGroupMembers, useSubGroups } from '../../hooks/useGroups';
import { useFolderTree } from '../../hooks/useFolderTree';
import { supabase } from '../../lib/supabase';
import type { Group, GroupMember, SubGroup } from '../layout/ui/cons';
import type { FolderRecord } from '../../types/folder';

const ACCENT = '#533AFD';

// ── Types ──────────────────────────────────────────────────────────────────

interface MetadataPanelProps {
  files:     File[];
  onSubmit:  (meta: {
    projectName: string;
    description: string;
    tags:        string[];
    groupId:     string | null;
    subGroupId:  string | null;
    folderId:    string | null;
  }) => void;
  uploading: boolean;
  progress:  number;
}

interface BreadcrumbNode {
  id:       string;
  name:     string;
  children: FolderRecord[];
}

function initials(name: string) {
  return (name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── SingleGroupFolderTree ──────────────────────────────────────────────────
// Mounts one per group. Calls the real useFolderTree hook (which handles
// auth via useAuth internally) and reports results up via onLoaded.

interface GroupTreeLoaderProps {
  groupId:  string;
  onLoaded: (groupId: string, roots: FolderRecord[], loading: boolean, refetch: () => void) => void;
}

function GroupTreeLoader({ groupId, onLoaded }: GroupTreeLoaderProps) {
  const { roots, loading, refetch } = useFolderTree(groupId);

  useEffect(() => {
    onLoaded(groupId, roots, loading, refetch);
  }, [groupId, roots, loading]);

  return null;
}

// ── FolderGrid ─────────────────────────────────────────────────────────────

interface FolderGridProps {
  groups:        Group[];
  groupsLoading: boolean;
  selectedId:    string | null;
  onSelect:      (id: string | null) => void;
  onGroupChange: (id: string | null) => void;
}

interface GroupTreeState {
  roots:   FolderRecord[];
  loading: boolean;
  refetch: () => void;
}

function FolderGrid({ groups, groupsLoading, selectedId, onSelect, onGroupChange }: FolderGridProps) {
  const [activeTab,    setActiveTab]    = useState<string>('all');
  const [stack,        setStack]        = useState<(BreadcrumbNode | null)[]>([null]);
  const [searchQ,      setSearchQ]      = useState('');
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [activeExts,   setActiveExts]   = useState<Set<string>>(new Set());
  const [creating,     setCreating]     = useState<{
    groupId: string; parentId: string | null; parentName: string | null;
  } | null>(null);

  // One entry per group, populated by GroupTreeLoader children
  const [treeByGroup, setTreeByGroup] = useState<Record<string, GroupTreeState>>({});

  function handleGroupLoaded(
    groupId: string,
    roots: FolderRecord[],
    loading: boolean,
    refetch: () => void,
  ) {
    setTreeByGroup(prev => ({
      ...prev,
      [groupId]: { roots, loading, refetch },
    }));
  }

  // Reset navigation when tab changes
  useEffect(() => {
    setStack([null]);
    setSearchQ('');
    setActiveExts(new Set());
    setCreating(null);
  }, [activeTab]);

  // Roots for the active tab
  const currentRoots: FolderRecord[] = useMemo(() => {
    if (activeTab === 'all') {
      return Object.values(treeByGroup).flatMap(t => t.roots);
    }
    return treeByGroup[activeTab]?.roots ?? [];
  }, [activeTab, treeByGroup]);

  const isLoading =
    activeTab === 'all'
      ? Object.values(treeByGroup).some(t => t.loading) || (groups.length > 0 && Object.keys(treeByGroup).length < groups.length)
      : (treeByGroup[activeTab]?.loading ?? true);

  // Current level in the drill-down stack
  const currentChildren: FolderRecord[] = useMemo(() => {
    if (stack.length > 1) {
      return (stack[stack.length - 1] as BreadcrumbNode).children;
    }
    return currentRoots;
  }, [stack, currentRoots]);

  // All extensions across current roots (for filter chips)
  const allExts = useMemo(() => {
    const exts = new Set<string>();
    function collect(nodes: FolderRecord[]) {
      nodes.forEach(n => {
        if ((n as any).ext) exts.add((n as any).ext);
        if (n.children?.length) collect(n.children);
      });
    }
    collect(currentRoots);
    return [...exts].sort();
  }, [currentRoots]);

  // Apply search + ext filter to current level
  const visible = useMemo(() => {
    let items = currentChildren;
    if (searchQ) items = items.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()));
    if (activeExts.size > 0) items = items.filter(c => c.type === 'folder' || activeExts.has((c as any).ext));
    return items;
  }, [currentChildren, searchQ, activeExts]);

  function drillInto(folder: FolderRecord) {
    setStack(s => [...s, { id: folder.id, name: folder.name, children: folder.children ?? [] }]);
    setSearchQ('');
  }

  function jumpTo(idx: number) {
    setStack(s => s.slice(0, idx + 1));
    setSearchQ('');
  }

  function toggleExt(ext: string) {
    setActiveExts(prev => {
      const next = new Set(prev);
      next.has(ext) ? next.delete(ext) : next.add(ext);
      return next;
    });
  }

  // Which groupId to use when creating a new folder
  const createGroupId     = activeTab !== 'all' ? activeTab : (groups[0]?.id ?? '');
  const currentParentId   = stack.length > 1 ? (stack[stack.length - 1] as BreadcrumbNode).id   : null;
  const currentParentName = stack.length > 1 ? (stack[stack.length - 1] as BreadcrumbNode).name : null;

  return (
    <div className="mt-1">

      {/* ── Mount one GroupTreeLoader per group (invisible, side-effect only) ── */}
      {groups.map(g => (
        <GroupTreeLoader key={g.id} groupId={g.id} onLoaded={handleGroupLoaded} />
      ))}

      {/* ── Tab pills + Filter + Search ── */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">

          {/* All tab — always shown */}
          <button
            type="button"
            onClick={() => { setActiveTab('all'); onGroupChange(null); }}
            className="px-4 py-1.5 rounded-full text-sm border transition-all duration-150 whitespace-nowrap"
            style={{
              background:  activeTab === 'all' ? '#1a1a1a' : 'white',
              color:       activeTab === 'all' ? '#fff'    : '#64748D',
              borderColor: activeTab === 'all' ? '#1a1a1a' : '#D4DEE9',
              fontWeight:  activeTab === 'all' ? 500       : 400,
            }}
          >
            All
          </button>

          {/* Skeleton pills while groups load */}
          {groupsLoading && [1, 2].map(i => (
            <div key={i} className="h-8 w-24 rounded-full bg-[#F1F5F9] animate-pulse" />
          ))}

          {/* One pill per cohort */}
          {!groupsLoading && groups.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => { setActiveTab(g.id); onGroupChange(g.id); }}
              className="px-4 py-1.5 rounded-full text-sm border transition-all duration-150 whitespace-nowrap"
              style={{
                background:  activeTab === g.id ? '#1a1a1a' : 'white',
                color:       activeTab === g.id ? '#fff'    : '#64748D',
                borderColor: activeTab === g.id ? '#1a1a1a' : '#D4DEE9',
                fontWeight:  activeTab === g.id ? 500       : 400,
              }}
            >
              {g.icon ? `${g.icon} ` : ''}{g.name}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setFilterOpen(o => !o)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-all duration-150 whitespace-nowrap"
          style={{
            background:  filterOpen || activeExts.size > 0 ? '#f5f4ff' : 'white',
            color:       filterOpen || activeExts.size > 0 ? ACCENT    : '#64748D',
            borderColor: filterOpen || activeExts.size > 0 ? ACCENT    : '#D4DEE9',
          }}
        >
          <SlidersHorizontal size={13} />
          Filter{activeExts.size > 0 ? ` (${activeExts.size})` : ''}
        </button>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white transition-all duration-150"
          style={{ borderColor: searchQ ? ACCENT : '#D4DEE9', minWidth: 150 }}
        >
          <Search size={13} className="text-[#94A3B8] flex-shrink-0" />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search"
            className="border-none outline-none bg-transparent text-sm text-[#061B31] w-full placeholder-[#94A3B8]"
          />
          {searchQ && (
            <button type="button" onClick={() => setSearchQ('')} className="text-[#94A3B8] hover:text-[#061B31]">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── File type filter chips ── */}
      {filterOpen && (
        <div className="mb-3 p-3 rounded-lg border border-[#D4DEE9] bg-white">
          <p className="text-xs font-semibold text-[#64748D] uppercase tracking-wider mb-2">File type</p>
          {allExts.length === 0 ? (
            <p className="text-xs text-[#94A3B8]">No file types available in this view</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allExts.map(ext => (
                <button
                  key={ext}
                  type="button"
                  onClick={() => toggleExt(ext)}
                  className="px-3 py-1 rounded-full text-xs border transition-all duration-150"
                  style={{
                    background:  activeExts.has(ext) ? ACCENT  : 'white',
                    color:       activeExts.has(ext) ? '#fff'  : '#64748D',
                    borderColor: activeExts.has(ext) ? ACCENT  : '#D4DEE9',
                  }}
                >
                  .{ext}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Breadcrumb (only shown when drilled in) ── */}
      {stack.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {stack.map((node, idx) => {
            const isLast = idx === stack.length - 1;
            return (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight size={11} className="text-[#CBD5E1]" />}
                <button
                  type="button"
                  onClick={() => { if (!isLast) jumpTo(idx); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-colors"
                  style={{
                    background:    isLast ? 'white'     : 'transparent',
                    borderColor:   isLast ? '#D4DEE9'   : 'transparent',
                    color:         isLast ? '#061B31'   : '#64748D',
                    fontWeight:    isLast ? 500         : 400,
                    cursor:        isLast ? 'default'   : 'pointer',
                    pointerEvents: isLast ? 'none'      : 'auto',
                  }}
                >
                  {node === null
                    ? <><Home size={11} /> All</>
                    : <><Folder size={11} style={{ color: '#64748D' }} />{node.name}</>
                  }
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Folder list panel ── */}
      <div className="rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">

        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Folder size={12} className="text-[#64748D]" />
            <span className="text-xs font-semibold text-[#64748D]">Select Folder</span>
          </div>
          {createGroupId && (
            <button
              type="button"
              onClick={() => setCreating({ groupId: createGroupId, parentId: currentParentId, parentName: currentParentName })}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ color: ACCENT, border: `1px solid ${ACCENT}40`, background: `${ACCENT}08` }}
            >
              <Plus size={10} />New
            </button>
          )}
        </div>

        {/* Inline create folder form */}
        {creating && (
          <div className="px-3 py-2 border-b border-[#F1F5F9] bg-[#FAFBFF]">
            <CreateFolderForm
              groupId={creating.groupId}
              parentId={creating.parentId}
              parentName={creating.parentName}
              onCreated={f => {
                // Trigger refetch on the group that owns the new folder
                treeByGroup[creating.groupId]?.refetch();
                onSelect(f.id);
                setCreating(null);
              }}
              onCancel={() => setCreating(null)}
            />
          </div>
        )}

        {/* Root / no folder option */}
        {!searchQ && activeExts.size === 0 && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#F1F5F9] hover:bg-[#F8F7FF] transition-colors"
            style={{ background: selectedId === null ? '#F8F7FF' : 'white' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedId === null ? ACCENT : '#D4DEE9' }} />
            <FolderOpen size={12} className="text-[#64748D]" />
            <span className="flex-1 text-[#061B31]">Root — no folder</span>
            {selectedId === null && <Check size={13} style={{ color: ACCENT }} />}
          </button>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 size={14} className="animate-spin" style={{ color: ACCENT }} />
            <span className="text-xs text-[#64748D]">Loading folders…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && visible.length === 0 && !creating && (
          <p className="text-xs text-center text-[#94A3B8] py-5">
            {searchQ || activeExts.size > 0
              ? 'No items match the filter'
              : 'No folders yet — click + New above'}
          </p>
        )}

        {/* Folder / file rows */}
        {!isLoading && visible.map((item, idx) => {
          const isSel    = selectedId === item.id;
          const hasKids  = (item.children ?? []).length > 0;
          const isFolder = item.type === 'folder';

          return (
            <div
              key={item.id}
              className="flex items-center hover:bg-[#F8F7FF] group transition-colors"
              style={{
                background:   isSel ? '#F8F7FF' : 'white',
                borderBottom: idx < visible.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              {isFolder ? (
                <>
                  {/* Click to select */}
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm text-left"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSel ? ACCENT : '#D4DEE9' }} />
                    <Folder size={13} style={{ color: isSel ? ACCENT : '#64748D', flexShrink: 0 }} />
                    <span className="flex-1 text-[#061B31] truncate">{item.name}</span>
                    {item.file_count != null && item.file_count > 0 && (
                      <span className="text-xs text-[#94A3B8] mr-1">{item.file_count} files</span>
                    )}
                    {isSel && <Check size={13} style={{ color: ACCENT }} />}
                  </button>

                  {/* Drill into sub-folders */}
                  {hasKids && (
                    <button
                      type="button"
                      onClick={() => drillInto(item)}
                      title="Open folder"
                      className="flex-shrink-0 mr-1 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: ACCENT, background: `${ACCENT}10` }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  )}

                  {/* Add sub-folder */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasKids) drillInto(item);
                      setCreating({ groupId: createGroupId, parentId: item.id, parentName: item.name });
                    }}
                    title="New sub-folder"
                    className="flex-shrink-0 mr-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: ACCENT, background: `${ACCENT}10` }}
                  >
                    <FolderPlus size={12} />
                  </button>
                </>
              ) : (
                // File row (visible when searching/filtering)
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#D4DEE9]" />
                  <span className="text-xs font-bold uppercase text-[#94A3B8] w-8 flex-shrink-0">{(item as any).ext}</span>
                  <span className="flex-1 text-[#061B31] truncate">{item.name}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Member Form ────────────────────────────────────────────────────────────

function MemberForm({ groupId, onSuccess, onCancel }: { groupId: string; onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm]     = useState({ full_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  }

  async function handleAdd() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const { data: profile, error: lookupError } = await supabase.from('profiles').select('id').eq('email', form.email.trim()).maybeSingle();
      if (lookupError) throw lookupError;
      if (!profile) { setErrors({ submit: 'No account found with that email.' }); return; }
      if (form.full_name.trim() || form.phone.trim()) {
        const updates: Record<string, string> = {};
        if (form.full_name.trim()) updates.full_name = form.full_name.trim();
        if (form.phone.trim()) updates.phone = form.phone.trim();
        await supabase.from('profiles').update(updates).eq('id', profile.id).is('full_name', null);
      }
      const { error: memberError } = await supabase.from('group_members').insert({ group_id: groupId, user_id: profile.id, role: 'viewer' } as never);
      if (memberError) {
        if (memberError.code === '23505') { setErrors({ submit: 'Already a member.' }); return; }
        throw memberError;
      }
      onSuccess();
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to add member' });
    } finally { setSaving(false); }
  }

  const inputCls = (key: string) => ['w-full rounded border text-sm px-3 py-2 outline-none transition-all duration-150 placeholder-[#64748D]/70 bg-white text-[#061B31]', errors[key] ? 'border-red-400' : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10'].join(' ');

  return (
    <div className="mt-3 rounded-lg p-3 flex flex-col gap-2.5 bg-[#F8F7FF] border border-[#C9C3F0]">
      <p className="text-xs font-semibold text-[#533AFD]">New Member</p>
      <div><div className="relative"><Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" /><input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className={inputCls('full_name') + ' pl-8'} /></div>{errors.full_name && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.full_name}</p>}</div>
      <div><div className="relative"><Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" /><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" type="email" className={inputCls('email') + ' pl-8'} /></div>{errors.email && <p className="text-xs mt-0.5 text-red-500 pl-1">{errors.email}</p>}</div>
      <div><div className="relative"><Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" /><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone (optional)" type="tel" className={inputCls('phone') + ' pl-8'} /></div></div>
      {errors.submit && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{errors.submit}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-medium border border-[#D4DEE9] text-[#64748D] bg-white hover:bg-[#F3F3F3] disabled:opacity-50">Cancel</button>
        <button type="button" onClick={handleAdd} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#533AFD] text-white hover:bg-[#4430d4] disabled:opacity-60 flex items-center justify-center gap-1">{saving && <Loader2 size={11} className="animate-spin" />}{saving ? 'Adding…' : 'Add Member'}</button>
      </div>
    </div>
  );
}

// ── Member Card ────────────────────────────────────────────────────────────

function MemberCard({ member, onRemove }: { member: GroupMember; onRemove: () => void }) {
  const name  = member.profile?.full_name ?? '(Unknown)';
  const email = member.profile?.email     ?? '—';
  const phone = member.profile?.phone     ?? '—';
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-white border border-[#D4DEE9]">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5" style={{ background: `${ACCENT}18`, color: ACCENT, border: `1.5px solid ${ACCENT}40` }}>{initials(name)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#061B31] truncate">{name}</p>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5 truncate"><Mail size={10} />{email}</p>
        <p className="flex items-center gap-1 text-xs text-[#64748D] mt-0.5"><Phone size={10} />{phone}</p>
      </div>
      <button type="button" onClick={onRemove} className="flex-shrink-0 mt-0.5 text-[#D4DEE9] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
    </div>
  );
}

// ── Group Dropdown ─────────────────────────────────────────────────────────

function GroupDropdown({ groups, selectedGroupId, onSelect, disabled }: { groups: Group[]; selectedGroupId: string | null; onSelect: (id: string | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = groups.find(g => g.id === selectedGroupId) ?? null;
  return (
    <div ref={ref} className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <button type="button" onClick={() => setOpen(o => !o)} className={['w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all duration-150', open ? 'border-2 border-[#533AFD] ring-[3px] ring-[#533AFD]/10 bg-white' : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]'].join(' ')}>
        <span className="flex items-center gap-2 text-sm min-w-0">
          {selected
            ? (<><span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#533AFD]" /><FolderOpen size={13} className="text-[#533AFD] flex-shrink-0" /><span className="text-[#061B31] truncate">{selected.icon} {selected.name}</span></>)
            : (<span className="text-[#64748D]/70">Select a cohort…</span>)}
        </span>
        <ChevronDown size={14} className="text-[#64748D] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="mt-1 rounded-lg overflow-hidden bg-white border border-[#D4DEE9]" style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}>
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]" style={{ background: !selectedGroupId ? '#F8F7FF' : 'white' }}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedGroupId ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
            <span className="flex-1 text-[#061B31]">Personal — don't share</span>
            {!selectedGroupId && <Check size={13} className="text-[#533AFD]" />}
          </button>
          {groups.map((g, idx) => {
            const isSel = selectedGroupId === g.id;
            return (
              <button key={g.id} type="button" onClick={() => { onSelect(g.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]" style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none' }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
                <FolderOpen size={13} className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'} style={{ flexShrink: 0 }} />
                <span className="flex-1 text-[#061B31] truncate">{g.icon} {g.name}</span>
                <span className="text-xs text-[#64748D] mr-1">{g.group_members?.[0]?.count ?? 0} members</span>
                {isSel && <Check size={13} className="text-[#533AFD]" />}
              </button>
            );
          })}
          {groups.length === 0 && <p className="text-xs text-center text-[#64748D] py-4">No cohorts found</p>}
        </div>
      )}
    </div>
  );
}

// ── SubGroup Picker ────────────────────────────────────────────────────────

function SubGroupPicker({ groupId, selectedSubGroupId, onSelect }: { groupId: string; selectedSubGroupId: string | null; onSelect: (id: string | null) => void }) {
  const { subGroups, loading } = useSubGroups(groupId);
  const [settled, setSettled] = useState(false);
  useEffect(() => { if (!loading) setSettled(true); }, [loading]);
  if (loading || !settled || subGroups.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]"><Layers size={12} className="text-[#64748D]" /><span className="text-xs font-semibold text-[#64748D]">Select Team</span></div>
      <button type="button" onClick={() => onSelect(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]" style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }} />
        <Users size={12} className="text-[#64748D]" /><span className="flex-1 text-[#061B31]">Entire cohort</span>
        {selectedSubGroupId === null && <Check size={13} className="text-[#533AFD]" />}
      </button>
      {subGroups.map((sg: SubGroup, idx: number) => {
        const isSel = selectedSubGroupId === sg.id;
        return (
          <button key={sg.id} type="button" onClick={() => onSelect(sg.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]" style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSel ? ACCENT : '#D4DEE9' }} />
            <Layers size={12} style={{ color: isSel ? ACCENT : '#64748D' }} />
            <span className="flex-1 text-[#061B31] truncate">{sg.name}</span>
            {isSel && <Check size={13} style={{ color: ACCENT }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Create Folder Form ─────────────────────────────────────────────────────

function CreateFolderForm({ groupId, parentId, parentName, onCreated, onCancel }: {
  groupId: string; parentId: string | null; parentName: string | null;
  onCreated: (f: { id: string; name: string }) => void; onCancel: () => void;
}) {
  const [name, setName]     = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Use the hook directly so creation goes through the same auth path
  const { createFolder } = useFolderTree(groupId);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Required'); return; }
    setSaving(true); setError('');
    try {
      const id = await createFolder(trimmed, parentId);
      if (!id) throw new Error('Failed to create folder');
      onCreated({ id, name: trimmed });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="mt-2 rounded-lg p-3 flex flex-col gap-2.5 bg-[#F8F7FF] border border-[#C9C3F0]">
      <div className="flex items-center gap-1.5">
        <FolderPlus size={13} className="text-[#533AFD]" />
        <p className="text-xs font-semibold text-[#533AFD]">New Folder</p>
        {parentName && <span className="flex items-center gap-1 text-xs text-[#64748D]"><ChevronRight size={11} />inside <span className="font-medium text-[#061B31]">{parentName}</span></span>}
      </div>
      <div>
        <div className="relative">
          <Folder size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D]" />
          <input
            ref={inputRef}
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onCancel(); }}
            placeholder="Folder name…"
            className={['w-full rounded border text-sm px-3 py-2 pl-8 outline-none transition-all duration-150 placeholder-[#64748D]/70 bg-white text-[#061B31]', error ? 'border-red-400' : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10'].join(' ')}
          />
        </div>
        {error && <p className="text-xs mt-0.5 text-red-500 pl-1">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-1.5 rounded text-xs font-medium border border-[#D4DEE9] text-[#64748D] bg-white hover:bg-[#F3F3F3] disabled:opacity-50">Cancel</button>
        <button type="button" onClick={handleCreate} disabled={saving || !name.trim()} className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#533AFD] text-white hover:bg-[#4430d4] disabled:opacity-60 flex items-center justify-center gap-1">
          {saving && <Loader2 size={11} className="animate-spin" />}
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  );
}

// ── Members Section ────────────────────────────────────────────────────────

function MembersSection({ groupId }: { groupId: string }) {
  const { members, loading, removeMember, refetch } = useGroupMembers(groupId);
  const [showForm, setShowForm] = useState(false);
  if (loading) return (
    <div className="mt-3 flex items-center justify-center py-6 rounded-lg border border-[#D4DEE9]">
      <Loader2 size={16} className="animate-spin text-[#533AFD]" />
      <span className="ml-2 text-xs text-[#64748D]">Loading members…</span>
    </div>
  );
  return (
    <div className="mt-3 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#64748D]" />
          <span className="text-xs font-semibold text-[#64748D]">Members</span>
          {members.length > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${ACCENT}18`, color: ACCENT }}>{members.length}</span>}
        </div>
        <button type="button" onClick={() => setShowForm(f => !f)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: showForm ? `${ACCENT}15` : 'white', color: ACCENT, border: `1px solid ${ACCENT}50` }}>
          <UserPlus size={11} />{showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {members.length === 0 && !showForm && <p className="text-xs text-center text-[#64748D] py-3">No members yet</p>}
        {members.map(m => <MemberCard key={m.id} member={m} onRemove={async () => { await removeMember(m.id); }} />)}
        {showForm && <MemberForm groupId={groupId} onSuccess={async () => { await refetch(); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
      </div>
    </div>
  );
}

// ── MetadataPanel ──────────────────────────────────────────────────────────

export default function MetadataPanel({ files, onSubmit, uploading, progress }: MetadataPanelProps) {
  const { groups, loading: groupsLoading } = useGroups() as { groups: Group[]; loading: boolean };

  const [projectName,        setProjectName]        = useState('');
  const [description,        setDescription]        = useState('');
  const [tags,               setTags]               = useState<string[]>([]);
  const [tagInput,           setTagInput]            = useState('');
  const [selectedGroupId,    setSelectedGroupId]    = useState<string | null>(null);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
  const [selectedFolderId,   setSelectedFolderId]   = useState<string | null>(null);
  const [validationError,    setValidationError]    = useState('');

  // Still used for SubGroupPicker + MembersSection
  const { roots: _folderRoots, loading: _foldersLoading } = useFolderTree(selectedGroupId ?? '');

  const hasFiles      = files.length > 0;
  const isProjectMode = projectName.trim().length > 0;

  function handleGroupSelect(id: string | null) {
    setSelectedGroupId(id);
    setSelectedSubGroupId(null);
    setSelectedFolderId(null);
    setValidationError('');
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(',', '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  }

  function handleSubmit() {
    if (!hasFiles) return;
    if (isProjectMode && !selectedGroupId) {
      setValidationError('Please select a cohort to create the project in.');
      return;
    }
    setValidationError('');
    onSubmit({
      projectName,
      description,
      tags,
      groupId:    selectedGroupId,
      subGroupId: selectedSubGroupId,
      folderId:   selectedFolderId,
    });
  }

  const buttonLabel = uploading
    ? `Uploading… ${progress}%`
    : isProjectMode
      ? `📁 Create Project & Upload ${files.length} file${files.length > 1 ? 's' : ''}`
      : `⬆ Upload ${files.length > 0 ? `${files.length} ` : ''}file${files.length !== 1 ? 's' : ''}`;

  return (
    <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="pb-4 border-b border-[#E5EDF5]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">File Metadata</div>
        {!hasFiles
          ? <div className="text-sm text-[#64748D]">Fill in details below — then select your files to upload</div>
          : <div className="text-sm font-medium" style={{ color: ACCENT }}>{files.length} file{files.length > 1 ? 's' : ''} selected — shared metadata will apply to all</div>
        }
      </div>

      {/* Project name */}
      <FormField label="Project name">
        <input
          type="text"
          placeholder="e.g. Brand refresh 2026… (creates a new folder)"
          value={projectName}
          onChange={e => { setProjectName(e.target.value); setValidationError(''); }}
          className="w-full text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-2.5 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
        />
        {isProjectMode && <p className="text-xs mt-1" style={{ color: ACCENT }}>📁 A new top-level folder will be created in the selected cohort</p>}
      </FormField>

      {/* Description */}
      <FormField label="Description">
        <textarea
          rows={3}
          placeholder="Describe this project / files…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full resize-none text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-3 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
        />
      </FormField>



      {/* Cohort */}
      <FormField label={isProjectMode ? 'Cohort (required for project)' : 'Share with Cohort'}>
        {groupsLoading
          ? <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin text-[#533AFD]" /><span className="text-sm text-[#64748D]">Loading cohorts…</span></div>
          : <>
              <GroupDropdown groups={groups} selectedGroupId={selectedGroupId} onSelect={handleGroupSelect} />
              {validationError && <p className="text-xs mt-1.5 text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{validationError}</p>}
              {selectedGroupId && (
                <>
                  <SubGroupPicker groupId={selectedGroupId} selectedSubGroupId={selectedSubGroupId} onSelect={setSelectedSubGroupId} />
                  <MembersSection groupId={selectedGroupId} />
                </>
              )}
            </>
        }
      </FormField>


      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-[#64748D] mb-1.5"><span>Uploading…</span><span>{progress}%</span></div>
          <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]">
            <div className="h-full rounded-full transition-all duration-300 bg-[#533AFD]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button variant="primary" onClick={handleSubmit} disabled={!hasFiles || uploading} className="w-full justify-center">
        {!hasFiles ? '⬆ Select files to upload' : buttonLabel}
      </Button>
    </div>
  );
}

