import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';
import {
  LayoutDashboard, Upload, Users, FolderOpen, LogOut, Settings,
} from 'lucide-react';

const NAV = [
  { section: 'Main' },
  { label: 'Dashboard',  icon: LayoutDashboard, path: '/' },
  { label: 'My Catalog', icon: FolderOpen,       path: '/catalog' },
  { label: 'Upload',     icon: Upload,            path: '/upload' },
  { section: 'Team' },
  { label: 'Groups',     icon: Users,             path: '/groups' },
  { section: 'Account' },
  { label: 'Settings',   icon: Settings,          path: '/settings' },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200">

      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #533AFD, #FF6118)' }}>
            🗄
          </div>
          <div>
            <div className="text-base font-normal leading-[18.4px] text-slate-900">
              Pelsung
            </div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest mt-0.5">
              Repository
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item, i) => {
          if (item.section) {
            return (
              <div
                key={i}
                className="text-[11px] font-normal text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1.5 leading-3"
              >
                {item.section}
              </div>
            );
          }

          const isActive = location.pathname === item.path;
          const Icon = item.icon!;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path!)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-[6px] border-none cursor-pointer text-sm font-normal leading-4 text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-violet-50 text-violet-600'
                  : 'bg-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon
                size={15}
                strokeWidth={isActive ? 2 : 1.5}
                className={`flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-500'}`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── User ── */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2.5">
        <Avatar name={profile?.full_name || 'User'} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="text-sm font-normal text-slate-900 leading-4 truncate">
            {profile?.full_name || 'User'}
          </div>
          <div className="text-xs text-slate-400 leading-[14px] mt-0.5 capitalize">
            {profile?.role || 'member'}
          </div>
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
