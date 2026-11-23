import { describe, expect, it } from 'vitest';
import { costForPeriod, summarizeBills, yearlyCost } from '../utils/billMath';

describe('bill math', () => {
  it('turns a monthly bill into a year of payments', () => {
    expect(yearlyCost(10000, 'monthly')).toBe(120000);
    expect(Math.round(costForPeriod(7000, 'weekly', 'month'))).toBe(Math.round((7000 * 52) / 12));
  });

  it('adds every repeating bill into the standing totals', () => {
    const summary = summarizeBills([
      { title: 'Rent', amount: 50000, recurrence: 'monthly', reminderType: 'bill', scheduledDate: '2026-12-01', status: 'scheduled' },
      { title: 'Airtime', amount: 1000, recurrence: 'daily', reminderType: 'bill', scheduledDate: '2026-11-24', status: 'scheduled' },
      { title: 'Note', amount: 0, reminderType: 'general', scheduledDate: '2026-11-24', status: 'scheduled' },
    ]);

    expect(summary.bills).toHaveLength(2);
    expect(summary.totals.year).toBe(50000 * 12 + 1000 * 365);
    expect(summary.dueSoon.map((bill) => bill.title)).toEqual(['Airtime', 'Rent']);
  });
});
