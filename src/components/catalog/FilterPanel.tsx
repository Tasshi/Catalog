import { FileType, SortKey } from './CatalogView';

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
                // base
                'inline-flex items-center h-8 px-3 rounded text-xs font-medium',
                'border transition-all duration-150 select-none',
                // active  → filled purple (primary CTA style, scaled down)
                isActive
                  ? 'bg-[#533AFD] text-white border-[#533AFD] shadow-[0px_1px_2px_rgba(83,58,253,0.25)]'
                  // inactive → ghost outline
                  : 'bg-white text-[#64748D] border-[#D4DEE9] hover:border-[#533AFD] hover:text-[#533AFD] hover:bg-[#F3F0FF]',
              ].join(' ')}
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
              'focus:border-[#533AFD] focus:shadow-[0px_0px_0px_3px_rgba(83,58,253,0.1)]',
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
