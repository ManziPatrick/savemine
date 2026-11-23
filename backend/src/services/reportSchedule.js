const cron = require('node-cron');
const User = require('../models/User');
const smsService = require('./smsService');
const { loadBooks } = require('../controllers/reportController');
const { buildMoneyReport, duePeriods, formatReportText } = require('./moneyReport');
const { normalizePhone, phoneTail } = require('../utils/phone');

const REPORT_PHONE = '0790706170';

async function attachReportNumber() {
  const phone = normalizePhone(REPORT_PHONE);
  const tail = phoneTail(phone);
  if (!tail) return;
  const users = await User.find({ isActive: true, phone: new RegExp(`${tail}$`) });
  for (const user of users) {
    user.preferences = user.preferences || {};
    const reports = user.preferences.reports || {};
    user.preferences.reports = {
      phone,
      weekly: reports.weekly !== false,
      monthly: reports.monthly !== false,
      yearly: reports.yearly !== false,
    };
    user.markModified('preferences');
    await user.save();
  }
  if (users.length) {
    console.log(`Monday money report is on for ${users.length} account`);
  }
}

async function sendDueReports(now = new Date()) {
  const periods = duePeriods(now);
  if (!periods.length) return { sent: 0 };
  const users = await User.find({ isActive: true, 'preferences.reports.weekly': true });
  let sent = 0;
  for (const user of users) {
    const reports = user.preferences.reports || {};
    const phone = reports.phone || user.phone;
    const wanted = periods.filter((period) => {
      if (period === 'week') return reports.weekly !== false;
      if (period === 'month') return Boolean(reports.monthly);
      return Boolean(reports.yearly);
    });
    for (const period of wanted) {
      try {
        const books = await loadBooks(user._id);
        const text = formatReportText(buildMoneyReport(books, period, now));
        await smsService.sendSMS(phone, text);
        sent += 1;
      } catch (error) {
        console.error(`Money report failed for ${user.email}:`, error.message);
      }
    }
  }
  return { sent };
}

function startReportSchedule() {
  attachReportNumber().catch((error) => {
    console.error('Could not save the report number:', error.message);
  });
  cron.schedule('0 8 * * 1', () => {
    sendDueReports().catch((error) => console.error('Monday report failed:', error.message));
  }, { timezone: 'Africa/Kigali' });
  console.log('Monday money report scheduled for 08:00 Kigali');
}

module.exports = { startReportSchedule, sendDueReports, attachReportNumber };
