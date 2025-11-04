import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { assetsAPI, contactsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function AssetForm({ asset, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const isEditing = !!asset;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      value: '',
      currency: 'FRW',
      category: '',
      status: 'owned',
      ownerContactId: '',
      purchaseDate: '',
      depreciationRate: 0,
      location: '',
      serialNumber: '',
      notes: '',
      tags: []
    }
  });

  useEffect(() => {
    if (asset) {
      setValue('name', asset.name || '');
      setValue('description', asset.description || '');
      setValue('value', asset.value || '');
      setValue('currency', asset.currency || 'FRW');
      setValue('category', asset.category || '');
      setValue('status', asset.status || 'owned');
      setValue('ownerContactId', asset.ownerContactId?._id || '');
      setValue('purchaseDate', asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '');
      setValue('depreciationRate', asset.depreciationRate || 0);
      setValue('location', asset.location || '');
      setValue('serialNumber', asset.serialNumber || '');
      setValue('notes', asset.notes || '');
      setValue('tags', asset.tags || []);
    }
  }, [asset, setValue]);

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
        await assetsAPI.updateAsset(asset._id, data);
        toast.success('Asset updated successfully');
      } else {
        await assetsAPI.createAsset(data);
        toast.success('Asset created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const commonCategories = [
    'Electronics', 'Vehicle', 'Property', 'Furniture', 'Equipment', 
    'Jewelry', 'Art', 'Books', 'Clothing', 'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Asset' : 'Add New Asset'}
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
              placeholder="Enter asset name"
            />
            {errors.name && (
              <p className="error-message">{errors.name.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <input
              {...register('description')}
              type="text"
              className="input"
              placeholder="Brief description of the asset"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Value *</label>
              <input
                {...register('value', {
                  required: 'Value is required',
                  min: { value: 0, message: 'Value must be positive' }
                })}
                type="number"
                step="0.01"
                className={`input ${errors.value ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.value && (
                <p className="error-message">{errors.value.message}</p>
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
                {commonCategories.map((category) => (
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
              <label className="label">Status</label>
              <select
                {...register('status')}
                className="input"
              >
                <option value="owned">Owned</option>
                <option value="loaned">Loaned</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Owner Contact</label>
            <select
              {...register('ownerContactId')}
              className="input"
              disabled={loadingContacts}
            >
              <option value="">Select contact (optional)</option>
              {contacts.map((contact) => (
                <option key={contact._id} value={contact._id}>
                  {contact.name} ({contact.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Purchase Date</label>
              <input
                {...register('purchaseDate')}
                type="date"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Depreciation Rate (%)</label>
              <input
                {...register('depreciationRate', {
                  min: { value: 0, message: 'Depreciation rate must be positive' },
                  max: { value: 100, message: 'Depreciation rate cannot exceed 100%' }
                })}
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`input ${errors.depreciationRate ? 'input-error' : ''}`}
                placeholder="0"
              />
              {errors.depreciationRate && (
                <p className="error-message">{errors.depreciationRate.message}</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Location</label>
              <input
                {...register('location')}
                type="text"
                className="input"
                placeholder="Where is the asset located?"
              />
            </div>

            <div className="form-group">
              <label className="label">Serial Number</label>
              <input
                {...register('serialNumber')}
                type="text"
                className="input"
                placeholder="Serial number (if applicable)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this asset"
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
                isEditing ? 'Update Asset' : 'Create Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetForm;


