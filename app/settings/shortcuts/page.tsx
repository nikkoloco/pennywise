import { headers } from "next/headers";
import Link from "next/link";
import { CopyField } from "@/components/settings/CopyField";
import { TokenManager } from "@/components/settings/TokenManager";
import { Card, SectionLabel } from "@/components/ui/Card";
import { getApiTokens, getCategories } from "@/db/queries";
import { currentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function ShortcutsPage() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const endpoint = `${protocol}://${host}/api/v1/log`;

  const user = await currentUser();
  const [tokens, categories] = await Promise.all([
    getApiTokens(user.id),
    getCategories(user.id),
  ]);

  const example = categories[0]?.name ?? "Food";

  return (
    <main className="flex flex-1 flex-col gap-6 pb-6">
      <header className="safe-top flex items-center gap-3 px-6 pt-6 pb-2">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="flex size-11 items-center justify-center rounded-full text-sky-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-paper">Lock screen logging</h1>
      </header>

      <section className="px-6">
        <Card>
          <p className="text-sm text-sky-200">
            Pennywise is a web app, so it cannot put a button on your Lock Screen
            directly. Apple Shortcuts can: a Shortcut that posts here fires from
            Back Tap, the Action Button, a Lock Screen widget or Siri, without
            opening the app.
          </p>
        </Card>
      </section>

      <section className="px-6">
        <SectionLabel>1 · Create a token</SectionLabel>
        <div className="mt-3">
          <TokenManager tokens={tokens} />
        </div>
      </section>

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>2 · Build the Shortcut</SectionLabel>
        <Card>
          <ol className="flex flex-col gap-3 text-sm text-sky-200">
            <li>
              Open <strong className="text-sky-100">Shortcuts</strong> and tap{" "}
              <strong className="text-sky-100">+</strong>.
            </li>
            <li>
              Add <strong className="text-sky-100">Ask for Input</strong>. Set the
              input type to <strong className="text-sky-100">Number</strong> and the
              prompt to &ldquo;How much?&rdquo;
            </li>
            <li>
              Add <strong className="text-sky-100">Get Contents of URL</strong> and
              paste this URL:
              <div className="mt-2">
                <CopyField value={endpoint} />
              </div>
            </li>
            <li>
              Expand it, set <strong className="text-sky-100">Method</strong> to{" "}
              <strong className="text-sky-100">POST</strong>, then add a header:
              <div className="mt-2 flex flex-col gap-2">
                <CopyField label="Key" value="Authorization" />
                <CopyField label="Value" value="Bearer PASTE_YOUR_TOKEN_HERE" />
              </div>
            </li>
            <li>
              Set <strong className="text-sky-100">Request Body</strong> to{" "}
              <strong className="text-sky-100">JSON</strong> and add two fields:
              <span className="mt-1 block text-xs text-sky-300">
                <code>amount</code> (Number) → the{" "}
                <strong className="text-sky-100">Provided Input</strong> from step 2,
                and <code>category</code> (Text) → one of your category names below.
              </span>
            </li>
            <li>
              Name it something Siri can hear, like{" "}
              <strong className="text-sky-100">&ldquo;Log {example}&rdquo;</strong>.
            </li>
          </ol>
        </Card>

        <Card>
          <p className="text-xs tracking-[0.15em] text-gold-500 uppercase">
            One tap, no prompt
          </p>
          <p className="mt-2 text-sm text-sky-200">
            For a fixed cost you pay constantly, skip step 2 and type the amount
            straight into the JSON. Bound to Back Tap, that logs a fare in about a
            second.
          </p>
          <div className="mt-3">
            <CopyField
              multiline
              value={`{\n  "amount": 15,\n  "category": "Transportation",\n  "note": "jeepney"\n}`}
            />
          </div>
        </Card>
      </section>

      <section className="px-6">
        <SectionLabel>3 · Give it a trigger</SectionLabel>
        <Card className="mt-3">
          <ul className="flex flex-col gap-3 text-sm text-sky-200">
            <li>
              <strong className="text-sky-100">Back Tap</strong> — Settings →
              Accessibility → Touch → Back Tap → Double Tap.
            </li>
            <li>
              <strong className="text-sky-100">Action Button</strong> — Settings →
              Action Button → swipe to Shortcut.
            </li>
            <li>
              <strong className="text-sky-100">Lock Screen</strong> — long-press the
              Lock Screen → Customise → add a Shortcuts widget.
            </li>
            <li>
              <strong className="text-sky-100">Siri</strong> — just say the
              Shortcut&rsquo;s name. This is the only one that works with the screen
              off and your hands full.
            </li>
          </ul>
          <p className="mt-4 text-xs text-sky-400">
            iOS asks for a Face ID glance when the phone is locked. That is Apple&rsquo;s
            gate, not one Pennywise can skip.
          </p>
        </Card>
      </section>

      <section className="px-6">
        <SectionLabel>Your category names</SectionLabel>
        <p className="mt-2 mb-3 text-xs text-sky-400">
          Matched without case sensitivity. Anything else comes back as an error
          listing these.
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-ink-700 px-3 py-1.5 text-xs text-sky-200"
            >
              {c.emoji} {c.name}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
