const { normalizePhone } = require('../utils/phone');

function parsePhones(input) {
  const pieces = Array.isArray(input) ? input : String(input || '').split(/[\n,;]+/);
  const people = [];
  const rejected = [];
  const seen = new Set();

  for (const piece of pieces) {
    const raw = String(piece || '').trim();
    if (!raw) continue;
    const phone = normalizePhone(raw);
    if (!phone) {
      rejected.push(raw);
      continue;
    }
    if (seen.has(phone)) continue;
    seen.add(phone);
    people.push({
      contactId: null,
      name: '',
      phone,
      status: 'pending',
      error: ''
    });
  }

  return { people, rejected };
}

module.exports = { parsePhones };
