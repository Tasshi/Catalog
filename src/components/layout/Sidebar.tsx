import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import { Avatar } from '../ui';
import {
  LayoutDashboard, Upload, Users, FolderOpen, LogOut, Settings, ChevronDown,
} from 'lucide-react';
import type { Group } from '../ui/cons';

function groupColor(str: string) {
  const palette = ['#5B8DEF', '#4CAF7D', '#F5C842', '#E07B54', '#A78BFA', '#F472B6', '#34D399'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

interface SidebarProps {
  selectedGroupId?: string | null;
  onSelectGroup?: (group: Group | null) => void;
}

export default function Sidebar({ selectedGroupId = null, onSelectGroup }: SidebarProps) {
  const navigate             = useNavigate();
  const location             = useLocation();
  const { profile, signOut } = useAuth();
  const { groups }           = useGroups();

  const onGroupsPage = location.pathname.startsWith('/groups');

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200">

      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #533AFD, #FF6118)' }}
          >
            🗄
          </div>
          <div>
            <div className="text-base font-normal leading-[18.4px] text-slate-900">Pelsung</div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest mt-0.5">
              Repository
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">

        {/* MAIN */}
        <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1.5 leading-3">Main</div>

        {([
          { label: 'Dashboard',  icon: LayoutDashboard, path: '/' },
          { label: 'My Catalog', icon: FolderOpen,       path: '/catalog' },
          { label: 'Upload',     icon: Upload,            path: '/upload' },
        ] as const).map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-[6px] border-none cursor-pointer text-sm font-normal leading-4 text-left transition-colors duration-150 ${
                isActive ? 'bg-violet-50 text-violet-600' : 'bg-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} className={`flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-500'}`} />
              <span>{label}</span>
            </button>
          );
        })}

        {/* TEAM */}
        <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1.5 leading-3">Team</div>

        {/* Groups parent button */}
        <button
          onClick={() => { if (!onGroupsPage) navigate('/groups'); onSelectGroup?.(null); }}
          className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-[6px] border-none cursor-pointer text-sm font-normal leading-4 text-left transition-colors duration-150 ${
            onGroupsPage && selectedGroupId === null
              ? 'bg-violet-50 text-violet-600'
              : onGroupsPage
              ? 'bg-transparent text-violet-500 hover:bg-slate-100'
              : 'bg-transparent text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users size={15} strokeWidth={onGroupsPage ? 2 : 1.5} className={`flex-shrink-0 ${onGroupsPage ? 'text-violet-600' : 'text-slate-500'}`} />
          <span className="flex-1">All Cohorts</span>
          {onGroupsPage && groups.length > 0 && (
            <ChevronDown size={12} className="text-violet-400 flex-shrink-0" />
          )}
        </button>

        {/* Inline group list — visible only on /groups */}
        {onGroupsPage && groups.map((group) => {
          const isActive = selectedGroupId === group.id;
          const dot = groupColor(group.id);
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup?.(group)}
              className={`flex items-center gap-2 w-full pl-8 pr-3 py-2 rounded-[6px] border-none cursor-pointer text-[13px] font-normal leading-4 text-left transition-colors duration-150 ${
                isActive ? 'bg-violet-50 text-violet-700' : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: isActive ? `0 0 5px ${dot}99` : 'none' }} />
              <span className="truncate">{group.icon ? `${group.icon} ` : ''}{group.name}</span>
            </button>
          );
        })}

        {/* ACCOUNT */}
        <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1.5 leading-3">Account</div>

        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-[6px] border-none cursor-pointer text-sm font-normal leading-4 text-left transition-colors duration-150 ${
            location.pathname === '/settings' ? 'bg-violet-50 text-violet-600' : 'bg-transparent text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Settings size={15} strokeWidth={location.pathname === '/settings' ? 2 : 1.5} className={`flex-shrink-0 ${location.pathname === '/settings' ? 'text-violet-600' : 'text-slate-500'}`} />
          <span>Settings</span>
        </button>
      </nav>

      {/* ── User ── */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2.5">
        <Avatar name={profile?.full_name || 'User'} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-normal text-slate-900 leading-4 truncate">{profile?.full_name || 'User'}</div>
          <div className="text-xs text-slate-400 leading-[14px] mt-0.5 capitalize">{profile?.role || 'member'}</div>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="flex items-center justify-center w-7 h-7 rounded border border-slate-200 bg-transparent cursor-pointer text-slate-500 flex-shrink-0 transition-colors duration-150 hover:bg-violet-50 hover:border-violet-500 hover:text-violet-600"
        >
          <LogOut size={13} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
