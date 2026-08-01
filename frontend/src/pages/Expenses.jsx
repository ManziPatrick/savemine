import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, CurrencyDollarIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';
import { expensesAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildExpenseSections } from '../utils/exportSections';
import ExpenseForm from '../components/forms/ExpenseForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  const { data: expenses, isLoading, error } = useQuery(
    ['expenses', filter, categoryFilter, businessFilter, currentPage, pageSize],
    () => expensesAPI.getExpenses({ 
      category: categoryFilter || undefined,
      business: businessFilter === 'business' ? 'true' : businessFilter === 'personal' ? 'false' : undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const { data: expenseStats } = useQuery(
    'expenseStats',
    () => expensesAPI.getExpenseStats({ period: 'month' })
  );

  const handleFormSuccess = () => {
    setShowForm(false);
    setCurrentPage(1);
    queryClient.invalidateQueries('expenses');
    queryClient.invalidateQueries('expenseStats');
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
      other: 'Other'
    };
    return categories[category] || category;
  };

  const formatCurrency = (amount, currency = 'FRW') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600">Error loading expenses: {error.message}</div>;

  const expensesList = expenses?.data?.data || expenses?.data?.data || [];
  const stats = expenseStats?.data?.data || {};
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
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.overview?.totalAmount || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.overview?.businessExpenses || 0)}
              </div>
              <div className="text-sm text-gray-500">Business</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.overview?.personalExpenses || 0)}
              </div>
              <div className="text-sm text-gray-500">Personal</div>
            </div>
          </div>
        </div>
      )}

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            'food', 'transport', 'housing', 'utilities', 'healthcare', 
            'education', 'business', 'animal_care', 'agriculture'
          ].map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(categoryFilter === category ? '' : category)}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                categoryFilter === category
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{getCategoryIcon(category)}</span>
              {getCategoryName(category)}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['all', 'business', 'personal'].map((type) => (
            <button
              key={type}
              onClick={() => setBusinessFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                businessFilter === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="card">
        <div className="card-body">
          {expensesList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Category</th>
                      <th className="table-header-cell">Title</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Payment Method</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {expenses?.data?.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, expenses?.data?.pagination?.totalItems || 0)} of {expenses?.data?.pagination?.totalItems || 0} expenses
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
                      Page {currentPage} of {expenses?.data?.pagination?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === (expenses?.data?.pagination?.totalPages || 1)}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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
