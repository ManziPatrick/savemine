import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, PencilIcon, TrashIcon, BellIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { remindersAPI } from '../services/api';
import ReminderForm from '../components/forms/ReminderForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function Reminders() {
  const [showForm, setShowForm] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: reminders, isLoading, error } = useQuery(
    ['reminders', filter, typeFilter],
    () => remindersAPI.getReminders({ 
      status: filter === 'all' ? undefined : filter,
      modelType: typeFilter === 'all' ? undefined : typeFilter,
      limit: 50
    })
  );

  const deleteMutation = useMutation(remindersAPI.deleteReminder, {
    onSuccess: () => {
      queryClient.invalidateQueries('reminders');
      toast.success('Reminder deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete reminder');
    }
  });

  const sendNowMutation = useMutation(remindersAPI.sendReminderNow, {
    onSuccess: () => {
      queryClient.invalidateQueries('reminders');
      toast.success('Reminder sent successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    }
  });

  const handleEdit = (reminder) => {
    setSelectedReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = async (reminder) => {
    if (window.confirm(`Are you sure you want to delete this reminder?`)) {
      deleteMutation.mutate(reminder._id);
    }
  };

  const handleSendNow = async (reminder) => {
    if (window.confirm(`Send this reminder now?`)) {
      sendNowMutation.mutate(reminder._id);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('reminders');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedReminder(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading reminders: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reminders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up SMS and WhatsApp reminders for loans and payments
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary self-start sm:self-auto"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Set Reminder
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'scheduled', 'sent', 'failed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                filter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['all', 'loan', 'transaction', 'custom'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                typeFilter === type
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="card">
        <div className="card-body">
          {reminders?.data?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Title</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Send At</th>
                    <th className="table-header-cell">Channels</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {reminders.data.data.map((reminder) => (
                    <tr key={reminder._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {reminder.title}
                          </div>
                          {reminder.description && (
                            <div className="text-sm text-gray-500">
                              {reminder.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {reminder.modelType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(reminder.sendAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(reminder.sendAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-1">
                          {reminder.channels.map((channel) => (
                            <span key={channel} className="badge badge-gray text-xs">
                              {channel.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          reminder.status === 'sent' ? 'badge-success' :
                          reminder.status === 'failed' ? 'badge-danger' :
                          reminder.status === 'scheduled' ? 'badge-info' :
                          'badge-gray'
                        }`}>
                          {reminder.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          {reminder.status === 'scheduled' && (
                            <button
                              onClick={() => handleSendNow(reminder)}
                              className="text-green-600 hover:text-green-900"
                              title="Send now"
                              disabled={sendNowMutation.isLoading}
                            >
                              <PaperAirplaneIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(reminder)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit reminder"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reminder)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete reminder"
                            disabled={deleteMutation.isLoading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No reminders found</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Set Your First Reminder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reminder Form Modal */}
      {showForm && (
        <ReminderForm
          reminder={selectedReminder}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default Reminders;
