import { describe, expect, it } from 'vitest';
import { exactMoney, formatMoney } from '../utils/money';

describe('formatMoney', () => {
  it('keeps everyday amounts short', () => {
    expect(formatMoney(12000)).toBe('RF 12,000');
    expect(formatMoney(0)).toBe('RF 0');
  });

  it('shortens amounts that would crowd a card', () => {
    expect(formatMoney(12500000)).toBe('RF 12.5M');
    expect(formatMoney(2000000000)).toBe('RF 2B');
    expect(exactMoney(12500000)).toBe('RF 12,500,000');
  });
});
