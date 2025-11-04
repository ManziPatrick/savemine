import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { XMarkIcon, GiftIcon } from '@heroicons/react/24/outline';
import { giftsAPI, contactsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function GiftForm({ gift, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contactId: '',
    giftType: 'given',
    category: 'money',
    title: '',
    description: '',
    amount: '',
    currency: 'FRW',
    quantity: 1,
    unitPrice: '',
    giftDate: new Date().toISOString().split('T')[0],
    occasion: 'none',
    location: '',
    tags: [],
    notes: '',
    receipt: '',
    photos: []
  });

  // Load contacts for dropdown
  const { data: contacts } = useQuery(
    'contacts',
    () => contactsAPI.getContacts({ limit: 1000 })
  );

  useEffect(() => {
    if (gift) {
      setFormData({
        contactId: gift.contactId?._id || '',
        giftType: gift.giftType || 'given',
        category: gift.category || 'money',
        title: gift.title || '',
        description: gift.description || '',
        amount: gift.amount || '',
        currency: gift.currency || 'FRW',
        quantity: gift.quantity || 1,
        unitPrice: gift.unitPrice || '',
        giftDate: gift.giftDate ? new Date(gift.giftDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        occasion: gift.occasion || 'none',
        location: gift.location || '',
        tags: gift.tags || [],
        notes: gift.notes || '',
        receipt: gift.receipt || '',
        photos: gift.photos || []
      });
    }
  }, [gift]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const giftData = {
        ...formData,
        amount: parseFloat(formData.amount),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        contactId: formData.contactId || null,
        tags: formData.tags.filter(tag => tag.trim())
      };

      if (gift) {
        await giftsAPI.updateGift(gift._id, giftData);
        toast.success('Gift updated successfully');
      } else {
        await giftsAPI.createGift(giftData);
        toast.success('Gift added successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save gift');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? value : value
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

  const contactsList = contacts?.data?.data || contacts?.data || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {gift ? 'Edit Gift' : 'Add New Gift'}
            </h2>
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
              {/* Gift Type */}
              <div>
                <label htmlFor="giftType" className="block text-sm font-medium text-gray-700 mb-2">
                  Gift Type *
                </label>
                <select
                  id="giftType"
                  name="giftType"
                  value={formData.giftType}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="given">Given</option>
                  <option value="received">Received</option>
                  <option value="charity">Charity</option>
                  <option value="donation">Donation</option>
                  <option value="reward">Reward</option>
                  <option value="incentive">Incentive</option>
                </select>
              </div>

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
                  <option value="money">Money</option>
                  <option value="item">Item</option>
                  <option value="service">Service</option>
                  <option value="food">Food</option>
                  <option value="clothing">Clothing</option>
                  <option value="electronics">Electronics</option>
                  <option value="other">Other</option>
                </select>
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
                placeholder="e.g., Birthday gift for John"
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
                placeholder="Additional details about the gift..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
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

            {/* Contact */}
            <div>
              <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient/Donor (Optional)
              </label>
              <select
                id="contactId"
                name="contactId"
                value={formData.contactId}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a contact (optional)</option>
                {contactsList.map((contact) => (
                  <option key={contact._id} value={contact._id}>
                    {contact.name} - {contact.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Occasion */}
              <div>
                <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-2">
                  Occasion
                </label>
                <select
                  id="occasion"
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="none">General</option>
                  <option value="birthday">Birthday</option>
                  <option value="wedding">Wedding</option>
                  <option value="graduation">Graduation</option>
                  <option value="holiday">Holiday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="funeral">Funeral</option>
                  <option value="celebration">Celebration</option>
                  <option value="thank_you">Thank You</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Gift Date */}
              <div>
                <label htmlFor="giftDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Gift Date *
                </label>
                <input
                  type="date"
                  id="giftDate"
                  name="giftDate"
                  value={formData.giftDate}
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
                placeholder="Where was the gift given/received?"
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
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional notes about this gift..."
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
                  gift ? 'Update Gift' : 'Add Gift'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GiftForm;
