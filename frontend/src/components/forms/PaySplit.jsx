function PaySplit({ total, jars, splits, onChange }) {
  const sum = splits.reduce((totalSoFar, row) => totalSoFar + (Number(row.amount) || 0), 0);
  const remaining = Math.round((Number(total) || 0) - sum);

  const update = (index, patch) => {
    onChange(splits.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">Split this pay</p>
      {splits.map((row, index) => (
        <div key={row.key || index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <select
            className="input"
            value={row.place}
            onChange={(event) => update(index, { place: event.target.value })}
          >
            <option value="wallet">Wallet</option>
            {jars.map((jar) => (
              <option key={jar._id} value={jar._id}>{jar.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            className="input"
            value={row.amount}
            onChange={(event) => update(index, { amount: event.target.value })}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChange(splits.filter((_, i) => i !== index))}
            disabled={splits.length === 1}
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onChange([...splits, { key: Date.now(), place: 'wallet', amount: '' }])}
        >
          Add a place
        </button>
        <p className={`text-sm ${remaining === 0 ? 'text-green-700' : 'text-ink/70'}`}>
          {remaining === 0 ? 'The split matches the pay.' : `${remaining.toLocaleString()} FRW still to place.`}
        </p>
      </div>
    </div>
  );
}

export function splitsPayload(splits) {
  return splits.map((row) => (
    row.place === 'wallet'
      ? { place: 'wallet', amount: Number(row.amount) }
      : { place: 'savings', savingsId: row.place, amount: Number(row.amount) }
  ));
}

export default PaySplit;
