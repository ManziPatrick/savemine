export const formatCurrency = (amount, currency = 'FRW') => {
  if (!amount && amount !== 0) return '0';
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: currency === 'FRW' ? 'RWF' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

