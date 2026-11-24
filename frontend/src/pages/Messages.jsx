import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { contactsAPI, loansAPI, messagesAPI } from '../services/api';
import SlideOver from '../components/SlideOver';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const REASONS = [
  { id: 'general', label: 'General' },
  { id: 'loan', label: 'Loan' },
  { id: 'bill', label: 'Bill' },
  { id: 'gift', label: 'Gift' },
  { id: 'follow_up', label: 'Follow-up' },
];

const SCHEDULES = [
  { id: 'now', label: 'Send now' },
  { id: 'date', label: 'On a date' },
  { id: 'weekly', label: 'Every week' },
  { id: 'monthly', label: 'Every month' },
  { id: 'yearly', label: 'Every year' },
];

const blank = {
  reason: 'general',
  loanId: '',
  contactIds: [],
  phones: [],
  numberDraft: '',
  message: '',
  schedule: 'now',
  scheduledDate: new Date().toISOString().slice(0, 16),
  days: [],
};

function dayStamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    timeZone: 'Africa/Kigali',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Messages() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const { data, isLoading } = useQuery('dispatches', messagesAPI.listDispatches);
  const { data: contacts } = useQuery(['contacts', 'messages'], () => contactsAPI.getContacts({ limit: 1000 }));
  const { data: loans } = useQuery(['loans', 'messages'], () => loansAPI.getLoans({ limit: 100 }));
  const rows = [...(data?.data?.data || [])].sort((left, right) => (
    new Date(left.nextSendAt || left.scheduledDate || left.createdAt) - new Date(right.nextSendAt || right.scheduledDate || right.createdAt)
  ));
  const sent = data?.data?.sent || 0;
  const waiting = data?.data?.waiting || 0;
  const people = contacts?.data?.data || [];
  const loanRows = loans?.data?.data || [];
  const needle = query.trim().toLowerCase();
  const shown = people.filter((person) => `${person.name} ${person.phone}`.toLowerCase().includes(needle));

  const save = useMutation((payload) => messagesAPI.createDispatch(payload), {
    onSuccess: (response) => {
      queryClient.invalidateQueries('dispatches');
      const payload = response.data?.data;
      const rows = Array.isArray(payload) ? payload : [payload].filter(Boolean);
      const planned = rows.filter((row) => row.schedule !== 'now' && row.status === 'scheduled').length;
      if (planned && planned < rows.length) toast.success('Sent, and the other days are planned');
      else if (planned > 1) toast.success('Those days are planned');
      else if (planned === 1) toast.success('That day is planned');
      else toast.success('Message sent');
      setOpen(false);
      setForm(blank);
      setQuery('');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not send that message'),
  });

  const cancel = useMutation((id) => messagesAPI.cancelDispatch(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('dispatches');
      toast.success('That day was taken off the plan');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not cancel'),
  });

  const resend = useMutation((id) => messagesAPI.resendDispatch(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('dispatches');
      toast.success('Message sent again');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not resend'),
  });

  const togglePerson = (id) => {
    setForm((current) => ({
      ...current,
      contactIds: current.contactIds.includes(id)
        ? current.contactIds.filter((item) => item !== id)
        : [...current.contactIds, id],
    }));
  };

  const chooseLoan = (loanId) => {
    const loan = loanRows.find((item) => item._id === loanId);
    const contactId = loan?.contactId?._id;
    setForm((current) => ({
      ...current,
      loanId,
      contactIds: contactId && !current.contactIds.includes(contactId)
        ? [...current.contactIds, contactId]
        : current.contactIds,
    }));
  };

  const addNumber = () => {
    const raw = form.numberDraft.trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('Type the full number');
      return;
    }
    setForm((current) => ({
      ...current,
      phones: current.phones.includes(raw) ? current.phones : [...current.phones, raw],
      numberDraft: '',
    }));
  };

  const keepDay = () => {
    if (!form.message.trim()) {
      toast.error('Write the message for this day');
      return;
    }
    if (form.schedule === 'now' || !form.scheduledDate) {
      toast.error('Choose the day first');
      return;
    }
    setForm((current) => ({
      ...current,
      days: [...current.days, { date: current.scheduledDate, message: current.message.trim(), schedule: current.schedule }],
      message: '',
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    const plans = form.days.map((day) => ({
      message: day.message,
      schedule: day.schedule || 'date',
      scheduledDate: day.date,
    }));
    if (form.message.trim()) {
      plans.push({
        message: form.message.trim(),
        schedule: form.schedule,
        scheduledDate: form.schedule === 'now' ? undefined : form.scheduledDate,
      });
    }
    if (!plans.length) {
      toast.error('Write the message');
      return;
    }
    if (!form.contactIds.length && !form.phones.length && !(form.reason === 'loan' && form.loanId)) {
      toast.error('Choose a person or type a number');
      return;
    }
    save.mutate({
      reason: form.reason,
      loanId: form.loanId || undefined,
      contactIds: form.contactIds,
      phones: form.phones,
      plans,
    });
  };

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-saffron">Office</p>
          <h1 className="font-display text-4xl text-ink">Messages</h1>
          <p className="mt-1 text-sm text-ink/60">Send to a saved person or any number, and plan a different note for each day.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>New message</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card"><div className="card-body">
          <p className="text-sm text-ink/60">Sent</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">{sent}</p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="text-sm text-ink/60">Waiting or not sent</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">{waiting}</p>
        </div></div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-ink/60">No messages yet.</p>}
        {rows.map((row) => {
          const unsent = row.recipients.filter((person) => person.status !== 'sent');
          return (
            <article key={row._id} className="card">
              <div className="card-body space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize text-saffron">
                    {row.reason.replace('_', ' ')} · {labelSchedule(row.schedule)}
                    {row.schedule !== 'now' && row.scheduledDate ? ` · ${dayStamp(row.scheduledDate)}` : ''}
                  </p>
                  <div className="flex gap-2">
                    {row.status === 'scheduled' && (
                      <button type="button" className="btn btn-secondary" onClick={() => cancel.mutate(row._id)} disabled={cancel.isLoading}>
                        Cancel
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={() => resend.mutate(row._id)} disabled={resend.isLoading}>
                      Resend
                    </button>
                  </div>
                </div>
                <p className="text-ink">{row.message}</p>
                <p className="text-sm text-ink/70">
                  Sent {row.recipients.filter((person) => person.status === 'sent').length}
                  {' · '}
                  Not sent {unsent.length}
                  {' · '}
                  Total sent {row.sentCount || 0}
                </p>
                <div className="flex flex-wrap gap-2">
                  {row.recipients.map((person) => (
                    <span key={`${person.contactId || 'number'}-${person.phone}`} className="rounded-full bg-paper px-2 py-1 text-xs text-ink">
                      {person.name || person.phone} · {person.status === 'sent' ? 'sent' : person.status === 'failed' ? 'not sent' : 'waiting'}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {open && (
        <SlideOver title="New message" subtitle="Choose the reason, the people, and when it goes" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Reason</p>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    className={`btn ${form.reason === reason.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setForm((current) => ({ ...current, reason: reason.id }))}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            {form.reason === 'loan' && (
              <div>
                <label className="label" htmlFor="loan-person">Loan</label>
                <select
                  id="loan-person"
                  className="input"
                  value={form.loanId}
                  onChange={(event) => chooseLoan(event.target.value)}
                >
                  <option value="">Choose the person who owes</option>
                  {loanRows.map((loan) => (
                    <option key={loan._id} value={loan._id}>
                      {loan.contactId?.name || 'Person'} · {Number(loan.remainingAmount || 0).toLocaleString()} FRW
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label" htmlFor="people-search">People</label>
              <input
                id="people-search"
                className="input"
                placeholder="Search a name"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                {shown.length === 0 && <p className="text-sm text-ink/60">No saved person matches. Type the number below.</p>}
                {shown.map((person) => (
                  <label key={person._id} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.contactIds.includes(person._id)}
                      onChange={() => togglePerson(person._id)}
                    />
                    <span className="text-sm text-ink">{person.name} · {person.phone}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="raw-number">A number that is not saved</label>
              <div className="flex gap-2">
                <input
                  id="raw-number"
                  className="input"
                  placeholder="0790706170"
                  value={form.numberDraft}
                  onChange={(event) => setForm((current) => ({ ...current, numberDraft: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addNumber();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary" onClick={addNumber}>Add</button>
              </div>
              {form.phones.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.phones.map((phone) => (
                    <button
                      key={phone}
                      type="button"
                      className="rounded-full bg-paper px-2 py-1 text-xs text-ink"
                      onClick={() => setForm((current) => ({ ...current, phones: current.phones.filter((item) => item !== phone) }))}
                    >
                      {phone} · remove
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label" htmlFor="note">{form.schedule === 'now' ? 'Message' : 'Message for this day'}</label>
              <textarea id="note" className="input min-h-28" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">When</p>
              <div className="flex flex-wrap gap-2">
                {SCHEDULES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn ${form.schedule === item.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setForm((current) => ({ ...current, schedule: item.id }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {form.schedule !== 'now' && (
                <div className="mt-2 space-y-2">
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.scheduledDate}
                    onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))}
                  />
                  <button type="button" className="btn btn-secondary" onClick={keepDay}>Plan this day, then write the next</button>
                  {form.days.length > 0 && (
                    <ul className="space-y-2">
                      {form.days.map((day, index) => (
                        <li key={`${day.date}-${index}`} className="rounded-xl border border-line bg-paper px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-ink">{dayStamp(day.date)}</p>
                            <button
                              type="button"
                              className="text-xs text-red-600"
                              onClick={() => setForm((current) => ({ ...current, days: current.days.filter((_, item) => item !== index) }))}
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-sm text-ink/70">{day.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={save.isLoading}>
                {save.isLoading ? 'Saving...' : form.schedule === 'now' ? 'Send' : 'Schedule'}
              </button>
            </div>
          </form>
        </SlideOver>
      )}
    </div>
  );
}

function labelSchedule(schedule) {
  return SCHEDULES.find((item) => item.id === schedule)?.label || schedule;
}

export default Messages;
