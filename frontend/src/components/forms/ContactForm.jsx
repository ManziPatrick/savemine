import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { contactsAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function ContactForm({ contact, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!contact;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      type: 'debtor',
      email: '',
      address: '',
      notes: '',
      organization: '',
      tags: []
    }
  });

  useEffect(() => {
    if (contact) {
      setValue('name', contact.name || '');
      setValue('phone', contact.phone || '');
      setValue('type', contact.type || 'debtor');
      setValue('email', contact.email || '');
      setValue('address', contact.address || '');
      setValue('notes', contact.notes || '');
      setValue('organization', contact.organization || '');
      setValue('tags', contact.tags || []);
    }
  }, [contact, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        await contactsAPI.updateContact(contact._id, data);
        toast.success('Contact updated successfully');
      } else {
        await contactsAPI.createContact(data);
        toast.success('Contact created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
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
              placeholder="Enter contact name"
            />
            {errors.name && (
              <p className="error-message">{errors.name.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Phone Number *</label>
            <input
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[1-9]\d{1,14}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              type="tel"
              className={`input ${errors.phone ? 'input-error' : ''}`}
              placeholder="+250 788 123 456"
            />
            {errors.phone && (
              <p className="error-message">{errors.phone.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Type *</label>
            <select
              {...register('type', { required: 'Type is required' })}
              className={`input ${errors.type ? 'input-error' : ''}`}
            >
              <option value="debtor">Debtor</option>
              <option value="creditor">Creditor</option>
              <option value="partner">Partner</option>
            </select>
            {errors.type && (
              <p className="error-message">{errors.type.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="error-message">{errors.email.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Address</label>
            <input
              {...register('address')}
              type="text"
              className="input"
              placeholder="Enter address"
            />
          </div>

          <div className="form-group">
            <label className="label">Organization</label>
            <input
              {...register('organization')}
              type="text"
              className="input"
              placeholder="Company or organization name"
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes about this contact"
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
                isEditing ? 'Update Contact' : 'Create Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactForm;
