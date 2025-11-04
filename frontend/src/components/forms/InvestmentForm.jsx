import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline';
import { investmentsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function InvestmentForm({ investment, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    investmentType: 'savings',
    name: '',
    description: '',
    symbol: '',
    initialAmount: '',
    currentValue: '',
    currency: 'FRW',
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    interestRate: '',
    riskLevel: 'medium',
    status: 'active',
    isRecurring: false,
    recurringAmount: '',
    recurringFrequency: 'monthly',
    targetAmount: '',
    targetDate: '',
    targetReturn: '',
    location: '',
    accountNumber: '',
    broker: '',
    tags: [],
    notes: ''
  });

  useEffect(() => {
    if (investment) {
      setFormData({
        investmentType: investment.investmentType || 'savings',
        name: investment.name || '',
        description: investment.description || '',
        symbol: investment.symbol || '',
        initialAmount: investment.initialAmount || '',
        currentValue: investment.currentValue || '',
        currency: investment.currency || 'FRW',
        startDate: investment.startDate ? new Date(investment.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        maturityDate: investment.maturityDate ? new Date(investment.maturityDate).toISOString().split('T')[0] : '',
        interestRate: investment.interestRate || '',
        riskLevel: investment.riskLevel || 'medium',
        status: investment.status || 'active',
        isRecurring: investment.isRecurring || false,
        recurringAmount: investment.recurringAmount || '',
        recurringFrequency: investment.recurringFrequency || 'monthly',
        targetAmount: investment.targetAmount || '',
        targetDate: investment.targetDate ? new Date(investment.targetDate).toISOString().split('T')[0] : '',
        targetReturn: investment.targetReturn || '',
        location: investment.location || '',
        accountNumber: investment.accountNumber || '',
        broker: investment.broker || '',
        tags: investment.tags || [],
        notes: investment.notes || ''
      });
    }
  }, [investment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.initialAmount || !formData.currentValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const investmentData = {
        ...formData,
        initialAmount: parseFloat(formData.initialAmount),
        currentValue: parseFloat(formData.currentValue),
        interestRate: parseFloat(formData.interestRate) || 0,
        recurringAmount: parseFloat(formData.recurringAmount) || null,
        targetAmount: parseFloat(formData.targetAmount) || null,
        targetReturn: parseFloat(formData.targetReturn) || null,
        maturityDate: formData.maturityDate || null,
        targetDate: formData.targetDate || null,
        tags: formData.tags.filter(tag => tag.trim())
      };

      if (investment) {
        await investmentsAPI.updateInvestment(investment._id, investmentData);
        toast.success('Investment updated successfully');
      } else {
        await investmentsAPI.createInvestment(investmentData);
        toast.success('Investment added successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save investment');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-primary-600" />
              {investment ? 'Edit Investment' : 'Add New Investment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Investment Type and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="investmentType" className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Type *
                </label>
                <select
                  id="investmentType"
                  name="investmentType"
                  value={formData.investmentType}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="savings">💰 Savings</option>
                  <option value="stocks">📈 Stocks</option>
                  <option value="bonds">📊 Bonds</option>
                  <option value="real_estate">🏠 Real Estate</option>
                  <option value="crypto">₿ Cryptocurrency</option>
                  <option value="business">🏢 Business</option>
                  <option value="animals">🐄 Animals</option>
                  <option value="agriculture">🌾 Agriculture</option>
                  <option value="other">💼 Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Apple Stock, House in Kigali"
                  required
                />
              </div>
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
                placeholder="Describe your investment..."
              />
            </div>

            {/* Symbol (for stocks/crypto) */}
            {['stocks', 'crypto'].includes(formData.investmentType) && (
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol/Ticker
                </label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., AAPL, BTC, ETH"
                />
              </div>
            )}

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Amount *
                </label>
                <input
                  type="number"
                  id="initialAmount"
                  name="initialAmount"
                  value={formData.initialAmount}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="currentValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value *
                </label>
                <input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

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
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="maturityDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Maturity Date
                </label>
                <input
                  type="date"
                  id="maturityDate"
                  name="maturityDate"
                  value={formData.maturityDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Risk and Interest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="riskLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Level
                </label>
                <select
                  id="riskLevel"
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="very_high">Very High Risk</option>
                </select>
              </div>

              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">Active</option>
                <option value="matured">Matured</option>
                <option value="cancelled">Cancelled</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            {/* Recurring Investment */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recurring Investment</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                    This is a recurring investment
                  </label>
                </div>
                
                {formData.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="recurringAmount" className="block text-sm font-medium text-gray-700 mb-2">
                        Recurring Amount
                      </label>
                      <input
                        type="number"
                        id="recurringAmount"
                        name="recurringAmount"
                        value={formData.recurringAmount}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="recurringFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <select
                        id="recurringFrequency"
                        name="recurringFrequency"
                        value={formData.recurringFrequency}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Goals and Targets */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Goals & Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    id="targetAmount"
                    name="targetAmount"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    id="targetDate"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="targetReturn" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Return (%)
                  </label>
                  <input
                    type="number"
                    id="targetReturn"
                    name="targetReturn"
                    value={formData.targetReturn}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Location and Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Where is this investment located?"
                />
              </div>

              <div>
                <label htmlFor="broker" className="block text-sm font-medium text-gray-700 mb-2">
                  Broker/Platform
                </label>
                <input
                  type="text"
                  id="broker"
                  name="broker"
                  value={formData.broker}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Interactive Brokers, Binance"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Account or reference number"
              />
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
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional notes about this investment..."
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
                  investment ? 'Update Investment' : 'Add Investment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InvestmentForm;
