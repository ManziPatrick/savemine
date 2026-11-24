const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePhones } = require('./dispatchPhones');

test('an unsaved Rwanda number is accepted and a short one is rejected', () => {
  const parsed = parsePhones('0790706170, 123, +250788000111');
  assert.deepEqual(parsed.people.map((person) => person.phone), ['+250790706170', '+250788000111']);
  assert.equal(parsed.people[0].contactId, null);
  assert.equal(parsed.people[0].name, '');
  assert.deepEqual(parsed.rejected, ['123']);
});

test('the same number written two ways is kept once', () => {
  const parsed = parsePhones(['0790706170', '+250790706170']);
  assert.equal(parsed.people.length, 1);
  assert.equal(parsed.rejected.length, 0);
});
