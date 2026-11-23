const test = require('node:test');
const assert = require('node:assert/strict');
const { advanceSendDate, repeats } = require('./dispatchSchedule');

test('weekly, monthly, and yearly dates move forward', () => {
  const start = new Date('2026-01-15T08:00:00.000Z');
  assert.equal(advanceSendDate(start, 'weekly').toISOString().slice(0, 10), '2026-01-22');
  assert.equal(advanceSendDate(start, 'monthly').getMonth(), 1);
  assert.equal(advanceSendDate(start, 'yearly').getFullYear(), 2027);
  assert.equal(advanceSendDate(start, 'date'), null);
});

test('only repeating schedules stay on the calendar', () => {
  assert.equal(repeats('weekly'), true);
  assert.equal(repeats('monthly'), true);
  assert.equal(repeats('yearly'), true);
  assert.equal(repeats('now'), false);
  assert.equal(repeats('date'), false);
});
