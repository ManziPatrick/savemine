import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import { exactMoney, formatMoney } from '../utils/money';

const periods = [
  ['week', 'Weekly'],
  ['month', 'Monthly'],
  ['year', 'Yearly'],
];

function ReportDesk() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('week');
  const [phone, setPhone] = useState('0790706170');
  const [weekly, setWeekly] = useState(true);
  const [monthly, setMonthly] = useState(true);
  const [yearly, setYearly] = useState(true);
  const [ready, setReady] = useState(false);

  const { data, isLoading } = useQuery(['moneyReport', period], () => reportsAPI.getReport(period), {
    onSuccess: (response) => {
      if (ready) return;
      const settings = response?.data?.data?.settings;
      if (settings?.phone) {
        setPhone(settings.phone);
        setWeekly(Boolean(settings.weekly));
        setMonthly(Boolean(settings.monthly));
        setYearly(Boolean(settings.yearly));
      }
      setReady(true);
    },
  });

  const report = data?.data?.data;

  const save = useMutation(() => reportsAPI.saveSettings({ phone, weekly, monthly, yearly }), {
    onSuccess: () => {
      toast.success('Report number saved');
      queryClient.invalidateQueries(['moneyReport']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save the report'),
  });

  const send = useMutation(async () => {
    await reportsAPI.saveSettings({ phone, weekly, monthly, yearly });
    return reportsAPI.sendReport(period, phone);
  }, {
    onSuccess: () => toast.success('Report sent'),
    onError: (error) => toast.error(error.response?.data?.message || 'Could not send the report'),
  });

  return (
    <section className="rounded-2xl border border-line bg-paper-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-saffron">Monday report</p>
          <h2 className="font-display text-2xl text-ink">Profit, loss, and rising costs</h2>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-white p-1">
          {periods.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium sm:text-sm ${period === id ? 'bg-ink text-white' : 'text-ink/70'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !report ? (
        <p className="mt-4 text-sm text-ink/60">Adding up the books...</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-paper px-3 py-2">
              <p className="text-xs text-ink/50">{report.profit >= 0 ? 'Profit' : 'Loss'}</p>
              <p className="text-lg font-semibold tabular-nums text-ink" title={exactMoney(report.profit)}>{formatMoney(report.profit)}</p>
            </div>
            <div className="rounded-xl bg-paper px-3 py-2">
              <p className="text-xs text-ink/50">Income</p>
              <p className="text-lg font-semibold tabular-nums text-ink" title={exactMoney(report.income)}>{formatMoney(report.income)}</p>
            </div>
            <div className="rounded-xl bg-paper px-3 py-2">
              <p className="text-xs text-ink/50">Expenses</p>
              <p className="text-lg font-semibold tabular-nums text-ink" title={exactMoney(report.expense)}>{formatMoney(report.expense)}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-ink">Areas where expenses rose</p>
            {report.rising.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">No area spent more than the period before.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {report.rising.map((row) => (
                  <li key={row.category} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink">{row.label}</span>
                    <span className="tabular-nums text-ink" title={exactMoney(row.increase)}>+{formatMoney(row.increase)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-3 text-sm text-ink/60">{report.text}</p>
        </>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm text-ink/70">
          Send to
          <input className="input mt-1" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <div className="flex flex-wrap gap-3 text-sm text-ink">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={weekly} onChange={(event) => setWeekly(event.target.checked)} /> Every Monday</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={monthly} onChange={(event) => setMonthly(event.target.checked)} /> First Monday, month</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={yearly} onChange={(event) => setYearly(event.target.checked)} /> First Monday, year</label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => save.mutate()} disabled={save.isLoading}>Save number</button>
        <button type="button" className="btn btn-primary" onClick={() => send.mutate()} disabled={send.isLoading}>Send this report</button>
      </div>
    </section>
  );
}

export default ReportDesk;
