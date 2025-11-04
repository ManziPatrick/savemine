import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { remindersAPI, loansAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

function ReminderForm({ reminder, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const isEditing = !!reminder;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      modelType: 'loan',
      modelId: '',
      title: '',
      description: '',
      sendAt: '',
      messageTemplate: '',
      autoSend: false,
      channels: ['sms'],
      priority: 'medium'
    }
  });

  const modelType = watch('modelType');

  useEffect(() => {
    if (reminder) {
      setValue('modelType', reminder.modelType || 'loan');
      setValue('modelId', reminder.modelId?._id || '');
      setValue('title', reminder.title || '');
      setValue('description', reminder.description || '');
      setValue('sendAt', reminder.sendAt ? new Date(reminder.sendAt).toISOString().slice(0, 16) : '');
      setValue('messageTemplate', reminder.messageTemplate || '');
      setValue('autoSend', reminder.autoSend || false);
      setValue('channels', reminder.channels || ['sms']);
      setValue('priority', reminder.priority || 'medium');
    }
  }, [reminder, setValue]);

  useEffect(() => {
    const fetchLoans = async () => {
      if (modelType === 'loan') {
        setLoadingLoans(true);
        try {
          const response = await loansAPI.getLoans({ limit: 100 });
          setLoans(response.data.data);
        } catch (error) {
          toast.error('Failed to load loans');
        } finally {
          setLoadingLoans(false);
        }
      }
    };

    fetchLoans();
  }, [modelType]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Clean up the data - remove empty modelId if not provided
      const cleanedData = {
        ...data,
        modelId: data.modelId || null
      };

      // For custom reminders, add the custom phone to the data
      if (data.modelType === 'custom' && data.customPhone) {
        cleanedData.customPhone = data.customPhone;
        cleanedData.customContactName = data.customContactName || 'Contact';
      }

      if (isEditing) {
        await remindersAPI.updateReminder(reminder._id, cleanedData);
        toast.success('Reminder updated successfully');
      } else {
        await remindersAPI.createReminder(cleanedData);
        toast.success('Reminder created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  const defaultTemplates = {
    loan: 'Hi {contactName}, this is a reminder that your loan of {amount} FRW is due on {dueDate}. Remaining balance: {remainingAmount} FRW. Please ensure payment is made on time. Thank you!',
    transaction: 'Reminder: {description} transaction of {amount} FRW is scheduled for {date}.',
    custom: 'Hi {contactName}, this is a reminder: {message}. From SmartMoney FRW.'
  };

  const handleTemplateChange = (template) => {
    setValue('messageTemplate', template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Reminder' : 'Set New Reminder'}
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
              {...register('modelType', { required: 'Type is required' })}
              className={`input ${errors.modelType ? 'input-error' : ''}`}
            >
              <option value="loan">Loan Reminder</option>
              <option value="transaction">Transaction Reminder</option>
              <option value="custom">Custom Reminder</option>
            </select>
            {errors.modelType && (
              <p className="error-message">{errors.modelType.message}</p>
            )}
          </div>

          {modelType !== 'custom' && (
            <div className="form-group">
              <label className="label">
                {modelType === 'loan' ? 'Loan' : 'Transaction'} *
              </label>
              <select
                {...register('modelId', { required: `${modelType} is required` })}
                className={`input ${errors.modelId ? 'input-error' : ''}`}
                disabled={loadingLoans}
              >
                <option value="">Select a {modelType}</option>
                {loans.map((loan) => (
                  <option key={loan._id} value={loan._id}>
                    {loan.contactId?.name} - {loan.currency} {loan.amount.toLocaleString()} (Due: {new Date(loan.dueDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {errors.modelId && (
                <p className="error-message">{errors.modelId.message}</p>
              )}
            </div>
          )}

          {modelType === 'custom' && (
            <>
              <div className="form-group">
                <label className="label">Contact Name</label>
                <input
                  {...register('customContactName')}
                  type="text"
                  className="input"
                  placeholder="Enter contact name (optional)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Name to use in the reminder message
                </p>
              </div>
              
              <div className="form-group">
                <label className="label">Contact Phone Number *</label>
                <input
                  {...register('customPhone', { 
                    required: 'Phone number is required for custom reminders',
                    pattern: {
                      value: /^(\+250|0)[0-9]{9}$/,
                      message: 'Please enter a valid Rwanda phone number (e.g., +250788123456 or 0788123456)'
                    }
                  })}
                  type="tel"
                  className={`input ${errors.customPhone ? 'input-error' : ''}`}
                  placeholder="+250788123456 or 0788123456"
                />
                {errors.customPhone && (
                  <p className="error-message">{errors.customPhone.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Enter the phone number where you want to send the reminder
                </p>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="label">Title *</label>
            <input
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 2, message: 'Title must be at least 2 characters' }
              })}
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Enter reminder title"
            />
            {errors.title && (
              <p className="error-message">{errors.title.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="input"
              placeholder="Optional description"
            />
          </div>

          <div className="form-group">
            <label className="label">Send Date & Time *</label>
            <input
              {...register('sendAt', { required: 'Send date is required' })}
              type="datetime-local"
              className={`input ${errors.sendAt ? 'input-error' : ''}`}
            />
            {errors.sendAt && (
              <p className="error-message">{errors.sendAt.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Message Template *</label>
            <div className="space-y-2">
              <textarea
                {...register('messageTemplate', {
                  required: 'Message template is required',
                  minLength: { value: 10, message: 'Message must be at least 10 characters' }
                })}
                rows={4}
                className={`input ${errors.messageTemplate ? 'input-error' : ''}`}
                placeholder="Enter your message template"
              />
              {errors.messageTemplate && (
                <p className="error-message">{errors.messageTemplate.message}</p>
              )}
              
              <div className="text-sm text-gray-600">
                <p className="mb-2">Available placeholders:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>• {'{contactName}'} - Contact name</div>
                  <div>• {'{amount}'} - Loan/transaction amount</div>
                  <div>• {'{dueDate}'} - Due date</div>
                  <div>• {'{remainingAmount}'} - Remaining amount</div>
                  <div>• {'{daysUntilDue}'} - Days until due</div>
                  <div>• {'{date}'} - Transaction date</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateChange(defaultTemplates[modelType])}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Use Default Template
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Priority</label>
              <select
                {...register('priority')}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Channels</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('channels')}
                    value="sms"
                    className="mr-2"
                  />
                  SMS
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('channels')}
                    value="whatsapp"
                    className="mr-2"
                  />
                  WhatsApp
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('autoSend')}
                className="mr-2"
              />
              Auto-send reminder (will be sent automatically at the scheduled time)
            </label>
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
                isEditing ? 'Update Reminder' : 'Set Reminder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReminderForm;


