import { useQuery } from 'react-query';
import { 
  loansAPI, 
  transactionsAPI, 
  savingsAPI, 
  remindersAPI,
  giftsAPI,
  expensesAPI,
  businessesAPI,
  investmentsAPI,
  assetAssignmentsAPI,
  projectsAPI
} from '../services/api';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GiftIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CubeIcon,
  FolderIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectProfitChart from '../components/charts/ProjectProfitChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart';
import SavingsTrendChart from '../components/charts/SavingsTrendChart';
import { Link } from 'react-router-dom';

function Dashboard() {
  // Fetch dashboard data
  const { data: loanStats, isLoading: loansLoading } = useQuery(
    'loanStats',
    loansAPI.getLoanStats
  );

  const { data: overdueLoans, isLoading: dueSoonLoading } = useQuery(
    'overdueLoans',
    loansAPI.getOverdueLoans
  );

  const { data: transactionStats, isLoading: statsLoading } = useQuery(
    'transactionStats',
    transactionsAPI.getTransactionStats
  );

  const { data: savingsStats, isLoading: savingsLoading } = useQuery(
    'savingsStats',
    savingsAPI.getSavingsStats
  );

  const { data: reminderStats, isLoading: remindersLoading } = useQuery(
    'reminderStats',
    remindersAPI.getReminderStats
  );

  const { data: giftStats, isLoading: giftsLoading } = useQuery(
    'giftStats',
    giftsAPI.getGiftStats
  );

  const { data: expenseStats, isLoading: expensesLoading } = useQuery(
    'expenseStats',
    () => expensesAPI.getExpenseStats({ period: 'month' })
  );

  const { data: businessStats, isLoading: businessLoading } = useQuery(
    'businessStats',
    businessesAPI.getBusinessStats
  );

  const { data: investmentStats, isLoading: investmentsLoading } = useQuery(
    'investmentStats',
    investmentsAPI.getInvestmentStats
  );

  const { data: assetAssignmentStats, isLoading: assetsLoading } = useQuery(
    'assetAssignmentStats',
    assetAssignmentsAPI.getAssetAssignmentStats
  );

  const { data: projectStats, isLoading: projectsLoading } = useQuery(
    'projectStats',
    projectsAPI.getProjectStats
  );

  const { data: allProjects, isLoading: allProjectsLoading } = useQuery(
    'allProjects',
    () => projectsAPI.getProjects({ limit: 100 })
  );

  const { data: recentTx, isLoading: recentTxLoading } = useQuery(
    'recentTransactions',
    () => transactionsAPI.getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' })
  );

  const isLoading = loansLoading || dueSoonLoading || statsLoading || savingsLoading || 
    remindersLoading || giftsLoading || expensesLoading || businessLoading || 
    investmentsLoading || assetsLoading || projectsLoading || recentTxLoading || allProjectsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Outstanding Loans',
      value: loanStats?.data?.data?.overview?.activeLoans || 0,
      amount: loanStats?.data?.data?.overview?.totalRemaining || 0,
      icon: CurrencyDollarIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/loans',
    },
    {
      name: 'Overdue Loans',
      value: loanStats?.data?.data?.overview?.overdueLoans || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/loans',
    },
    {
      name: 'Total Expenses',
      value: expenseStats?.data?.data?.overview?.totalExpenses || 0,
      amount: expenseStats?.data?.data?.overview?.totalAmount || 0,
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/expenses',
    },
    {
      name: 'Total Gifts',
      value: giftStats?.data?.data?.overview?.totalGifts || 0,
      amount: giftStats?.data?.data?.overview?.totalAmountGiven || 0,
      icon: GiftIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      href: '/gifts',
    },
    {
      name: 'Active Businesses',
      value: businessStats?.data?.data?.overview?.activeBusinesses || 0,
      amount: businessStats?.data?.data?.overview?.totalProfit || 0,
      icon: BuildingOfficeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/business',
    },
    {
      name: 'Investment Portfolio',
      value: investmentStats?.data?.data?.overview?.totalInvestments || 0,
      amount: investmentStats?.data?.data?.overview?.currentValue || 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/investments',
    },
    {
      name: 'Asset Assignments',
      value: assetAssignmentStats?.data?.data?.overview?.totalAssignments || 0,
      amount: assetAssignmentStats?.data?.data?.overview?.totalAssetValue || 0,
      icon: CubeIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      href: '/asset-assignments',
    },
    {
      name: 'Active Reminders',
      value: reminderStats?.data?.data?.activeReminders || 0,
      icon: BellIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/reminders',
    },
    {
      name: 'Total Savings',
      value: savingsStats?.data?.data?.overall?.totalAmount || 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/savings',
    },
    {
      name: 'My Projects',
      value: projectStats?.data?.data?.overview?.totalProjects || 0,
      amount: projectStats?.data?.data?.overview?.totalProfit || 0,
      icon: FolderIcon,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      href: '/projects',
    },
  ];

  // Only show modules the user actually has data in — hide empty type cards
  const usedStats = stats.filter(
    (stat) => Number(stat.value || 0) > 0 || Number(stat.amount || 0) > 0
  );

  const projectOverview = projectStats?.data?.data?.overview || {};
  const projectsList = allProjects?.data?.data || allProjects?.data || [];
  const recentTransactions = recentTx?.data?.data || recentTx?.data || [];
  const monthlyStats = transactionStats?.data?.data?.monthlyStats || [];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount || 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your finances.
        </p>
      </div>

      {/* My Projects Overview */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">My Projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Money spent, income and profit across all your projects
              </p>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Manage projects →
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <div className="flex items-center">
                <BanknotesIcon className="h-5 w-5 text-cyan-600 mr-2" />
                <span className="text-sm font-medium text-cyan-800">Total Money Spent</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-cyan-900">{formatCurrency(projectOverview.totalExpenses)}</div>
              <div className="text-sm text-cyan-700">across {projectOverview.totalProjects || 0} project{projectOverview.totalProjects === 1 ? '' : 's'}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Total Income</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-green-900">{formatCurrency(projectOverview.totalIncome)}</div>
              <div className="text-sm text-green-700">outcomes & revenue recorded</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-emerald-600 mr-2" />
                <span className="text-sm font-medium text-emerald-800">Total Profit</span>
              </div>
              <div className={`mt-2 text-2xl font-bold ${(projectOverview.totalProfit || 0) >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>
                {formatCurrency(projectOverview.totalProfit)}
              </div>
              <div className="text-sm text-emerald-700">{projectOverview.completedProjects || 0} completed</div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent projects</h4>
            {projectsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projectsList.slice(0, 5).map((project) => (
                  <Link
                    key={project._id}
                    to="/projects"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">📁 {project.name}</span>
                      <span className={`text-sm font-bold ${(project.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(project.profit)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {project.projectType && project.projectType !== 'general' ? `${project.projectType} · ` : ''}
                      {formatCurrency(project.totalExpenses)} spent · {formatCurrency(project.totalIncome)} income
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">You haven't created any projects yet.</p>
                <Link
                  to="/projects"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Create a project →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts: Project Profit + Monthly Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Project Profit</h3>
            <p className="mt-1 text-sm text-gray-500">
              Profit or loss per project
            </p>
          </div>
          <div className="card-body">
            <ProjectProfitChart projects={projectsList} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Monthly Trend</h3>
            <p className="mt-1 text-sm text-gray-500">
              Income vs expenses over the last 12 months
            </p>
          </div>
          <div className="card-body">
            <MonthlyTrendChart monthlyStats={monthlyStats} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
            <p className="mt-1 text-sm text-gray-500">
              Where your money went this month
            </p>
          </div>
          <div className="card-body">
            <CategoryBreakdownChart byCategory={expenseStats?.data?.data?.byCategory || []} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Savings Trend</h3>
            <p className="mt-1 text-sm text-gray-500">
              Deposits vs withdrawals and your savings balance
            </p>
          </div>
          <div className="card-body">
            <SavingsTrendChart monthlyTrend={savingsStats?.data?.data?.monthlyTrend || []} />
          </div>
        </div>
      </div>

      {/* Overdue Loans Alert */}
      {overdueLoans?.data?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {overdueLoans.data.length} Overdue Loan{overdueLoans.data.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-600">
                You have loans that are past their due date. Consider sending reminders or contacting borrowers.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Link
              to="/loans"
              className="text-sm font-medium text-red-800 hover:text-red-900"
            >
              View overdue loans →
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid — only shows types you've actually used */}
      {usedStats.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-8">
            <p className="text-sm text-gray-500">
              Your dashboard overview will appear here once you add your first loans, savings, expenses or projects.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Use the Quick Actions below to get started.
            </p>
          </div>
        </div>
      ) : (
      <div className="stats-grid">
        {usedStats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="stats-card hover:shadow-md transition-shadow duration-200"
          >
            <div className="stats-card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="stats-card-title">{stat.name}</dt>
                    <dd className="stats-card-value">
                      {stat.amount ? `FRW ${stat.amount.toLocaleString()}` : stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Outstanding Loans */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Outstanding Loans</h3>
            <p className="mt-1 text-sm text-gray-500">
              Loans that need attention
            </p>
          </div>
          <div className="card-body">
            {overdueLoans?.data?.length > 0 ? (
              <div className="space-y-4">
                {overdueLoans.data.slice(0, 3).map((loan) => (
                  <div key={loan._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {loan.contactId?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(loan.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        FRW {loan.remainingAmount.toLocaleString()}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        loan.status === 'overdue' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <Link
                    to="/loans"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all loans →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No outstanding loans</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Great job! You don't have any outstanding loans.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your latest financial activity
            </p>
          </div>
          <div className="card-body">
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description || transaction.category}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.category} · {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}FRW {transaction.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <Link
                    to="/transactions"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all transactions →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent transactions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by adding your first transaction.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/loans/new"
              className="btn btn-primary w-full justify-center"
            >
              Add New Loan
            </Link>
            <Link
              to="/transactions/new"
              className="btn btn-secondary w-full justify-center"
            >
              Add Transaction
            </Link>
            <Link
              to="/contacts/new"
              className="btn btn-secondary w-full justify-center"
            >
              Add Contact
            </Link>
            <Link
              to="/reminders/new"
              className="btn btn-secondary w-full justify-center"
            >
              Set Reminder
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
