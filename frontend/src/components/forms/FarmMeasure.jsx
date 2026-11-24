function Field({ label, children }) {
  return (
    <label className="block text-sm text-gray-700">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

function FarmMeasure({ value, onChange }) {
  const set = (name) => (event) => onChange(name, event.target.value);

  return (
    <div className="space-y-3 rounded-lg border border-line bg-paper p-3">
      <div>
        <p className="text-sm font-medium text-gray-900">Farming measure</p>
        <p className="text-xs text-ink/60">Kilograms, farm size, days, and a level. Change the level name whenever you want.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Kilograms">
          <input type="number" min="0" step="0.01" className="input" placeholder="kg" value={value.kilograms || ''} onChange={set('kilograms')} />
        </Field>
        <Field label="Days">
          <input type="number" min="0" step="1" className="input" placeholder="days" value={value.farmDays || ''} onChange={set('farmDays')} />
        </Field>
        <Field label="Farm size">
          <input type="number" min="0" step="0.01" className="input" placeholder="size" value={value.farmSize || ''} onChange={set('farmSize')} />
        </Field>
        <Field label="Size unit">
          <input className="input" placeholder="hectares, acres" value={value.farmSizeUnit || ''} onChange={set('farmSizeUnit')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Level">
            <input className="input" placeholder="Level 1" value={value.farmLevel || ''} onChange={set('farmLevel')} />
          </Field>
        </div>
      </div>
    </div>
  );
}

export default FarmMeasure;
