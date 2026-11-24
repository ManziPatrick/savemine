import { useQuery } from 'react-query';
import { projectsAPI } from '../services/api';
import { formatMoney } from '../utils/money';

const PAY = {
  before: 'Paid before the work',
  halfway: 'Paid at halfway',
  after: 'Paid after the work',
  other: 'Paid on another arrangement'
};

function MoneyConnections() {
  const { data, isLoading } = useQuery('moneyMap', projectsAPI.getMoneyMap);
  const map = data?.data?.data;
  if (isLoading || !map) return null;

  const unplaced = Number(map.unplaced) || 0;

  return (
    <section className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">How the money connects</h3>
        <p className="mt-1 text-sm text-gray-500">
          Salary feeds the house, school, food, internet, transport, and the projects. What is still yours stays in the wallet and savings.
        </p>
      </div>
      <div className="card-body space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-paper p-3">
            <div className="text-xs text-ink/60">Came in</div>
            <div className="text-lg font-semibold tabular-nums">{formatMoney(map.cameIn)}</div>
            <div className="text-xs text-ink/60">Salary {formatMoney(map.salary)}</div>
          </div>
          <div className="rounded-lg border border-line bg-paper p-3">
            <div className="text-xs text-ink/60">In use</div>
            <div className="text-lg font-semibold tabular-nums">{formatMoney(map.inUse)}</div>
            <div className="text-xs text-ink/60">Spent or invested</div>
          </div>
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="text-xs text-primary-800">Remaining</div>
            <div className="text-lg font-semibold tabular-nums text-primary-900">{formatMoney(map.remaining)}</div>
            <div className="text-xs text-primary-800">Wallet {formatMoney(map.wallet)} · Savings {formatMoney(map.savings)}</div>
          </div>
        </div>

        {map.behind > 0 && (
          <p className="text-sm text-ink">
            {formatMoney(map.behind)} is still behind on projects. It is agreed, and it updates when you confirm the amount or the percent received.
          </p>
        )}
        {unplaced > 0 && (
          <p className="text-sm text-ink">
            {formatMoney(unplaced)} of what came in is not in use and not in the wallet or savings yet.
          </p>
        )}
        {map.inUse > 0 && map.remaining >= 0 && (
          <p className="text-sm text-ink/70">
            The rest of the money is in use. You are remaining with {formatMoney(map.remaining)}.
          </p>
        )}

        <ul className="space-y-2">
          {(map.uses || []).map((line) => (
            <li key={line.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">
                {line.label}
                {line.note ? <span className="text-ink/50"> · {line.note}</span> : null}
              </span>
              <span className="tabular-nums">{formatMoney(line.amount)}</span>
            </li>
          ))}
        </ul>

        {(map.projects || []).length > 0 && (
          <ul className="space-y-2 border-t border-line pt-3">
            {map.projects.map((project) => (
              <li key={project.id} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">
                    Level {project.level} · {project.name}
                  </span>
                  <span className="tabular-nums text-ink/70">
                    {project.agreed > 0 ? `${project.percent}% received` : (project.received > 0 ? formatMoney(project.received) : 'Nothing confirmed yet')}
                  </span>
                </div>
                <div className="text-xs text-ink/60">
                  {PAY[project.payWhen] || PAY.after}
                  {project.supportsName ? ` · Supports ${project.supportsName}` : ''}
                  {project.spent > 0 ? ` · ${formatMoney(project.spent)} spent following it` : ''}
                  {project.behind > 0 ? ` · ${formatMoney(project.behind)} behind` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default MoneyConnections;
