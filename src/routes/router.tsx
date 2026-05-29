import { useState, useEffect, useRef } from 'react';
import { Modal, Button } from '../components/layout/ui';
import { useGroups } from '../hooks/useGroups';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { X, Search, Loader } from 'lucide-react';
import { ICONS, ROLE_STYLES } from '@/constant/fileIcons';

type MemberRole = 'viewer' | 'editor' | 'owner';

interface MiniCohort {
  id: string;
  name: string;
  description: string | null;
  group_id: string;
  group_name?: string; // joined from groups
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
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
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
  const { createGroup } = useGroups();
  const { showToast } = useApp();

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDesc] = useState('');
  const [icon, setIcon] = useState('📁');

  const nameError = nameTouched && !name.trim() ? 'Project name is required.' : '';

  // Mini cohort search
  const [miniCohortSearch, setMiniCohortSearch] = useState('');
  const [cohortResults, setCohortResults] = useState<MiniCohort[]>([]);
  const [cohortSearching, setCohortSearching] = useState(false);
  const [selectedMiniCohort, setSelectedMiniCohort] = useState<MiniCohort | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [members, setMembers] = useState<PendingMember[]>([]);

  // Debounced search against mini_cohorts table, join group name
  useEffect(() => {
    const query = miniCohortSearch.trim();

    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCohortResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setCohortSearching(true);

      const { data, error } = await db
        .from('mini_cohorts')
        .select('id, name, description, group_id, groups(name)')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (error) console.warn('[CreateGroupModal] mini_cohort search error:', error);

      // Flatten joined group name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: MiniCohort[] = (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        group_id: r.group_id,
        group_name: r.groups?.name ?? null,
      }));

      setCohortResults(results);
      setShowDropdown(true);
      setCohortSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [miniCohortSearch]);

  function handleSelectMiniCohort(mc: MiniCohort) {
    setSelectedMiniCohort(mc);
    setMiniCohortSearch(mc.name);
    setShowDropdown(false);
    setCohortResults([]);
  }

  function handleClearMiniCohort() {
    setSelectedMiniCohort(null);
    setMiniCohortSearch('');
    setCohortResults([]);
    setShowDropdown(false);
  }

  function handleRemove(id: number) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleCreate() {
    setNameTouched(true);
    if (!name.trim()) return;
    try {
      // 1. Create the group with mini_cohort_id
      const group = await createGroup({
        name,
        description,
        icon,
        mini_cohort_id: selectedMiniCohort?.id ?? null,
      });

      // 2. Add any manually pending members
      if (members.length > 0) {
        await Promise.all(
          members.map(async (m) => {
            const { data: profile, error: profileError } = (await db
              .from('profiles')
              .select('id')
              .eq('email', m.value)
              .maybeSingle()) as { data: { id: string } | null; error: unknown };

            if (profileError) {
              console.warn(`[CreateGroup] Profile lookup error for ${m.value}:`, profileError);
              return;
            }
            if (!profile?.id) {
              console.warn(`[CreateGroup] No profile found for ${m.value}`);
              return;
            }

            const { error: memberError } = await db
              .from('group_members')
              .insert({ group_id: group.id, user_id: profile.id, role: m.role });

            if (memberError) {
              console.warn(`[CreateGroup] Failed to add member ${m.value}:`, memberError);
            }
          }),
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
    setMiniCohortSearch('');
    setCohortResults([]);
    setSelectedMiniCohort(null);
    setShowDropdown(false);
    setMembers([]);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create new cohort"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            Create group
          </Button>
        </div>
      }
    >
      <div
        className="flex flex-col gap-4 overflow-y-auto pr-1"
        style={{ maxHeight: 'calc(80vh - 140px)' }}
      >
        {/* Group name */}
        <div>
          <label
            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text3)' }}
          >
            Project name <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            className="form-input w-full"
            placeholder="e.g. Marketing Team Q3"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!nameTouched) setNameTouched(true);
            }}
            onBlur={() => setNameTouched(true)}
            style={nameError ? { borderColor: '#f87171', outline: 'none' } : {}}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError && (
            <p
              id="name-error"
              className="mt-1 text-[11px] font-medium"
              style={{ color: '#f87171' }}
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text3)' }}
          >
            Description
          </label>
          <input
            className="form-input w-full"
            placeholder="Short description of this group's purpose"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {/* Icon picker */}
        <div>
          <label
            className="mb-2 block text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text3)' }}
          >
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                style={{
                  width: 38,
                  height: 38,
                  fontSize: 19,
                  borderRadius: 8,
                  border: icon === i ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: icon === i ? 'rgba(90,79,207,0.08)' : 'var(--glass2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={`Select icon ${i}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Pending members list */}
        {members.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {members.map((m) => {
              const rs = ROLE_STYLES[m.role] || ROLE_STYLES.viewer;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{ border: '1px solid var(--border)', background: 'var(--glass2)' }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: avatarBg(m.label),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#374151',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(m.label)}
                  </div>
                  <span className="flex-1 truncate text-sm" style={{ color: 'var(--text)' }}>
                    {m.label}
                  </span>
                  <span
                    className="rounded-xl px-2 py-0.5 text-xs font-semibold capitalize"
                    style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                  >
                    {m.role}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() => handleRemove(m.id)}
                    style={{ color: '#fc8181', flexShrink: 0 }}
                    aria-label="Remove member"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add mini cohort section */}
        <div>
          <label
            className="mb-1.5 block text-xs font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text3)' }}
          >
            Add mini cohort
          </label>

          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text3)',
                  pointerEvents: 'none',
                }}
              />
              {cohortSearching && (
                <Loader
                  size={13}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text3)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              )}
              <input
                className="form-input w-full"
                style={{ paddingLeft: 30, paddingRight: selectedMiniCohort ? 30 : 10 }}
                placeholder="Search mini cohort…"
                value={miniCohortSearch}
                onChange={(e) => {
                  setMiniCohortSearch(e.target.value);
                  if (selectedMiniCohort) setSelectedMiniCohort(null);
                }}
                onFocus={() => {
                  if (cohortResults.length > 0) setShowDropdown(true);
                }}
              />
              {selectedMiniCohort && (
                <button
                  onClick={handleClearMiniCohort}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Clear selection"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && cohortResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: 4,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  overflow: 'hidden',
                }}
              >
                {cohortResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectMiniCohort(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {c.name}
                    </span>
                    {c.group_name && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        Group: {c.group_name}
                      </span>
                    )}
                    {c.description && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.description}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {showDropdown &&
              !cohortSearching &&
              cohortResults.length === 0 &&
              miniCohortSearch.trim() && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    marginTop: 4,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: 'var(--text3)',
                  }}
                >
                  No mini cohort found for "{miniCohortSearch}"
                </div>
              )}
          </div>

          {/* Selected mini cohort preview */}
          {selectedMiniCohort && (
            <div
              className="mt-2 flex flex-col gap-0.5 rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'rgba(90,79,207,0.07)',
                border: '1px solid rgba(90,79,207,0.25)',
              }}
            >
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {selectedMiniCohort.name}
              </span>
              {selectedMiniCohort.group_name && (
                <span style={{ color: 'var(--text3)' }}>
                  Group: {selectedMiniCohort.group_name}
                </span>
              )}
              {selectedMiniCohort.description && (
                <span style={{ color: 'var(--text3)' }}>{selectedMiniCohort.description}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
