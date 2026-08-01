const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount || 0);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Build a series of the last 12 months with income/expense totals.
 * monthlyStats from the API: [{ _id: { year, month, type }, totalAmount, count }]
 */
function buildMonthlySeries(monthlyStats = []) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      income: 0,
      expenses: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  monthlyStats.forEach((s) => {
    const m = byKey.get(`${s._id.year}-${s._id.month - 1}`);
    if (!m) return;
    if (s._id.type === 'income') m.income += s.totalAmount || 0;
    else m.expenses += s.totalAmount || 0;
  });
  return months;
}

/**
 * MonthlyTrendChart — grouped bars of income (green) vs expenses (red) for the last 12 months.
 */
function MonthlyTrendChart({ monthlyStats = [] }) {
  const series = buildMonthlySeries(monthlyStats);
  const maxValue = Math.max(...series.map((m) => Math.max(m.income, m.expenses)), 1);
  const hasData = series.some((m) => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          No transactions yet — add income and expenses to see your monthly trend.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mb-4">
        <span className="flex items-center text-xs text-gray-600">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 mr-1.5" /> Income
        </span>
        <span className="flex items-center text-xs text-gray-600">
          <span className="w-3 h-3 rounded-sm bg-red-500 mr-1.5" /> Expenses
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 h-44">
        {series.map((month) => {
          const incomePct = Math.round((month.income / maxValue) * 100);
          const expensesPct = Math.round((month.expenses / maxValue) * 100);
          return (
            <div key={month.key} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex-1 flex items-end justify-center gap-1">
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                  {month.label}:<br />
                  +{formatCurrency(month.income)} · −{formatCurrency(month.expenses)}
                </div>
                <div
                  className="w-3 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  style={{ height: `${Math.max(incomePct, incomePct > 0 ? 4 : 0)}%` }}
                  title={`${month.label} income: ${formatCurrency(month.income)}`}
                />
                <div
                  className="w-3 rounded-t bg-red-500 hover:bg-red-600 transition-colors"
                  style={{ height: `${Math.max(expensesPct, expensesPct > 0 ? 4 : 0)}%` }}
                  title={`${month.label} expenses: ${formatCurrency(month.expenses)}`}
                />
              </div>
              <span className="text-[10px] text-gray-500">{month.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthlyTrendChart;
