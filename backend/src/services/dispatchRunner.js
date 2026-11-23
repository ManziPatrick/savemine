const cron = require('node-cron');
const { sendDueDispatches } = require('./dispatchService');

function startDispatchSchedule() {
  cron.schedule('* * * * *', () => {
    sendDueDispatches().catch((error) => {
      console.error('Scheduled messages failed:', error.message);
    });
  }, { timezone: 'Africa/Kigali' });
  console.log('Message schedule checks every minute');
}

module.exports = { startDispatchSchedule };
