import { useState } from 'react';
import { Modal, Button } from '../layout/ui';
import { useApp } from '../../contexts/AppContext';
import type { Group } from '../layout/ui/cons';

interface GroupMemberModalProps {
  group:   Group | null;
  open:    boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GroupMemberModal({ group, open, onClose }: GroupMemberModalProps) {
  const { showToast } = useApp();
  const [newEmail,   setNewEmail]   = useState('');
  const [newRole,    setNewRole]    = useState('viewer');
  const [touched,    setTouched]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailError = touched
    ? (!newEmail.trim() ? 'Email is required.' : !EMAIL_RE.test(newEmail.trim()) ? 'Enter a valid email address.' : '')
    : '';
  const isValid = !!newEmail.trim() && EMAIL_RE.test(newEmail.trim());

  function handleChange(v: string) {
    setNewEmail(v);
    if (!touched && v) setTouched(true);
  }

  async function handleAdd() {
    setTouched(true);
    if (!isValid) return;
    setSubmitting(true);
    try {
      showToast(`Invite sent to ${newEmail.trim()}`);
      setNewEmail('');
      setTouched(false);
    } catch {
      showToast('Failed to add member', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!group) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${group.icon || '📁'} ${group.name} — Add Member`}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div className="flex flex-col gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
          Invite Member
        </div>
        <div className="flex gap-2 items-start">
          <div className="flex-1 flex flex-col gap-1">
            <input
              className="form-input"
              placeholder="Email address…"
              type="email"
              value={newEmail}
              onChange={e => handleChange(e.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={e => e.key === 'Enter' && void handleAdd()}
              style={emailError ? { borderColor: '#f87171', outline: 'none' } : {}}
              aria-invalid={!!emailError}
            />
            {emailError && (
              <span className="text-[11px] font-medium" style={{ color: '#f87171' }}>
                {emailError}
              </span>
            )}
          </div>
          <select
            className="form-input"
            style={{ width: 100 }}
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
          <Button
            variant="primary"
            onClick={() => void handleAdd()}
            disabled={submitting}
          >
            {submitting ? 'Inviting…' : 'Invite'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
