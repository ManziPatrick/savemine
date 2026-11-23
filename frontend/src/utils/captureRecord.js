export const SAVINGS_LOCATIONS = ['MTN MoMo', 'Bank', 'SACCO', 'Cash'];

export function validateCapture(input) {
  const errors = {};
  const kind = input.kind || 'savings';

  if (!input.file) {
    errors.file = 'Add a screenshot or photo first';
  }
  if (!String(input.title || '').trim()) {
    errors.title = 'Give this record a short name';
  }

  if (kind !== 'contract') {
    const amount = Number(input.amount);
    if (!input.amount || Number.isNaN(amount) || amount <= 0) {
      errors.amount = 'Enter an amount greater than 0';
    }
  }

  if (kind === 'savings') {
    if (input.savingsMode === 'new') {
      if (!String(input.jarName || '').trim()) {
        errors.jarName = 'Name this savings jar';
      }
      if (!SAVINGS_LOCATIONS.includes(input.location)) {
        errors.location = 'Choose where the money sits';
      }
    } else if (!input.savingsId) {
      errors.savingsId = 'Choose a savings jar';
    }
  }

  if (kind === 'wallet' && !['in', 'out'].includes(input.direction)) {
    errors.direction = 'Choose money in or money out';
  }

  if (kind === 'contract' && !String(input.party || '').trim()) {
    errors.party = 'Who is the other party?';
  }

  return errors;
}

export function isCaptureReady(input) {
  return Object.keys(validateCapture(input)).length === 0;
}
