import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, BellIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { remindersAPI } from '../services/api';
import ReminderForm from '../components/forms/ReminderForm';
import { useConfirm } from '../components/ConfirmDialog';
import BillForm from '../components/forms/BillForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { repeatLabel, summarizeBills } from '../utils/billMath';
import { chargeLabel } from '../utils/chargeFrom';
import toast from 'react-hot-toast';
import { syncBooks } from '../utils/syncBooks';
import FilterMenu from '../components/FilterMenu';

function Reminders() {
  const [showForm, setShowForm] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();
  const { ask, dialog } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setSelectedReminder(null);
    setShowForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { data: reminders, isLoading, error } = useQuery(
    ['reminders', filter, typeFilter],
    () => remindersAPI.getReminders({ 
      status: filter === 'all' ? undefined : filter,
      modelType: typeFilter === 'all' ? undefined : typeFilter,
      limit: 50
    }),
    { keepPreviousData: true }
  );

  const deleteMutation = useMutation(remindersAPI.deleteReminder, {
    onSuccess: () => {
      syncBooks(queryClient, 'bills');
      toast.success('Reminder deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete reminder');
    }
  });

  const sendNowMutation = useMutation(remindersAPI.sendReminderNow, {
    onSuccess: () => {
      syncBooks(queryClient, 'bills');
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
    ask({
      title: 'Delete this reminder?',
      message: 'It will no longer be sent.',
      onConfirm: () => deleteMutation.mutate(reminder._id),
    });
  };

  const payMutation = useMutation(remindersAPI.payReminder, {
    onSuccess: () => {
      syncBooks(queryClient, 'bills', 'expenses');
      toast.success('Bill paid. The charged place is updated.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not mark this bill paid');
    }
  });

  const handlePay = (reminder) => {
    ask({
      title: `Mark ${reminder.title} paid?`,
      message: `${Number(reminder.amount).toLocaleString()} FRW leaves ${chargeLabel(reminder)}. The next date follows the schedule.`,
      confirmLabel: 'Paid',
      tone: 'primary',
      onConfirm: () => payMutation.mutate(reminder._id),
    });
  };

  const handleSendNow = async (reminder) => {
    ask({
      title: 'Send this reminder now?',
      message: 'It goes out to the person on this reminder.',
      confirmLabel: 'Send',
      tone: 'primary',
      onConfirm: () => sendNowMutation.mutate(reminder._id),
    });
  };

  const handleFormSuccess = () => {
    syncBooks(queryClient, 'bills');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedReminder(null);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
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
      {dialog}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-saffron">Bills</p>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Reminders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mark a bill paid when you pay it. The money leaves the place you chose, and the next date follows the schedule.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <button onClick={() => setShowBill(true)} className="btn btn-primary">
            Add a bill
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-secondary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Other reminder
          </button>
        </div>
      </div>

      <FilterMenu
        groups={[
          {
            label: 'Status',
            value: filter,
            onChange: setFilter,
            options: ['all', 'scheduled', 'sent', 'failed', 'cancelled'].map((status) => ({
              value: status,
              label: status,
            })),
          },
          {
            label: 'Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: ['all', 'loan', 'transaction', 'custom'].map((type) => ({
              value: type,
              label: type,
            })),
          },
        ]}
      />

      {(() => {
        const summary = summarizeBills(reminders?.data?.data || []);
        const money = (amount) => new Intl.NumberFormat('en-RW', {
          style: 'currency', currency: 'RWF', maximumFractionDigits: 0,
        }).format(Math.round(amount || 0));
        return (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Each day', summary.totals.day],
              ['Each week', summary.totals.week],
              ['Each month', summary.totals.month],
              ['Each year', summary.totals.year],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-paper-card p-4">
                <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
                <p className="mt-2 break-words font-display text-xl text-ink sm:text-2xl">{money(value)}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Reminders List */}
      {(reminders?.data?.data || []).length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-paper-card p-8 text-center md:hidden">
          <p className="text-sm text-ink/60">No bills yet. Add the first one and choose how often it repeats.</p>
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {(reminders?.data?.data || []).map((reminder) => {
          const when = reminder.scheduledDate || reminder.sendAt;
          return (
            <div key={reminder._id} className="rounded-2xl border border-line bg-paper-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{reminder.title}</p>
                  {reminder.category && <p className="text-xs text-ink/50">{reminder.category}</p>}
                  <p className="mt-1 text-sm text-ink/60">
                    {when ? new Date(when).toLocaleDateString() : 'No date'} · {repeatLabel(reminder.recurrence)} · {chargeLabel(reminder)}
                  </p>
                </div>
                {Number(reminder.amount) > 0 && (
                  <p className="shrink-0 text-sm font-semibold">{Number(reminder.amount).toLocaleString()} FRW</p>
                )}
              </div>
              <div className="mt-3 flex gap-3">
                {Number(reminder.amount) > 0 && (
                  <button type="button" onClick={() => handlePay(reminder)} className="text-xs font-medium text-green-700">
                    Paid{reminder.lastPaidAt ? ` · last ${new Date(reminder.lastPaidAt).toLocaleDateString()}` : ''}
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(reminder)} className="text-xs font-medium text-red-700">
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card hidden md:block">
        <div className="card-body">
          {reminders?.data?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Title</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Send At</th>
                    <th className="table-header-cell">Charged from</th>
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
                          {reminder.category && <div className="text-xs text-gray-500">{reminder.category}</div>}
                          {reminder.description && (
                            <div className="text-sm text-gray-500">
                              {reminder.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {reminder.reminderType || reminder.modelType || 'general'}
                          {reminder.recurrence && reminder.recurrence !== 'none' ? ` · ${repeatLabel(reminder.recurrence)}` : ''}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(reminder.sendAt || reminder.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reminder.amount ? `${Number(reminder.amount).toLocaleString()} FRW` : new Date(reminder.sendAt || reminder.scheduledDate).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">{chargeLabel(reminder)}</td>
                      <td className="table-cell">
                        <div className="flex space-x-1">
                          {(reminder.channels || [reminder.sendMethod].filter(Boolean)).map((channel) => (
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
                          {Number(reminder.amount) > 0 && (
                            <button
                              onClick={() => handlePay(reminder)}
                              className="text-sm font-medium text-green-700"
                              disabled={payMutation.isLoading}
                            >
                              Paid
                            </button>
                          )}
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
      {showBill && (
        <BillForm onClose={() => setShowBill(false)} onSuccess={handleFormSuccess} />
      )}
    </div>
  );
}

export default Reminders;
