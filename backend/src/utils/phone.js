/**
 * Turn a phone number written any common way into +250... or +country...
 * 0788 123 456, 788123456 and +250788123456 are the same number.
 */
function normalizePhone(phone) {
  if (phone === undefined || phone === null) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0') && digits.length === 10) {
    digits = `250${digits.slice(1)}`;
  } else if (digits.length === 9 && /^[789]/.test(digits)) {
    digits = `250${digits}`;
  }

  if (digits.length < 8 || digits.length > 15) return '';
  return `+${digits}`;
}

function phoneTail(phone) {
  const normalized = normalizePhone(phone);
  return normalized ? normalized.replace(/\D/g, '').slice(-9) : '';
}

module.exports = { normalizePhone, phoneTail };
