import { describe, expect, it } from 'vitest';
import { formatRwandaPhone } from '../utils/phoneUtils';

describe('formatRwandaPhone', () => {
  it('treats local, short, and international writing as one number', () => {
    expect(formatRwandaPhone('0788 123 456')).toBe('+250788123456');
    expect(formatRwandaPhone('788123456')).toBe('+250788123456');
    expect(formatRwandaPhone('+250 788-123-456')).toBe('+250788123456');
  });
});