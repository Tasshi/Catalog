
import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Modal, Button } from '../layout/ui';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { X, Search, Loader } from 'lucide-react';
import { ICONS, ROLE_STYLES } from '@/constant/fileIcons';

type MemberRole = 'viewer' | 'editor' | 'owner';

interface MiniCohort {
  id: string;
  name: string;

  group_id: string;
  group_name?: string;
}

interface PendingMember {
  id: number;
  label: string;
  value: string;
  role: MemberRole;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = ['#e0e7ff', '#fce7f3', '#d1fae5', '#fef3c7', '#ede9fe', '#dbeafe'];
function avatarBg(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const { showToast }   = useApp();
  const queryClient     = useQueryClient();

  const [name,        setName]        = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDesc]        = useState('');
  const [icon,        setIcon]        = useState('📁');

  const nameError = nameTouched && !name.trim() ? 'Project name is required.' : '';

  // Mini cohort
  const [cohortInput,     setCohortInput]     = useState('');
  const [cohortSearching, setCohortSearching] = useState(false);
  const [dropdownResults, setDropdownResults] = useState<MiniCohort[]>([]);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [selectedCohorts, setSelectedCohorts] = useState<MiniCohort[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<PendingMember[]>([]);
  const [showCohortForm, setShowCohortForm] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search as user types
  useEffect(() => {
    const q = cohortInput.trim();
    if (!q) { setDropdownResults([]); setShowDropdown(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCohortSearching(true);
      const { data, error } = await db
        .from('mini_cohorts')
        .select('id, name, group_id')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(8);

      setCohortSearching(false);
      if (error) { console.error('[cohort search]', error); return; }

      const filtered = (data ?? []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => !selectedCohorts.some(c => c.id === r.id)
      );
      setDropdownResults(filtered);
      setShowDropdown(true); // always show — even if empty, we show "Create" option
    }, 250);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortInput]);

  function selectCohort(mc: MiniCohort) {
    setSelectedCohorts(prev => [...prev, mc]);
    setCohortInput('');
    setDropdownResults([]);
    setShowDropdown(false);
    document.getElementById('cohort-inline-input')?.focus();
  }

  // Create a brand-new mini_cohort row then add it as a tag
  async function createAndAddCohort(cohortName: string) {
    const trimmed = cohortName.trim();
    if (!trimmed) return;

    // Prevent duplicates
    if (selectedCohorts.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setShowDropdown(false);
      setCohortInput('');
      return;
    }

    setCohortSearching(true);
    const { data, error } = await db
      .from('mini_cohorts')
      .insert({ name: trimmed, group_id: null })
      .select('id, name, group_id')
      .single();

    setCohortSearching(false);

    if (error) {
      console.error('[createAndAddCohort] insert failed:', error);
      return;
    }

    const mc: MiniCohort = {
      id:          data.id,
      name:        data.name,
      
      group_id:    data.group_id,
    };

    setSelectedCohorts(prev => [...prev, mc]);
    setCohortInput('');
    setDropdownResults([]);
    setShowDropdown(false);
    document.getElementById('cohort-inline-input')?.focus();
  }

  function removeCohort(id: string) {
    setSelectedCohorts(prev => prev.filter(c => c.id !== id));
  }

  async function handleCohortKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const q = cohortInput.trim();
      if (!q) return;
      // If exact match exists in dropdown, select it; otherwise create new
      const exact = dropdownResults.find(r => r.name.toLowerCase() === q.toLowerCase());
      if (exact) {
        selectCohort(exact);
      } else if (dropdownResults.length > 0) {
        selectCohort(dropdownResults[0]);
      } else {
        await createAndAddCohort(q);
      }
    }
    if (e.key === 'Escape') { setShowDropdown(false); }
    if (e.key === 'Backspace' && cohortInput === '' && selectedCohorts.length > 0) {
      e.stopPropagation();
      setSelectedCohorts(prev => prev.slice(0, -1));
    }
  }

  function handleRemoveMember(id: number) {
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  async function handleCreate() {
    setNameTouched(true);
    if (!name.trim()) return;

    // Collect all cohorts — selected tags + anything still typed but not yet added
    let finalCohorts = [...selectedCohorts];
    const typedName = cohortInput.trim();

    if (typedName && !finalCohorts.some(c => c.name.toLowerCase() === typedName.toLowerCase())) {
      // Check if it already exists — use maybeSingle to avoid 406
      const { data: existing } = await db
        .from('mini_cohorts')
        .select('id, name, group_id')
        .ilike('name', typedName)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        finalCohorts = [...finalCohorts, existing];
      } else {
        // Create new cohort row
        const { data: newCohort, error: cohortErr } = await db
          .from('mini_cohorts')
          .insert({ name: typedName })
          .select('id, name, group_id')
          .single();
        if (!cohortErr && newCohort) {
          finalCohorts = [...finalCohorts, newCohort];
        } else {
          console.error('[handleCreate] failed to create cohort:', cohortErr);
        }
      }
    }

    console.log('[handleCreate] finalCohorts:', finalCohorts.map(c => c.name));

    try {
      // Step 1 — create the group via RPC
      const { data, error } = await db.rpc('create_group_with_cohort', {
        p_name:        name.trim(),
        p_description: description.trim() || null,
        p_icon:        icon,
        p_cohort_name: null, // cohorts handled separately below
      });

      if (error) {
        console.error('[handleCreate] rpc error:', error);
        showToast('Failed to create group', 'error');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groupId = (data as any)?.group_id;
      console.log('[handleCreate] ✅ group created:', groupId);

      // Immediately refresh the groups list so the new cohort appears without waiting for staleTime
      await queryClient.invalidateQueries({ queryKey: ['groups'] });

      // Step 2 — insert all cohorts into junction table + update their group_id
      if (groupId && finalCohorts.length > 0) {
        await Promise.all(finalCohorts.map(async c => {
          // Link in junction table
          await db.from('group_mini_cohorts').insert({ group_id: groupId, cohort_id: c.id });
          // Update cohort's group_id
          await db.from('mini_cohorts').update({ group_id: groupId }).eq('id', c.id);
        }));

        // Set first cohort as primary on the group (for backwards compat)
        await db.from('groups')
          .update({ mini_cohort_id: finalCohorts[0].id })
          .eq('id', groupId);

        console.log('[handleCreate] ✅ linked', finalCohorts.length, 'cohort(s)', finalCohorts.map(c => c.name));
      }

      // Step 3 — add pending members
      if (groupId && members.length > 0) {
        await Promise.all(
          members.map(async m => {
            const { data: profile, error: profileError } = await db
              .from('profiles').select('id').eq('email', m.value).maybeSingle() as
              { data: { id: string } | null; error: unknown };
            if (profileError || !profile?.id) return;
            await db.from('group_members').insert({ group_id: groupId, user_id: profile.id, role: m.role });
          })
        );
      }

      showToast(`Group "${name}" created!`);
      handleClose();
    } catch (err) {
      console.error('[CreateGroupModal] handleCreate failed:', err);
      showToast('Failed to create group', 'error');
    }
  }

  function handleClose() {
    setName('');
    setNameTouched(false);
    setDesc('');
    setIcon('📁');
    setCohortInput('');
    setDropdownResults([]);
    setShowDropdown(false);
    setShowCohortForm(false);
    setSelectedCohorts([]);
    setMembers([]);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create new Cohort"
      size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Create group</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(80vh - 140px)' }}>

        {/* Group name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text3)' }}>
            Cohort name <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            className="form-input w-full"
            placeholder="e.g. Marketing Team Q3"
            value={name}
            onChange={e => { setName(e.target.value); if (!nameTouched) setNameTouched(true); }}
            onBlur={() => setNameTouched(true)}
            style={nameError ? { borderColor: '#f87171', outline: 'none' } : {}}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError && (
            <p id="name-error" className="text-[11px] font-medium mt-1" style={{ color: '#f87171' }}>{nameError}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text3)' }}>
            Description
          </label>
          <input
            className="form-input w-full"
            placeholder="Short description of this group's purpose"
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text3)' }}>
            Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map(i => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                style={{
                  width: 38, height: 38, fontSize: 19, borderRadius: 8,
                  border: icon === i ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: icon === i ? 'rgba(90,79,207,0.08)' : 'var(--glass2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label={`Select icon ${i}`}
              >{i}</button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Pending members */}
        {members.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {members.map(m => {
              const rs = ROLE_STYLES[m.role] || ROLE_STYLES.viewer;
              return (
                <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  style={{ border: '1px solid var(--border)', background: 'var(--glass2)' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: avatarBg(m.label),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, color: '#374151', flexShrink: 0,
                  }}>{getInitials(m.label)}</div>
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>{m.label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-xl capitalize"
                    style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{m.role}</span>
                  <button className="icon-btn" onClick={() => handleRemoveMember(m.id)}
                    style={{ color: '#fc8181', flexShrink: 0 }} aria-label="Remove member">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add mini cohort */}
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search size={14} style={{ color: 'var(--text3)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                Mini cohorts
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '1px 8px', borderRadius: 20,
                background: 'rgba(90,79,207,0.08)', color: 'var(--accent)',
                border: '1px solid rgba(90,79,207,0.2)',
              }}>
                {selectedCohorts.length}
              </span>
            </div>
            {!showCohortForm && (
              <button
                onClick={() => { setShowCohortForm(true); setTimeout(() => document.getElementById('cohort-inline-input')?.focus(), 50); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px', fontSize: 12, fontWeight: 500,
                  borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--glass2)', color: 'var(--text)', cursor: 'pointer',
                }}
              >
                <Search size={13} />
                Add mini cohort
              </button>
            )}
          </div>

          {/* Added cohorts list */}
          {selectedCohorts.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {selectedCohorts.map(c => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ border: '1px solid var(--border)', background: 'var(--glass2)' }}>
                  <div className="flex items-center gap-2">
                    <Search size={13} style={{ color: 'var(--text3)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{c.name}</span>

                  </div>
                  <button onClick={() => removeCohort(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text3)' }}
                    aria-label={`Remove ${c.name}`}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inline form — shown when Add button clicked */}
          {showCohortForm && (
            <div ref={wrapperRef} style={{
              border: '1px solid rgba(90,79,207,0.25)', borderRadius: 8,
              background: 'rgba(90,79,207,0.03)', padding: '12px',
              position: 'relative',
            }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>New mini cohort</p>

              {/* Input */}
              <div className="flex items-center gap-2 mb-3" style={{
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 10px', background: 'var(--glass2)',
              }}>
                <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                <input
                  id="cohort-inline-input"
                  value={cohortInput}
                  onChange={e => setCohortInput(e.target.value)}
                  onKeyDown={handleCohortKeyDown}
                  onFocus={() => { if (dropdownResults.length > 0) setShowDropdown(true); }}
                  placeholder="Cohort name"
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0,
                  }}
                />
                {cohortSearching && (
                  <Loader size={13} style={{ color: 'var(--text3)', animation: 'spin 1s linear infinite' }} />
                )}
              </div>

              {/* Dropdown suggestions */}
              {showDropdown && cohortInput.trim() && (
                <div style={{
                  border: '1px solid var(--border)', borderRadius: 8,
                  overflow: 'hidden', marginBottom: 10, background: 'var(--bg)',
                }}>
                  {dropdownResults.map((c, i) => (
                    <button key={c.id}
                      onMouseDown={e => { e.preventDefault(); selectCohort(c); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '7px 12px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: i < dropdownResults.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 1,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.name}</span>

                    </button>
                  ))}
                  {!dropdownResults.some(r => r.name.toLowerCase() === cohortInput.trim().toLowerCase()) && cohortInput.trim() && (
                    <button
                      onMouseDown={e => { e.preventDefault(); createAndAddCohort(cohortInput); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '7px 12px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(90,79,207,0.10)', color: 'var(--accent)' }}>+ Create</span>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>"{cohortInput.trim()}"</span>
                    </button>
                  )}
                </div>
              )}

              {/* Cancel / Add cohort buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setCohortInput(''); setShowDropdown(false); setDropdownResults([]); setShowCohortForm(false); }}
                  style={{
                    padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 8,
                    border: '1px solid var(--border)', background: 'none',
                    color: 'var(--text)', cursor: 'pointer',
                  }}
                >Cancel</button>
                <button
                  onClick={async () => {
                    const q = cohortInput.trim();
                    console.log('[Add cohort btn] q:', q, 'dropdownResults:', dropdownResults, 'selectedCohorts before:', selectedCohorts);
                    if (!q) return;
                    const exact = dropdownResults.find(r => r.name.toLowerCase() === q.toLowerCase());
                    if (exact) {
                      console.log('[Add cohort btn] selecting exact match:', exact);
                      selectCohort(exact);
                    } else if (dropdownResults.length > 0) {
                      console.log('[Add cohort btn] selecting first result:', dropdownResults[0]);
                      selectCohort(dropdownResults[0]);
                    } else {
                      console.log('[Add cohort btn] creating new cohort:', q);
                      const result = await createAndAddCohort(q);
                      console.log('[Add cohort btn] createAndAddCohort result:', result);
                    }
                    console.log('[Add cohort btn] selectedCohorts after setState called');
                    setCohortInput('');
                    setDropdownResults([]);
                    setShowDropdown(false);
                    document.getElementById('cohort-inline-input')?.focus();
                  }}
                  style={{
                    padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 8,
                    border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                  }}
                >Add cohort</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}