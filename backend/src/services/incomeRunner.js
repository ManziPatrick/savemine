const cron = require('node-cron');
const { postDueIncomes } = require('./incomeSchedule');

function startIncomeSchedule() {
  const run = () => {
    postDueIncomes().catch((error) => {
      console.error('Repeating income failed:', error.message);
    });
  };
  cron.schedule('5 6 * * *', run, { timezone: 'Africa/Kigali' });
  run();
  console.log('Repeating income checks each morning');
}

module.exports = { startIncomeSchedule };
