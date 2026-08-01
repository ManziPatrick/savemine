import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CurrencyDollarIcon, ClockIcon, ExclamationTriangleIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { loansAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildLoanSections } from '../utils/exportSections';
import LoanForm from '../components/forms/LoanForm';
import PaymentForm from '../components/forms/PaymentForm';
import ImportLoansForm from '../components/forms/ImportLoansForm';
import SMSTest from '../components/SMSTest';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Loans() {
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSMSTest, setShowSMSTest] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  const { data: loans, isLoading, error } = useQuery(
    ['loans', filter, loanTypeFilter, currentPage, pageSize],
    () => loansAPI.getLoans({ 
      status: filter === 'all' ? undefined : filter,
      loanType: loanTypeFilter || undefined,
      page: currentPage,
      limit: pageSize
    })
  );

  const { data: loanStats } = useQuery(
    'loanStats',
    loansAPI.getLoanStats
  );

  const { data: overdueLoans } = useQuery(
    'overdueLoans',
    loansAPI.getOverdueLoans,
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const deleteMutation = useMutation(loansAPI.deleteLoan, {
    onSuccess: () => {
      queryClient.invalidateQueries('loans');
      queryClient.invalidateQueries('loanStats');
      toast.success('Loan deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete loan');
    }
  });

  const handleEdit = (loan) => {
    setSelectedLoan(loan);
    setShowForm(true);
  };

  const handleAddPayment = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentForm(true);
  };

  const handleDelete = async (loan) => {
    if (window.confirm(`Are you sure you want to delete the loan to ${loan.contactId?.name}?`)) {
      deleteMutation.mutate(loan._id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedLoan(null);
    setCurrentPage(1);
    queryClient.invalidateQueries('loans');
    queryClient.invalidateQueries('loanStats');
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedLoan(null);
    queryClient.invalidateQueries('loans');
    queryClient.invalidateQueries('loanStats');
  };

  const handleImportSuccess = () => {
    setShowImportForm(false);
    setCurrentPage(1);
    queryClient.invalidateQueries('loans');
    queryClient.invalidateQueries('loanStats');
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleLoanTypeFilterChange = (newType) => {
    setLoanTypeFilter(newType);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      overdue: 'badge-danger',
      completed: 'badge-info',
      defaulted: 'badge-warning',
      cancelled: 'badge-secondary'
    };
    return `badge ${badges[status] || 'badge-secondary'}`;
  };

  const getLoanTypeBadge = (type) => {
    const types = {
      personal: 'Personal',
      business: 'Business',
      animal: 'Animal',
      emergency: 'Emergency',
      investment: 'Investment'
    };
    return types[type] || type;
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

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600">Error loading loans: {error.message}</div>;

  const loansList = loans?.data?.data || loans?.data || [];
  const stats = loanStats?.data?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track loans, payments, and manage debtors
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowSMSTest(true)}
            className="btn btn-secondary"
            title="Test SMS functionality"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Test SMS
          </button>
          <ExportButtons
            filename="loans"
            title="Loans Report"
            sections={buildLoanSections(loansList)}
          />
          <button 
            onClick={() => setShowImportForm(true)}
            className="btn btn-secondary"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Import
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Loan
          </button>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueLoans?.data?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {overdueLoans.data.length} Overdue Loan{overdueLoans.data.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-600">
                You have loans that are past their due date. Consider sending reminders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loan Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600">
                {stats.overview?.totalLoans || 0}
              </div>
              <div className="text-sm text-gray-500">Total Loans</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.overview?.totalAmount || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.overview?.totalRemaining || 0)}
              </div>
              <div className="text-sm text-gray-500">Outstanding</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.overview?.overdueLoans || 0}
              </div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'overdue', 'completed', 'defaulted'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                filter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['', 'personal', 'business', 'animal', 'emergency', 'investment'].map((type) => (
            <button
              key={type}
              onClick={() => handleLoanTypeFilterChange(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                loanTypeFilter === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type || 'All Types'}
            </button>
          ))}
        </div>
      </div>

      {/* Loans List */}
      <div className="card">
        <div className="card-body">
          {loansList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Borrower</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Due Date</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {loansList.map((loan) => {
                      const daysUntilDue = getDaysUntilDue(loan.dueDate);
                      const isOverdue = daysUntilDue < 0;
                      
                      return (
                        <tr key={loan._id} className="table-row">
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">
                                {loan.contactId?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {loan.contactId?.phone || 'No phone'}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="badge badge-info">
                              {getLoanTypeBadge(loan.loanType)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatCurrency(loan.totalAmount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Paid: {formatCurrency(loan.amountPaid || 0)}
                              </div>
                              <div className="text-sm text-red-600">
                                Remaining: {formatCurrency(loan.remainingAmount)}
                              </div>
                              {loan.source && (
                                <div className="text-xs text-blue-600 mt-1">
                                  From: {loan.source.sourceName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                              <span className={isOverdue ? 'text-red-600' : 'text-gray-900'}>
                                {formatDate(loan.dueDate)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={getStatusBadge(loan.status)}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAddPayment(loan)}
                                className="text-green-600 hover:text-green-900"
                                title="Add payment"
                                disabled={loan.status === 'completed'}
                              >
                                <CurrencyDollarIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(loan)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit loan"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(loan)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete loan"
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
              {loans?.data?.pagination?.totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mt-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, loans?.data?.pagination?.totalItems || 0)} of {loans?.data?.pagination?.totalItems || 0} loans
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 text-sm border rounded-md"
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                    
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, loans?.data?.pagination?.totalPages || 1) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min((loans?.data?.pagination?.totalPages || 1) - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === pageNum
                              ? 'bg-primary-100 text-primary-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === (loans?.data?.pagination?.totalPages || 1)}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(loans?.data?.pagination?.totalPages || 1)}
                      disabled={currentPage === (loans?.data?.pagination?.totalPages || 1)}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Last
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
              <p className="text-gray-500 mb-4">
                {filter !== 'all' ? `No ${filter} loans found.` : 'Start by adding your first loan.'}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Loan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showForm && (
        <LoanForm
          loan={selectedLoan}
          onClose={() => {
            setShowForm(false);
            setSelectedLoan(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showPaymentForm && (
        <PaymentForm
          loan={selectedLoan}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedLoan(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showImportForm && (
        <ImportLoansForm
          onClose={() => setShowImportForm(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {showSMSTest && (
        <SMSTest
          onClose={() => setShowSMSTest(false)}
        />
      )}
    </div>
  );
}

export default Loans;