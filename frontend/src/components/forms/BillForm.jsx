import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { remindersAPI } from '../../services/api';
import { REPEAT_OPTIONS } from '../../utils/billMath';
import toast from 'react-hot-toast';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function BillForm({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState(todayInput());
  const [recurrence, setRecurrence] = useState('monthly');
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!title.trim()) {
      toast.error('Name the bill');
      return;
    }
    if (!value || value <= 0) {
      toast.error('Enter the amount you pay');
      return;
    }
    if (!due) {
      toast.error('Choose the next due date');
      return;
    }

    setSaving(true);
    try {
      await remindersAPI.createReminder({
        title: title.trim(),
        reminderType: 'bill',
        amount: value,
        currency: 'FRW',
        recurrence,
        scheduledDate: due,
        message: `${title.trim()} is due. Amount: ${value.toLocaleString()} FRW.`,
        sendMethod: 'none',
        priority: 'high',
      });
      toast.success('Bill reminder saved');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save this bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 sm:items-center">
      <form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-paper-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-saffron">Bill reminder</p>
            <h2 className="font-display text-2xl text-ink">What do you need to pay?</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink/50">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="bill-title">Bill</label>
            <input
              id="bill-title"
              className="input"
              placeholder="Rent, electricity, school fees"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bill-amount">Amount (FRW)</label>
              <input
                id="bill-amount"
                type="number"
                min="1"
                className="input"
                placeholder="50000"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="bill-due">Next due date</label>
              <input
                id="bill-due"
                type="date"
                className="input"
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="label">Repeat</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {REPEAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRecurrence(option.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    recurrence === option.id
                      ? 'border-primary-600 bg-primary-50 text-primary-800'
                      : 'border-line text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save bill'}
        </button>
      </form>
    </div>
  );
}

export default BillForm;
