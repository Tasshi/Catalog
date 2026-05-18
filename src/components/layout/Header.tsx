import { SearchBar, Button } from '../ui';
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
    <header className="flex items-center gap-4 flex-shrink-0 px-8 h-16 bg-white border-b border-slate-200">
      <h1 className="flex-1 text-sm font-normal text-slate-900 truncate">
        {title}
      </h1>

      {onSearch && <SearchBar value={search} onChange={onSearch} />}

      {actions}

      <Button variant="primary" onClick={() => navigate('/upload')}>
        <Upload size={14} strokeWidth={1.5} /> Create Project
      </Button>
    </header>
  );
}
