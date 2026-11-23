import { useEffect, useRef, useState } from 'react';

function LinkPicker({ id, items = [], value, onChange, onCreate, emptyLabel = 'None', placeholder = 'Search or create' }) {
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === value);
  const [query, setQuery] = useState(selected?.name || '');
  const [saving, setSaving] = useState(false);
  const needle = query.trim().toLowerCase();
  const matches = items.filter((item) => item.name.toLowerCase().includes(needle));
  const exact = items.some((item) => item.name.toLowerCase() === needle);

  useEffect(() => {
    setQuery(selected?.name || '');
  }, [selected?.name]);

  useEffect(() => {
    const close = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (item) => {
    onChange(item ? item.id : '');
    setQuery(item ? item.name : '');
    setOpen(false);
  };

  const create = async () => {
    if (!onCreate || needle.length < 2 || exact) return;
    setSaving(true);
    try {
      const created = await onCreate(query.trim());
      if (created?.id) choose(created);
    } catch {
      // The caller reports the reason.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={box} className="relative">
      <input
        id={id}
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!event.target.value.trim()) onChange('');
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-paper-card py-1 shadow-lg">
          <li>
            <button type="button" className="w-full px-3 py-2 text-left text-sm text-ink/70 hover:bg-paper" onClick={() => choose(null)}>
              {emptyLabel}
            </button>
          </li>
          {matches.map((item) => (
            <li key={item.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-paper" onClick={() => choose(item)}>
                {item.name}
              </button>
            </li>
          ))}
          {needle.length >= 2 && !exact && onCreate && (
            <li>
              <button type="button" className="w-full px-3 py-2 text-left text-sm font-medium text-primary-700 hover:bg-paper" onClick={create} disabled={saving}>
                Create “{query.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default LinkPicker;
