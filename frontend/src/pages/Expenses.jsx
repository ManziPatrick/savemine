import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PencilIcon, PlusIcon, TrashIcon, CurrencyDollarIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';
import { expensesAPI, savingsAPI, transactionsAPI } from '../services/api';
import SlideOver from '../components/SlideOver';
import ExportButtons from '../components/ExportButtons';
import { buildExpenseSections } from '../utils/exportSections';
import ExpenseForm from '../components/forms/ExpenseForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { syncBooks } from '../utils/syncBooks';
import FilterMenu from '../components/FilterMenu';
import { exactMoney, formatMoney } from '../utils/money';
import { farmSummary } from '../utils/farmMeasure';

function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editExpense, setEditExpense] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', savingsId: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [raising, setRaising] = useState(false);
  const queryClient = useQueryClient();

  const { data: expenses, isLoading, error } = useQuery(
    ['expenses', filter, categoryFilter, businessFilter, currentPage, pageSize],
    () => expensesAPI.getExpenses({ 
      category: categoryFilter || undefined,
      business: businessFilter === 'business' ? 'true' : businessFilter === 'personal' ? 'false' : undefined,
      page: currentPage,
      limit: pageSize
    }),
    { keepPreviousData: true }
  );

  const { data: expenseStats } = useQuery(
    'expenseStats',
    () => expensesAPI.getExpenseStats({ period: 'all' })
  );

  const { data: savingsList } = useQuery(['savings', 'expenses'], () => savingsAPI.getSavings({ limit: 100 }));

  const { data: salaryIncome } = useQuery(
    'salaryIncome',
    () => transactionsAPI.getTransactions({ type: 'income', limit: 100 })
  );

  const handleFormSuccess = () => {
    setShowForm(false);
    setCurrentPage(1);
    syncBooks(queryClient, 'expenses');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return '';
      case 'transport': return '';
      case 'housing': return '';
      case 'utilities': return '';
      case 'healthcare': return '';
      case 'education': return '';
      case 'entertainment': return '';
      case 'clothing': return '';
      case 'personal_care': return '';
      case 'business': return '';
      case 'animal_care': return '';
      case 'agriculture': return '';
      case 'investment': return '';
      case 'emergency': return '';
      case 'gift': return '';
      case 'donation': return '';
      default: return '';
    }
  };

  const getCategoryName = (category) => {
    const categories = {
      food: 'Food & Dining',
      transport: 'Transportation',
      housing: 'Housing & Rent',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      education: 'Education',
      entertainment: 'Entertainment',
      clothing: 'Clothing',
      personal_care: 'Personal Care',
      business: 'Business',
      animal_care: 'Animal Care',
      agriculture: 'Agriculture',
      investment: 'Investment',
      emergency: 'Emergency',
      gift: 'Gifts',
      donation: 'Donations',
      school: 'School',
      tax: 'Tax',
      salary: 'Salary',
      insurance: 'Insurance',
      loan: 'Loan',
      other: 'Other'
    };
    return categories[category] || category;
  };

  const formatCurrency = (amount) => formatMoney(amount);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-center text-red-600">Error loading expenses: {error.message}</div>;

  const expensesList = expenses?.data?.data || [];
  const stats = expenseStats?.data?.data || {};
  const salaryRows = (salaryIncome?.data?.data || []).filter((row) => /salary/i.test(`${row.category || ''} ${row.description || ''}`));
  const salaryPlan = salaryRows.find((row) => row.isRecurring) || salaryRows[0] || null;
  const salaryTotal = salaryRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const spentTotal = Number(stats.overview?.totalAmount || 0);
  const salaryLeft = salaryTotal - spentTotal;

  const increaseSalary = async () => {
    const next = Number(salaryAmount);
    if (!Number.isFinite(next) || next <= 0) {
      toast.error('Enter the new salary');
      return;
    }
    setRaising(true);
    try {
      if (salaryPlan) {
        await transactionsAPI.raiseSalary(salaryPlan._id, next);
        toast.success('Salary increased. The extra is added now, and later months use this amount.');
      } else {
        await transactionsAPI.createTransaction({
          type: 'income',
          amount: next,
          currency: 'FRW',
          category: 'Salary',
          description: 'Monthly salary',
          date: new Date().toISOString().slice(0, 10),
          repeat: 'monthly',
          depositTo: 'wallet'
        });
        toast.success('Salary added. It comes again every month.');
      }
      setSalaryAmount('');
      syncBooks(queryClient, 'transactions', 'expenses');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update the salary');
    } finally {
      setRaising(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your spending and manage expenses by category
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <ExportButtons
            filename="expenses"
            title="Expenses Report"
            sections={buildExpenseSections(expensesList)}
          />
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Expense Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.overview?.totalExpenses || 0}
              </div>
              <div className="text-sm text-gray-500">Total Expenses</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-lg font-semibold tabular-nums text-red-600" title={exactMoney(stats.overview?.totalAmount || 0)}>
                {formatCurrency(stats.overview?.totalAmount || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-lg font-semibold tabular-nums text-blue-600" title={exactMoney(stats.overview?.businessExpenses || 0)}>
                {formatCurrency(stats.overview?.businessExpenses || 0)}
              </div>
              <div className="text-sm text-gray-500">Business</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-lg font-semibold tabular-nums text-green-600" title={exactMoney(stats.overview?.personalExpenses || 0)}>
                {formatCurrency(stats.overview?.personalExpenses || 0)}
              </div>
              <div className="text-sm text-gray-500">Personal</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Salary</p>
            <p className="text-lg font-semibold tabular-nums text-ink" title={exactMoney(salaryTotal)}>{formatCurrency(salaryTotal)}</p>
            <p className="text-sm text-gray-500">
              Expenses come off this. Left {formatCurrency(salaryLeft)}
              {salaryPlan ? ` · monthly ${formatCurrency(salaryPlan.amount)}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="0"
              className="input w-40"
              placeholder={salaryPlan ? 'Higher salary' : 'Set salary'}
              value={salaryAmount}
              onChange={(event) => setSalaryAmount(event.target.value)}
            />
            <button type="button" className="btn btn-primary" onClick={increaseSalary} disabled={raising}>
              {salaryPlan ? 'Increase salary' : 'Set salary'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats?.byCategory && stats.byCategory.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Expenses by Category</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byCategory.slice(0, 6).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getCategoryIcon(category._id)}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getCategoryName(category._id)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.count} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(category.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg: {formatCurrency(category.averageAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <FilterMenu
        groups={[
          {
            label: 'Category',
            value: categoryFilter,
            onChange: (category) => setCategoryFilter(categoryFilter === category ? '' : category),
            options: [
              { value: '', label: 'All' },
              ...[
                'school', 'tax', 'salary', 'insurance', 'investment', 'loan',
                'food', 'transport', 'housing', 'utilities', 'healthcare',
                'education', 'business', 'animal_care', 'agriculture',
              ].map((category) => ({
                value: category,
                label: getCategoryName(category),
              })),
            ],
          },
          {
            label: 'Type',
            value: businessFilter,
            onChange: setBusinessFilter,
            options: ['all', 'business', 'personal'].map((type) => ({
              value: type,
              label: type === 'all' ? 'All types' : type,
            })),
          },
        ]}
      />

      {/* Expenses List */}
      <div className="card">
        <div className="card-body">
          {expensesList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table table-compact">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Category</th>
                      <th className="table-header-cell">Title</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Payment Method</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {expensesList.map((expense) => (
                      <tr key={expense._id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{getCategoryIcon(expense.category)}</span>
                            <span className="badge badge-info">
                              {getCategoryName(expense.category)}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium text-gray-900">
                              {expense.title}
                            </div>
                            {expense.description && (
                              <div className="text-sm text-gray-500">
                                {expense.description}
                              </div>
                            )}
                            {farmSummary(expense.farm) && (
                              <div className="text-sm text-gray-500">
                                {farmSummary(expense.farm)}
                              </div>
                            )}
                            {expense.vendor && (
                              <div className="text-sm text-gray-500">
                                Vendor: {expense.vendor}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(expense.amount, expense.currency)}
                          </div>
                          {expense.quantity > 1 && (
                            <div className="text-sm text-gray-500">
                              Qty: {expense.quantity}
                            </div>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex flex-col space-y-1">
                            <span className={`badge ${expense.isBusinessExpense ? 'badge-success' : 'badge-secondary'}`}>
                              {expense.isBusinessExpense ? 'Business' : 'Personal'}
                            </span>
                            {expense.isTaxDeductible && (
                              <span className="badge badge-info text-xs">
                                Tax Deductible
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          {formatDate(expense.expenseDate)}
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-outline">
                            {expense.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-primary-700"
                              title="Edit"
                              onClick={() => {
                                setEditExpense(expense);
                                setEditForm({
                                  title: expense.title || '',
                                  amount: expense.amount ?? '',
                                  savingsId: expense.source?.type === 'savings' ? (expense.source.sourceId || '') : '',
                                });
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="text-red-600"
                              title="Delete"
                              onClick={async () => {
                                if (!window.confirm(`Delete ${expense.title} and put the money back?`)) return;
                                try {
                                  await expensesAPI.deleteExpense(expense._id);
                                  syncBooks(queryClient, 'expenses', 'projects', 'savings', 'wallet');
                                  toast.success('Expense removed and the money put back');
                                } catch (error) {
                                  toast.error(error.response?.data?.message || 'Could not delete that expense');
                                }
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-ink/60">
                  {expensesList.length ? `${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, expenses?.data?.pagination?.totalItems || expensesList.length)} of ${expenses?.data?.pagination?.totalItems || expensesList.length}` : '0'}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-ink/60">
                    Rows
                    <select className="ml-1 rounded border border-line bg-paper-card px-1 py-0.5" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}>
                      {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </label>
                  <button type="button" className="rounded border border-line px-2 py-1 text-xs disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                  <span className="text-xs text-ink/70">{currentPage} / {expenses?.data?.pagination?.totalPages || 1}</span>
                  <button type="button" className="rounded border border-line px-2 py-1 text-xs disabled:opacity-40" disabled={currentPage >= (expenses?.data?.pagination?.totalPages || 1)} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <CurrencyDollarIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-4">
                Start by adding your first expense.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expense Form */}
      {editExpense && (
        <SlideOver title={`Edit ${editExpense.title}`} subtitle="The difference is taken from, or returned to, the place you choose" onClose={() => setEditExpense(null)}>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const account = (savingsList?.data?.data || []).find((saving) => saving._id === editForm.savingsId);
              setSavingEdit(true);
              try {
                await expensesAPI.updateExpense(editExpense._id, {
                  title: editForm.title || editExpense.title,
                  amount: Number(editForm.amount),
                  category: editExpense.category,
                  subcategory: editExpense.subcategory,
                  source: account
                    ? { type: 'savings', sourceId: account._id, sourceName: account.name }
                    : { type: 'cash', sourceName: 'Wallet' },
                });
                syncBooks(queryClient, 'expenses', 'projects', 'savings', 'wallet');
                toast.success('Expense updated');
                setEditExpense(null);
              } catch (error) {
                toast.error(error.response?.data?.message || 'Could not update that expense');
              } finally {
                setSavingEdit(false);
              }
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input className="input" value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Take the money from</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`btn ${editForm.savingsId ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setEditForm((prev) => ({ ...prev, savingsId: '' }))}>Wallet</button>
                {(savingsList?.data?.data || []).map((saving) => (
                  <button key={saving._id} type="button" className={`btn ${editForm.savingsId === saving._id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setEditForm((prev) => ({ ...prev, savingsId: saving._id }))}>
                    {saving.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount (FRW)</label>
              <input type="number" min="0" className="input" required value={editForm.amount} onChange={(event) => setEditForm((prev) => ({ ...prev, amount: event.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setEditExpense(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </SlideOver>
      )}

      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Expenses;
