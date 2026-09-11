import Link from "next/link";
import { AccountCard } from "@/components/settings/AccountCard";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { PayScheduleCard } from "@/components/settings/PayScheduleCard";
import { ExportButtons } from "@/components/settings/ExportButtons";
import { Card, SectionLabel } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAccount, getCategories, getPaySchedule } from "@/db/queries";
import { currentUserId } from "@/lib/user";

const SETTINGS = [
  ["Currency", "PHP (₱)"],
  ["Timezone", "Asia/Manila"],
  ["Week starts", "Monday"],
];

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await currentUserId();
  const [account, categories, schedule] = await Promise.all([
    getAccount(userId),
    getCategories(userId),
    getPaySchedule(userId),
  ]);

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
        <SectionLabel>Cutoff</SectionLabel>
        <p className="mt-2 mb-3 text-sm text-sky-300">
          How often pay lands and on which days. A cutoff is the stretch
          between paydays, and it is what spending is counted against.
        </p>
        <PayScheduleCard initial={schedule} />
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
        <SectionLabel>Account</SectionLabel>
        <p className="mt-2 mb-3 text-sm text-sky-300">
          Signed in as {account.email}.
        </p>
        <AccountCard email={account.email} hasPin={account.hasPin} />
      </section>

      <section className="px-6">
        <SectionLabel>Categories</SectionLabel>
        <p className="mt-2 mb-3 text-sm text-sky-300">
          Rename one and everything already filed under it follows. Tap a
          subgroup to edit it; tiles are edited on the Log screen.
        </p>
        <CategoryManager
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            emoji: c.emoji,
            color: c.color,
            parentId: c.parentId,
          }))}
        />
      </section>
    </main>
  );
}
