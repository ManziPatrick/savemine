import { Link } from 'react-router-dom';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount || 0);

const CATEGORY_META = {
  food: { icon: '🍽️', name: 'Food & Dining' },
  transport: { icon: '🚗', name: 'Transportation' },
  housing: { icon: '🏠', name: 'Housing & Rent' },
  utilities: { icon: '⚡', name: 'Utilities' },
  healthcare: { icon: '🏥', name: 'Healthcare' },
  education: { icon: '📚', name: 'Education' },
  entertainment: { icon: '🎬', name: 'Entertainment' },
  clothing: { icon: '👕', name: 'Clothing' },
  personal_care: { icon: '💄', name: 'Personal Care' },
  business: { icon: '💼', name: 'Business' },
  animal_care: { icon: '🐄', name: 'Animal Care' },
  agriculture: { icon: '🌾', name: 'Agriculture' },
  investment: { icon: '📈', name: 'Investment' },
  emergency: { icon: '🚨', name: 'Emergency' },
  gift: { icon: '🎁', name: 'Gifts' },
  donation: { icon: '❤️', name: 'Donations' },
  other: { icon: '📝', name: 'Other' }
};

const BAR_COLORS = [
  'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-pink-500'
];

/**
 * CategoryBreakdownChart — horizontal bars of spending by category.
 * byCategory shape: [{ _id: category, count, totalAmount, averageAmount }]
 */
function CategoryBreakdownChart({ byCategory = [] }) {
  const sorted = [...byCategory]
    .filter((c) => c.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 6);

  if (!sorted.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 mb-4">
          No expenses yet — add expenses to see where your money goes.
        </p>
        <Link to="/expenses" className="btn btn-primary">
          Add an expense
        </Link>
      </div>
    );
  }

  const maxAmount = Math.max(...sorted.map((c) => c.totalAmount), 1);

  return (
    <div className="space-y-4">
      {sorted.map((category, index) => {
        const meta = CATEGORY_META[category._id] || { icon: '📝', name: category._id };
        const pct = Math.max(4, Math.round((category.totalAmount / maxAmount) * 100));
        const color = BAR_COLORS[index % BAR_COLORS.length];
        return (
          <div key={category._id} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900 truncate mr-3">
                {meta.icon} {meta.name}
                <span className="ml-2 text-xs text-gray-400">{category.count} exp.</span>
              </span>
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                {formatCurrency(category.totalAmount)}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-500 group-hover:opacity-80`}
                style={{ width: `${pct}%` }}
                title={`${meta.name}: ${formatCurrency(category.totalAmount)}`}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-2 text-center">
        <Link to="/expenses" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all expenses →
        </Link>
      </div>
    </div>
  );
}

export default CategoryBreakdownChart;
