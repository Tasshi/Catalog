import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import { usePermissions } from '../../hooks/Usepermissions';
import { Avatar } from './ui';

import {
  LayoutDashboard, Upload, Users, FolderOpen, LogOut, Settings, ChevronDown, KeyRound,
} from 'lucide-react';
import type { Group } from './ui/cons';

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
  const perms                = usePermissions();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onGroupsPage = location.pathname.startsWith('/groups');

  const mainNav = [
    { label: 'Dashboard',  icon: LayoutDashboard, path: '/',        adminOnly: true  },
    { label: 'My Catalog', icon: FolderOpen,       path: '/catalog', adminOnly: false },
    { label: 'Creat Project',     icon: Upload,            path: '/upload',  adminOnly: false },
  ] as const;

  const visibleMainNav = mainNav.filter(item => !item.adminOnly || perms.isAdmin);

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200">

      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-base flex-shrink-0"
            // style={{ background: 'linear-gradient(135deg, #533AFD, #FF6118)' }} 
            
          >
            <img src="/src/assets/Logo.png" alt="react logo" style={{ width: '400px' }} />
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
        <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1.5 leading-3">
          Main
        </div>

        {visibleMainNav.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
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
              <span className="flex-1">{label}</span>

              {path === '/catalog' && !perms.isAdmin && (
                <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1 py-0.5 leading-none flex-shrink-0">
                  view
                </span>
              )}
            </button>
          );
        })}

        {/* TEAM */}
        {perms.canViewGroups && (
          <>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest px-2 pt-4 pb-1.5 leading-3">
              Team
            </div>

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
              <Users
                size={15}
                strokeWidth={onGroupsPage ? 2 : 1.5}
                className={`flex-shrink-0 ${onGroupsPage ? 'text-violet-600' : 'text-slate-500'}`}
              />
              <span className="flex-1">All Cohorts</span>
              {onGroupsPage && groups.length > 0 && (
                <ChevronDown size={12} className="text-violet-400 flex-shrink-0" />
              )}
            </button>

            {onGroupsPage && groups.map((group) => {
              const isActive = selectedGroupId === group.id;
              const dot = groupColor(group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup?.(group)}
                  className={`flex items-center gap-2 w-full pl-8 pr-3 py-2 rounded-[6px] border-none cursor-pointer text-[13px] font-normal leading-4 text-left transition-colors duration-150 ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: dot,
                      flexShrink: 0,
                      boxShadow: isActive ? `0 0 5px ${dot}99` : 'none',
                    }}
                  />
                  <span className="truncate">
                    {group.icon ? `${group.icon} ` : ''}{group.name}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* ── User footer with dropdown ── */}
      <div ref={dropdownRef} className="relative border-t border-slate-100">

        {/* Dropdown — pops above the footer */}
        {dropdownOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">

            {/* User info header */}
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
              <Avatar name={profile?.full_name || 'User'} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 leading-4 truncate">
                  Hi {profile?.full_name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-xs text-slate-400 leading-[14px] mt-0.5 capitalize">
                  {profile?.role || 'member'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-left transition-colors duration-150"
              >
                <Settings size={14} strokeWidth={1.5} className="text-slate-400 flex-shrink-0" />
                Settings
              </button>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/change-password'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-left transition-colors duration-150"
              >
                <KeyRound size={14} strokeWidth={1.5} className="text-slate-400 flex-shrink-0" />
                Change Password
              </button>
            </div>

            <div className="border-t border-slate-100 py-1">
              <button
                onClick={() => { setDropdownOpen(false); signOut(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent text-left font-medium transition-colors duration-150"
              >
                <LogOut size={14} strokeWidth={1.5} className="flex-shrink-0" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Trigger row */}
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-left transition-colors duration-150"
        >
          <Avatar name={profile?.full_name || 'User'} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-normal text-slate-900 leading-4 truncate">
              {profile?.full_name || 'User'}
            </div>
            <div className="text-xs text-slate-400 leading-[14px] mt-0.5 capitalize">
              {profile?.role || 'member'}
            </div>
          </div>
          <ChevronDown
            size={13}
            className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
}