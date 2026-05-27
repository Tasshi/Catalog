import { SearchBar } from './ui';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

interface HeaderProps {
  title: string;
  search?: string;
  onSearch?: (value: string) => void;
  actions?: React.ReactNode;
}

export default function Header({ title, search, onSearch, actions }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className="flex h-16 flex-shrink-0 items-center gap-4 px-8"
      style={{
        background: 'linear-gradient(135deg, #f8f9fb 0%, #eef0f4 60%, #e8eaed 100%)',
        borderBottom: '1px solid #dde1e7',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <h1
        className="flex-1 truncate"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#1a202c',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h1>

      {onSearch && <SearchBar value={search ?? ''} onChange={onSearch} />}

      {actions}

      <button
        onClick={() => navigate('/upload')}
        className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 px-4 text-xs font-bold text-white transition-all hover:-translate-y-px"
        style={{ background: '#054159', boxShadow: '0 4px 14px rgba(5,65,89,0.35)' }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,65,89,0.5)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(5,65,89,0.35)')}
      >
        <Upload size={14} strokeWidth={1.5} /> Create Project
      </button>
    </header>
  );
}
