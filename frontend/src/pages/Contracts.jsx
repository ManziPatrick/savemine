import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { documentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatDate(value) {
  if (!value) return 'No end date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No end date';
  return date.toLocaleDateString();
}

function Contracts() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery(['contracts', search], () =>
    documentsAPI.getDocuments({
      documentType: 'contract',
      search: search || undefined,
      limit: 50,
    })
  );

  const contracts = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-saffron">Office</p>
          <h1 className="mt-1 font-display text-4xl text-ink">Contracts</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/70">
            Your business papers live here. Photograph a signed page or upload the PDF, and it stays on your account only.
          </p>
        </div>
        <Link to="/capture" className="btn btn-primary self-start">
          File a contract
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['1', 'Take a photo of every page, or drop the PDF.'],
          ['2', 'Name the other party and the business it belongs to.'],
          ['3', 'Come back here when you need the paper again.'],
        ].map(([step, text]) => (
          <div key={step} className="rounded-2xl border border-line bg-paper-card p-4">
            <p className="font-display text-2xl text-primary-700">{step}</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">{text}</p>
          </div>
        ))}
      </div>

      <input
        className="input max-w-md"
        placeholder="Search by title or party"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading ? (
        <LoadingSpinner className="min-h-[12rem] py-8" />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load contracts. {error.response?.data?.message || error.message}
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper-card p-10 text-center">
          <p className="font-display text-2xl text-ink">No contracts yet</p>
          <p className="mt-2 text-sm text-ink/60">A lease, supplier agreement, or client contract can start the file.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map((contract) => (
            <a
              key={contract._id}
              href={contract.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-line bg-paper-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{contract.title}</p>
                  <p className="mt-1 text-sm text-ink/60">{contract.description || 'No party noted'}</p>
                </div>
                <span className="badge-info">Open</span>
              </div>
              <p className="mt-4 text-xs uppercase tracking-wide text-ink/45">
                Filed {formatDate(contract.uploadDate || contract.createdAt)} · Ends {formatDate(contract.expiryDate)}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default Contracts;
