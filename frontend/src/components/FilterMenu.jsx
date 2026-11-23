import { useEffect, useRef, useState } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

const NEUTRAL = new Set(['', 'all']);

function FilterMenu({ groups = [], children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = groups.filter((group) => !NEUTRAL.has(group.value ?? '')).length;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Filter"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium ${
          open || active
            ? 'border-primary-500 bg-primary-50 text-primary-800'
            : 'border-line bg-paper-card text-ink'
        }`}
      >
        <FunnelIcon className="h-5 w-5" />
        Filter
        {active > 0 && (
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ink px-1.5 text-xs text-white">
            {active}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-paper-card p-4 shadow-lg">
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{group.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const selected = option.value === group.value;
                    return (
                      <button
                        key={`${group.label}-${String(option.value)}`}
                        type="button"
                        onClick={() => group.onChange(option.value)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                          selected ? 'bg-ink text-white' : 'bg-paper text-ink/80 hover:bg-line'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterMenu;
