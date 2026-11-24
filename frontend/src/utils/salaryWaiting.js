export function isSalaryRecord(row) {
  return /salary/i.test(`${row?.category || ''} ${row?.description || ''}`);
}

export function salaryWaiting(row, now = new Date()) {
  if (!isSalaryRecord(row)) return false;
  if (!row.lastReceivedAt) return true;
  if (row.nextIncomeAt && new Date(row.nextIncomeAt) <= now) return true;
  return false;
}
