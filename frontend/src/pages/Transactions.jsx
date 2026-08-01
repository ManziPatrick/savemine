import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { transactionsAPI } from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { buildTransactionSections } from '../utils/exportSections';
import TransactionForm from '../components/forms/TransactionForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: transactions, isLoading, error } = useQuery(
    ['transactions', filter, typeFilter, categoryFilter],
    () => transactionsAPI.getTransactions({ 
      status: filter === 'all' ? undefined : filter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      category: categoryFilter || undefined,
      limit: 50
    })
  );

  const deleteMutation = useMutation(transactionsAPI.deleteTransaction, {
    onSuccess: () => {
      queryClient.invalidateQueries('transactions');
      toast.success('Transaction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    }
  });

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (transaction) => {
    if (window.confirm(`Are you sure you want to delete this ${transaction.type} transaction?`)) {
      deleteMutation.mutate(transaction._id);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('transactions');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading transactions: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your income and expenses
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <ExportButtons
            filename="transactions"
            title="Transactions Report"
            sections={buildTransactionSections(transactions?.data?.data || [])}
          />
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'completed', 'pending', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
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
          {['all', 'income', 'expense'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                typeFilter === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Filter by category..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="card-body">
          {transactions?.data?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {transactions.data.data.map((transaction) => (
                    <tr key={transaction._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-md mr-3 ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <span className={`badge ${
                            transaction.type === 'income' ? 'badge-success' : 'badge-danger'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.category}
                          </div>
                          {transaction.subcategory && (
                            <div className="text-sm text-gray-500">
                              {transaction.subcategory}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {transaction.contactId ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.contactId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.contactId.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit transaction"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete transaction"
                            disabled={deleteMutation.isLoading}
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={selectedTransaction}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Transactions;
