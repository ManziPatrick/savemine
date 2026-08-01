import { Link } from 'react-router-dom';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount || 0);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Build a series of the last 12 months with deposits, withdrawals and a cumulative balance.
 * monthlyTrend shape: [{ _id: { year, month }, deposits, withdrawals, count }] (sorted desc)
 */
function buildSavingsSeries(monthlyTrend = []) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      deposits: 0,
      withdrawals: 0
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  monthlyTrend.forEach((s) => {
    const m = byKey.get(`${s._id.year}-${s._id.month - 1}`);
    if (!m) return;
    m.deposits += s.deposits || 0;
    m.withdrawals += s.withdrawals || 0;
  });

  // Cumulative balance across the window
  let balance = 0;
  months.forEach((m) => {
    balance += m.deposits - m.withdrawals;
    m.balance = balance;
  });
  return months;
}

/**
 * SavingsTrendChart — deposits (green) vs withdrawals (red) bars for the last 12 months,
 * plus a cumulative balance line (blue) overlayed on the bars area.
 */
function SavingsTrendChart({ monthlyTrend = [] }) {
  const series = buildSavingsSeries(monthlyTrend);
  const maxValue = Math.max(...series.map((m) => Math.max(m.deposits, m.withdrawals, m.balance)), 1);
  const hasData = series.some((m) => m.deposits > 0 || m.withdrawals > 0);

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 mb-4">
          No savings activity yet — add money to your savings to see your trend here.
        </p>
        <Link to="/savings" className="btn btn-primary">
          Go to Savings
        </Link>
      </div>
    );
  }

  // Balance line points (SVG overlay across the bars area only)
  const points = series.map((m, i) => {
    const x = series.length === 1 ? 50 : (i / (series.length - 1)) * 100;
    const y = m.balance <= 0 ? 100 : Math.max(2, 100 - (m.balance / maxValue) * 100);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mb-4">
        <span className="flex items-center text-xs text-gray-600">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 mr-1.5" /> Deposits
        </span>
        <span className="flex items-center text-xs text-gray-600">
          <span className="w-3 h-3 rounded-sm bg-red-500 mr-1.5" /> Withdrawals
        </span>
        <span className="flex items-center text-xs text-gray-600">
          <span className="w-3 h-0.5 bg-blue-500 mr-1.5 inline-block" /> Balance
        </span>
      </div>

      {/* Bars + balance line (labels in a separate row so the line aligns with the bars) */}
      <div className="h-44 flex flex-col">
        <div className="relative flex-1">
          <div className="flex items-end gap-2 h-full">
            {series.map((month) => {
              const depositPct = Math.round((month.deposits / maxValue) * 100);
              const withdrawPct = Math.round((month.withdrawals / maxValue) * 100);
              return (
                <div key={month.key} className="relative flex-1 flex items-end justify-center gap-1 h-full group">
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                    {month.label}:<br />
                    +{formatCurrency(month.deposits)} · −{formatCurrency(month.withdrawals)}
                    <br />
                    Balance: {formatCurrency(month.balance)}
                  </div>
                  <div
                    className="w-3 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors"
                    style={{ height: `${Math.max(depositPct, depositPct > 0 ? 4 : 0)}%` }}
                    title={`${month.label} deposits: ${formatCurrency(month.deposits)}`}
                  />
                  <div
                    className="w-3 rounded-t bg-red-500 hover:bg-red-600 transition-colors"
                    style={{ height: `${Math.max(withdrawPct, withdrawPct > 0 ? 4 : 0)}%` }}
                    title={`${month.label} withdrawals: ${formatCurrency(month.withdrawals)}`}
                  />
                </div>
              );
            })}
          </div>
          {/* Balance line overlay (covers only the bars area) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={points}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {series.map((m, i) => {
              const x = series.length === 1 ? 50 : (i / (series.length - 1)) * 100;
              const y = m.balance <= 0 ? 100 : Math.max(2, 100 - (m.balance / maxValue) * 100);
              return (
                <circle
                  key={m.key}
                  cx={x}
                  cy={y}
                  r="0.9"
                  fill="#3b82f6"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        </div>
        {/* Month labels row */}
        <div className="flex gap-2 mt-1">
          {series.map((month) => (
            <span key={month.key} className="flex-1 text-center text-[10px] text-gray-500 truncate">
              {month.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SavingsTrendChart;
