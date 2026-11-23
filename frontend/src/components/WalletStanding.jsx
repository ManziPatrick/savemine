import { useState } from 'react';
import { Link } from 'react-router-dom';
import { repeatLabel } from '../utils/billMath';

const periods = [
  ['day', 'Daily'],
  ['week', 'Weekly'],
  ['month', 'Monthly'],
  ['year', 'Yearly'],
];

function money(amount) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

function formatDue(date) {
  if (!date || Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function WalletStanding({ wallet, savings, summary, onAddBill }) {
  const [period, setPeriod] = useState('month');
  const due = summary.dueSoon.slice(0, 4);

  const cards = [
    ['In the wallet', money(wallet), 'Cash ready for today'],
    ['Saved', money(savings), 'Every jar added together'],
    ['Bills', money(summary.totals[period]), `What your repeating bills cost, counted ${periods.find((item) => item[0] === period)[1].toLowerCase()}`],
    ['Still to come', String(summary.dueSoon.length), 'Bills due in the next 31 days'],
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-saffron">Standing</p>
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Your wallet at a glance</h2>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1">
          {periods.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium sm:text-sm ${
                period === id ? 'bg-ink text-white' : 'text-ink/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, detail]) => (
          <div key={label} className="rounded-2xl border border-line bg-paper-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
            <p className="mt-2 break-words font-display text-2xl text-ink sm:text-3xl">{value}</p>
            <p className="mt-2 text-xs leading-5 text-ink/60">{detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-paper-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-medium text-ink">Bills coming up</h3>
            <p className="mt-1 text-sm text-ink/60">
              A daily, weekly, monthly, or yearly bill is counted into the standing above.
            </p>
          </div>
          <button type="button" onClick={onAddBill} className="btn btn-primary self-start">
            Add a bill
          </button>
        </div>

        {due.length === 0 ? (
          <p className="mt-4 rounded-xl bg-paper px-4 py-6 text-sm text-ink/60">
            No bills due in the next month. Add rent, power, or school fees so the wallet can remind you.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {due.map((bill) => (
              <li key={bill._id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{bill.title}</p>
                  <p className="text-sm text-ink/60">
                    {formatDue(bill.due)} · {repeatLabel(bill.recurrence)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">{money(bill.amount)}</p>
              </li>
            ))}
          </ul>
        )}
        <Link to="/reminders" className="mt-3 inline-block text-sm font-medium text-primary-700">
          All reminders
        </Link>
      </div>
    </section>
  );
}

export default WalletStanding;
