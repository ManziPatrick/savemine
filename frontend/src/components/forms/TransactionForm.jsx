import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { transactionsAPI, contactsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function TransactionForm({ transaction, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      type: 'expense',
      amount: '',
      currency: 'FRW',
      category: '',
      subcategory: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      contactId: '',
      tags: []
    }
  });

  const transactionType = watch('type');

  useEffect(() => {
    if (transaction) {
      setValue('type', transaction.type || 'expense');
      setValue('amount', transaction.amount || '');
      setValue('currency', transaction.currency || 'FRW');
      setValue('category', transaction.category || '');
      setValue('subcategory', transaction.subcategory || '');
      setValue('date', transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
      setValue('description', transaction.description || '');
      setValue('notes', transaction.notes || '');
      setValue('contactId', transaction.contactId?._id || '');
      setValue('tags', transaction.tags || []);
    }
  }, [transaction, setValue]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const response = await contactsAPI.getContacts({ limit: 100 });
        setContacts(response.data.data);
      } catch (error) {
        toast.error('Failed to load contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        await transactionsAPI.updateTransaction(transaction._id, data);
        toast.success('Transaction updated successfully');
      } else {
        await transactionsAPI.createTransaction(data);
        toast.success('Transaction created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const commonCategories = {
    income: ['Salary', 'Business', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Shopping', 'Other']
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
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
            <label className="label">Type *</label>
            <select
              {...register('type', { required: 'Type is required' })}
              className={`input ${errors.type ? 'input-error' : ''}`}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            {errors.type && (
              <p className="error-message">{errors.type.message}</p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Amount *</label>
              <input
                {...register('amount', {
                  required: 'Amount is required',
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
              <label className="label">Category *</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className={`input ${errors.category ? 'input-error' : ''}`}
              >
                <option value="">Select category</option>
                {commonCategories[transactionType]?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="error-message">{errors.category.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label">Subcategory</label>
              <input
                {...register('subcategory')}
                type="text"
                className="input"
                placeholder="Optional subcategory"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Date *</label>
            <input
              {...register('date', { required: 'Date is required' })}
              type="date"
              className={`input ${errors.date ? 'input-error' : ''}`}
            />
            {errors.date && (
              <p className="error-message">{errors.date.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Contact</label>
            <select
              {...register('contactId')}
              className="input"
              disabled={loadingContacts}
            >
              <option value="">Select a contact (optional)</option>
              {contacts.map((contact) => (
                <option key={contact._id} value={contact._id}>
                  {contact.name} ({contact.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <input
              {...register('description')}
              type="text"
              className="input"
              placeholder="Brief description of the transaction"
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this transaction"
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
                isEditing ? 'Update Transaction' : 'Create Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;


