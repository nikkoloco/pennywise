import Link from "next/link";
import { ExportButtons } from "@/components/settings/ExportButtons";
import { Card, SectionLabel } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

const SETTINGS = [
  ["Currency", "PHP (₱)"],
  ["Timezone", "Asia/Manila"],
  ["Week starts", "Monday"],
];

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-5 pb-6">
      <PageHeader title="Settings" />

      <section className="px-6">
        <Card>
          <ul className="divide-y divide-ink-600">
            {SETTINGS.map(([label, value]) => (
              <li
                key={label}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-sky-200">{label}</span>
                <span className="text-sm font-semibold text-sky-100">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="px-6">
        <Link href="/settings/shortcuts" className="block">
          <Card className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-sky-100">
                Lock screen logging
              </p>
              <p className="mt-0.5 text-xs text-sky-300">
                Back Tap, Action Button and Siri, via Apple Shortcuts
              </p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-sky-300"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Card>
        </Link>
      </section>

      <section className="px-6">
        <SectionLabel>Your data</SectionLabel>
        <Card className="mt-3">
          <p className="mb-3 text-sm text-sky-200">
            Every expense you have logged, in a form nothing else owns.
          </p>
          <ExportButtons />
        </Card>
      </section>

      <section className="px-6">
        <SectionLabel>Coming</SectionLabel>
        <p className="mt-2 text-sm text-sky-300">
          Category and quick-tap editors, and the PIN gate in Phase 8.
        </p>
      </section>
    </main>
  );
}
