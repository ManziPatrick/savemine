import { describe, expect, it } from 'vitest';
import { isCaptureReady, validateCapture } from '../utils/captureRecord';

const file = new File(['proof'], 'slip.png', { type: 'image/png' });

describe('validateCapture', () => {
  it('asks for a photo, a name, and an amount before saving savings', () => {
    const errors = validateCapture({ kind: 'savings', savingsMode: 'existing' });
    expect(errors.file).toBeTruthy();
    expect(errors.title).toBeTruthy();
    expect(errors.amount).toBeTruthy();
    expect(errors.savingsId).toBeTruthy();
  });

  it('accepts a new savings jar with a screenshot', () => {
    expect(
      isCaptureReady({
        kind: 'savings',
        file,
        title: 'MoMo top-up',
        amount: '15000',
        savingsMode: 'new',
        jarName: 'Emergency',
        location: 'MTN MoMo',
      })
    ).toBe(true);
  });

  it('requires the other party on a contract and skips the amount', () => {
    const errors = validateCapture({
      kind: 'contract',
      file,
      title: 'Shop lease',
    });
    expect(errors.amount).toBeUndefined();
    expect(errors.party).toBeTruthy();
  });

  it('rejects a zero wallet amount', () => {
    const errors = validateCapture({
      kind: 'wallet',
      file,
      title: 'Lunch',
      amount: '0',
      direction: 'out',
    });
    expect(errors.amount).toBeTruthy();
  });
});
