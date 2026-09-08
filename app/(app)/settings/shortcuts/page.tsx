import { headers } from "next/headers";
import Link from "next/link";
import { CopyField } from "@/components/settings/CopyField";
import { Step, Tap } from "@/components/settings/Step";
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

  const example = categories.find((c) => c.name === "Food") ?? categories[0];
  const exampleName = example?.name ?? "Food";

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
            by itself. Apple Shortcuts can. You build one Shortcut that sends an
            amount here, then attach it to Back Tap, the Action Button, a Lock
            Screen control or Siri.
          </p>
          <p className="mt-3 text-sm text-sky-200">
            Do this once per category you want a fast button for. Fifteen minutes
            now, then logging takes a second.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="px-6">
        <SectionLabel>Step 1 · Create your token</SectionLabel>
        <p className="mt-2 mb-3 text-sm text-sky-300">
          This is the password the Shortcut uses. It is shown once, so create it
          when you have your phone in front of you.
        </p>
        <TokenManager tokens={tokens} />
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Step 2 · Build the Shortcut</SectionLabel>
        <p className="text-sm text-sky-300">
          On your iPhone, open the <Tap>Shortcuts</Tap> app. If it is not
          installed, get it free from the App Store.
        </p>

        <Card>
          <ol className="flex flex-col gap-4">
            <Step n={1}>
              Tap the <Tap>+</Tap> in the top right corner to start a new
              Shortcut.
            </Step>

            <Step n={2}>
              Tap <Tap>Add Action</Tap>. A search box appears.
            </Step>

            <Step n={3}>
              Search for <Tap>Ask for Input</Tap> and tap it. This is what makes
              your phone ask how much you spent.
            </Step>

            <Step n={4}>
              In that action, tap the word <Tap>Text</Tap> next to
              &ldquo;Input Type&rdquo; and change it to <Tap>Number</Tap>. Then
              tap the <Tap>Prompt</Tap> box and type{" "}
              <span className="text-gold-300">How much?</span>
              <span className="mt-1 block text-xs text-sky-400">
                Number matters. It gives you a keypad instead of a keyboard, and
                stops Siri mishearing words as amounts.
              </span>
            </Step>

            <Step n={5}>
              Tap the search box again, search{" "}
              <Tap>Get Contents of URL</Tap>, and tap it. Make sure it sits{" "}
              <em>below</em> the Ask for Input action.
            </Step>

            <Step n={6}>
              Tap the <Tap>URL</Tap> field in that action and paste this:
              <div className="mt-2">
                <CopyField value={endpoint} />
              </div>
            </Step>

            <Step n={7}>
              Tap the small arrow (<Tap>&gt;</Tap>) or <Tap>Show More</Tap> at
              the bottom of the Get Contents of URL action. It expands to reveal
              Method, Headers and Request Body.
            </Step>

            <Step n={8}>
              Tap <Tap>Method</Tap> and change <Tap>GET</Tap> to{" "}
              <Tap>POST</Tap>.
            </Step>

            <Step n={9}>
              Under <Tap>Headers</Tap>, tap <Tap>Add new header</Tap>. Put this
              in the left box:
              <div className="mt-2 mb-2">
                <CopyField value="Authorization" />
              </div>
              And in the right box, the word <span className="text-gold-300">Bearer</span>,
              a space, then your token from Step 1. The token screen gives you
              this whole line ready to paste.
            </Step>

            <Step n={10}>
              Under <Tap>Request Body</Tap>, make sure <Tap>JSON</Tap> is
              selected, then tap <Tap>Add new field</Tap> and choose{" "}
              <Tap>Number</Tap>.
              <span className="mt-1 block text-xs text-sky-400">
                Key: <span className="text-gold-300">amount</span> — then tap the
                value box and pick <Tap>Provided Input</Tap> from the strip just
                above the keyboard. That is the number you typed in Step 4.
              </span>
            </Step>

            <Step n={11}>
              Tap <Tap>Add new field</Tap> again, choose <Tap>Text</Tap>.
              <span className="mt-1 block text-xs text-sky-400">
                Key: <span className="text-gold-300">category</span> — value:{" "}
                <span className="text-gold-300">{exampleName}</span>, typed
                exactly as it appears in the list further down this page.
              </span>
            </Step>

            <Step n={12}>
              Optional but worth it: tap the search box, add{" "}
              <Tap>Show Notification</Tap>, and set the text to{" "}
              <span className="text-gold-300">Logged</span>. Without it, a
              Shortcut run from a locked phone gives you no confirmation.
            </Step>

            <Step n={13}>
              Tap the Shortcut&rsquo;s name at the top of the screen, choose{" "}
              <Tap>Rename</Tap>, and call it{" "}
              <span className="text-gold-300">Log {exampleName.toLowerCase()}</span>.
              <span className="mt-1 block text-xs text-sky-400">
                Pick something you can say out loud. This exact name becomes the
                Siri phrase.
              </span>
            </Step>

            <Step n={14}>
              Tap <Tap>Done</Tap> in the top right.
            </Step>
          </ol>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Step 3 · Run it once, unlocked</SectionLabel>
        <Card>
          <ol className="flex flex-col gap-4">
            <Step n={1}>
              Tap your new Shortcut in the Shortcuts app. Enter any small amount.
            </Step>
            <Step n={2}>
              iOS will ask whether to allow it to send data to{" "}
              <span className="break-all text-gold-300">{host}</span>. Tap{" "}
              <Tap>Allow</Tap>, and <Tap>Always Allow</Tap> if it is offered.
              <span className="mt-1 block text-xs text-sky-400">
                This prompt only appears the first time. If you skip it now, the
                Shortcut will fail silently from the Lock Screen later.
              </span>
            </Step>
            <Step n={3}>
              Open Pennywise and check the entry appeared under Today. Delete it
              with the × once you have seen it.
            </Step>
          </ol>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Step 4 · Attach a trigger</SectionLabel>
        <p className="text-sm text-sky-300">
          Pick one, or set up several. All four work on your iPhone 16e.
        </p>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Back Tap — tap the back of the phone twice
          </p>
          <p className="mt-1 mb-3 text-xs text-sky-400">
            The fastest one-handed option. Works through most cases.
          </p>
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Open <Tap>Settings</Tap> → <Tap>Accessibility</Tap>.
            </Step>
            <Step n={2}>
              Tap <Tap>Touch</Tap>, then scroll to the very bottom and tap{" "}
              <Tap>Back Tap</Tap>.
            </Step>
            <Step n={3}>
              Tap <Tap>Double Tap</Tap>, scroll past the system options to the{" "}
              <Tap>Shortcuts</Tap> section at the bottom, and pick your Shortcut.
            </Step>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Action Button — the button above the volume keys
          </p>
          <p className="mt-1 mb-3 text-xs text-sky-400">
            Press and hold. Best if you log one category far more than the rest.
          </p>
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Open <Tap>Settings</Tap> → <Tap>Action Button</Tap>.
            </Step>
            <Step n={2}>
              Swipe sideways through the options until you reach{" "}
              <Tap>Shortcut</Tap>.
            </Step>
            <Step n={3}>
              Tap <Tap>Choose a Shortcut</Tap> and pick yours.
            </Step>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Lock Screen control — bottom corner button
          </p>
          <p className="mt-1 mb-3 text-xs text-sky-400">
            Replaces the flashlight or camera button on your Lock Screen.
          </p>
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Press and hold on your Lock Screen until <Tap>Customise</Tap>{" "}
              appears, then tap it. You may need to unlock with Face ID first.
            </Step>
            <Step n={2}>
              Tap <Tap>Lock Screen</Tap>.
            </Step>
            <Step n={3}>
              Tap the <Tap>−</Tap> on the flashlight or camera button in the
              bottom corner to remove it, then tap the <Tap>+</Tap> that appears
              in its place.
            </Step>
            <Step n={4}>
              Search <Tap>Shortcuts</Tap> in the controls gallery, choose it, and
              select your Shortcut. Tap <Tap>Done</Tap>.
            </Step>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Siri — hands free, screen off
          </p>
          <p className="mt-1 mb-3 text-xs text-sky-400">
            Nothing to set up. The Shortcut&rsquo;s name is already the phrase.
          </p>
          <p className="text-sm text-sky-200">
            Say <span className="text-gold-300">&ldquo;Siri, Log {exampleName.toLowerCase()}&rdquo;</span>.
            Siri asks &ldquo;How much?&rdquo;, you say the number, and it is
            logged. This is the only trigger that works with the phone in your
            pocket.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Variant · One tap, no question</SectionLabel>
        <Card>
          <p className="text-sm text-sky-200">
            For a fixed cost you pay constantly, like a jeepney fare, skip the
            Ask for Input action entirely. Build the same Shortcut without steps
            3 and 4, and type the amount straight into the JSON instead of using
            Provided Input.
          </p>
          <p className="mt-3 text-sm text-sky-200">
            Bound to Back Tap, that logs a fare in about a second with no screen
            interaction at all. The body should look like this:
          </p>
          <div className="mt-3">
            <CopyField
              multiline
              value={`amount  (Number)  15\ncategory (Text)   Transportation\nnote     (Text)   jeepney`}
            />
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="px-6">
        <SectionLabel>Category names</SectionLabel>
        <p className="mt-2 mb-3 text-xs text-sky-400">
          Type one of these into the <span className="text-gold-300">category</span>{" "}
          field. Capitalisation does not matter, spelling does.
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

      {/* ---------------------------------------------------------------- */}

      <section className="px-6">
        <SectionLabel>If it does not work</SectionLabel>
        <Card className="mt-3">
          <ul className="flex flex-col gap-3 text-sm text-sky-200">
            <li>
              <Tap>Nothing happens from the Lock Screen</Tap> — you probably
              missed the one-time permission prompt. Run the Shortcut from inside
              the Shortcuts app once and tap Allow.
            </li>
            <li>
              <Tap>&ldquo;Missing bearer token&rdquo;</Tap> — the Authorization
              header is misspelled, or the value is missing the word{" "}
              <span className="text-gold-300">Bearer</span> and a space before
              the token.
            </li>
            <li>
              <Tap>&ldquo;Invalid or revoked token&rdquo;</Tap> — the token was
              revoked, or part of it was cut off when pasting. Create a new one
              and paste it again.
            </li>
            <li>
              <Tap>&ldquo;No category named…&rdquo;</Tap> — the category value
              does not match. The reply lists every valid name.
            </li>
            <li>
              <Tap>It asks for Face ID every time</Tap> — that is iOS protecting
              a locked phone, and Pennywise cannot skip it. A glance is enough.
            </li>
          </ul>
          <p className="mt-4 text-xs text-sky-400">
            Menu wording shifts slightly between iOS releases. If a label reads a
            little differently on your phone, the one nearest in meaning is the
            right one.
          </p>
        </Card>
      </section>
    </main>
  );
}
