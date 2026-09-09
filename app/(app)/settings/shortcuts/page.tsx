import { headers } from "next/headers";
import Link from "next/link";
import { AttemptLog } from "@/components/settings/AttemptLog";
import { CopyField } from "@/components/settings/CopyField";
import { Step, Tap } from "@/components/settings/Step";
import { TokenManager } from "@/components/settings/TokenManager";
import { Card, SectionLabel } from "@/components/ui/Card";
import { getApiAttempts, getApiTokens, getCategories } from "@/db/queries";
import { currentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function ShortcutsPage() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const endpoint = `${protocol}://${host}/api/v1/log`;

  const userId = await currentUserId();
  const [tokens, categories, attempts] = await Promise.all([
    getApiTokens(userId),
    getCategories(userId),
    getApiAttempts(userId),
  ]);

  // Parents each followed by their subgroups: a flat list the Shortcut can use,
  // ordered so it still reads as the hierarchy it came from.
  const categoryList = categories
    .filter((c) => c.parentId === null)
    .flatMap((parent) => [
      parent.name,
      ...categories.filter((c) => c.parentId === parent.id).map((c) => c.name),
    ]).join("\n");

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
            One Shortcut that asks <Tap>how much</Tap> and <Tap>what for</Tap>,
            then sends it here. Attach it to Back Tap, the Action Button, a Lock
            Screen control or Siri.
          </p>
          <p className="mt-3 text-sm text-sky-200">
            There are no headers to set up. The token goes in the body with
            everything else, which removes the step most setups get wrong.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="px-6">
        <SectionLabel>What the endpoint has heard</SectionLabel>
        <p className="mt-2 mb-3 text-sm text-sky-300">
          Every attempt is recorded here, working or not. A Shortcut that fails
          on a locked phone tells you nothing, so check this first.
        </p>
        <AttemptLog attempts={attempts} />
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="px-6">
        <SectionLabel>Step 1 · Create your token</SectionLabel>
        <p className="mt-2 mb-3 text-sm text-sky-300">
          Shown once. Create it with your phone in front of you, and copy the
          plain token — not the header version. Revoking keeps a record that a
          token once existed; deleting removes it outright, which is what you
          want for a botched first attempt.
        </p>
        <TokenManager tokens={tokens} />
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Step 2 · Build the Shortcut</SectionLabel>
        <p className="text-sm text-sky-300">
          Open the <Tap>Shortcuts</Tap> app on your iPhone. You are adding six
          actions, in this order.
        </p>

        <Card>
          <ol className="flex flex-col gap-4">
            <Step n={1}>
              Tap <Tap>+</Tap> in the top right, then <Tap>Add Action</Tap>.
            </Step>

            <Step n={2}>
              Search <Tap>Ask for Input</Tap> and tap it. Then tap the word{" "}
              <Tap>Text</Tap> beside &ldquo;Input Type&rdquo; and change it to{" "}
              <Tap>Number</Tap>. Tap the <Tap>Prompt</Tap> box and type{" "}
              <span className="text-gold-300">How much?</span>
              <span className="mt-1 block text-xs text-sky-400">
                Number matters: it gives you a keypad, and stops Siri hearing a
                word as an amount.
              </span>
            </Step>

            <Step n={3}>
              Search <Tap>List</Tap> and tap it. Tap <Tap>Add new item</Tap> once
              per category and type these in, one per item:
              <div className="mt-2">
                <CopyField multiline value={categoryList} />
              </div>
              <span className="mt-2 block text-xs text-sky-400">
                Subgroups are in the list too, each under what it belongs to.
                Adding <Tap>Groceries</Tap> rather than <Tap>Food</Tap> records
                the more precise answer, and both still roll up to Food in the
                charts.
              </span>
              <span className="mt-2 block text-xs text-sky-400">
                Only add the ones you actually log by phone. A short list is
                faster to tap on a lock screen.
              </span>
            </Step>

            <Step n={4}>
              Search <Tap>Choose from List</Tap> and tap it. It picks up the list
              above automatically. Tap <Tap>Show More</Tap>, turn on{" "}
              <Tap>Prompt</Tap>, and type{" "}
              <span className="text-gold-300">What for?</span>
              <span className="mt-1 block text-xs text-sky-400">
                This is the &ldquo;what did I spend it on&rdquo; step. Its answer
                is called <Tap>Chosen Item</Tap>.
              </span>
            </Step>

            <Step n={5}>
              Search <Tap>Get Contents of URL</Tap> and tap it. Paste this into
              its <Tap>URL</Tap> field:
              <div className="mt-2">
                <CopyField value={endpoint} />
              </div>
            </Step>

            <Step n={6}>
              Tap <Tap>Show More</Tap> on that action, then tap <Tap>Method</Tap>{" "}
              and change <Tap>GET</Tap> to <Tap>POST</Tap>.
              <span className="mt-1 block text-xs text-sky-400">
                Leave Headers empty. Skipping this step is the single most common
                reason nothing is logged.
              </span>
            </Step>

            <Step n={7}>
              Under <Tap>Request Body</Tap>, make sure <Tap>JSON</Tap> is
              selected. Tap <Tap>Add new field</Tap> three times:
              <ul className="mt-2 flex flex-col gap-2 text-xs text-sky-300">
                <li>
                  <Tap>Text</Tap> · key <span className="text-gold-300">token</span>{" "}
                  · value: paste your token from Step 1
                </li>
                <li>
                  <Tap>Text</Tap> · key{" "}
                  <span className="text-gold-300">amount</span> · value: tap the
                  box, then pick <Tap>Provided Input</Tap> from the strip above
                  the keyboard
                  <span className="mt-1 block text-sky-400">
                    Text, not Number. A Number field gives you a plain keypad
                    with no variable strip, so the amount stays 0 and nothing
                    can be logged. Pennywise reads the digits either way.
                  </span>
                </li>
                <li>
                  <Tap>Text</Tap> · key{" "}
                  <span className="text-gold-300">category</span> · value: pick{" "}
                  <Tap>Chosen Item</Tap> from that same strip
                </li>
              </ul>
            </Step>

            <Step n={8}>
              Search <Tap>Get Dictionary Value</Tap> and tap it. Leave{" "}
              <Tap>Get</Tap> set to <Tap>Value</Tap>, then tap the <Tap>Key</Tap>{" "}
              box and type <span className="text-gold-300">message</span>. It
              picks up <Tap>Contents of URL</Tap> automatically.
              <span className="mt-1 block text-xs text-sky-400">
                The reply is a dictionary. Shown whole it prints the entire
                envelope — ok, amountMinor, category and all. This pulls out the
                one line meant to be read. Every reply carries{" "}
                <span className="text-gold-300">message</span>, working or not.
              </span>
            </Step>

            <Step n={9}>
              Search <Tap>Show Notification</Tap> and tap it. Clear the text,
              then pick <Tap>Dictionary Value</Tap> from the variable strip.
              <span className="mt-1 block text-xs text-sky-400">
                Do not skip this. It is what turns a silent failure into a
                message telling you exactly what went wrong.
              </span>
            </Step>

            <Step n={10}>
              Tap the name at the top, choose <Tap>Rename</Tap>, and call it{" "}
              <span className="text-gold-300">Log spending</span>. That exact
              name becomes the Siri phrase, so pick something you can say.
            </Step>

            <Step n={11}>
              Tap <Tap>Done</Tap>.
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
              Tap the Shortcut in the Shortcuts app. Enter a small amount and
              pick a category.
            </Step>
            <Step n={2}>
              iOS asks whether to allow it to send data to{" "}
              <span className="break-all text-gold-300">{host}</span>. Tap{" "}
              <Tap>Allow</Tap>, and <Tap>Always Allow</Tap> if offered.
              <span className="mt-1 block text-xs text-sky-400">
                Only asked once. Miss it and the Shortcut fails silently from the
                Lock Screen forever after.
              </span>
            </Step>
            <Step n={3}>
              Read the notification. <span className="text-gold-300">Logged 50.00 to Food</span>{" "}
              means it worked. Anything else names the problem — and it appears at
              the top of this page too.
            </Step>
          </ol>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Step 4 · Attach a trigger</SectionLabel>
        <p className="text-sm text-sky-300">
          All four work on an iPhone 16e. Set up as many as you like.
        </p>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Back Tap — tap the back of the phone twice
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            <Step n={1}>
              <Tap>Settings</Tap> → <Tap>Accessibility</Tap> → <Tap>Touch</Tap>.
            </Step>
            <Step n={2}>
              Scroll to the very bottom, tap <Tap>Back Tap</Tap>, then{" "}
              <Tap>Double Tap</Tap>.
            </Step>
            <Step n={3}>
              Scroll past the system options to the <Tap>Shortcuts</Tap> list at
              the bottom and pick yours.
            </Step>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Action Button — the button above the volume keys
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            <Step n={1}>
              <Tap>Settings</Tap> → <Tap>Action Button</Tap>.
            </Step>
            <Step n={2}>
              Swipe sideways to <Tap>Shortcut</Tap>, tap{" "}
              <Tap>Choose a Shortcut</Tap>, pick yours.
            </Step>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Lock Screen control — bottom corner button
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            <Step n={1}>
              Press and hold your Lock Screen, tap <Tap>Customise</Tap>, then{" "}
              <Tap>Lock Screen</Tap>.
            </Step>
            <Step n={2}>
              Tap the <Tap>−</Tap> on the flashlight or camera button, then the{" "}
              <Tap>+</Tap> that replaces it.
            </Step>
            <Step n={3}>
              Search <Tap>Shortcuts</Tap> in the gallery, pick yours, tap{" "}
              <Tap>Done</Tap>.
            </Step>
          </ol>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gold-300">
            Siri — hands free, screen off
          </p>
          <p className="mt-2 text-sm text-sky-200">
            Say <span className="text-gold-300">&ldquo;Siri, Log spending&rdquo;</span>.
            It asks how much, then reads out the category list for you to choose.
            The only trigger that works with the phone in your pocket.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-3 px-6">
        <SectionLabel>Variant · One tap, no questions</SectionLabel>
        <Card>
          <p className="text-sm text-sky-200">
            For a fixed cost you pay constantly, like a jeepney fare, build the
            same Shortcut with only actions 5 to 8 — no Ask for Input, no List,
            no Choose from List. Type the values straight in:
          </p>
          <div className="mt-3">
            <CopyField
              multiline
              value={`token    (Text)    your token\namount   (Number)  15\ncategory (Text)    Transportation\nnote     (Text)    jeepney`}
            />
          </div>
          <p className="mt-3 text-sm text-sky-200">
            On Back Tap, that logs a fare in about a second without looking at
            the screen.
          </p>
        </Card>
      </section>

      {/* ---------------------------------------------------------------- */}

      <section className="px-6">
        <SectionLabel>If it still does not work</SectionLabel>
        <Card className="mt-3">
          <ul className="flex flex-col gap-3 text-sm text-sky-200">
            <li>
              <Tap>Nothing at all in the list above</Tap> — the request never
              arrived. Method is probably still GET, or the URL is mistyped.
            </li>
            <li>
              <Tap>&ldquo;This endpoint needs POST&rdquo;</Tap> — Method is GET.
              Step 2, action 6.
            </li>
            <li>
              <Tap>&ldquo;Amount arrived as 0&rdquo;</Tap> — the{" "}
              <span className="text-gold-300">amount</span> field is typed
              Number. Change it to Text and insert{" "}
              <Tap>Provided Input</Tap> again. A Number field shows a keypad with
              no variable strip, so nothing can be attached to it.
            </li>
            <li>
              <Tap>&ldquo;The amount field arrived empty&rdquo;</Tap> — the field
              is Text, but the variable in it resolves to nothing. Usually{" "}
              <Tap>Shortcut Input</Tap> was picked instead of{" "}
              <Tap>Provided Input</Tap>. They sit next to each other on the
              variable strip, and only <Tap>Provided Input</Tap> carries the
              answer to &ldquo;How much?&rdquo;. Check too that{" "}
              <Tap>Ask for Input</Tap> comes before{" "}
              <Tap>Get Contents of URL</Tap>.
            </li>
            <li>
              <Tap>A notification full of braces and quotes</Tap> — nothing is
              wrong and the spend was logged. <Tap>Show Notification</Tap> is
              pointing at <Tap>Contents of URL</Tap>, the whole reply, rather
              than <Tap>Dictionary Value</Tap>. Step 2, actions 8 and 9.
            </li>
            <li>
              <Tap>&ldquo;No token&rdquo;</Tap> — the{" "}
              <span className="text-gold-300">token</span> field is missing or
              misspelled in the JSON body.
            </li>
            <li>
              <Tap>&ldquo;Token not recognised&rdquo;</Tap> — it was cut short
              when pasting, or has been revoked. Create a new one.
            </li>
            <li>
              <Tap>&ldquo;No category called…&rdquo;</Tap> — the name does not
              match. The reply lists every valid one.
            </li>
            <li>
              <Tap>&ldquo;Body is missing or wrong&rdquo;</Tap> — Request Body is
              not set to JSON, or a field name is misspelled.
            </li>
          </ul>
          <p className="mt-4 text-xs text-sky-400">
            Menu wording shifts between iOS releases. If a label reads slightly
            differently, the nearest one in meaning is right.
          </p>
        </Card>
      </section>
    </main>
  );
}
