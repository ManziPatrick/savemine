export const REPEAT_OPTIONS = [
  { id: 'daily', label: 'Daily', perYear: 365 },
  { id: 'weekly', label: 'Weekly', perYear: 52 },
  { id: 'monthly', label: 'Monthly', perYear: 12 },
  { id: 'yearly', label: 'Yearly', perYear: 1 },
];

const PER_YEAR = Object.fromEntries(REPEAT_OPTIONS.map((option) => [option.id, option.perYear]));

export function isBill(reminder) {
  return reminder?.reminderType === 'bill' || Number(reminder?.amount) > 0;
}

export function yearlyCost(amount, recurrence) {
  const times = PER_YEAR[recurrence];
  const value = Number(amount) || 0;
  if (!times) return value;
  return value * times;
}

export function costForPeriod(amount, recurrence, period) {
  const year = yearlyCost(amount, recurrence);
  if (period === 'year') return year;
  if (period === 'month') return year / 12;
  if (period === 'week') return year / 52;
  if (period === 'day') return year / 365;
  return 0;
}

export function summarizeBills(reminders, now = new Date()) {
  const bills = (reminders || []).filter(
    (item) => item && item.isActive !== false && item.status !== 'cancelled' && isBill(item)
  );

  const totals = { day: 0, week: 0, month: 0, year: 0 };
  const upcoming = bills.map((bill) => {
    totals.day += costForPeriod(bill.amount, bill.recurrence, 'day');
    totals.week += costForPeriod(bill.amount, bill.recurrence, 'week');
    totals.month += costForPeriod(bill.amount, bill.recurrence, 'month');
    totals.year += costForPeriod(bill.amount, bill.recurrence, 'year');
    return { ...bill, due: new Date(bill.scheduledDate || bill.sendAt) };
  });

  upcoming.sort((a, b) => a.due - b.due);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 31);
  const dueSoon = upcoming.filter((bill) => !Number.isNaN(bill.due.getTime()) && bill.due <= horizon);

  return { bills, totals, upcoming, dueSoon };
}

export function repeatLabel(recurrence) {
  return REPEAT_OPTIONS.find((option) => option.id === recurrence)?.label || 'Once';
}
