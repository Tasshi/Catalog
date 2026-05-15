import { getFileConfig } from '../../lib/metadata';
import { Badge, Avatar } from '../ui';
import { Download, Info, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { IconSize,FileIconProps, FileRowProps,FileCardProps } from '../ui/cons';

// ── FileIcon ──────────────────────────────────────────────────────────────────

const iconDims: Record<IconSize, { w: number; h: number; fs: number }> = {
  sm: { w: 28, h: 34, fs: 8 },
  md: { w: 34, h: 40, fs: 9 },
  lg: { w: 80, h: 96, fs: 18 },
};

export function FileIcon({ ext, size = 'md' }: FileIconProps) {
  const cfg = getFileConfig(ext);
  const d = iconDims[size];
  return (
    <div
      className="rounded flex items-center justify-center font-mono font-medium flex-shrink-0"
      style={{
        width: d.w,
        height: d.h,
        background: cfg.bg,
        color: cfg.color,
        fontSize: d.fs,
        letterSpacing: '0.05em',
      }}
    >
      {cfg.label}
    </div>
  );
}

// ── Shared icon action button ─────────────────────────────────────────────────

interface IconBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
}

function IconBtn({ danger = false, className = '', ...props }: IconBtnProps) {
  return (
    <button
      className={[
        'w-7 h-7 flex items-center justify-center rounded',
        'border border-[#D4DEE9] bg-white',
        'transition-colors duration-150',
        danger
          ? 'text-red-400 hover:bg-red-50 hover:border-red-200'
          : 'text-[#50617A] hover:bg-[#F3F3F3] hover:border-[#B8CCDB]',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

// ── FileRow ───────────────────────────────────────────────────────────────────

export function FileRow({ file, onView, onDelete, onDownload }: FileRowProps) {
  const ext = file.ext || file.file_type || '';
  const dateStr = file.created_at
    ? format(new Date(file.created_at), 'MMM d, yyyy')
    : '—';

  return (
    <tr
      className="group cursor-pointer transition-colors duration-100 hover:bg-[#F8FAFC]"
      onClick={() => onView(file)}
    >
      {/* Name + size */}
      <td className="px-4 py-3 border-b border-[#D4DEE9]">
        <div className="flex items-center gap-3">
          <FileIcon ext={ext} size="md" />
          <div>
            <div className="text-[14px] font-normal text-[#061B31] leading-snug">
              {file.name}
            </div>
            <div className="text-[12px] text-[#64748D] mt-0.5">
              {file.sizeFormatted}
            </div>
          </div>
        </div>
      </td>

      {/* Type badge */}
      <td className="px-4 py-3 border-b border-[#D4DEE9]">
        <Badge type={ext}>.{ext.toUpperCase()}</Badge>
      </td>

      {/* Group */}
      <td className="px-4 py-3 border-b border-[#D4DEE9] text-[14px] text-[#273951]">
        {file.groupName ? (
          <span className="flex items-center gap-1.5">
            <span>{file.groupIcon || '📁'}</span>
            {file.groupName}
          </span>
        ) : (
          <span className="text-[#64748D]">Personal</span>
        )}
      </td>

      {/* Author */}
      <td className="px-4 py-3 border-b border-[#D4DEE9]">
        <div className="flex items-center gap-2">
          <Avatar name={file.authorName || ''} size="xs" />
          <span className="text-[14px] text-[#273951]">{file.authorName}</span>
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3 border-b border-[#D4DEE9] text-[12px] font-mono text-[#64748D]">
        {dateStr}
      </td>

      {/* Actions — visible on row hover */}
      <td className="px-4 py-3 border-b border-[#D4DEE9]">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <IconBtn
            title="View details"
            onClick={e => { e.stopPropagation(); onView(file); }}
          >
            <Info size={12} strokeWidth={1.5} />
          </IconBtn>
          <IconBtn
            title="Download"
            onClick={e => { e.stopPropagation(); onDownload(file); }}
          >
            <Download size={12} strokeWidth={1.5} />
          </IconBtn>
          <IconBtn
            danger
            title="Delete"
            onClick={e => { e.stopPropagation(); onDelete(file); }}
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

// ── FileCard ──────────────────────────────────────────────────────────────────

export function FileCard({ file, onView, onDelete, onDownload }: FileCardProps) {
  const ext = file.ext || file.file_type || '';
  const dateStr = file.created_at
    ? format(new Date(file.created_at), 'MMM d, yyyy')
    : '—';

  return (
    <div
      className={[
        'group cursor-pointer',
        'bg-white border border-[#D4DEE9] rounded-[5px] p-6',
        'shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
        'transition-all duration-200',
        'hover:border-[#B8CCDB] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
      ].join(' ')}
      onClick={() => onView(file)}
    >
      {/* Top row: icon + action buttons */}
      <div className="flex items-start justify-between mb-4">
        <FileIcon ext={ext} size="md" />
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <IconBtn
            title="Download"
            onClick={e => { e.stopPropagation(); onDownload(file); }}
          >
            <Download size={11} strokeWidth={1.5} />
          </IconBtn>
          <IconBtn
            danger
            title="Delete"
            onClick={e => { e.stopPropagation(); onDelete(file); }}
          >
            <Trash2 size={11} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* File name */}
      <div
        className="text-[14px] font-normal text-[#061B31] truncate mb-1 leading-snug"
        style={{ fontFamily: 'sohne-var, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {file.name}
      </div>

      {/* Size · Date */}
      <div className="text-[12px] text-[#64748D] mb-4">
        {file.sizeFormatted} · {dateStr}
      </div>

      {/* Footer: badge + group */}
      <div className="flex items-center justify-between pt-3 border-t border-[#D4DEE9]">
        <Badge type={ext}>.{ext.toUpperCase()}</Badge>
        {file.groupName && (
          <span className="text-[12px] text-[#64748D] flex items-center gap-1">
            {file.groupIcon} {file.groupName}
          </span>
        )}
      </div>
    </div>
  );
}
