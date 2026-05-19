import Sidebar from './Sidebar';
import { useApp } from '../../contexts/AppContext';
import { Toast } from './ui';
import type { Group } from './ui/cons';

interface LayoutProps {
  children: React.ReactNode;
  selectedGroupId?: string | null;
  onSelectGroup?: (group: Group | null) => void;
}

export default function Layout({ children, selectedGroupId, onSelectGroup }: LayoutProps) {
  const { toast } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ONE sidebar only — Sidebar.tsx already shows the inline group list */}
      <Sidebar
        selectedGroupId={selectedGroupId}
        onSelectGroup={onSelectGroup}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
