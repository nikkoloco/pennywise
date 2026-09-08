import { Card, SectionLabel } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

const SETTINGS = [
  ["Currency", "PHP (₱)"],
  ["Timezone", "Asia/Manila"],
  ["Week starts", "Monday"],
];

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <PageHeader title="Settings" />

      <section className="px-6">
        <Card>
          <ul className="divide-y divide-ink-600">
            {SETTINGS.map(([label, value]) => (
              <li key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <span className="text-sm text-sky-200">{label}</span>
                <span className="text-sm font-semibold text-sky-100">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="px-6">
        <SectionLabel>Coming</SectionLabel>
        <p className="mt-2 text-sm text-sky-300">
          Categories and quick-tap editors in Phase 2, Shortcuts setup in Phase 5,
          data export in Phase 7.
        </p>
      </section>
    </main>
  );
}
