"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Log", icon: LogIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/insights", label: "Insights", icon: InsightsIcon },
  { href: "/events", label: "Events", icon: EventsIcon },
  { href: "/recurring", label: "Recurring", icon: RecurringIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-500 bg-ink-800/95 backdrop-blur">
      <ul className="flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 ${
                  active ? "text-gold-500" : "text-sky-300"
                }`}
              >
                <Icon />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function LogIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <path d="M6 20v-6M12 20V7M18 20v-9" />
    </svg>
  );
}

function RecurringIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <path d="M4 9a6 6 0 0 1 10-3l3 3M20 15a6 6 0 0 1-10 3l-3-3" />
      <path d="M17 3v6h-6M7 21v-6h6" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
      <path d="M5 21V4a1 1 0 0 1 1-1h11l-2 4 2 4H6" />
    </svg>
  );
}
