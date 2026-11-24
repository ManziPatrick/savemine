import { useState } from 'react';

function ConfirmDialog({ title, message, confirmLabel, tone = 'danger', busy, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-line bg-paper-card p-5 shadow-2xl">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {message ? <p className="mt-2 text-sm text-ink/70">{message}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const ask = (options) => setPending(options);
  const close = () => {
    if (!busy) setPending(null);
  };

  const dialog = pending ? (
    <ConfirmDialog
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel || 'Delete'}
      tone={pending.tone || 'danger'}
      busy={busy}
      onClose={close}
      onConfirm={async () => {
        setBusy(true);
        try {
          await pending.onConfirm();
          setPending(null);
        } finally {
          setBusy(false);
        }
      }}
    />
  ) : null;

  return { ask, dialog };
}

export default ConfirmDialog;
