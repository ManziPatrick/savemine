const cron = require('node-cron');
const { postDueExpenses } = require('./expenseSchedule');

function startExpenseSchedule() {
  const run = () => {
    postDueExpenses().catch((error) => {
      console.error('Monthly expenses failed:', error.message);
    });
  };
  cron.schedule('10 6 * * *', run, { timezone: 'Africa/Kigali' });
  run();
  console.log('Monthly expenses check each morning');
}

module.exports = { startExpenseSchedule };
