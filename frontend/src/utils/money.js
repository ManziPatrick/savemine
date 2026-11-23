const CODE = {
  FRW: 'RF',
  RWF: 'RF',
};

export function formatMoney(amount, currency = 'FRW') {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  const code = CODE[currency] || currency;
  if (abs >= 1000000000) {
    return `${sign}${code} ${trimZero((abs / 1000000000).toFixed(1))}B`;
  }
  if (abs >= 1000000) {
    return `${sign}${code} ${trimZero((abs / 1000000).toFixed(1))}M`;
  }
  return `${sign}${code} ${Math.round(abs).toLocaleString('en-US')}`;
}

export function exactMoney(amount, currency = 'FRW') {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  const sign = safe < 0 ? '-' : '';
  const code = CODE[currency] || currency;
  return `${sign}${code} ${Math.abs(safe).toLocaleString('en-US')}`;
}

function trimZero(text) {
  return text.replace(/\.0$/, '');
}
