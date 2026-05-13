import { useState } from 'react';
import { useGroups } from '../../hooks/useGroups';
import { FormField, Button } from '../ui';
import { X } from 'lucide-react';
import { Group,  MetadataPanelProps } from '../ui/cons'


export default function MetadataPanel({ file, onSubmit, uploading, progress }: MetadataPanelProps) {
  const { groups } = useGroups() as { groups: Group[] };
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(',', '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  function handleSubmit() {
    if (!file) return;
    onSubmit({ file, description, tags, groupId });
  }

  const hasFile = !!file;
  const isSelected = (id: string | null) => groupId === id;

  return (
    <div className="bg-white border border-[#D4DEE9] rounded-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 flex flex-col gap-6">

      {/* File header */}
      <div className="pb-4 border-b border-[#E5EDF5]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748D] mb-1">
          File Metadata
        </div>
        {!hasFile
          ? <div className="text-sm text-[#64748D]">Select a file to configure metadata</div>
          : <div className="text-sm font-medium text-[#533AFD]">{file.name}</div>
        }
      </div>

      {/* Description */}
      <FormField label="Description">
        <textarea
          rows={3}
          placeholder="Describe this file…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={!hasFile}
          className={[
            'w-full resize-none text-sm text-[#061B31] bg-white',
            'border border-[#D4DEE9] rounded px-4 py-3 leading-[21px]',
            'placeholder-[#64748D]/70 outline-none',
            'focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
          ].join(' ')}
        />
      </FormField>

      {/* Tags */}
      <FormField label="Tags">
        <div className="w-full min-h-[40px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-white border border-[#D4DEE9] rounded transition-all duration-150 focus-within:border-[#533AFD] focus-within:ring-[3px] focus-within:ring-[#533AFD]/10">
          {tags.map(t => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#E8E9FF] text-[#533AFD] border border-[#C9C3F0]"
            >
              {t}
              <button
                onClick={() => removeTag(t)}
                className="text-[#533AFD]/60 hover:text-[#533AFD] transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            className="bg-transparent border-none outline-none text-sm text-[#061B31] flex-1 min-w-[80px] placeholder-[#64748D]/70"
            placeholder="Add tag, press Enter…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            disabled={!hasFile}
          />
        </div>
      </FormField>

      {/* Group selector */}
      <FormField label="Share with Group">
        <div className="flex flex-col gap-1.5">
          {/* Personal option */}
          <button
            onClick={() => setGroupId(null)}
            className={[
              'flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all duration-150',
              isSelected(null)
                ? 'border border-[#533AFD] bg-[#533AFD]/[0.06]'
                : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB] hover:bg-[#F3F3F3]',
            ].join(' ')}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected(null) ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
            <span className="text-sm text-[#061B31] flex-1">Personal — don't share</span>
          </button>

          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setGroupId(g.id)}
              className={[
                'flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all duration-150',
                isSelected(g.id)
                  ? 'border border-[#533AFD] bg-[#533AFD]/[0.06]'
                  : 'border border-[#D4DEE9] bg-white hover:border-[#B8CCDB] hover:bg-[#F3F3F3]',
              ].join(' ')}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected(g.id) ? 'bg-[#533AFD]' : 'bg-[#D4DEE9]'}`} />
              <span className="text-sm text-[#061B31] flex-1">{g.icon} {g.name}</span>
              <span className="text-xs text-[#64748D]">
                {g.group_members?.[0]?.count ?? 0} members
              </span>
            </button>
          ))}
        </div>
      </FormField>

      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-[#64748D] mb-1.5">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-[#E5EDF5]">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#533AFD]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!hasFile || uploading}
        className="w-full justify-center"
      >
        {uploading ? `Uploading… ${progress}%` : '⬆ Upload File'}
      </Button>
    </div>
  );
}
