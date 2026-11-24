import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingUpIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { assetsAPI, expensesAPI, projectsAPI, savingsAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildProjectSections } from '../utils/exportSections';
import ProjectForm from '../components/forms/ProjectForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { syncBooks } from '../utils/syncBooks';
import FilterMenu from '../components/FilterMenu';
import { categoryLabel, expenseChoices, groupBook, incomeChoices, linesFromBooks } from '../utils/bookGroups';
import CategoryPicker from '../components/CategoryPicker';
import LinkPicker from '../components/LinkPicker';
import SlideOver from '../components/SlideOver';
import { exactMoney, formatMoney } from '../utils/money';
import MoneyConnections from '../components/MoneyConnections';
import { fileExpenseCategory } from '../utils/fileExpense';
import { uploadProof } from '../utils/uploadProof';

function Projects() {
  const [searchParams] = useSearchParams();
  const businessFilter = searchParams.get('business') || '';
  const openProject = searchParams.get('project') || '';
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedProject, setExpandedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  // Expense/Income modal states
  const [expenseTarget, setExpenseTarget] = useState(null);
  const [incomeTarget, setIncomeTarget] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ category: 'School fees', reason: '', amount: '', date: new Date().toISOString().split('T')[0], assetId: '', savingsId: '' });
  const [expenseReceipt, setExpenseReceipt] = useState(null);
  const [incomeForm, setIncomeForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', amount: '', category: 'income' });
  const [analysisScope, setAnalysisScope] = useState('all');
  const [analysisCategory, setAnalysisCategory] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);

  useEffect(() => {
    if (openProject) setExpandedProject(openProject);
  }, [openProject]);

  const { data: projects, isLoading, error } = useQuery(
    ['projects', statusFilter, currentPage, pageSize, businessFilter],
    () => projectsAPI.getProjects({
      status: statusFilter || undefined,
      businessId: businessFilter || undefined,
      page: currentPage,
      limit: pageSize
    }),
    { keepPreviousData: true }
  );

  const { data: projectStats } = useQuery('projectStats', projectsAPI.getProjectStats);
  const { data: analysisProjects } = useQuery(['projects', 'analysis'], () => projectsAPI.getProjects({ limit: 100 }));
  const { data: analysisExpenses } = useQuery(['expenses', 'analysis'], () => expensesAPI.getExpenses({ limit: 200 }));
  const { data: assetList } = useQuery(['assets', 'links'], () => assetsAPI.getAssets({ limit: 100 }));
  const { data: savingsList } = useQuery(['savings', 'links'], () => savingsAPI.getSavings({ limit: 100 }));

  const deleteMutation = useMutation(projectsAPI.deleteProject, {
    onSuccess: () => {
      syncBooks(queryClient, 'projects');
      toast.success('Project deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete project')
  });

  const addExpenseMutation = useMutation((data) => expensesAPI.createExpense(data), {
    onSuccess: () => {
      syncBooks(queryClient, 'expenses', 'projects', 'assets');
      toast.success('Expense recorded');
      setExpenseTarget(null);
      setExpenseForm({ category: 'School fees', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', notes: '', assetId: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record expense')
  });

  const removeExpenseMutation = useMutation(({ id, expenseId }) => projectsAPI.removeExpense(id, expenseId), {
    onSuccess: () => {
      syncBooks(queryClient, 'projects');
      toast.success('Expense removed');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to remove expense')
  });

  const addIncomeMutation = useMutation(({ id, data }) => projectsAPI.addIncome(id, data), {
    onSuccess: () => {
      syncBooks(queryClient, 'projects');
      toast.success('Income recorded');
      setIncomeTarget(null);
      setIncomeForm({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '', notes: '', category: 'income' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record income')
  });

  const removeIncomeMutation = useMutation(({ id, incomeId }) => projectsAPI.removeIncome(id, incomeId), {
    onSuccess: () => {
      syncBooks(queryClient, 'projects');
      toast.success('Income removed');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to remove income')
  });

  const handleEdit = (project) => {
    setSelectedProject(project);
    setShowForm(true);
  };

  const handleDelete = (project) => {
    if (window.confirm(`Delete "${project.name}" and all its expenses/incomes?`)) {
      deleteMutation.mutate(project._id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedProject(null);
    syncBooks(queryClient, 'projects');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount) {
      toast.error('Enter the amount');
      return;
    }
    const account = (savingsList?.data?.data || []).find((saving) => saving._id === expenseForm.savingsId);
    setSavingExpense(true);
    try {
      const title = expenseForm.reason.trim() || expenseForm.category || 'Expense';
      const receipt = await uploadProof(expenseReceipt, { title, relatedEntity: 'project' });
      addExpenseMutation.mutate(
        {
          title,
          ...fileExpenseCategory(expenseForm.category, ''),
          amount: parseFloat(expenseForm.amount),
          expenseDate: expenseForm.date,
          receipt,
          projectId: expenseTarget._id,
          assetId: expenseForm.assetId || undefined,
          currency: 'FRW',
          source: account
            ? { type: 'savings', sourceId: account._id, sourceName: account.name, amount: parseFloat(expenseForm.amount) }
            : { type: 'cash' },
        },
        { onSettled: () => setSavingExpense(false) }
      );
    } catch (error) {
      setSavingExpense(false);
      toast.error(error.response?.data?.message || 'Could not save that expense');
    }
  };

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!incomeForm.amount) {
      toast.error('Enter the amount');
      return;
    }
    setSavingIncome(true);
    addIncomeMutation.mutate(
      {
        id: incomeTarget._id,
        data: {
          ...incomeForm,
          title: incomeForm.title.trim() || incomeForm.category || 'Income',
          amount: parseFloat(incomeForm.amount),
        }
      },
      { onSettled: () => setSavingIncome(false) }
    );
  };

  const formatCurrency = (amount) => formatMoney(amount);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const map = {
      planning: { name: 'Planning', color: 'bg-yellow-100 text-yellow-800' },
      active: { name: 'Active', color: 'bg-green-100 text-green-800' },
      paused: { name: 'Paused', color: 'bg-orange-100 text-orange-800' },
      completed: { name: 'Completed', color: 'bg-blue-100 text-blue-800' },
      cancelled: { name: 'Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return map[status] || { name: status, color: 'bg-gray-100 text-gray-800' };
  };

  const analysisLines = linesFromBooks({
    projects: analysisProjects?.data?.data || [],
    expenses: analysisExpenses?.data?.data || [],
  });
  const analysisProjectId = analysisScope.startsWith('project:') ? analysisScope.slice(8) : '';
  const analysis = groupBook(analysisLines, {
    scope: analysisScope === 'general' ? 'general' : analysisProjectId ? 'project' : 'all',
    projectId: analysisProjectId,
    category: analysisCategory,
  });
  const analysisProjectsList = analysisProjects?.data?.data || [];

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-center text-red-600">Error loading projects: {error.message}</div>;

  const projectsList = projects?.data?.data || projects?.data || [];
  const stats = projectStats?.data?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create any project you own, record your expenses with reasons and your income, and see your profit
          </p>
          {businessFilter && (
            <p className="mt-2 text-sm text-ink">
              Projects in this business.{' '}
              <Link to="/business" className="font-medium text-primary-700">Back to the business</Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <ExportButtons
            filename="projects"
            title="My Projects Report"
            sections={buildProjectSections(projectsList)}
          />
          <button onClick={() => { setSelectedProject(null); setShowForm(true); }} className="btn btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>
      </div>

      <MoneyConnections />

      {/* Statistics */}
      {stats.overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card"><div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.overview.totalProjects || 0}</div>
            <div className="text-sm text-gray-500">My Projects</div>
          </div></div>
          <div className="card"><div className="card-body text-center">
            <div className="text-lg font-semibold tabular-nums text-blue-600" title={exactMoney(stats.overview.totalExpenses)}>{formatCurrency(stats.overview.totalExpenses)}</div>
            <div className="text-sm text-gray-500">Total Money Spent</div>
          </div></div>
          <div className="card"><div className="card-body text-center">
            <div className="text-lg font-semibold tabular-nums text-green-600" title={exactMoney(stats.overview.totalIncome)}>{formatCurrency(stats.overview.totalIncome)}</div>
            <div className="text-sm text-gray-500">Total Income</div>
          </div></div>
          <div className="card"><div className="card-body text-center">
            <div className={`text-lg font-semibold tabular-nums ${(stats.overview.totalProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} title={exactMoney(stats.overview.totalProfit)}>
              {formatCurrency(stats.overview.totalProfit)}
            </div>
            <div className="text-sm text-gray-500">Total Profit</div>
          </div></div>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-paper-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">Analyse</h2>
            <p className="mt-1 text-sm text-ink/60">Group school, tax, salary, insurance, investment, and loans by a project or as general spending.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-sm text-ink/70">
              Look at
              <select className="input mt-1" value={analysisScope} onChange={(event) => setAnalysisScope(event.target.value)}>
                <option value="all">Everything</option>
                <option value="general">General</option>
                {analysisProjectsList.map((project) => (
                  <option key={project._id} value={`project:${project._id}`}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-ink/70">
              Category
              <select className="input mt-1" value={analysisCategory} onChange={(event) => setAnalysisCategory(event.target.value)}>
                <option value="">All categories</option>
                {[...expenseChoices, ...incomeChoices.filter((item) => !expenseChoices.includes(item))].map((value) => (
                  <option key={value} value={value}>{categoryLabel(value)}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-ink/50">In</p>
            <p className="text-base font-semibold tabular-nums text-ink" title={exactMoney(analysis.income)}>{formatMoney(analysis.income)}</p>
          </div>
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-ink/50">Out</p>
            <p className="text-base font-semibold tabular-nums text-ink" title={exactMoney(analysis.spent)}>{formatMoney(analysis.spent)}</p>
          </div>
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-ink/50">Left</p>
            <p className="text-base font-semibold tabular-nums text-ink" title={exactMoney(analysis.net)}>{formatMoney(analysis.net)}</p>
          </div>
        </div>
        {analysis.groups.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">Nothing in this view yet. Create a project, then record a category such as school, tax, salary, or insurance.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.groups.map((group) => (
              <li key={group.category} className="rounded-xl border border-line px-3 py-2">
                <p className="text-sm font-medium text-ink">{group.label}</p>
                <p className="text-xs text-ink/60">{group.count} record{group.count === 1 ? '' : 's'}</p>
                <p className="mt-1 text-sm tabular-nums text-ink" title={exactMoney(group.in - group.out)}>
                  In {formatMoney(group.in)} · Out {formatMoney(group.out)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FilterMenu
        groups={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: ['', 'planning', 'active', 'paused', 'completed', 'cancelled'].map((status) => ({
              value: status,
              label: status || 'All status',
            })),
          },
        ]}
      />

      {/* Projects List */}
      <div className="card">
        <div className="card-body">
          {projectsList.length > 0 ? (
            <div className="space-y-4">
              {projectsList.map((project) => {
                const linked = project.linkedExpenses || [];
                const spent = project.officeSpent ?? project.totalExpenses;
                const profit = (project.totalIncome || 0) - spent;
                const roi = spent ? ((profit / spent) * 100).toFixed(2) : '0.00';
                const status = getStatusBadge(project.status);
                return (
                  <div key={project._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Project header row */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">📁</span>
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">
                            {`Level ${project.level || 1}`}
                            {project.payWhen ? ` • ${{ before: 'Paid before', halfway: 'Paid halfway', after: 'Paid after', other: 'Other payment' }[project.payWhen]}` : ''}
                            {project.agreedAmount > 0 ? ` • ${project.receivedPercent || 0}% received • ${formatCurrency(project.behindAmount || 0)} behind` : ''}
                            {project.supportsName ? ` • Supports ${project.supportsName}` : ''}
                            {' • '}
                            {project.businessId?.name && `${project.businessId.name} • `}
                            {project.locationMode === 'online' ? 'Online' : (project.location || 'No place yet')}
                            {(project.partners || []).length > 0 && ` • Partners: ${project.partners.join(', ')}`}
                            {project.expectedEndDate && ` • Ends: ${formatDate(project.expectedEndDate)}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <div className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profit)}
                          </div>
                          <div className="text-xs text-gray-500">Profit</div>
                        </div>
                        <span className={`badge ${status.color}`}>{status.name}</span>
                        <button onClick={() => setExpandedProject(expandedProject === project._id ? null : project._id)} className="text-sm text-primary-600 hover:text-primary-800">
                          {expandedProject === project._id ? 'Hide Details' : 'View Details'}
                        </button>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(project)} className="text-primary-600 hover:text-primary-900" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(project)} className="text-red-600 hover:text-red-900" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-3">
                      <div>
                        <div className="text-xs text-gray-500">Money Spent</div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(spent)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Income</div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(project.totalIncome)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Expenses Recorded</div>
                        <div className="text-sm font-medium text-gray-900">{(project.expenses || []).length + linked.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">ROI</div>
                        <div className={`text-sm font-medium ${parseFloat(roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {roi}%
                        </div>
                      </div>
                    </div>

                    {((project.expenses || []).length + linked.length) > 0 && (
                      <ul className="space-y-1 px-4 pb-3">
                        {(project.expenses || []).map((expense) => (
                          <li key={expense._id} className="flex justify-between gap-2 text-sm text-ink">
                            <span className="truncate">{expense.reason || expense.category || 'Expense'}</span>
                            <span className="tabular-nums">{formatCurrency(expense.amount)}</span>
                          </li>
                        ))}
                        {linked.map((expense) => (
                          <li key={expense._id} className="flex justify-between gap-2 text-sm text-ink">
                            <span className="truncate">{expense.title || expense.subcategory || expense.category || 'Expense'}</span>
                            <span className="tabular-nums">{formatCurrency(expense.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <ConfirmPayment project={project} onDone={() => syncBooks(queryClient, 'projects')} />

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2 px-4 pb-3">
                      <button onClick={() => { setExpenseTarget(project); }} className="btn btn-secondary btn-sm">
                        <PlusCircleIcon className="h-4 w-4 mr-1" /> Add Expense
                      </button>
                      <button onClick={() => { setIncomeTarget(project); }} className="btn btn-secondary btn-sm">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" /> Add Income
                      </button>
                    </div>

                    {/* Expanded details */}
                    {expandedProject === project._id && (
                      <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Expenses */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">💸 Money Spent (Expenses)</h4>
                          {((project.expenses || []).length + linked.length) > 0 ? (
                            <div className="space-y-2">
                              {(project.expenses || []).map((expense) => (
                                <div key={expense._id} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {categoryLabel(expense.category)} — {formatCurrency(expense.amount)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      <span className="italic">"Reason: {expense.reason}"</span>
                                      {expense.vendor && ` • ${expense.vendor}`}
                                    </div>
                                    <div className="text-xs text-gray-400">{formatDate(expense.date)}</div>
                                  </div>
                                  <button
                                    onClick={() => removeExpenseMutation.mutate({ id: project._id, expenseId: expense._id })}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              {linked.map((expense) => (
                                <div key={expense._id} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {categoryLabel(expense.subcategory || expense.category)} — {formatCurrency(expense.amount)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      <span className="italic">"{expense.title}"</span>
                                      {expense.vendor && ` • ${expense.vendor}`}
                                    </div>
                                    <div className="text-xs text-gray-400">{formatDate(expense.expenseDate)} • Same expense as the office book</div>
                                  </div>
                                </div>
                              ))}
                              <div className="p-2 bg-blue-50 rounded flex justify-between text-sm font-medium">
                                <span>Total Spent</span>
                                <span>{formatCurrency(spent)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No expenses yet. Add the money you spent with the reason.</p>
                          )}
                        </div>
                        {/* Incomes */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">💵 Income / Outcomes</h4>
                          {project.incomes.length > 0 ? (
                            <div className="space-y-2">
                              {project.incomes.map((income) => (
                                <div key={income._id} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{income.title}</div>
                                    {income.quantity > 0 && (
                                      <div className="text-sm text-gray-500">
                                        {income.quantity} {income.unit} {income.customer && `• Sold to: ${income.customer}`}
                                      </div>
                                    )}
                                    <div className="text-sm text-green-600 font-medium">
                                      {categoryLabel(income.category || 'income')}: {formatCurrency(income.amount)}
                                    </div>
                                    <div className="text-xs text-gray-400">{formatDate(income.date)}</div>
                                  </div>
                                  <button
                                    onClick={() => removeIncomeMutation.mutate({ id: project._id, incomeId: income._id })}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              <div className="p-2 bg-green-50 rounded flex justify-between text-sm font-medium">
                                <span>Total Income</span>
                                <span>{formatCurrency(project.totalIncome)}</span>
                              </div>
                              <div className={`p-2 rounded flex justify-between text-sm font-bold ${profit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                <span>Profit ({formatCurrency(project.totalIncome)} - {formatCurrency(spent)})</span>
                                <span>{formatCurrency(profit)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No income yet. Record the outcome of your project to see profit.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4"><ArrowTrendingUpIcon className="h-12 w-12 mx-auto" /></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Create the project you own, then add your expenses (with reasons) and your income to calculate profit.</p>
              <button onClick={() => { setSelectedProject(null); setShowForm(true); }} className="btn btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" /> Create My First Project
              </button>
            </div>
          )}

          {/* Pagination */}
          {projects?.data?.pagination?.totalPages > 1 && (
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mt-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, projects?.data?.pagination?.totalItems || 0)} of {projects?.data?.pagination?.totalItems || 0} projects
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {projects?.data?.pagination?.totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === (projects?.data?.pagination?.totalPages || 1)}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Form */}
      {showForm && (
        <ProjectForm
          project={selectedProject}
          onClose={() => { setShowForm(false); setSelectedProject(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Add Expense Modal */}
      {expenseTarget && (
        <SlideOver title={`Expense for ${expenseTarget.name}`} subtitle="Same expense across the office" onClose={() => setExpenseTarget(null)}>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <CategoryPicker value={expenseForm.category} onChange={(name) => setExpenseForm((prev) => ({ ...prev, category: name }))} />
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-700">Take the money from</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`btn ${expenseForm.savingsId ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => setExpenseForm((prev) => ({ ...prev, savingsId: '' }))}
                    >
                      Cash
                    </button>
                    {(savingsList?.data?.data || []).map((saving) => (
                      <button
                        key={saving._id}
                        type="button"
                        className={`btn ${expenseForm.savingsId === saving._id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setExpenseForm((prev) => ({ ...prev, savingsId: saving._id }))}
                      >
                        {saving.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW) *</label>
                    <input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                  <LinkPicker
                    id="project-expense-asset"
                    items={(assetList?.data?.data || []).map((asset) => ({ id: asset._id, name: asset.name }))}
                    value={expenseForm.assetId}
                    onChange={(id) => setExpenseForm((prev) => ({ ...prev, assetId: id }))}
                    onCreate={async (name) => {
                      const response = await assetsAPI.createAsset({
                        name,
                        value: 0,
                        category: 'Equipment',
                        currency: 'FRW',
                        status: 'owned',
                        projectId: expenseTarget._id,
                      });
                      const asset = response.data.data.asset;
                      syncBooks(queryClient, 'assets');
                      return { id: asset._id, name: asset.name };
                    }}
                    emptyLabel="No asset"
                    placeholder="Search an asset, or create one"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-receipt">Receipt</label>
                  <input
                    id="project-receipt"
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    className="input"
                    onChange={(event) => setExpenseReceipt(event.target.files?.[0] || null)}
                  />
                  {expenseReceipt && <p className="mt-1 text-sm text-ink/60">{expenseReceipt.name}</p>}
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setExpenseTarget(null)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingExpense}>
                    {savingExpense ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </form>
        </SlideOver>
      )}

      {/* Add Income Modal */}
      {incomeTarget && (
        <SlideOver title={`Income for ${incomeTarget.name}`} subtitle="Project income" onClose={() => setIncomeTarget(null)}>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <CategoryPicker value={incomeForm.category} onChange={(name) => setIncomeForm((prev) => ({ ...prev, category: name }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW) *</label>
                  <input type="number" min="0" value={incomeForm.amount} onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm(prev => ({ ...prev, date: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIncomeTarget(null)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingIncome}>
                    {savingIncome ? 'Saving...' : 'Save Income'}
                  </button>
                </div>
              </form>
        </SlideOver>
      )}
    </div>
  );
}

function ConfirmPayment({ project, onDone }) {
  const [mode, setMode] = useState('amount');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const number = Number(value);
    if (!(number > 0)) {
      toast.error('Enter the amount you received, or the percent');
      return;
    }
    setSaving(true);
    try {
      await projectsAPI.confirmReceipt(project._id, mode === 'percent' ? { percent: number } : { amount: number });
      toast.success('Received amount confirmed. The project and your remaining money are updated.');
      setValue('');
      onDone();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not confirm that payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      <span className="text-xs text-gray-500">Confirm what you received</span>
      <button type="button" className={`btn btn-sm ${mode === 'amount' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('amount')}>Amount</button>
      <button type="button" className={`btn btn-sm ${mode === 'percent' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('percent')}>Percent</button>
      <input
        type="number"
        min="0"
        className="input w-28"
        placeholder={mode === 'percent' ? '%' : 'Amount'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="button" className="btn btn-secondary btn-sm" onClick={submit} disabled={saving}>
        {saving ? 'Saving...' : 'Confirm received'}
      </button>
    </div>
  );
}

export default Projects;
