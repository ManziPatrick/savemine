import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, ArrowTrendingUpIcon, ClockIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { investmentsAPI } from '../services/api';
import InvestmentForm from '../components/forms/InvestmentForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Investments() {
  const [showForm, setShowForm] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [filter, setFilter] = useState('all');
  const [investmentTypeFilter, setInvestmentTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  const { data: investments, isLoading, error } = useQuery(
    ['investments', filter, investmentTypeFilter, riskFilter, currentPage, pageSize],
    () => investmentsAPI.getInvestments({ 
      investmentType: investmentTypeFilter || undefined,
      riskLevel: riskFilter || undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const { data: investmentStats } = useQuery(
    'investmentStats',
    investmentsAPI.getInvestmentStats
  );

  const deleteMutation = useMutation(investmentsAPI.deleteInvestment, {
    onSuccess: () => {
      queryClient.invalidateQueries('investments');
      queryClient.invalidateQueries('investmentStats');
      toast.success('Investment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete investment');
    }
  });

  const handleEdit = (investment) => {
    setSelectedInvestment(investment);
    setShowForm(true);
  };

  const handleDelete = async (investment) => {
    if (window.confirm(`Are you sure you want to delete "${investment.name}"?`)) {
      deleteMutation.mutate(investment._id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedInvestment(null);
    setCurrentPage(1);
    queryClient.invalidateQueries('investments');
    queryClient.invalidateQueries('investmentStats');
  };

  const getInvestmentTypeIcon = (type) => {
    switch (type) {
      case 'savings': return '💰';
      case 'stocks': return '📈';
      case 'bonds': return '📊';
      case 'real_estate': return '🏠';
      case 'crypto': return '₿';
      case 'business': return '🏢';
      case 'animals': return '🐄';
      case 'agriculture': return '🌾';
      default: return '💼';
    }
  };

  const getInvestmentTypeName = (type) => {
    const types = {
      savings: 'Savings',
      stocks: 'Stocks',
      bonds: 'Bonds',
      real_estate: 'Real Estate',
      crypto: 'Cryptocurrency',
      business: 'Business',
      animals: 'Animals',
      agriculture: 'Agriculture',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getRiskBadge = (risk) => {
    const risks = {
      low: { name: 'Low Risk', color: 'bg-green-100 text-green-800' },
      medium: { name: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' },
      high: { name: 'High Risk', color: 'bg-orange-100 text-orange-800' },
      very_high: { name: 'Very High Risk', color: 'bg-red-100 text-red-800' }
    };
    return risks[risk] || { name: risk, color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusBadge = (status) => {
    const statuses = {
      active: { name: 'Active', color: 'bg-green-100 text-green-800' },
      matured: { name: 'Matured', color: 'bg-blue-100 text-blue-800' },
      cancelled: { name: 'Cancelled', color: 'bg-red-100 text-red-800' },
      transferred: { name: 'Transferred', color: 'bg-purple-100 text-purple-800' }
    };
    return statuses[status] || { name: status, color: 'bg-gray-100 text-gray-800' };
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

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600">Error loading investments: {error.message}</div>;

  const investmentsList = investments?.data?.data || investments?.data || [];
  const stats = investmentStats?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your investments, returns, and portfolio performance
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Investment
        </button>
      </div>

      {/* Investment Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.overview?.totalInvestments || 0}
              </div>
              <div className="text-sm text-gray-500">Total Investments</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.overview?.totalInvested || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Invested</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.overview?.currentValue || 0)}
              </div>
              <div className="text-sm text-gray-500">Current Value</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className={`text-2xl font-bold ${(stats.overview?.totalReturnPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(stats.overview?.totalReturnPercentage || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Return</div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Performance */}
      {stats?.byType && stats.byType.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Portfolio by Investment Type</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byType.map((investmentType, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getInvestmentTypeIcon(investmentType._id)}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getInvestmentTypeName(investmentType._id)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {investmentType.count} investments
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(investmentType.totalInvested)}
                    </div>
                    <div className={`text-sm ${investmentType.avgReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Avg: {formatPercentage(investmentType.avgReturnPercentage)}
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
        <div className="flex space-x-2">
          {['', 'savings', 'stocks', 'bonds', 'real_estate', 'crypto', 'business', 'animals', 'agriculture'].map((type) => (
            <button
              key={type}
              onClick={() => setInvestmentTypeFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                investmentTypeFilter === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{getInvestmentTypeIcon(type)}</span>
              {type ? getInvestmentTypeName(type) : 'All Types'}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {['', 'low', 'medium', 'high', 'very_high'].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                riskFilter === risk
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {risk ? getRiskBadge(risk).name : 'All Risks'}
            </button>
          ))}
        </div>
      </div>

      {/* Investments List */}
      <div className="card">
        <div className="card-body">
          {investmentsList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Investment</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Invested</th>
                      <th className="table-header-cell">Current Value</th>
                      <th className="table-header-cell">Return</th>
                      <th className="table-header-cell">Risk</th>
                      <th className="table-header-cell">Maturity</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {investmentsList.map((investment) => {
                      const totalReturn = investment.currentValue - investment.initialAmount;
                      const returnPercentage = investment.initialAmount > 0 ? ((totalReturn / investment.initialAmount) * 100).toFixed(1) : 0;
                      const risk = getRiskBadge(investment.riskLevel);
                      const status = getStatusBadge(investment.status);
                      const isMature = investment.maturityDate && new Date() >= new Date(investment.maturityDate);
                      
                      return (
                        <tr key={investment._id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{getInvestmentTypeIcon(investment.investmentType)}</span>
                              <span className="badge badge-info">
                                {getInvestmentTypeName(investment.investmentType)}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">
                                {investment.name}
                              </div>
                              {investment.symbol && (
                                <div className="text-sm text-gray-500">
                                  Symbol: {investment.symbol}
                                </div>
                              )}
                              {investment.description && (
                                <div className="text-sm text-gray-500">
                                  {investment.description}
                                </div>
                              )}
                              {investment.location && (
                                <div className="text-sm text-gray-500">
                                  📍 {investment.location}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-col space-y-1">
                              <span className={`badge ${status.color}`}>
                                {status.name}
                              </span>
                              {isMature && (
                                <span className="badge badge-warning text-xs">
                                  Matured
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(investment.initialAmount, investment.currency)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(investment.startDate)}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="font-medium text-blue-600">
                              {formatCurrency(investment.currentValue, investment.currency)}
                            </div>
                            {investment.targetAmount && (
                              <div className="text-sm text-gray-500">
                                Target: {formatCurrency(investment.targetAmount, investment.currency)}
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className={`font-medium ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(totalReturn, investment.currency)}
                            </div>
                            <div className={`text-sm ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(returnPercentage)}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${risk.color}`}>
                              {risk.name}
                            </span>
                          </td>
                          <td className="table-cell">
                            {investment.maturityDate ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {formatDate(investment.maturityDate)}
                                </div>
                                {!isMature && (
                                  <div className="text-xs text-gray-500">
                                    {Math.ceil((new Date(investment.maturityDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(investment)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit investment"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(investment)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete investment"
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
              {investments?.data?.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, investments?.data?.pagination?.totalItems || 0)} of {investments?.data?.pagination?.totalItems || 0} investments
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
                      Page {currentPage} of {investments?.data?.pagination?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === (investments?.data?.pagination?.totalPages || 1)}
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
                <ArrowTrendingUpIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No investments found</h3>
              <p className="text-gray-500 mb-4">
                Start building your investment portfolio today.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Investment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Investment Form */}
      {showForm && (
        <InvestmentForm
          investment={selectedInvestment}
          onClose={() => {
            setShowForm(false);
            setSelectedInvestment(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Investments;
