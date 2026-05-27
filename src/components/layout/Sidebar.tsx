import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import { usePermissions } from '../../hooks/Usepermissions';
import { Avatar } from './ui';
import logoImage from '../../assets/Logo.png';

import {
  LayoutDashboard,
  Upload,
  Users,
  FolderOpen,
  LogOut,
  Settings,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import type { Group } from './ui/cons';

interface SidebarProps {
  selectedGroupId?: string | null;
  onSelectGroup?: (group: Group | null) => void;
}

export default function Sidebar({ selectedGroupId = null, onSelectGroup }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { groups } = useGroups();
  const perms = usePermissions();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cohortsExpanded, setCohortsExpanded] = useState(true);
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
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', adminOnly: true },
    { label: 'My Catalog', icon: FolderOpen, path: '/catalog', adminOnly: false },
    { label: 'Create Project', icon: Upload, path: '/upload', adminOnly: false },
  ] as const;

  const visibleMainNav = mainNav.filter((item) => !item.adminOnly || perms.isAdmin);

  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* ── Logo ── */}
      <div className="border-b border-slate-100 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[6px] text-base"
            // style={{ background: 'linear-gradient(135deg, #533AFD, #FF6118)' }}
          >
            <img
              src={logoImage}
              alt="Pelsung Logo"
              style={{ width: '400px', opacity: 0.75, mixBlendMode: 'multiply' }}
            />
          </div>
          <div>
            <div className="text-base leading-[18.4px] font-normal text-slate-900">Pelsung</div>
            <div className="mt-0.5 text-[11px] font-normal tracking-widest text-slate-400 uppercase">
              Repository
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {/* MAIN */}
        <div className="px-2 pt-4 pb-1.5 text-[11px] leading-3 font-normal tracking-widest text-slate-400 uppercase">
          Main
        </div>

        {visibleMainNav.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`group flex w-full cursor-pointer items-center gap-2 rounded-[6px] border-none px-3 py-2.5 text-left text-sm leading-4 font-normal transition-colors duration-150 ${
                isActive
                  ? 'bg-[#054159] text-white'
                  : 'bg-transparent text-slate-700 hover:bg-[#054159] hover:text-white'
              }`}
            >
              <Icon
                size={15}
                strokeWidth={isActive ? 2 : 1.5}
                className={`flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}
              />
              <span className="flex-1">{label}</span>

              {path === '/catalog' && !perms.isAdmin && (
                <span
                  className={`flex-shrink-0 rounded px-1 py-0.5 text-[10px] leading-none ${isActive ? 'bg-white/20 text-white/80' : 'bg-slate-100 text-slate-400 group-hover:bg-white/20 group-hover:text-white/80'}`}
                >
                  view
                </span>
              )}
            </button>
          );
        })}

        {/* TEAM */}
        {perms.canViewGroups && (
          <>
            <div className="px-2 pt-4 pb-1.5 text-[11px] leading-3 font-normal tracking-widest text-slate-400 uppercase">
              Team
            </div>

            <button
              onClick={() => {
                if (!onGroupsPage) navigate('/groups');
                onSelectGroup?.(null);
                setCohortsExpanded((e) => !e);
              }}
              className={`group flex w-full cursor-pointer items-center gap-2 rounded-[6px] border-none px-3 py-2.5 text-left text-sm leading-4 font-normal transition-colors duration-150 ${
                onGroupsPage && selectedGroupId === null
                  ? 'bg-[#054159] text-white'
                  : 'bg-transparent text-slate-700 hover:bg-[#054159] hover:text-white'
              }`}
            >
              <Users
                size={15}
                strokeWidth={onGroupsPage ? 2 : 1.5}
                className={`flex-shrink-0 transition-colors duration-150 ${onGroupsPage && selectedGroupId === null ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}
              />
              <span className="flex-1">All Cohorts</span>
              {groups.length > 0 && (
                <ChevronDown
                  size={12}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:text-white/70 ${cohortsExpanded ? 'rotate-180' : ''} ${onGroupsPage && selectedGroupId === null ? 'text-white/70' : 'text-slate-400'}`}
                />
              )}
            </button>

            {cohortsExpanded &&
              groups.map((group) => {
                const isActive = selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => onSelectGroup?.(group)}
                    className={`group flex w-full cursor-pointer items-center gap-2 rounded-[6px] border-none py-2 pr-3 pl-8 text-left text-[13px] leading-4 font-normal transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#054159] text-white'
                        : 'bg-transparent text-slate-600 hover:bg-[#054159] hover:text-white'
                    }`}
                  >
                    <span className="truncate">
                      {group.icon ? `${group.icon} ` : ''}
                      {group.name}
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
          <div className="absolute right-2 bottom-full left-2 z-50 mb-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {/* User info header */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
              <Avatar name={profile?.full_name || 'User'} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-sm leading-4 font-medium text-slate-900">
                  {profile?.full_name?.split(' ')[0] || 'User'}
                </div>
                <div className="mt-0.5 text-xs leading-[14px] text-slate-400 capitalize">
                  {profile?.role || 'member'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                className="group flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-[#054159] hover:text-white"
              >
                <Settings
                  size={14}
                  strokeWidth={1.5}
                  className="flex-shrink-0 text-slate-400 group-hover:text-white"
                />
                Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/change-password');
                }}
                className="group flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-[#054159] hover:text-white"
              >
                <KeyRound
                  size={14}
                  strokeWidth={1.5}
                  className="flex-shrink-0 text-slate-400 group-hover:text-white"
                />
                Change Password
              </button>
            </div>

            <div className="border-t border-slate-100 py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors duration-150 hover:bg-red-50"
              >
                <LogOut size={14} strokeWidth={1.5} className="flex-shrink-0" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Trigger row */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="group flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-4 py-3 text-left transition-colors duration-150 hover:bg-[#054159]"
        >
          <Avatar name={profile?.full_name || 'User'} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm leading-4 font-normal text-slate-900 transition-colors duration-150 group-hover:text-white">
              {profile?.full_name || 'User'}
            </div>
            <div className="mt-0.5 text-xs leading-[14px] text-slate-400 capitalize transition-colors duration-150 group-hover:text-white/60">
              {profile?.role || 'member'}
            </div>
          </div>
          <ChevronDown
            size={13}
            className={`flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-white/70 ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
}
