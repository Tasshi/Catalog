import { SearchBar, Button } from './ui';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

interface HeaderProps {
  title:    string;
  search?:  string;
  onSearch?: (value: string) => void;
  actions?: React.ReactNode;
}

export default function Header({ title, search, onSearch, actions }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className="flex items-center gap-4 flex-shrink-0 px-8 h-16"
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

      <Button variant="primary" onClick={() => navigate('/upload')}>
        <Upload size={14} strokeWidth={1.5} /> Create Project
      </Button>
    </header>
  );
}
