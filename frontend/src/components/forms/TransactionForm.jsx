import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import SlideOver from '../SlideOver';
import { transactionsAPI, contactsAPI, savingsAPI } from '../../services/api';
import CategoryPicker from '../CategoryPicker';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function TransactionForm({ transaction, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [repeat, setRepeat] = useState('once');
  const [depositTo, setDepositTo] = useState('wallet');
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
    savingsAPI.getSavings({ limit: 100 })
      .then((response) => setSavingsAccounts(response.data?.data || []))
      .catch(() => setSavingsAccounts([]));
  }, []);

  useEffect(() => {
    if (/salary/i.test(category || '')) setRepeat('monthly');
  }, [category]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (!isEditing && data.type === 'income') {
        payload.repeat = repeat;
        payload.depositTo = depositTo === 'wallet' ? 'wallet' : 'savings';
        payload.savingsId = depositTo === 'wallet' ? undefined : depositTo;
      }
      if (isEditing) {
        await transactionsAPI.updateTransaction(transaction._id, data);
        toast.success('Transaction updated successfully');
      } else {
        await transactionsAPI.createTransaction(payload);
        toast.success(data.type === 'income' && repeat !== 'once'
          ? 'Income added. The same amount comes again on that schedule.'
          : 'Transaction created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const category = watch('category');
  const subcategory = watch('subcategory');
  const type = watch('type');

  return (
    <SlideOver title={isEditing ? 'Edit transaction' : 'Add a transaction'} subtitle="Money" onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          {type === 'income' && (
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium text-ink">How often</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['once', 'Once'],
                    ['monthly', 'Every month'],
                    ['weekly', 'Every week'],
                    ['yearly', 'Every year']
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`btn ${repeat === id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setRepeat(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink/60">Salary and similar income can come every month. The office adds it again on that date.</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-ink">Put the money in</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`btn ${depositTo === 'wallet' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDepositTo('wallet')}
                  >
                    Wallet
                  </button>
                  {savingsAccounts.map((saving) => (
                    <button
                      key={saving._id}
                      type="button"
                      className={`btn ${depositTo === saving._id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setDepositTo(saving._id)}
                    >
                      {saving.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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

          </div>

          <div className="form-group">
            <label className="label">Category *</label>
            <input type="hidden" {...register('category', { required: 'Category is required' })} />
            <CategoryPicker
              id="transaction-category"
              value={category}
              onChange={(name) => setValue('category', name, { shouldValidate: true })}
            />
            {errors.category && (
              <p className="error-message">{errors.category.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Subcategory</label>
            <CategoryPicker
              id="transaction-subcategory"
              value={subcategory}
              onChange={(name) => setValue('subcategory', name)}
              placeholder="Search a detail already in the office"
            />
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
    </SlideOver>
  );
}

export default TransactionForm;


