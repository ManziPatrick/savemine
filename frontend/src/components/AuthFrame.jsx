import { Link } from 'react-router-dom';

const points = [
  'Each person gets a private account. Nobody else sees your money.',
  'Snap a screenshot or photo and file it under savings, the wallet, or a contract.',
  'Keep daily cash and business papers in one office.',
];

function AuthFrame({ eyebrow, title, subtitle, children, alternate }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-saffron uppercase">SaveMine</p>
          <h1 className="mt-6 max-w-md font-display text-5xl leading-tight text-white">
            Your wallet, savings book, and office.
          </h1>
          <ul className="mt-10 space-y-4 text-sm leading-6 text-paper/80">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-paper/50">Built for personal accounts and small businesses.</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <p className="text-sm font-medium tracking-[0.16em] text-primary-700 uppercase lg:hidden">SaveMine</p>
          <p className="mt-3 text-sm font-medium text-saffron">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl text-ink">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-ink/70">
            {alternate.lead}{' '}
            <Link to={alternate.href} className="font-medium text-primary-700 hover:text-primary-800">
              {alternate.label}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default AuthFrame;
