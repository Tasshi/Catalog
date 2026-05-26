import { useState, useRef, useEffect } from 'react';
import { FormField, Button } from '../layout/ui';
import {
  ChevronDown, FolderOpen, Check,
  UserPlus, Phone, Mail, Users, Loader2, Layers,
  ShieldAlert, Search, X,
} from 'lucide-react';
import { useGroups, useSubGroups, useUserGroupIds } from '../../hooks/useGroups';
import { supabase } from '../../lib/supabase';
import type { Group, SubGroup, MiniCohort } from '../layout/ui/cons';

const ACCENT = '#533AFD';
const db = supabase as any;
interface MetadataPanelProps {
  files:             File[];
  onFilesSelected:   (files: File[]) => void;
  onSubmit:          (meta: {
    projectName: string;
    description: string;
    tags:        string[];
    groupId:     string | null;
    subGroupId:  string | null;
    folderId:    string | null;
    miniCohortId: string | null;
  }) => void;
  uploading:         boolean;
  progress:          number;
  currentFolderId?:  string | null;
}

// ── Mini Cohort Picker ─────────────────────────────────────────────────────

function MiniCohortPicker({ selectedId, groupId, onSelect }: {
  selectedId: string | null;
  groupId:    string | null;
  onSelect:   (id: string | null, name: string | null) => void;
}) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<MiniCohort[]>([]);
  const [searching, setSearching] = useState(false);
  const [open,      setOpen]      = useState(false);
  const [selected,  setSelected]  = useState<MiniCohort | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

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
    debounceRef.current = setTimeout(async () => {
      if (!q) { setResults([]); setOpen(false); return; }

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
            cohortData: ((res.data ?? []) as { mini_cohorts: MiniCohort }[]).map(r => r.mini_cohorts),
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
      if (fetchError) { console.error('[MiniCohortPicker]', fetchError); return; }
      setResults(cohortData);
      setOpen(true);
    }, q ? 250 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
        <Search size={13} style={{ position: 'absolute', left: 10, color: '#64748D', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (selected) { setSelected(null); onSelect(null, null); } }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search mini cohort…"
          className="w-full text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-2.5 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150"
          style={{ paddingLeft: 30, paddingRight: selected ? 30 : 12 }}
        />
        {searching && (
          <Loader2 size={13} style={{ position: 'absolute', right: 10, color: '#64748D', animation: 'spin 1s linear infinite' }} />
        )}
        {selected && !searching && (
          <button onClick={handleClear} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748D', display: 'flex', alignItems: 'center' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: 4, background: 'white', border: '1px solid #D4DEE9',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(6,27,49,0.12)', overflow: 'hidden',
        }}>
          {results.length > 0 ? results.map((c, i) => (
            <button
              key={c.id}
              onMouseDown={e => { e.preventDefault(); handleSelect(c); }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                background: selectedId === c.id ? '#F8F7FF' : 'white',
                border: 'none', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #E5EDF5' : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8F7FF')}
              onMouseLeave={e => (e.currentTarget.style.background = selectedId === c.id ? '#F8F7FF' : 'white')}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
              {/* <span style={{ fontSize: 13, fontWeight: 500, color: '#061B31', flex: 1 }}>{c.name}</span>
              {selectedId === c.id && <Check size={13} color={ACCENT} />} */}
              <span style={{ fontSize: 13, fontWeight: 500, color: '#061B31', flex: 1 }}>{c.name}</span>
              {c.project_name && (
                <span style={{ fontSize: 11, color: '#64748D', background: '#F1F5F9', borderRadius: 4, padding: '1px 6px' }}>
                  {c.project_name}</span>
)}
{selectedId === c.id && <Check size={13} color={ACCENT} />}
            </button>
          )) : (
            <div style={{ padding: '10px 12px', fontSize: 13, color: '#64748D' }}>
              No mini cohort found for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Selected preview */}
      {selected && (
        <div style={{
          marginTop: 6, padding: '6px 10px', borderRadius: 6,
          background: `${ACCENT}08`, border: `1px solid ${ACCENT}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
            {/* <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{selected.name}</span> */}
            <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{selected.name}</span>
            {selected.project_name && (
              <span style={{ fontSize: 11, color: '#64748D' }}>· {selected.project_name}</span>
            )}
          </div>
          <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748D', display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </button>
        </div>
      )}
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { data: existing } = await db.from('profiles').select('id').ilike('email', form.email.trim()).maybeSingle() as { data: { id: string } | null };
      if (existing) {
        const { error: memberError } = await db.from('group_members').insert({ group_id: groupId, user_id: existing.id, role: 'viewer' });
        if (memberError) { if (memberError.code === '23505') { setErrors({ submit: 'Already a member.' }); return; } throw memberError; }
      } else {
        const { error: inviteError } = await db.from('invitations').insert({ group_id: groupId, email: form.email.trim().toLowerCase(), full_name: form.full_name.trim() || null, phone: form.phone.trim() || null, role: 'viewer', invited_by: user.id });
        if (inviteError) { if (inviteError.code === '23505') { setErrors({ submit: 'Already invited.' }); return; } throw inviteError; }
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

// ── Group Dropdown ─────────────────────────────────────────────────────────

function GroupDropdown({ groups, selectedGroupId, onSelect, disabled }: { groups: Group[]; selectedGroupId: string | null; onSelect: (id: string | null) => void; disabled?: boolean; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); } document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const selected = groups.find(g => g.id === selectedGroupId) ?? null;
  return (
    <div ref={ref} className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <button type="button" onClick={() => setOpen(o => !o)} className={['w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all duration-150', open ? 'border-2 border-[#533AFD] ring-[3px] ring-[#533AFD]/10 bg-white' : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB]'].join(' ')}>
        <span className="flex items-center gap-2 text-sm min-w-0">{selected ? (<><span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#533AFD]" /><FolderOpen size={13} className="text-[#533AFD] flex-shrink-0" /><span className="text-[#061B31] truncate">{selected.icon} {selected.name}</span></>) : (<span className="text-[#64748D]/70">Select a cohort…</span>)}</span>
        <ChevronDown size={14} className="text-[#64748D] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="mt-1 rounded-lg overflow-hidden bg-white border border-[#D4DEE9]" style={{ boxShadow: '0 8px 24px rgba(6,27,49,0.12)' }}>
          <button type="button" onClick={() => { onSelect(null); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]" style={{ background: !selectedGroupId ? '#F8F7FF' : 'white' }}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedGroupId ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} /><span className="flex-1 text-[#061B31]">Personal — don't share</span>{!selectedGroupId && <Check size={13} className="text-[#533AFD]" />}
          </button>
          {groups.map((g, idx) => { const isSel = selectedGroupId === g.id; return (<button key={g.id} type="button" onClick={() => { onSelect(g.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]" style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < groups.length - 1 ? '1px solid #E5EDF5' : 'none' }}><div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSel ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} /><FolderOpen size={13} className={isSel ? 'text-[#533AFD]' : 'text-[#64748D]'} style={{ flexShrink: 0 }} /><span className="flex-1 text-[#061B31] truncate">{g.icon} {g.name}</span><span className="text-xs text-[#64748D] mr-1">{g.group_members?.[0]?.count ?? 0} members</span>{isSel && <Check size={13} className="text-[#533AFD]" />}</button>); })}
          {groups.length === 0 && <p className="text-xs text-center text-[#64748D] py-4">No cohorts found</p>}
        </div>
      )}
    </div>
  );
}

function SubGroupPicker({ groupId, selectedSubGroupId, onSelect }: { groupId: string; selectedSubGroupId: string | null; onSelect: (id: string | null) => void; }) {
  const { subGroups, loading } = useSubGroups(groupId);
  if (loading || subGroups.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5EDF5] bg-[#F8FAFC]"><Layers size={12} className="text-[#64748D]" /><span className="text-xs font-semibold text-[#64748D]">Select Team</span></div>
      <button type="button" onClick={() => onSelect(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-b border-[#E5EDF5] hover:bg-[#F8F7FF]" style={{ background: selectedSubGroupId === null ? '#F8F7FF' : 'white' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedSubGroupId === null ? ACCENT : '#D4DEE9' }} /><Users size={12} className="text-[#64748D]" /><span className="flex-1 text-[#061B31]">Entire cohort</span>{selectedSubGroupId === null && <Check size={13} className="text-[#533AFD]" />}
      </button>
      {subGroups.map((sg: SubGroup, idx: number) => { const isSel = selectedSubGroupId === sg.id; return (<button key={sg.id} type="button" onClick={() => onSelect(sg.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[#F8F7FF]" style={{ background: isSel ? '#F8F7FF' : 'white', borderBottom: idx < subGroups.length - 1 ? '1px solid #E5EDF5' : 'none' }}><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isSel ? ACCENT : '#D4DEE9' }} /><Layers size={12} style={{ color: isSel ? ACCENT : '#64748D' }} /><span className="flex-1 text-[#061B31] truncate">{sg.name}</span>{isSel && <Check size={13} style={{ color: ACCENT }} />}</button>); })}
    </div>
  );
}

function MembersSection({ groupId }: { groupId: string }) {
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="mt-3 rounded-lg border border-[#D4DEE9] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5EDF5] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <Users size={13} className="text-[#64748D]" />
          <span className="text-xs font-semibold text-[#64748D]">Members</span>
        </div>
        <button type="button" onClick={() => setShowForm(f => !f)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: showForm ? `${ACCENT}15` : 'white', color: ACCENT, border: `1px solid ${ACCENT}50` }}>
          <UserPlus size={11} />{showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>
      <div className="p-3">
        {showForm
          ? <MemberForm groupId={groupId} onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          : <p className="text-xs text-center text-[#64748D] py-3">Click "Add Member" to invite someone.</p>
        }
      </div>
    </div>
  );
}

// ── MetadataPanel ──────────────────────────────────────────────────────────

export default function MetadataPanel({ files, onSubmit, uploading, progress, currentFolderId = null }: MetadataPanelProps) {
  const { groups, loading: groupsLoading }          = useGroups() as { groups: Group[]; loading: boolean };
  const { userGroupIds, loading: userGroupLoading } = useUserGroupIds();

  const [projectName,        setProjectName]        = useState('');
  const [description,        setDescription]        = useState('');
  const [selectedGroupId,    setSelectedGroupId]    = useState<string | null>(null);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);
  const [selectedMiniCohortId, setSelectedMiniCohortId] = useState<string | null>(null);
  const [validationError,    setValidationError]    = useState('');

  const folderId      = currentFolderId;
  const hasFiles      = files.length > 0;
  const isProjectMode = projectName.trim().length > 0 && !folderId;

  const canUpload: boolean            = !selectedGroupId || userGroupIds.has(selectedGroupId);
  const uploadBlockedByGroup: boolean = !!selectedGroupId && !userGroupIds.has(selectedGroupId);

  function handleGroupSelect(id: string | null) {
    setSelectedGroupId(id);
    setSelectedSubGroupId(null);
    setValidationError('');
  }

  function handleSubmit() {
    if (!hasFiles || !canUpload) return;
    if (isProjectMode && !selectedGroupId) { setValidationError('Please select a cohort to create the project in.'); return; }
    setValidationError('');
    onSubmit({ projectName, description, tags: [], groupId: selectedGroupId, subGroupId: selectedSubGroupId, folderId, miniCohortId: selectedMiniCohortId });
  }

  const buttonLabel = uploading
    ? `Uploading… ${progress}%`
    : isProjectMode
      ? `📁 Create Project & Upload ${files.length} file${files.length > 1 ? 's' : ''}`
      : `⬆ Upload ${files.length} file${files.length !== 1 ? 's' : ''}`;

  return (
    <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

      <div className="pb-4 border-b border-[#E5EDF5]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">File Metadata</div>
        {folderId ? (
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: ACCENT }}><FolderOpen size={14} />Uploading into current folder</div>
        ) : (
          <div className="text-sm text-[#64748D]">Select files and fill in details below</div>
        )}
      </div>

      {!folderId && canUpload && (
        <FormField label="Project name">
          <input type="text" placeholder="e.g. Brand refresh 2026… (creates a new folder)" value={projectName} onChange={e => { setProjectName(e.target.value); setValidationError(''); }}
            className="w-full text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-2.5 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150" />
          {isProjectMode && <p className="text-xs mt-1" style={{ color: ACCENT }}>📁 A new project folder will be created in the selected cohort</p>}
        </FormField>
      )}

      {/* Cohort selector */}
      <FormField label={isProjectMode ? 'Cohort (required for project)' : 'Share with Cohort'}>
        {groupsLoading || userGroupLoading ? (
          <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin text-[#533AFD]" /><span className="text-sm text-[#64748D]">Loading cohorts…</span></div>
        ) : (
          <>
            <GroupDropdown groups={groups} selectedGroupId={selectedGroupId} onSelect={handleGroupSelect} />
            {uploadBlockedByGroup && (
              <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <ShieldAlert size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div><p className="text-xs font-semibold text-amber-700">View &amp; download only</p><p className="text-xs text-amber-600 mt-0.5">Oops! Please choose a <b>COHORT</b> before continuing.</p></div>
              </div>
            )}
            {validationError && <p className="text-xs mt-1.5 text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">{validationError}</p>}
            {selectedGroupId && (
              <>
                <SubGroupPicker groupId={selectedGroupId} selectedSubGroupId={selectedSubGroupId} onSelect={setSelectedSubGroupId} />
                <MembersSection groupId={selectedGroupId} />
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
          <textarea rows={3} placeholder="Describe this project / files…" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full resize-none text-sm text-[#061B31] bg-white border border-[#D4DEE9] rounded px-4 py-3 leading-[21px] placeholder-[#64748D]/70 outline-none focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10 transition-all duration-150" />
        </FormField>
      )}

      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-[#64748D] mb-1.5"><span>Uploading…</span><span>{progress}%</span></div>
          <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]"><div className="h-full rounded-full transition-all duration-300 bg-[#533AFD]" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      <Button variant="primary" onClick={handleSubmit} disabled={!hasFiles || uploading || uploadBlockedByGroup} className="w-full justify-center" style={uploadBlockedByGroup ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}>
        {uploadBlockedByGroup ? '🔒 View & Download Only' : !hasFiles ? '⬆ Select files above to upload' : buttonLabel}
      </Button>
    </div>
  );
}