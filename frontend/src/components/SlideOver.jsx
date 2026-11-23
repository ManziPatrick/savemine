import { XMarkIcon } from '@heroicons/react/24/outline';

function SlideOver({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside className="slide-over absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col bg-paper-card shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {subtitle && <p className="text-sm font-medium text-saffron">{subtitle}</p>}
            <h2 className="font-display text-2xl text-ink">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink/50">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}

export default SlideOver;
