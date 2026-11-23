import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import SlideOver from '../SlideOver';
import { loansAPI } from '../../services/api';
import { uploadProof } from '../../utils/uploadProof';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function PaymentForm({ loan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    receipt: ''
  });

  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const paymentAmount = parseFloat(formData.amount);
    
    if (paymentAmount > loan.remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(loan.remainingAmount)}`);
      return;
    }

    setLoading(true);
    try {
      const receipt = await uploadProof(receiptFile, {
        title: `Payment ${loan?.title || loan?.name || ''}`.trim(),
        relatedEntity: 'loan',
      });
      await loansAPI.addPayment(loan._id, {
        amount: paymentAmount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        receipt
      });

      toast.success('Payment added successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SlideOver title="Add a payment" subtitle="Loans" onClose={onClose}>

          {/* Loan Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Loan Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Borrower</label>
                <p className="text-gray-900">{loan.contactId?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{loan.contactId?.phone || 'No phone'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Loan Type</label>
                <p className="text-gray-900 capitalize">{loan.loanType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Due Date</label>
                <p className="text-gray-900">{formatDate(loan.dueDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-gray-900 font-semibold">{formatCurrency(loan.totalAmount)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                <p className="text-green-600 font-semibold">{formatCurrency(loan.amountPaid || 0)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Remaining Amount</label>
                <p className="text-red-600 font-bold text-lg">{formatCurrency(loan.remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                  max={loan.remainingAmount}
                  step="0.01"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Maximum: {formatCurrency(loan.remainingAmount)}
              </p>
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment-receipt" className="block text-sm font-medium text-gray-700 mb-2">
                Receipt
              </label>
              <input
                id="payment-receipt"
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="input"
                onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
              />
              {receiptFile && <p className="mt-1 text-sm text-ink/60">{receiptFile.name}</p>}
            </div>

            {/* Payment Summary */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Payment Amount:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(parseFloat(formData.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Current Balance:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(loan.remainingAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1">
                    <span className="text-blue-700 font-medium">New Balance:</span>
                    <span className="font-bold text-blue-900">
                      {formatCurrency(loan.remainingAmount - parseFloat(formData.amount))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
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
                disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </div>
                ) : (
                  'Add Payment'
                )}
              </button>
            </div>
          </form>
    </SlideOver>
  );
}

export default PaymentForm;
