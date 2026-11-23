import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../services/api';

function CategoryPicker({ id, value, onChange, placeholder = 'Search school fees, home...' }) {
  const queryClient = useQueryClient();
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const { data } = useQuery('categories', () => categoriesAPI.list());
  const names = data?.data?.data || [];
  const needle = query.trim().toLowerCase();
  const matches = names.filter((name) => name.toLowerCase().includes(needle));
  const exact = names.some((name) => name.toLowerCase() === needle);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const close = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const create = useMutation((name) => categoriesAPI.create(name), {
    onSuccess: (response) => {
      const name = response?.data?.data;
      queryClient.invalidateQueries('categories');
      onChange(name);
      setQuery(name);
      setOpen(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not add that category'),
  });

  const choose = (name) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
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
          {matches.map((name) => (
            <li key={name}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-paper" onClick={() => choose(name)}>
                {name}
              </button>
            </li>
          ))}
          {needle.length >= 2 && !exact && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm font-medium text-primary-700 hover:bg-paper"
                onClick={() => create.mutate(query.trim())}
                disabled={create.isLoading}
              >
                Create “{query.trim()}”
              </button>
            </li>
          )}
          {matches.length === 0 && needle.length < 2 && (
            <li className="px-3 py-2 text-sm text-ink/50">Type to search</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default CategoryPicker;
