import { useState, useEffect } from 'react';
import { XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { expensesAPI, savingsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function ExpenseForm({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'food',
    subcategory: '',
    title: '',
    description: '',
    amount: '',
    currency: 'FRW',
    quantity: 1,
    unitPrice: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    location: '',
    vendor: '',
    tags: [],
    notes: '',
    receipt: '',
    photos: [],
    isBusinessExpense: false,
    isTaxDeductible: false,
    deductFrom: 'cash',
    savingsId: ''
  });

  const [savingsAccounts, setSavingsAccounts] = useState([]);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const response = await savingsAPI.getSavings({ limit: 100 });
        setSavingsAccounts(response.data.data || []);
      } catch (error) {
        // Non-blocking — savings picker just stays empty
      }
    };
    fetchSavings();
  }, []);

  const selectedSaving = savingsAccounts.find((s) => s._id === formData.savingsId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.deductFrom === 'savings' && !selectedSaving) {
      toast.error('Please choose which savings account to deduct from');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);

      if (formData.deductFrom === 'savings' && amount > selectedSaving.amount) {
        toast.error(`Insufficient funds in savings: ${selectedSaving.currency} ${selectedSaving.amount.toLocaleString()}`);
        setLoading(false);
        return;
      }

      const { deductFrom, savingsId, ...rest } = formData;
      const expenseData = {
        ...rest,
        amount,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        tags: formData.tags.filter(tag => tag.trim()),
        source: formData.deductFrom === 'savings' && selectedSaving
          ? { type: 'savings', sourceId: selectedSaving._id, sourceName: selectedSaving.name, amount }
          : { type: 'cash' }
      };

      await expensesAPI.createExpense(expenseData);
      toast.success('Expense added successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'housing': return '🏠';
      case 'utilities': return '⚡';
      case 'healthcare': return '🏥';
      case 'education': return '📚';
      case 'entertainment': return '🎬';
      case 'clothing': return '👕';
      case 'personal_care': return '💄';
      case 'business': return '💼';
      case 'animal_care': return '🐄';
      case 'agriculture': return '🌾';
      case 'investment': return '📈';
      case 'emergency': return '🚨';
      case 'gift': return '🎁';
      case 'donation': return '❤️';
      default: return '📝';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="food">🍽️ Food & Dining</option>
                  <option value="transport">🚗 Transportation</option>
                  <option value="housing">🏠 Housing & Rent</option>
                  <option value="utilities">⚡ Utilities</option>
                  <option value="healthcare">🏥 Healthcare</option>
                  <option value="education">📚 Education</option>
                  <option value="entertainment">🎬 Entertainment</option>
                  <option value="clothing">👕 Clothing</option>
                  <option value="personal_care">💄 Personal Care</option>
                  <option value="business">💼 Business</option>
                  <option value="animal_care">🐄 Animal Care</option>
                  <option value="agriculture">🌾 Agriculture</option>
                  <option value="investment">📈 Investment</option>
                  <option value="emergency">🚨 Emergency</option>
                  <option value="gift">🎁 Gifts</option>
                  <option value="donation">❤️ Donations</option>
                  <option value="other">📝 Other</option>
                </select>
              </div>

              {/* Deduct From (source) */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="deductFrom" className="block text-sm font-medium text-gray-700 mb-2">
                  Deduct from
                </label>
                <select
                  id="deductFrom"
                  name="deductFrom"
                  value={formData.deductFrom}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="cash">💰 Cash (not tracked)</option>
                  <option value="savings">🏦 Savings account</option>
                </select>
                {formData.deductFrom === 'savings' && savingsAccounts.length > 0 && (
                  <select
                    id="savingsId"
                    name="savingsId"
                    value={formData.savingsId}
                    onChange={handleInputChange}
                    className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select savings account…</option>
                    {savingsAccounts.map((saving) => (
                      <option key={saving._id} value={saving._id}>
                        {saving.name} — available: {saving.currency} {saving.amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
                {formData.deductFrom === 'savings' && !selectedSaving && (
                  <p className="mt-1 text-sm text-orange-600">Please choose which savings account to deduct from.</p>
                )}
              </div>

              {/* Subcategory */}
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Groceries, Gas, Rent"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Grocery shopping at Kigali Market"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional details about this expense..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="FRW">FRW</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Method */}
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Expense Date */}
              <div>
                <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  id="expenseDate"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Where did you make this expense?"
              />
            </div>

            {/* Vendor */}
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                Vendor/Store
              </label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Store, restaurant, or service provider name"
              />
            </div>

            {/* Business Expense Options */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Business Options</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isBusinessExpense"
                    name="isBusinessExpense"
                    checked={formData.isBusinessExpense}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isBusinessExpense" className="ml-2 text-sm text-gray-700">
                    This is a business expense
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTaxDeductible"
                    name="isTaxDeductible"
                    checked={formData.isTaxDeductible}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isTaxDeductible" className="ml-2 text-sm text-gray-700">
                    Tax deductible
                  </label>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none focus:bg-primary-500 focus:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a tag and press Enter"
                onKeyPress={addTag}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional notes about this expense..."
              />
            </div>

            {/* Receipt URL */}
            <div>
              <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                Receipt/Proof URL
              </label>
              <input
                type="url"
                id="receipt"
                name="receipt"
                value={formData.receipt}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com/receipt.jpg"
              />
            </div>

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
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </div>
                ) : (
                  'Add Expense'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ExpenseForm;
