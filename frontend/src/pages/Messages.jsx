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
  message: '',
  schedule: 'now',
  scheduledDate: new Date().toISOString().slice(0, 16),
};

function Messages() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const { data, isLoading } = useQuery('dispatches', messagesAPI.listDispatches);
  const { data: contacts } = useQuery(['contacts', 'messages'], () => contactsAPI.getContacts({ limit: 1000 }));
  const { data: loans } = useQuery(['loans', 'messages'], () => loansAPI.getLoans({ limit: 100 }));
  const rows = data?.data?.data || [];
  const sent = data?.data?.sent || 0;
  const waiting = data?.data?.waiting || 0;
  const people = contacts?.data?.data || [];
  const loanRows = loans?.data?.data || [];
  const needle = query.trim().toLowerCase();
  const shown = people.filter((person) => `${person.name} ${person.phone}`.toLowerCase().includes(needle));

  const save = useMutation((payload) => messagesAPI.createDispatch(payload), {
    onSuccess: (response) => {
      queryClient.invalidateQueries('dispatches');
      const row = response.data?.data;
      const went = row?.status === 'scheduled' && row?.schedule !== 'now';
      toast.success(went ? 'Message is waiting for its time' : 'Message sent');
      setOpen(false);
      setForm(blank);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not send that message'),
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

  const submit = (event) => {
    event.preventDefault();
    if (!form.message.trim()) {
      toast.error('Write the message');
      return;
    }
    if (!form.contactIds.length && !(form.reason === 'loan' && form.loanId)) {
      toast.error('Choose at least one person');
      return;
    }
    save.mutate({
      reason: form.reason,
      loanId: form.loanId || undefined,
      contactIds: form.contactIds,
      message: form.message.trim(),
      schedule: form.schedule,
      scheduledDate: form.schedule === 'now' ? undefined : form.scheduledDate,
    });
  };

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-saffron">Office</p>
          <h1 className="font-display text-4xl text-ink">Messages</h1>
          <p className="mt-1 text-sm text-ink/60">Send one note, or the same note to several people.</p>
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
                  <p className="text-sm font-medium capitalize text-saffron">{row.reason.replace('_', ' ')} · {labelSchedule(row.schedule)}</p>
                  <button type="button" className="btn btn-secondary" onClick={() => resend.mutate(row._id)} disabled={resend.isLoading}>
                    Resend
                  </button>
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
                    <span key={`${person.contactId}-${person.phone}`} className="rounded-full bg-paper px-2 py-1 text-xs text-ink">
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
                {shown.length === 0 && <p className="text-sm text-ink/60">No people match. Add them under Contacts first.</p>}
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
              <label className="label" htmlFor="note">Message</label>
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
                <input
                  type="datetime-local"
                  className="input mt-2"
                  value={form.scheduledDate}
                  onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))}
                />
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
