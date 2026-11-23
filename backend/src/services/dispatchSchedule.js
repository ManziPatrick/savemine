function advanceSendDate(from, schedule) {
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return null;
  if (schedule === 'weekly') date.setDate(date.getDate() + 7);
  else if (schedule === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (schedule === 'yearly') date.setFullYear(date.getFullYear() + 1);
  else return null;
  return date;
}

function repeats(schedule) {
  return schedule === 'weekly' || schedule === 'monthly' || schedule === 'yearly';
}

module.exports = { advanceSendDate, repeats };
