import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { businessesAPI, documentsAPI, projectsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SlideOver from '../components/SlideOver';
import { syncBooks } from '../utils/syncBooks';

function formatDate(value) {
  if (!value) return 'No end date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No end date';
  return date.toLocaleDateString();
}

function isPaper(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return file.type === 'application/pdf' || file.type.startsWith('image/') || name.endsWith('.pdf');
}

function ContractFile({ onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [party, setParty] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data: businessData } = useQuery('businesses', () => businessesAPI.getBusinesses({ limit: 100 }));
  const { data: projectData } = useQuery(['projects', 'contracts'], () => projectsAPI.getProjects({ limit: 100 }));
  const businesses = businessData?.data?.data || [];
  const projects = projectData?.data?.data || [];

  const save = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error('Name this contract');
      return;
    }
    if (!party.trim()) {
      toast.error('Name the other party');
      return;
    }
    if (!isPaper(file)) {
      toast.error('Choose a PDF, or a photo of the paper');
      return;
    }
    setSaving(true);
    try {
      const relatedEntity = projectId ? 'project' : businessId ? 'business' : 'general';
      await documentsAPI.uploadDocument(file, {
        title: title.trim(),
        relatedEntity,
        relatedEntityId: projectId || businessId || '',
        documentType: 'contract',
        description: `Party: ${party.trim()}`,
        expiryDate: expiryDate || '',
        tags: 'contract',
      });
      toast.success('Contract PDF filed');
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload that PDF');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver title="Upload a contract" subtitle="PDF or a photo of the paper" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="contract-file">PDF</label>
          <input
            id="contract-file"
            type="file"
            accept="application/pdf,.pdf,image/*"
            className="input"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {file && <p className="mt-1 text-sm text-ink/60">{file.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="contract-title">Title</label>
          <input id="contract-title" className="input" placeholder="Shop lease 2026" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="contract-party">Other party</label>
          <input id="contract-party" className="input" placeholder="Landlord, supplier, client" value={party} onChange={(event) => setParty(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="contract-business">Business</label>
          <select id="contract-business" className="input" value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
            <option value="">Personal, no business</option>
            {businesses.map((business) => (
              <option key={business._id} value={business._id}>{business.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contract-project">Project</label>
          <select id="contract-project" className="input" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>{project.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contract-end">End date</label>
          <input id="contract-end" type="date" className="input" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          {saving ? 'Uploading…' : 'Save contract'}
        </button>
      </form>
    </SlideOver>
  );
}

function Contracts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
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
            Your business papers live here. Upload the PDF, or a photo of each signed page. It stays on your account only.
          </p>
        </div>
        <button type="button" className="btn btn-primary self-start" onClick={() => setUploading(true)}>
          Upload a PDF
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['1', 'Upload the PDF, or a photo of every page.'],
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
                <span className="badge-info">{contract.mimeType === 'application/pdf' || contract.fileExtension === 'pdf' ? 'PDF' : 'Open'}</span>
              </div>
              <p className="mt-4 text-xs uppercase tracking-wide text-ink/45">
                Filed {formatDate(contract.uploadDate || contract.createdAt)} · Ends {formatDate(contract.expiryDate)}
              </p>
            </a>
          ))}
        </div>
      )}
      {uploading && (
        <ContractFile
          onClose={() => setUploading(false)}
          onSaved={() => {
            setUploading(false);
            syncBooks(queryClient, 'contracts');
          }}
        />
      )}
    </div>
  );
}

export default Contracts;
