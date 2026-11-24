export function chargeLabel(record) {
  const source = record?.source;
  if (!source?.type || source.type === 'cash' || source.type === 'petty_cash') {
    return source?.sourceName || 'Wallet';
  }
  if (source.type === 'salary') {
    return source.sourceName && source.sourceName !== 'Salary'
      ? `Salary · ${source.sourceName}`
      : 'Salary';
  }
  return source.sourceName || 'Savings';
}
