import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { businessesAPI } from '../services/api';
import BusinessForm from '../components/forms/BusinessForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Business() {
  const [showForm, setShowForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [filter, setFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [incomeTarget, setIncomeTarget] = useState(null);
  const [expenseTarget, setExpenseTarget] = useState(null);
  const [incomeForm, setIncomeForm] = useState({ amount: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '' });
  const [savingIncome, setSavingIncome] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const queryClient = useQueryClient();

  const { data: businesses, isLoading, error } = useQuery(
    ['businesses', filter, businessTypeFilter, statusFilter, currentPage, pageSize],
    () => businessesAPI.getBusinesses({ 
      businessType: businessTypeFilter || undefined,
      status: statusFilter || undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const { data: businessStats } = useQuery(
    'businessStats',
    businessesAPI.getBusinessStats
  );

  const deleteMutation = useMutation(businessesAPI.deleteBusiness, {
    onSuccess: () => {
      queryClient.invalidateQueries('businesses');
      queryClient.invalidateQueries('businessStats');
      toast.success('Business deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete business');
    }
  });

  const handleEdit = (business) => {
    setSelectedBusiness(business);
    setShowForm(true);
  };

  const handleDelete = async (business) => {
    if (window.confirm(`Are you sure you want to delete "${business.name}"?`)) {
      deleteMutation.mutate(business._id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedBusiness(null);
    setCurrentPage(1);
    queryClient.invalidateQueries('businesses');
    queryClient.invalidateQueries('businessStats');
  };

  const addIncomeMutation = useMutation(({ id, data }) => businessesAPI.addMonthlyIncome(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('businesses');
      queryClient.invalidateQueries('businessStats');
      toast.success('Income recorded successfully');
      setIncomeTarget(null);
      setIncomeForm({ amount: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record income')
  });

  const addExpenseMutation = useMutation(({ id, data }) => businessesAPI.addMonthlyExpense(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('businesses');
      queryClient.invalidateQueries('businessStats');
      toast.success('Expense recorded successfully');
      setExpenseTarget(null);
      setExpenseForm({ amount: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record expense')
  });

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    setSavingIncome(true);
    addIncomeMutation.mutate(
      { id: incomeTarget._id, data: { ...incomeForm, amount: parseFloat(incomeForm.amount) } },
      { onSettled: () => setSavingIncome(false) }
    );
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    setSavingExpense(true);
    addExpenseMutation.mutate(
      { id: expenseTarget._id, data: { ...expenseForm, amount: parseFloat(expenseForm.amount) } },
      { onSettled: () => setSavingExpense(false) }
    );
  };

  const getBusinessTypeIcon = (type) => {
    switch (type) {
      case 'animal_farming': return '🐄';
      case 'agriculture': return '🌾';
      case 'trading': return '🏪';
      case 'services': return '🔧';
      case 'manufacturing': return '🏭';
      case 'retail': return '🛒';
      default: return '💼';
    }
  };

  const getBusinessTypeName = (type) => {
    const types = {
      animal_farming: 'Animal Farming',
      agriculture: 'Agriculture',
      trading: 'Trading',
      services: 'Services',
      manufacturing: 'Manufacturing',
      retail: 'Retail',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      planning: 'Planning',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return {
      name: statuses[status] || status,
      color: colors[status] || 'bg-gray-100 text-gray-800'
    };
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
  if (error) return <div className="text-center text-red-600">Error loading businesses: {error.message}</div>;

  const businessesList = businesses?.data?.data || businesses?.data || [];
  const stats = businessStats?.data?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your business ventures, animals, and agricultural projects
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary self-start sm:self-auto"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Business
        </button>
      </div>

      {/* Business Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.overview?.totalBusinesses || 0}
              </div>
              <div className="text-sm text-gray-500">Total Businesses</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.overview?.activeBusinesses || 0}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.overview?.totalRevenue || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.overview?.totalProfit || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Profit</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className={`text-2xl font-bold ${(stats.overview?.monthlyProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(stats.overview?.monthlyProfit || 0)}
              </div>
              <div className="text-sm text-gray-500">Monthly Profit</div>
            </div>
          </div>
        </div>
      )}

      {/* Business Performance Overview */}
      {stats?.byType && stats.byType.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Business Performance by Type</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byType.map((businessType, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getBusinessTypeIcon(businessType._id)}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getBusinessTypeName(businessType._id)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {businessType.count} businesses
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(businessType.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ROI: {businessType.averageROI?.toFixed(1)}%
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
          {['', 'animal_farming', 'agriculture', 'trading', 'services', 'manufacturing', 'retail'].map((type) => (
            <button
              key={type}
              onClick={() => setBusinessTypeFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                businessTypeFilter === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{getBusinessTypeIcon(type)}</span>
              {type ? getBusinessTypeName(type) : 'All Types'}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['', 'planning', 'active', 'paused', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                statusFilter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status || 'All Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Businesses List */}
      <div className="card">
        <div className="card-body">
          {businessesList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Business Name</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Revenue</th>
                      <th className="table-header-cell">Profit</th>
                      <th className="table-header-cell">ROI</th>
                      <th className="table-header-cell">Started</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {businessesList.map((business) => {
                      const profit = business.totalRevenue - business.totalExpenses;
                      const roi = business.initialInvestment > 0 ? ((profit / business.initialInvestment) * 100).toFixed(1) : 0;
                      const status = getStatusBadge(business.status);
                      
                      return (
                        <tr key={business._id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{getBusinessTypeIcon(business.businessType)}</span>
                              <span className="badge badge-info">
                                {getBusinessTypeName(business.businessType)}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">
                                {business.name}
                              </div>
                              {business.description && (
                                <div className="text-sm text-gray-500">
                                  {business.description}
                                </div>
                              )}
                              {business.location && (
                                <div className="text-sm text-gray-500">
                                  📍 {business.location}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${status.color}`}>
                              {status.name}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="font-medium text-green-600">
                              {formatCurrency(business.totalRevenue)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Monthly: {formatCurrency(business.monthlyRevenue)}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Monthly: {formatCurrency(business.monthlyRevenue - business.monthlyExpenses)}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {roi}%
                            </div>
                          </td>
                          <td className="table-cell">
                            {formatDate(business.startDate)}
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => { setIncomeTarget(business); }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700 hover:bg-green-100"
                                title="Record income for this business"
                              >
                                <ArrowTrendingUpIcon className="h-3.5 w-3.5 mr-1" />
                                Income
                              </button>
                              <button
                                onClick={() => { setExpenseTarget(business); }}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-orange-50 text-orange-700 hover:bg-orange-100"
                                title="Record expense for this business"
                              >
                                <ArrowTrendingDownIcon className="h-3.5 w-3.5 mr-1" />
                                Expense
                              </button>
                              <button
                                onClick={() => handleEdit(business)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit business"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(business)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete business"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {businesses?.data?.pagination?.totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, businesses?.data?.pagination?.totalItems || 0)} of {businesses?.data?.pagination?.totalItems || 0} businesses
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
                      Page {currentPage} of {businesses?.data?.pagination?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === (businesses?.data?.pagination?.totalPages || 1)}
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
                <BuildingOfficeIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-500 mb-4">
                Start by adding your first business venture.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Business
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Business Form */}
      {showForm && (
        <BusinessForm
          business={selectedBusiness}
          onClose={() => {
            setShowForm(false);
            setSelectedBusiness(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Add Income Modal */}
      {incomeTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Record Income for {incomeTarget.name}</h2>
                <button onClick={() => setIncomeTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW) *</label>
                  <input
                    type="number"
                    min="0"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 250000"
                    autoFocus
                    required
                  />
                  <p className="mt-1 text-xs text-gray-400">Adds to this business's monthly and total income.</p>
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

      {/* Add Expense Modal */}
      {expenseTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Record Expense for {expenseTarget.name}</h2>
                <button onClick={() => setExpenseTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (FRW) *</label>
                  <input
                    type="number"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 50000"
                    autoFocus
                    required
                  />
                  <p className="mt-1 text-xs text-gray-400">Adds to this business's monthly and total expenses.</p>
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
    </div>
  );
}

export default Business;
