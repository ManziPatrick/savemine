import {
  loansAPI,
  contactsAPI,
  transactionsAPI,
  savingsAPI,
  expensesAPI,
  projectsAPI,
  businessesAPI,
  investmentsAPI,
  giftsAPI,
  assetsAPI,
  remindersAPI,
  pettyCashAPI,
} from '../services/api';
import { buildAllSections } from './exportSections';

/**
 * Fetch every module's data for the current user (large limits) and build
 * export-ready sections. Individual failures are non-fatal — we export
 * whatever succeeded so one broken endpoint can't block the whole report.
 */
export async function fetchAllExportData() {
  const all = await Promise.allSettled([
    loansAPI.getLoans({ limit: 100000 }),
    contactsAPI.getContacts({ limit: 100000 }),
    transactionsAPI.getTransactions({ limit: 100000 }),
    savingsAPI.getSavings({ limit: 100000 }),
    expensesAPI.getExpenses({ limit: 100000 }),
    projectsAPI.getProjects({ limit: 100000 }),
    businessesAPI.getBusinesses({ limit: 100000 }),
    investmentsAPI.getInvestments({ limit: 100000 }),
    giftsAPI.getGifts({ limit: 100000 }),
    assetsAPI.getAssets({ limit: 100000 }),
    remindersAPI.getReminders({ limit: 100000 }),
    pettyCashAPI.getTransactions({ limit: 100000 }),
  ]);

  const pick = (res) => {
    if (res.status !== 'fulfilled') return [];
    const body = res.value?.data;
    // Controllers wrap lists as { data: [...], pagination: {...} }; fall back to a raw array.
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  };

  return {
    loans: pick(all[0]),
    contacts: pick(all[1]),
    transactions: pick(all[2]),
    savings: pick(all[3]),
    expenses: pick(all[4]),
    projects: pick(all[5]),
    businesses: pick(all[6]),
    investments: pick(all[7]),
    gifts: pick(all[8]),
    assets: pick(all[9]),
    reminders: pick(all[10]),
    pettyCash: pick(all[11]),
  };
}

/** Convenience: fetch all data and build the full sections list. */
export async function buildAllExportSections() {
  const data = await fetchAllExportData();
  return buildAllSections(data);
}

export default buildAllExportSections;
