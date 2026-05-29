import { useState, useRef, useEffect } from 'react';
import { FormField, Button } from '../layout/ui';
import {
  ChevronDown,
  FolderOpen,
  Check,
  UserPlus,
  Phone,
  Mail,
  Users,
  Loader2,
  Layers,
  ShieldAlert,
  Search,
  X,
} from 'lucide-react';
import { useGroups, useSubGroups, useUserGroupIds } from '../../hooks/useGroups';
import { usePermissions } from '../../hooks/Usepermissions';
import { supabase } from '../../lib/supabase';
import type { Group, SubGroup, MiniCohort } from '../layout/ui/cons';

const ACCENT = '#533AFD';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
interface MetadataPanelProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onSubmit: (meta: {
    projectName: string;
    description: string;
    tags: string[];
    groupId: string | null;
    subGroupId: string | null;
    folderId: string | null;
    miniCohortId: string | null;
    members: AddedMember[];
  }) => void;
  uploading: boolean;
  progress: number;
  currentFolderId?: string | null;
  currentGroupId?: string | null;
}

// ── Mini Cohort Picker ─────────────────────────────────────────────────────

function MiniCohortPicker({
  selectedId,
  groupId,
  onSelect,
}: {
  selectedId: string | null;
  groupId: string | null;
  onSelect: (id: string | null, name: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MiniCohort[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MiniCohort | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Debounced search — scoped to selected group via junction table
  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      async () => {
        if (!q) {
          setResults([]);
          setOpen(false);
          return;
        }

        setSearching(true);
        const { cohortData, fetchError } = await (async () => {
          if (groupId) {
            const res = await db
              .from('group_mini_cohorts')
              .select('mini_cohorts!inner(id, name, group_id, project_name)')
              .eq('group_id', groupId)
              .ilike('mini_cohorts.name', `%${q}%`)
              .limit(8);
            return {
              cohortData: ((res.data ?? []) as { mini_cohorts: MiniCohort }[]).map(
                (r) => r.mini_cohorts,
              ),
              fetchError: res.error,
            };
          }
          const res = await db
            .from('mini_cohorts')
            .select('id, name, group_id, project_name')
            .ilike('name', `%${q}%`)
            .order('name')
            .limit(8);
          return { cohortData: (res.data ?? []) as MiniCohort[], fetchError: res.error };
        })();

        setSearching(false);
        if (fetchError) {
          console.error('[MiniCohortPicker]', fetchError);
          return;
        }
        setResults(cohortData);
        setOpen(true);
      },
      q ? 250 : 0,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, groupId]);

  function handleSelect(mc: MiniCohort) {
    setSelected(mc);
    setQuery(mc.name);
    setOpen(false);
    setResults([]);
    onSelect(mc.id, mc.name);
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(null, null);
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={13}
          style={{ position: 'absolute', left: 10, color: '#64748D', pointerEvents: 'none' }}
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) {
              setSelected(null);
              onSelect(null, null);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Search mini cohort…"
          className="w-full rounded border border-[#D4DEE9] bg-white px-4 py-2.5 text-sm text-[#061B31] transition-all duration-150 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10"
          style={{ paddingLeft: 30, paddingRight: selected ? 30 : 12 }}
        />
        {searching && (
          <Loader2
            size={13}
            style={{
              position: 'absolute',
              right: 10,
              color: '#64748D',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        {selected && !searching && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748D',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: 4,
            background: 'white',
            border: '1px solid #D4DEE9',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(6,27,49,0.12)',
            overflow: 'hidden',
          }}
        >
          {results.length > 0 ? (
            results.map((c, i) => (
              <button
                key={c.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(c);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: selectedId === c.id ? '#F8F7FF' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid #E5EDF5' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F7FF')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = selectedId === c.id ? '#F8F7FF' : 'white')
                }
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: ACCENT,
                    flexShrink: 0,
                  }}
                />
                {/* <span style={{ fontSize: 13, fontWeight: 500, color: '#061B31', flex: 1 }}>{c.name}</span>
              {selectedId === c.id && <Check size={13} color={ACCENT} />} */}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#061B31', flex: 1 }}>
                  {c.name}
                </span>
                {c.project_name && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#64748D',
                      background: '#F1F5F9',
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}
                  >
                    {c.project_name}
                  </span>
                )}
                {selectedId === c.id && <Check size={13} color={ACCENT} />}
              </button>
            ))
          ) : (
            <div style={{ padding: '10px 12px', fontSize: 13, color: '#64748D' }}>
              No mini cohort found for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Selected preview */}
      {selected && (
        <div
          style={{
            marginTop: 6,
            padding: '6px 10px',
            borderRadius: 6,
            background: `${ACCENT}08`,
            border: `1px solid ${ACCENT}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
            {/* <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{selected.name}</span> */}
            <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{selected.name}</span>
            {selected.project_name && (
              <span style={{ fontSize: 11, color: '#64748D' }}>· {selected.project_name}</span>
            )}
          </div>
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748D',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Member Form ────────────────────────────────────────────────────────────

interface AddedMember {
  full_name: string;
  email: string;
  role: string;
}

function MemberForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (m: AddedMember) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  }

  function handleAdd() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSuccess({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      role: 'viewer',
    });
  }

  const inputCls = (key: string) =>
    [
      'w-full rounded border text-sm px-3 py-2 outline-none transition-all duration-150 placeholder-[#64748D]/70 bg-white text-[#061B31]',
      errors[key]
        ? 'border-red-400'
        : 'border-[#D4DEE9] focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
    ].join(' ');

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-lg border border-[#C9C3F0] bg-[#F8F7FF] p-3">
      <p className="text-xs font-semibold text-[#533AFD]">New Member</p>
      <div>
        <div className="relative">
          <Users size={12} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#64748D]" />
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Full name"
            className={inputCls('full_name') + ' pl-8'}
          />
        </div>
        {errors.full_name && <p className="mt-0.5 pl-1 text-xs text-red-500">{errors.full_name}</p>}
      </div>
      <div>
        <div className="relative">
          <Mail size={12} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#64748D]" />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email address"
            type="email"
            className={inputCls('email') + ' pl-8'}
          />
        </div>
        {errors.email && <p className="mt-0.5 pl-1 text-xs text-red-500">{errors.email}</p>}
      </div>
      <div>
        <div className="relative">
          <Phone size={12} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#64748D]" />
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone (optional)"
            type="tel"
            className={inputCls('phone') + ' pl-8'}
          />
        </div>
      </div>
      {errors.submit && (
        <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-500">
          {errors.submit}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded border border-red-200 bg-white py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="flex flex-1 items-center justify-center gap-1 rounded bg-[#533AFD] py-1.5 text-xs font-semibold text-white hover:bg-[#4430d4]"
        >
          Add Member
        </button>
      </div>
    </div>
  );
}

// ── Group Dropdown ─────────────────────────────────────────────────────────

function GroupDropdown({
  groups,
  selectedGroupId,
  onSelect,
  disabled,
}: {
  groups: Group[];
  selectedGroupId: string | null;
  onSelect: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = groups.find((g) => g.id === selectedGroupId) ?? null;
  return (
    <div ref={ref} className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center justify-between rounded px-3 py-2.5 text-left transition-all duration-150',
          open
            ? 'border-2 border-[#533AFD] bg-white ring-[3px] ring-[#533AFD]/10'
            : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]',
        ].join(' ')}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm">
          {selected ? (
            <>
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#533AFD]" />
              <FolderOpen size={13} className="flex-shrink-0 text-[#533AFD]" />
              <span className="truncate text-[#061B31]">
                {selected.icon} {selected.name}
              </span>
            </>
          ) : (
            <span className="text-[#64748D]/70">Select a cohort…</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className="flex-shrink-0 text-[#64748D]"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div
          className="mt-1 overflow-hidden rounded-lg border border-[#D4DEE9] bg-white"
          style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}
        >
          {groups.map((g, idx) => {
            const isSel = selectedGroupId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  onSelect(g.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[#F8F7FF]"
                style={{
                  background: isSel ? '#F8F7FF' : 'white',
                  borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none',
                }}
              >
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`}
                />
                <FolderOpen
                  size={13}
                  className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'}
                  style={{ flexShrink: 0 }}
                />
                <span className="flex-1 truncate text-[#061B31]">
                  {g.icon} {g.name}
                </span>
                <span className="mr-1 text-xs text-[#64748D]">
                  {g.group_members?.[0]?.count ?? 0} members
                </span>
                {isSel && <Check size={13} className="text-[#533AFD]" />}
              </button>
            );
          })}
          {groups.length === 0 && (
            <p className="py-4 text-center text-xs text-[#64748D]">No cohorts found</p>
          )}
        </div>
      )}
    </div>
  );
}

function SubGroupPicker({
  groupId,
  selectedSubGroupId,
  onSelect,
}: {
  groupId: string;
  selectedSubGroupId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { subGroups, loading } = useSubGroups(groupId);
  if (loading || subGroups.length === 0) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-[#D4DEE9] bg-white">
      <div className="flex items-center gap-2 border-b border-[#E5EDF5] bg-[#F8FAFC] px-3 py-2">
        <Layers size={12} className="text-[#64748D]" />
        <span className="text-xs font-semibold text-[#64748D]">Select Team</span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex w-full items-center gap-2.5 border-b border-[#E5EDF5] px-3 py-2.5 text-left text-sm hover:bg-[#F8F7FF]"
        style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}
      >
        <div
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }}
        />
        <Users size={12} className="text-[#64748D]" />
        <span className="flex-1 text-[#061B31]">Entire cohort</span>
        {selectedSubGroupId === null && <Check size={13} className="text-[#533AFD]" />}
      </button>
      {subGroups.map((sg: SubGroup, idx: number) => {
        const isSel = selectedSubGroupId === sg.id;
        return (
          <button
            key={sg.id}
            type="button"
            onClick={() => onSelect(sg.id)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[#F8F7FF]"
            style={{
              background: isSel ? '#F8F7FF' : 'white',
              borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none',
            }}
          >
            <div
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: isSel ? ACCENT : '#D4DEE9' }}
            />
            <Layers size={12} style={{ color: isSel ? ACCENT : '#64748D' }} />
            <span className="flex-1 truncate text-[#061B31]">{sg.name}</span>
            {isSel && <Check size={13} style={{ color: ACCENT }} />}
          </button>
        );
      })}
    </div>
  );
}

function MembersSection({
  members,
  onAdd,
}: {
  members: AddedMember[];
  onAdd: (m: AddedMember) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  function handleAdded(m: AddedMember) {
    onAdd(m);
    setShowForm(false);
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-[#D4DEE9] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5EDF5] bg-[#F8FAFC] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#64748D]" />
          <span className="text-xs font-semibold text-[#64748D]">
            Members{members.length > 0 ? ` (${members.length})` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((f) => !f)}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium"
          style={{
            background: showForm ? `${ACCENT}15` : 'white',
            color: ACCENT,
            border: `1px solid ${ACCENT}50`,
          }}
        >
          <UserPlus size={11} />
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {members.length > 0 && (
        <div className="divide-y divide-[#E5EDF5]">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#533AFD] text-[10px] font-semibold text-white">
                {m.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[#061B31]">{m.full_name}</p>
                <p className="truncate text-[11px] text-[#64748D]">{m.email}</p>
              </div>
              <span className="rounded border border-[#D4DEE9] px-1.5 py-0.5 text-[10px] text-[#64748D] capitalize">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={members.length > 0 ? 'border-t border-[#E5EDF5] p-3' : 'p-3'}>
          <MemberForm onSuccess={handleAdded} onCancel={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
}

// ── MetadataPanel ──────────────────────────────────────────────────────────

export default function MetadataPanel({
  files,
  onSubmit,
  uploading,
  progress,
  currentFolderId = null,
  currentGroupId = null,
}: MetadataPanelProps) {
  const { groups, loading: groupsLoading } = useGroups() as { groups: Group[]; loading: boolean };
  const { userGroupIds, loading: userGroupLoading } = useUserGroupIds();
  const { isAdmin } = usePermissions();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(currentGroupId);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
  const [selectedMiniCohortId, setSelectedMiniCohortId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [addedMembers, setAddedMembers] = useState<AddedMember[]>([]);

  const folderId = currentFolderId;
  const hasFiles = files.length > 0;
  const isProjectMode = projectName.trim().length > 0 && !folderId;

  const canUpload: boolean = isAdmin || !selectedGroupId || userGroupIds.has(selectedGroupId);
  const uploadBlockedByGroup: boolean =
    !isAdmin && !!selectedGroupId && !userGroupIds.has(selectedGroupId);

  function handleGroupSelect(id: string | null) {
    setSelectedGroupId(id);
    setSelectedSubGroupId(null);
    setAddedMembers([]);
    setValidationError('');
  }

  function handleSubmit() {
    if (!hasFiles || !canUpload) return;
    if (isProjectMode && !selectedGroupId) {
      setValidationError('Please select a cohort to create the project in.');
      return;
    }
    setValidationError('');
    onSubmit({
      projectName,
      description,
      tags: [],
      groupId: selectedGroupId,
      subGroupId: selectedSubGroupId,
      folderId,
      miniCohortId: selectedMiniCohortId,
      members: addedMembers,
    });
  }

  const buttonLabel = uploading
    ? `Uploading… ${progress}%`
    : isProjectMode
      ? `📁 Create Project & Upload ${files.length} file${files.length > 1 ? 's' : ''}`
      : `⬆ Upload ${files.length} file${files.length !== 1 ? 's' : ''}`;

  return (
    <div className="flex flex-col gap-6 rounded-[5px] border border-[#D4DEE9] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#E5EDF5] pb-4">
        <div className="mb-1 text-xs font-semibold tracking-wider text-[#64748D] uppercase">
          File Metadata
        </div>
        {folderId ? (
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: ACCENT }}>
            <FolderOpen size={14} />
            Uploading into current folder
          </div>
        ) : (
          <div className="text-sm text-[#64748D]">Select files and fill in details below</div>
        )}
      </div>

      {!folderId && canUpload && (
        <FormField label="Project name">
          <input
            type="text"
            placeholder="e.g. Brand refresh 2026… (creates a new folder)"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setValidationError('');
            }}
            className="w-full rounded border border-[#D4DEE9] bg-white px-4 py-2.5 text-sm leading-[21px] text-[#061B31] placeholder-[#64748D]/70 transition-all duration-150 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10"
          />
          {isProjectMode && (
            <p className="mt-1 text-xs" style={{ color: ACCENT }}>
              📁 A new project folder will be created in the selected cohort
            </p>
          )}
        </FormField>
      )}

      {/* Cohort selector */}
      <FormField label={isProjectMode ? 'Cohort (required for project)' : 'Select Cohort'}>
        {groupsLoading || userGroupLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-[#533AFD]" />
            <span className="text-sm text-[#64748D]">Loading cohorts…</span>
          </div>
        ) : (
          <>
            <GroupDropdown
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelect={handleGroupSelect}
            />
            {uploadBlockedByGroup && (
              <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <ShieldAlert size={15} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">View &amp; download only</p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    Oops! Please choose a <b>COHORT</b> before continuing.
                  </p>
                </div>
              </div>
            )}
            {validationError && (
              <p className="mt-1.5 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-500">
                {validationError}
              </p>
            )}
            {selectedGroupId && (
              <>
                <SubGroupPicker
                  groupId={selectedGroupId}
                  selectedSubGroupId={selectedSubGroupId}
                  onSelect={setSelectedSubGroupId}
                />
                <MembersSection
                  members={addedMembers}
                  onAdd={(m) => setAddedMembers((prev) => [...prev, m])}
                />
              </>
            )}
          </>
        )}
      </FormField>

      {/* Mini cohort picker — key resets the component when the group changes */}
      <FormField label="Mini cohort">
        <MiniCohortPicker
          key={selectedGroupId ?? 'no-group'}
          selectedId={selectedMiniCohortId}
          groupId={selectedGroupId}
          onSelect={(id) => setSelectedMiniCohortId(id)}
        />
      </FormField>

      {canUpload && (
        <FormField label="Description">
          <textarea
            rows={3}
            placeholder="Describe this project / files…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded border border-[#D4DEE9] bg-white px-4 py-3 text-sm leading-[21px] text-[#061B31] placeholder-[#64748D]/70 transition-all duration-150 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10"
          />
        </FormField>
      )}

      {uploading && (
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-[#64748D]">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#E5EDF5]">
            <div
              className="h-full rounded-full bg-[#533AFD] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!hasFiles || uploading || uploadBlockedByGroup}
        className="w-full justify-center"
        style={uploadBlockedByGroup ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
      >
        {uploadBlockedByGroup
          ? '🔒 View & Download Only'
          : !hasFiles
            ? '⬆ Select files above to upload'
            : buttonLabel}
      </Button>
    </div>
  );
}
