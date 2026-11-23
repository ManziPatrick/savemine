import { twMerge } from 'tailwind-merge';

function LoaderMark() {
  return (
    <div className="office-loader" aria-hidden="true">
      <span className="office-loader__ring" />
      <span className="office-loader__ring-inner" />
      <img className="office-loader__mark" src="/loader-mark.svg" alt="" />
    </div>
  );
}

function LoadingSpinner({ size = 'md', className = '' }) {
  if (size === 'sm') {
    return (
      <span className={twMerge('inline-flex items-center justify-center', className)} role="status" aria-label="Loading">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-saffron" />
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={twMerge('flex min-h-[calc(100dvh-7rem)] w-full items-center justify-center', className)}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="flex flex-col items-center">
          <LoaderMark />
          <p className="mt-5 font-display text-xl text-ink">SaveMine</p>
          <p className="mt-1 text-sm text-ink/60">Opening your office</p>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge('flex items-center justify-center py-6', className)} role="status" aria-label="Loading">
      <LoaderMark />
    </div>
  );
}

export default LoadingSpinner;
