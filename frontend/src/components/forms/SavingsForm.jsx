import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { savingsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function SavingsForm({ saving, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!saving;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      location: 'Bank',
      amount: 0,
      currency: 'FRW',
      targetAmount: '',
      targetDate: '',
      description: '',
      notes: '',
      accountNumber: '',
      interestRate: 0
    }
  });

  useEffect(() => {
    if (saving) {
      setValue('name', saving.name || '');
      setValue('location', saving.location || 'Bank');
      setValue('amount', saving.amount || 0);
      setValue('currency', saving.currency || 'FRW');
      setValue('targetAmount', saving.targetAmount || '');
      setValue('targetDate', saving.targetDate ? new Date(saving.targetDate).toISOString().split('T')[0] : '');
      setValue('description', saving.description || '');
      setValue('notes', saving.notes || '');
      setValue('accountNumber', saving.accountNumber || '');
      setValue('interestRate', saving.interestRate || 0);
    }
  }, [saving, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        await savingsAPI.updateSavings(saving._id, data);
        toast.success('Savings updated successfully');
      } else {
        await savingsAPI.createSavings(data);
        toast.success('Savings created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save savings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Savings' : 'Add New Savings'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="form-group">
            <label className="label">Name *</label>
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Emergency Fund, Vacation Savings"
            />
            {errors.name && (
              <p className="error-message">{errors.name.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Location *</label>
            <select
              {...register('location', { required: 'Location is required' })}
              className={`input ${errors.location ? 'input-error' : ''}`}
            >
              <option value="Bank">Bank</option>
              <option value="SACCO">SACCO</option>
              <option value="MTN MoMo">MTN MoMo</option>
              <option value="Cash">Cash</option>
            </select>
            {errors.location && (
              <p className="error-message">{errors.location.message}</p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Current Amount</label>
              <input
                {...register('amount', {
                  min: { value: 0, message: 'Amount must be positive' }
                })}
                type="number"
                step="0.01"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="error-message">{errors.amount.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Currency</label>
              <select
                {...register('currency')}
                className="input"
              >
                <option value="FRW">FRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Target Amount</label>
              <input
                {...register('targetAmount', {
                  min: { value: 0, message: 'Target amount must be positive' }
                })}
                type="number"
                step="0.01"
                className={`input ${errors.targetAmount ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.targetAmount && (
                <p className="error-message">{errors.targetAmount.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Target Date</label>
              <input
                {...register('targetDate')}
                type="date"
                className="input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Account Number</label>
            <input
              {...register('accountNumber')}
              type="text"
              className="input"
              placeholder="Account number (if applicable)"
            />
          </div>

          <div className="form-group">
            <label className="label">Interest Rate (%)</label>
            <input
              {...register('interestRate', {
                min: { value: 0, message: 'Interest rate must be positive' },
                max: { value: 100, message: 'Interest rate cannot exceed 100%' }
              })}
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={`input ${errors.interestRate ? 'input-error' : ''}`}
              placeholder="0"
            />
            {errors.interestRate && (
              <p className="error-message">{errors.interestRate.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <input
              {...register('description')}
              type="text"
              className="input"
              placeholder="Brief description of the savings goal"
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this savings account"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Savings' : 'Create Savings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SavingsForm;


