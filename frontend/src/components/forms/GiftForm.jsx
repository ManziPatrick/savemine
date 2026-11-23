import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { XMarkIcon, GiftIcon } from '@heroicons/react/24/outline';
import { giftsAPI, contactsAPI } from '../../services/api';
import { uploadProof } from '../../utils/uploadProof';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function GiftForm({ gift, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
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
      const uploaded = await uploadProof(receiptFile, {
        title: formData.title || 'Gift',
        relatedEntity: 'gift',
      });
      const giftData = {
        ...formData,
        receipt: uploaded || formData.receipt,
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
                required
              />
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

            <div>
              <label htmlFor="gift-receipt" className="block text-sm font-medium text-gray-700 mb-2">
                Receipt
              </label>
              <input
                id="gift-receipt"
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
              />
              {receiptFile && <p className="mt-1 text-sm text-gray-500">{receiptFile.name}</p>}
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
