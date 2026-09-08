import Link from "next/link";

type Props = { title: string; subtitle?: string };

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="safe-top flex items-start justify-between px-6 pt-6 pb-2">
      <div>
        <h1 className="text-lg font-bold text-paper">{title}</h1>
        {subtitle && <p className="text-xs text-sky-300">{subtitle}</p>}
      </div>
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex size-11 items-center justify-center rounded-full text-sky-300"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.1a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 1z" />
        </svg>
      </Link>
    </header>
  );
}
