import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { contactsAPI, messagesAPI } from '../services/api';
import SlideOver from './SlideOver';
import toast from 'react-hot-toast';
import { businessPlanText } from '../utils/farmMeasure';

function SharePlan({ projects }) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState('');
  const { data } = useQuery(['contacts', 'share-plan'], () => contactsAPI.getContacts({ limit: 1000 }), { enabled: open });
  const people = data?.data?.data || [];
  const message = businessPlanText(projects);

  const send = useMutation((payload) => messagesAPI.createDispatch(payload), {
    onSuccess: () => {
      toast.success('Business plan sent');
      setOpen(false);
      setContactId('');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not share that plan'),
  });

  const submit = (event) => {
    event.preventDefault();
    if (!contactId) {
      toast.error('Choose the person');
      return;
    }
    send.mutate({
      reason: 'general',
      contactIds: [contactId],
      message,
      schedule: 'now',
    });
  };

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)} disabled={!projects.length}>
        Share plan
      </button>
      {open && (
        <SlideOver title="Share the business plan" subtitle="One person receives the usage and prices" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Person
              <select className="input mt-1" value={contactId} onChange={(event) => setContactId(event.target.value)}>
                <option value="">Choose a person</option>
                {people.map((person) => (
                  <option key={person._id} value={person._id}>{person.name}</option>
                ))}
              </select>
            </label>
            <p className="whitespace-pre-wrap rounded-lg border border-line bg-paper p-3 text-sm text-ink">{message}</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={send.isLoading}>
                {send.isLoading ? 'Sending...' : 'Share this plan'}
              </button>
            </div>
          </form>
        </SlideOver>
      )}
    </>
  );
}

export default SharePlan;
