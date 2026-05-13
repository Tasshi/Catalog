import Sidebar from './Sidebar';
import { useApp } from '../../contexts/AppContext';
import { Toast } from '../ui';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { toast } = useApp();
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <Toast toast={toast} />
    </div>
  );
}
