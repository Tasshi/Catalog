import type { FileType, SortKey } from './CatalogView';

// ─── Constants ────────────────────────────────────────────────────────────────

const FILE_TYPES: FileType[] = ['All', 'PDF', 'DOCX', 'XLSX', 'PPTX', 'ZIP', 'IMG'];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name',   label: 'Name A–Z'    },
  { value: 'size',   label: 'Largest'     },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterPanelProps {
  activeType: FileType;
  onTypeChange: (type: FileType) => void;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FilterPanel({
  activeType,
  onTypeChange,
  sortBy,
  onSortChange,
}: FilterPanelProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">

      {/* ── Type chips ── */}
      <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by file type">
        {FILE_TYPES.map(t => {
          const isActive = activeType === t;
          return (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              aria-pressed={isActive}
              className={[
                'inline-flex items-center h-8 px-4 rounded-full text-xs font-semibold',
                'border transition-all duration-150 select-none cursor-pointer',
                isActive
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white text-[#64748D] border-[#D4DEE9] hover:border-[#FF9A00] hover:text-[#FF6B00]',
              ].join(' ')}
              style={isActive ? { background: 'linear-gradient(to right, #FF9A00, #FF6B00, #E85500)', boxShadow: '0 4px 12px rgba(255,100,0,0.35)' } : {}}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* ── Sort select ── */}
      <div className="ml-auto flex items-center gap-2">
        <label
          htmlFor="catalog-sort"
          className="text-xs text-[#64748D] select-none whitespace-nowrap"
        >
          Sort by
        </label>
        <div className="relative">
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortKey)}
            className={[
              'appearance-none h-8 pl-3 pr-7 rounded text-xs',
              'bg-white text-[#061B31] border border-[#D4DEE9]',
              'shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
              'outline-none cursor-pointer',
              'hover:border-[#B8CCDB]',
              'focus:border-[#FF6B00] focus:shadow-[0px_0px_0px_3px_rgba(255,107,0,0.12)]',
              'transition-all duration-150',
            ].join(' ')}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Custom chevron — sits over the select, pointer-events off so clicks pass through */}
          <span
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#64748D]"
            aria-hidden="true"
          >
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

    </div>
  );
}
