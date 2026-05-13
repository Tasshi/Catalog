import { FileText, Users } from 'lucide-react';
import { GroupCardProps, Group, GroupMemberCount,FileCount} from '../ui/cons';

export function GroupCard({ group, onClick }: GroupCardProps) {
  const memberCount = group.group_members?.[0]?.count ?? 0;
  const fileCount = group.files?.[0]?.count ?? 0;

  return (
    <div
      onClick={() => onClick(group)}
      className="
        group
        bg-white
        border border-[#D4DEE9]
        rounded-[5px]
        p-8
        shadow-[0px_1px_2px_rgba(0,0,0,0.04)]
        cursor-pointer
        transition-all duration-200
        hover:border-[#B8CCDB]
        hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]
        hover:-translate-y-0.5
      "
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-[5px] flex items-center justify-center text-xl flex-shrink-0 bg-[#E8E9FF]">
          {group.icon || '📁'}
        </div>
        <div className="min-w-0">
          <div
            className="text-[14px] font-normal leading-[1.3] text-[#061B31] truncate"
            style={{ fontFamily: 'sohne-var, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {group.name}
          </div>
          <div
            className="text-[12px] font-normal leading-[1.4] text-[#64748D] mt-0.5 truncate"
            style={{ fontFamily: 'sohne-var, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {group.description || 'No description'}
          </div>
        </div>
      </div>

      <div className="flex items-center pt-4 border-t border-[#D4DEE9]">
        <div
          className="flex items-center gap-1.5 text-[12px] text-[#64748D]"
          style={{ fontFamily: 'sohne-var, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          <Users size={12} className="text-[#533AFD]" />
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-[12px] text-[#64748D] ml-auto"
          style={{ fontFamily: 'sohne-var, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          <FileText size={12} className="text-[#533AFD]" />
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}