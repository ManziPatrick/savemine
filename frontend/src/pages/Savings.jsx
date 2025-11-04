import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, CircleStackIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { savingsAPI } from '../services/api';
import SavingsForm from '../components/forms/SavingsForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Savings() {
  const [showForm, setShowForm] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedSavingForAction, setSelectedSavingForAction] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: savings, isLoading, error } = useQuery(
    ['savings', filter],
    () => savingsAPI.getSavings({ location: filter === 'all' ? undefined : filter })
  );

  const deleteMutation = useMutation(savingsAPI.deleteSavings, {
    onSuccess: () => {
      queryClient.invalidateQueries('savings');
      toast.success('Savings deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete savings');
    }
  });

  const addAmountMutation = useMutation(
    ({ id, data }) => savingsAPI.addAmount(id, data.amount, data.notes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('savings');
        toast.success('Amount added successfully');
        setShowAddModal(false);
        setSelectedSavingForAction(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add amount');
      }
    }
  );

  const withdrawAmountMutation = useMutation(
    ({ id, data }) => savingsAPI.withdrawAmount(id, data.amount, data.notes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('savings');
        toast.success('Amount withdrawn successfully');
        setShowWithdrawModal(false);
        setSelectedSavingForAction(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to withdraw amount');
      }
    }
  );

  const handleEdit = (saving) => {
    setSelectedSaving(saving);
    setShowForm(true);
  };

  const handleDelete = async (saving) => {
    if (window.confirm(`Are you sure you want to delete ${saving.name}?`)) {
      deleteMutation.mutate(saving._id);
    }
  };

  const handleAddAmount = (saving) => {
    setSelectedSavingForAction(saving);
    setShowAddModal(true);
  };

  const handleWithdrawAmount = (saving) => {
    setSelectedSavingForAction(saving);
    setShowWithdrawModal(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('savings');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedSaving(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const notes = formData.get('notes');
    
    if (amount <= 0) {
      toast.error('Amount must be positive');
      return;
    }

    addAmountMutation.mutate({
      id: selectedSavingForAction._id,
      data: { amount, notes }
    });
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const notes = formData.get('notes');
    
    if (amount <= 0) {
      toast.error('Amount must be positive');
      return;
    }

    if (amount > selectedSavingForAction.amount) {
      toast.error('Insufficient funds');
      return;
    }

    withdrawAmountMutation.mutate({
      id: selectedSavingForAction._id,
      data: { amount, notes }
    });
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
        <p className="text-red-600">Error loading savings: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Savings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your savings across different locations
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Savings
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {['all', 'Bank', 'SACCO', 'MTN MoMo', 'Cash'].map((location) => (
          <button
            key={location}
            onClick={() => setFilter(location)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
              filter === location
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {location}
          </button>
        ))}
      </div>

      {/* Savings List */}
      <div className="card">
        <div className="card-body">
          {savings?.data?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Location</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Target</th>
                    <th className="table-header-cell">Progress</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {savings.data.data.map((saving) => (
                    <tr key={saving._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {saving.name}
                          </div>
                          {saving.description && (
                            <div className="text-sm text-gray-500">
                              {saving.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {saving.location}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">
                          {saving.currency} {saving.amount.toLocaleString()}
                        </div>
                        {saving.interestRate > 0 && (
                          <div className="text-sm text-gray-500">
                            {saving.interestRate}% interest
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        {saving.targetAmount ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {saving.currency} {saving.targetAmount.toLocaleString()}
                            </div>
                            {saving.targetDate && (
                              <div className="text-sm text-gray-500">
                                Target: {new Date(saving.targetDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No target</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {saving.targetAmount ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {saving.progressPercentage}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(saving.progressPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddAmount(saving)}
                            className="text-green-600 hover:text-green-900"
                            title="Add amount"
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleWithdrawAmount(saving)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Withdraw amount"
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(saving)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit savings"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(saving)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete savings"
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
              <p className="text-gray-500">No savings found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Savings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Savings Form Modal */}
      {showForm && (
        <SavingsForm
          saving={selectedSaving}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Add Amount Modal */}
      {showAddModal && selectedSavingForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Amount to {selectedSavingForAction.name}
              </h3>
              <form onSubmit={handleAddSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="amount"
                      required
                      className="input"
                      placeholder="Enter amount to add"
                    />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="input"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedSavingForAction(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addAmountMutation.isLoading}
                  >
                    {addAmountMutation.isLoading ? 'Adding...' : 'Add Amount'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Amount Modal */}
      {showWithdrawModal && selectedSavingForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Withdraw from {selectedSavingForAction.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Available: {selectedSavingForAction.currency} {selectedSavingForAction.amount.toLocaleString()}
              </p>
              <form onSubmit={handleWithdrawSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedSavingForAction.amount}
                      name="amount"
                      required
                      className="input"
                      placeholder="Enter amount to withdraw"
                    />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="input"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setSelectedSavingForAction(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={withdrawAmountMutation.isLoading}
                  >
                    {withdrawAmountMutation.isLoading ? 'Withdrawing...' : 'Withdraw Amount'}
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

export default Savings;
