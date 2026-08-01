import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingUpIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { projectsAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildProjectSections } from '../utils/exportSections';
import ProjectForm from '../components/forms/ProjectForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Projects() {
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
  const [expenseForm, setExpenseForm] = useState({ category: 'materials', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', notes: '' });
  const [incomeForm, setIncomeForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '', notes: '' });
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);

  const { data: projects, isLoading, error } = useQuery(
    ['projects', statusFilter, currentPage, pageSize],
    () => projectsAPI.getProjects({
      status: statusFilter || undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const { data: projectStats } = useQuery('projectStats', projectsAPI.getProjectStats);

  const deleteMutation = useMutation(projectsAPI.deleteProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      queryClient.invalidateQueries('projectStats');
      toast.success('Project deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete project')
  });

  const addExpenseMutation = useMutation(({ id, data }) => projectsAPI.addExpense(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      queryClient.invalidateQueries('projectStats');
      toast.success('Expense recorded');
      setExpenseTarget(null);
      setExpenseForm({ category: 'materials', reason: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '', notes: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record expense')
  });

  const removeExpenseMutation = useMutation(({ id, expenseId }) => projectsAPI.removeExpense(id, expenseId), {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      queryClient.invalidateQueries('projectStats');
      toast.success('Expense removed');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to remove expense')
  });

  const addIncomeMutation = useMutation(({ id, data }) => projectsAPI.addIncome(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      queryClient.invalidateQueries('projectStats');
      toast.success('Income recorded');
      setIncomeTarget(null);
      setIncomeForm({ date: new Date().toISOString().split('T')[0], title: '', amount: '', quantity: '', unit: '', customer: '', notes: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record income')
  });

  const removeIncomeMutation = useMutation(({ id, incomeId }) => projectsAPI.removeIncome(id, incomeId), {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      queryClient.invalidateQueries('projectStats');
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
    queryClient.invalidateQueries('projects');
    queryClient.invalidateQueries('projectStats');
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.reason || !expenseForm.amount) {
      toast.error('Category, reason and amount are required');
      return;
    }
    setSavingExpense(true);
    addExpenseMutation.mutate(
      { id: expenseTarget._id, data: { ...expenseForm, amount: parseFloat(expenseForm.amount) } },
      { onSettled: () => setSavingExpense(false) }
    );
  };

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!incomeForm.title || !incomeForm.amount) {
      toast.error('Title and amount are required');
      return;
    }
    setSavingIncome(true);
    addIncomeMutation.mutate(
      {
        id: incomeTarget._id,
        data: {
          ...incomeForm,
          amount: parseFloat(incomeForm.amount),
          quantity: parseFloat(incomeForm.quantity) || 0
        }
      },
      { onSettled: () => setSavingIncome(false) }
    );
  };

  const formatCurrency = (amount, currency = 'FRW') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

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

  const expenseCategories = {
    materials: '🧱 Materials', labor: '👷 Labor', equipment: '⚙️ Equipment',
    transport: '🚛 Transport', survey: '📐 Survey/Design', fees: '📄 Fees',
    utilities: '💡 Utilities', marketing: '📣 Marketing', rent: '🏠 Rent',
    maintenance: '🔧 Maintenance', other: '📦 Other'
  };

  if (isLoading) return <LoadingSpinner />;
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

      {/* Statistics */}
      {stats.overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card"><div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.overview.totalProjects || 0}</div>
            <div className="text-sm text-gray-500">My Projects</div>
          </div></div>
          <div className="card"><div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.overview.totalExpenses)}</div>
            <div className="text-sm text-gray-500">Total Money Spent</div>
          </div></div>
          <div className="card"><div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.overview.totalIncome)}</div>
            <div className="text-sm text-gray-500">Total Income</div>
          </div></div>
          <div className="card"><div className="card-body text-center">
            <div className={`text-2xl font-bold ${(stats.overview.totalProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(stats.overview.totalProfit)}
            </div>
            <div className="text-sm text-gray-500">Total Profit</div>
          </div></div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'planning', 'active', 'paused', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
              statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status || 'All Status'}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="card">
        <div className="card-body">
          {projectsList.length > 0 ? (
            <div className="space-y-4">
              {projectsList.map((project) => {
                const profit = project.profit;
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
                            {project.projectType && project.projectType !== 'general' && `${project.projectType} `}
                            {project.location && `• 📍 ${project.location}`}
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
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(project.totalExpenses)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Income</div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(project.totalIncome)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Expenses Recorded</div>
                        <div className="text-sm font-medium text-gray-900">{project.expenses.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">ROI</div>
                        <div className={`text-sm font-medium ${parseFloat(project.roiPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {project.roiPercentage}%
                        </div>
                      </div>
                    </div>

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
                          {project.expenses.length > 0 ? (
                            <div className="space-y-2">
                              {project.expenses.map((expense) => (
                                <div key={expense._id} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {expenseCategories[expense.category] || expense.category} — {formatCurrency(expense.amount)}
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
                              <div className="p-2 bg-blue-50 rounded flex justify-between text-sm font-medium">
                                <span>Total Spent</span>
                                <span>{formatCurrency(project.totalExpenses)}</span>
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
                                      Income: {formatCurrency(income.amount)}
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
                                <span>Profit ({formatCurrency(project.totalIncome)} - {formatCurrency(project.totalExpenses)})</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Expense to {expenseTarget.name}</h2>
                <button onClick={() => setExpenseTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Object.entries(expenseCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (why this money was spent) *</label>
                  <input
                    type="text"
                    value={expenseForm.reason}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Bought materials, paid workers, transport..."
                    required
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Supplier</label>
                  <input type="text" value={expenseForm.vendor} onChange={(e) => setExpenseForm(prev => ({ ...prev, vendor: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setExpenseTarget(null)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingExpense}>
                    {savingExpense ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {incomeTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Income to {incomeTarget.name}</h2>
                <button onClick={() => setIncomeTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" value={incomeForm.title} onChange={(e) => setIncomeForm(prev => ({ ...prev, title: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Sold harvest, client payment, revenue..." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW) *</label>
                  <input type="number" min="0" value={incomeForm.amount} onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" min="0" value={incomeForm.quantity} onChange={(e) => setIncomeForm(prev => ({ ...prev, quantity: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={incomeForm.unit} onChange={(e) => setIncomeForm(prev => ({ ...prev, unit: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="kg, pieces, bags" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm(prev => ({ ...prev, date: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer/Buyer</label>
                  <input type="text" value={incomeForm.customer} onChange={(e) => setIncomeForm(prev => ({ ...prev, customer: e.target.value }))} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setIncomeTarget(null)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingIncome}>
                    {savingIncome ? 'Saving...' : 'Save Income'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
