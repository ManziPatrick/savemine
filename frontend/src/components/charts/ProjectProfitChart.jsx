import { Link } from 'react-router-dom';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount || 0);

/**
 * ProjectProfitChart — horizontal bars showing profit (or loss) per project.
 * Positive profit grows right in green, negative grows left in red.
 */
function ProjectProfitChart({ projects = [] }) {
  if (!projects.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 mb-4">
          No projects yet — create one and add expenses & income to see your profit here.
        </p>
        <Link to="/projects" className="btn btn-primary">
          Create a project
        </Link>
      </div>
    );
  }

  const sorted = [...projects].sort((a, b) => (b.profit || 0) - (a.profit || 0));
  const top = sorted.slice(0, 6);
  const maxAbs = Math.max(...top.map((p) => Math.abs(p.profit || 0)), 1);

  return (
    <div className="space-y-4">
      {top.map((project) => {
        const profit = project.profit || 0;
        const isPositive = profit >= 0;
        const pct = Math.max(2, Math.min(100, (Math.abs(profit) / maxAbs) * 100));
        return (
          <div key={project._id} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900 truncate mr-3" title={project.name}>
                📁 {project.name}
              </span>
              <span className={`text-sm font-bold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{formatCurrency(profit)}
              </span>
            </div>
            {/* Centered bar track */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300" />
              {isPositive ? (
                <div
                  className="absolute inset-y-0 left-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-r-full transition-all duration-500 group-hover:from-emerald-500 group-hover:to-emerald-600"
                  style={{ width: `${pct / 2}%` }}
                />
              ) : (
                <div
                  className="absolute inset-y-0 right-1/2 bg-gradient-to-l from-red-400 to-red-500 rounded-l-full transition-all duration-500 group-hover:from-red-500 group-hover:to-red-600"
                  style={{ width: `${pct / 2}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
      <div className="pt-2 text-center">
        <Link to="/projects" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all projects →
        </Link>
      </div>
    </div>
  );
}

export default ProjectProfitChart;
