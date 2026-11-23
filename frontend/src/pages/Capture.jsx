import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import ProofCapture from '../components/ProofCapture';
import LoadingSpinner from '../components/LoadingSpinner';
import { businessesAPI, documentsAPI, pettyCashAPI, savingsAPI } from '../services/api';
import { SAVINGS_LOCATIONS, validateCapture } from '../utils/captureRecord';
import { syncBooks } from '../utils/syncBooks';

const kinds = [
  { id: 'savings', title: 'Savings', detail: 'A MoMo, bank, SACCO, or cash screenshot' },
  { id: 'wallet', title: 'Wallet', detail: 'Cash you spent or received today' },
  { id: 'contract', title: 'Contract', detail: 'A signed paper or agreement photo' },
];

const empty = {
  kind: 'savings',
  title: '',
  amount: '',
  notes: '',
  savingsMode: 'existing',
  savingsId: '',
  jarName: '',
  location: 'MTN MoMo',
  direction: 'out',
  party: '',
  businessId: '',
  expiryDate: '',
};

function fieldError(errors, name) {
  return errors[name] ? <p className="error-message">{errors[name]}</p> : null;
}

function Capture() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: savingsData, isLoading: savingsLoading } = useQuery('savings', () =>
    savingsAPI.getSavings()
  );
  const { data: businessData } = useQuery('businesses', () => businessesAPI.getBusinesses({ limit: 100 }));

  const jars = savingsData?.data?.data || [];
  const businesses = businessData?.data?.data || [];

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const save = async (event) => {
    event.preventDefault();
    const nextErrors = validateCapture({ ...form, file });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      if (form.kind === 'savings') {
        let savingsId = form.savingsId;
        if (form.savingsMode === 'new' || !savingsId) {
          const created = await savingsAPI.createSavings({
            name: form.jarName.trim(),
            location: form.location,
            amount: 0,
            description: form.notes,
          });
          savingsId = created.data?.data?.saving?._id;
        }
        await savingsAPI.addAmount(savingsId, Number(form.amount), form.notes || form.title);
        await documentsAPI.uploadDocument(file, {
          title: form.title.trim(),
          relatedEntity: 'savings',
          relatedEntityId: savingsId,
          documentType: 'statement',
          description: form.notes,
          notes: form.notes,
        });
        syncBooks(queryClient, 'savings');
        toast.success('Savings recorded with your photo');
        navigate('/savings');
      } else if (form.kind === 'wallet') {
        const payload = {
          amount: Number(form.amount),
          description: form.notes || form.title,
        };
        if (form.direction === 'in') {
          await pettyCashAPI.addDeposit({ ...payload, source: 'Wallet record' });
        } else {
          await pettyCashAPI.makeWithdrawal({ ...payload, purpose: form.title });
        }
        await documentsAPI.uploadDocument(file, {
          title: form.title.trim(),
          relatedEntity: 'pettycash',
          documentType: 'receipt',
          description: form.notes,
          notes: form.notes,
        });
        syncBooks(queryClient, 'wallet');
        toast.success('Wallet updated');
        navigate('/petty-cash');
      } else {
        await documentsAPI.uploadDocument(file, {
          title: form.title.trim(),
          relatedEntity: form.businessId ? 'business' : 'general',
          relatedEntityId: form.businessId || '',
          documentType: 'contract',
          description: `Party: ${form.party.trim()}`,
          notes: form.notes,
          expiryDate: form.expiryDate || '',
          tags: 'contract',
        });
        syncBooks(queryClient, 'contracts');
        toast.success('Contract filed in your office');
        navigate('/contracts');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not save this record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-saffron">Quick record</p>
        <h1 className="mt-1 font-display text-4xl text-ink">Add it from a photo</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink/70">
          Upload a screenshot or take a picture. It stays on your personal account, and you can file it as savings, today’s wallet, or a business contract.
        </p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {kinds.map((kind) => (
            <button
              key={kind.id}
              type="button"
              onClick={() => set({ kind: kind.id })}
              className={`rounded-2xl border p-4 text-left ${
                form.kind === kind.id ? 'border-primary-600 bg-primary-50' : 'border-line bg-paper-card'
              }`}
            >
              <span className="block font-medium text-ink">{kind.title}</span>
              <span className="mt-1 block text-sm text-ink/60">{kind.detail}</span>
            </button>
          ))}
        </div>

        <ProofCapture file={file} onFile={setFile} error={errors.file} />

        <div className="card">
          <div className="card-body space-y-4">
            <div>
              <label className="label" htmlFor="title">What is this?</label>
              <input
                id="title"
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder={form.kind === 'contract' ? 'Shop lease 2026' : 'MoMo savings top-up'}
                value={form.title}
                onChange={(event) => set({ title: event.target.value })}
              />
              {fieldError(errors, 'title')}
            </div>

            {form.kind !== 'contract' && (
              <div>
                <label className="label" htmlFor="amount">
                {form.kind === 'savings' ? 'Amount to add (FRW)' : 'Amount (FRW)'}
              </label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  className={`input ${errors.amount ? 'input-error' : ''}`}
                  placeholder="25000"
                  value={form.amount}
                  onChange={(event) => set({ amount: event.target.value })}
                />
                {fieldError(errors, 'amount')}
              </div>
            )}

            {form.kind === 'savings' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn ${form.savingsMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set({ savingsMode: 'existing' })}
                  >
                    Existing jar
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.savingsMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set({ savingsMode: 'new' })}
                  >
                    New jar
                  </button>
                </div>
                {form.savingsMode === 'existing' ? (
                  <div>
                    <label className="label" htmlFor="jar">Savings jar</label>
                    {savingsLoading ? (
                      <LoadingSpinner />
                    ) : jars.length === 0 ? (
                      <p className="text-sm text-ink/70">
                        You do not have a jar yet. Switch to New jar and this photo will create one.
                      </p>
                    ) : (
                      <select
                        id="jar"
                        className="input"
                        value={form.savingsId}
                        onChange={(event) => set({ savingsId: event.target.value })}
                      >
                        <option value="">Choose one</option>
                        {jars.map((jar) => (
                          <option key={jar._id} value={jar._id}>
                            {jar.name} · {jar.location} · {Number(jar.amount || 0).toLocaleString()} FRW
                          </option>
                        ))}
                      </select>
                    )}
                    {fieldError(errors, 'savingsId')}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="jarName">Jar name</label>
                      <input
                        id="jarName"
                        className="input"
                        placeholder="Emergency fund"
                        value={form.jarName}
                        onChange={(event) => set({ jarName: event.target.value })}
                      />
                      {fieldError(errors, 'jarName')}
                    </div>
                    <div>
                      <label className="label" htmlFor="location">Where it sits</label>
                      <select
                        id="location"
                        className="input"
                        value={form.location}
                        onChange={(event) => set({ location: event.target.value })}
                      >
                        {SAVINGS_LOCATIONS.map((location) => (
                          <option key={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.kind === 'wallet' && (
              <div>
                <label className="label">Today’s movement</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn ${form.direction === 'in' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set({ direction: 'in' })}
                  >
                    Money in
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.direction === 'out' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set({ direction: 'out' })}
                  >
                    Money out
                  </button>
                </div>
              </div>
            )}

            {form.kind === 'contract' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="party">Other party</label>
                  <input
                    id="party"
                    className="input"
                    placeholder="Landlord, supplier, client"
                    value={form.party}
                    onChange={(event) => set({ party: event.target.value })}
                  />
                  {fieldError(errors, 'party')}
                </div>
                <div>
                  <label className="label" htmlFor="business">Business</label>
                  <select
                    id="business"
                    className="input"
                    value={form.businessId}
                    onChange={(event) => set({ businessId: event.target.value })}
                  >
                    <option value="">Personal / no business yet</option>
                    {businesses.map((business) => (
                      <option key={business._id} value={business._id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="expiry">End date</label>
                  <input
                    id="expiry"
                    type="date"
                    className="input"
                    value={form.expiryDate}
                    onChange={(event) => set({ expiryDate: event.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="notes">Note</label>
              <textarea
                id="notes"
                rows={3}
                className="input"
                placeholder="Anything you want to remember"
                value={form.notes}
                onChange={(event) => set({ notes: event.target.value })}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? 'Saving…' : 'Save this record'}
        </button>
      </form>
    </div>
  );
}

export default Capture;
