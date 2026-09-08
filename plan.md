# Pennywise — Plan

A tap-first spending log. No net worth, no account balances, no "how much do you have?"
onboarding. You tap what you spent, it goes in the log, and the app shows you the shape of
your habits over time.

---

## 1. Platform decision (read this first)

You asked for an iOS app deployed on Vercel. Those two things pull in opposite directions,
so here is the resolution:

**Pennywise is a PWA** — a Next.js app hosted on Vercel, installed to the iOS Home Screen
via Safari's *Add to Home Screen*. It runs fullscreen with no browser chrome, has its own
icon and splash screen, works offline, and is indistinguishable from a native app in daily
use. Vercel deploys it; there is no App Store review, no Apple Developer account, no Xcode.

**What a PWA cannot do on iOS:** put an interactive button on the Lock Screen, add a
Control Center control, or bind the Action Button. Those are native-only APIs. Anyone who
tells you a web app can do this is wrong.

**What actually solves "log it while my phone is locked":** Apple Shortcuts. A Shortcut
that POSTs to a Pennywise API endpoint can be triggered from a Lock Screen widget, the
Action Button, Back Tap (double/triple-tap the back of the phone), or Siri — and it fires
*without opening the app*. iOS will ask for a Face ID glance, then the expense is logged in
under a second.

So the design target is:

| Trigger | Path | Speed |
|---|---|---|
| Siri: "Log 250 for lunch" | Shortcut → API | ~2s, hands-free, screen off |
| Back Tap ×2 | Shortcut → API | ~1s + Face ID glance |
| Lock Screen widget | Shortcut → API | ~1s + Face ID glance |
| Home Screen icon | PWA quick-tap grid | ~2s, full control |

The PWA is where you *see* your money. Shortcuts are where you *log* it fastest. Phase 5
ships an in-app generator that builds these Shortcuts for you with your token pre-filled,
so setup is copy-paste, not configuration.

If you later decide you want a true native app (real Lock Screen controls, Live Activities,
a home screen widget showing today's total), the API and data model in this plan carry over
unchanged — a SwiftUI client would talk to the same backend. That is a deliberate choice,
not an accident.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | First-class on Vercel, server actions remove most API boilerplate |
| Language | TypeScript, strict | |
| Styling | Tailwind CSS v4 | CSS-first config, design tokens live in one `@theme` block |
| Charts | Recharts 3 | React 19 compatible, composable, easy to restyle to the palette |
| Animation | Motion (framer-motion successor) | Tap feedback, sheet transitions |
| DB | Neon Postgres (Vercel Marketplace) | Serverless-native, scales to zero, free tier fits this app for years |
| ORM | Drizzle | Typed schema, plain SQL escape hatch, tiny |
| Dates | date-fns + `@date-fns/tz` | Timezone-correct day bucketing without dragging in a heavy lib |
| Validation | Zod | Shared between server actions and the Shortcuts API |
| Auth | PIN → signed httpOnly cookie (jose/JWT) + per-device API tokens | Single user; no OAuth provider to configure, no vendor lock-in |
| Offline | Service worker (Serwist) + IndexedDB outbox | Taps queue when offline, sync on reconnect |

**Confirmed settings:**
- Currency **PHP (₱)**, stored as integer centavos. Currency is a settings field.
- Timezone **Asia/Manila**. All day/week/month bucketing happens in the user's timezone,
  never UTC.
- **Week starts Monday.**
- Single user. The schema carries a `user_id` from day one so multi-user is a login screen,
  not a migration.

---

## 3. Data model

Money is stored as **integer minor units** (centavos). Never floats.

```
users
  id, email, pin_hash, currency, timezone, week_starts_on, created_at

categories
  id, user_id, name, emoji, color, sort_order, is_archived
  -- seeded: Food, Transport, Groceries, Bills, Shopping, Health,
  --         Fun, Coffee, Gifts, Other

expenses
  id, user_id, category_id, amount_minor, note, spent_at (timestamptz),
  event_id (nullable FK), source ('app' | 'shortcut' | 'siri'), created_at
  -- indexes: (user_id, spent_at desc), (user_id, category_id), (user_id, event_id)

events                       -- future things to budget for
  id, user_id, name, emoji, color, event_date, budget_minor,
  notes, is_recurring_annual, is_archived, created_at
  -- e.g. "Japan trip", "Mom's birthday", "Christmas gifts"

quick_taps                   -- the one-tap tiles on the home grid
  id, user_id, label, emoji, category_id, amount_minor (nullable),
  sort_order
  -- amount null => opens the keypad prefilled to that category
  -- amount set  => single tap logs it outright, e.g. "Jeepney ₱15"

api_tokens                   -- for Shortcuts
  id, user_id, name, token_hash, last_used_at, created_at, revoked_at

budgets                      -- optional monthly per-category caps (Phase 6)
  id, user_id, category_id, month (date), limit_minor
```

Design notes:
- **No accounts, no balances table.** Deliberate. The app never asks what you have.
- An expense may point at an `event`, which is how "I spent ₱4,000 on the Japan trip"
  rolls up against that event's budget while still counting in your normal category totals.
- `quick_taps` is what makes the app feel like TapSheet. It's user-editable data, not
  hardcoded UI.

---

## 4. Design system

Dark-first. The palette is deep navy ground, light-blue structure, and yellow reserved
almost exclusively for *money and action* — so your eye lands on the number every time.

```css
/* Ground — dark blues */
--ink-900: #060B1C   /* app background, near-black navy */
--ink-800: #0A1330   /* elevated surface */
--ink-700: #101B45   /* cards */
--ink-600: #17275E   /* pressed / hover */
--ink-500: #21377F   /* borders, dividers */

/* Structure — light blues */
--sky-400: #4C8BE8   /* primary interactive blue */
--sky-300: #7FB2F3   /* secondary text, chart series */
--sky-200: #AFD2FA   /* labels */
--sky-100: #DCEBFF   /* faint fills, chart grid */

/* Accent — bright yellow (money, CTAs, today) */
--gold-500: #FFC81E
--gold-400: #FFD84D
--gold-300: #FFE894

/* Warm neutral — dark brown (events, receipts, "set aside") */
--umber-700: #3A2618
--umber-500: #5C3B22
--umber-300: #A97A52

/* Absolutes */
--void:  #000000     /* keypad wells, OLED-true sheet backdrop */
--paper: #FFFFFF     /* headline numerals, primary text */
```

Rules that keep it coherent:
- **Yellow is scarce.** Amounts, the primary CTA, and today's date. Nothing else.
- **Brown means "future money."** Every event surface uses umber, so the eye instantly
  separates *what you've spent* (blue/yellow) from *what you're saving for* (brown/gold).
- Black is for wells and depth — the keypad, sheet scrims — not large fields.
- Category colors are drawn from a fixed 10-swatch ramp spanning sky → gold → umber, so
  pie and bar charts stay on-palette no matter what categories exist.

**Type:** system stack (`-apple-system`) for UI so it feels native on iOS; amounts in a
tabular-figure weight-800 treatment at 44–64px. Numbers are the hero of every screen.

**Texture:** subtle radial glow behind the today-total, 1px `--ink-500` hairlines instead
of shadows, 20px card radii, and a spring-scale + haptic-style flash on every tap tile.

---

## 5. Screens

**Home / Log** — Today's total in huge gold numerals, a live "this month" bar underneath,
then a 3-column grid of quick-tap tiles. Tap a tile with a preset amount → logged, tile
flashes gold, total ticks up. Tap a tile without one → keypad sheet slides up, category
preselected. Below the grid, a compact list of today's entries; swipe left to delete, tap
to edit.

**Keypad sheet** — Big black keypad, amount in gold, category chips in a horizontal scroll,
optional note, optional "attach to event" row in umber. One thumb reaches everything.

**Calendar** — Month grid where each day cell shows the day number plus a spend intensity
(navy → sky → gold heat, brighter = more spent) and the day's total in small type. Today
ringed in gold. Tap a day → that day's entries slide up. Upcoming events sit as small umber
dots on their date. Swipe between months; a strip above shows month-over-month totals.

**Insights** — Segmented control for Week / Month / Year.
- Donut chart of spend by category, center showing the period total.
- Stacked bar chart by day (week view) or by week (month view) or by month (year view).
- "Habits" strip: biggest category, most frequent category, busiest weekday, average day,
  longest no-spend streak, and change vs. previous period.
- Tapping any chart segment filters the entry list below it.

**Events** — Umber-toned cards for upcoming things: trips, birthdays, holidays. Each shows
days remaining, budget, spent-against-it, and a progress ring. Create one with a name,
emoji, date, and budget; optionally mark it recurring-annual so birthdays roll forward
automatically. An event within 14 days surfaces as a banner on Home.

**Settings** — Currency, timezone, week start, categories editor, quick-tap editor,
Shortcuts setup, data export (CSV/JSON), PIN change.

---

## 6. Build phases

Each phase is independently deployable and verifiable. I'll validate each one before
starting the next.

**Phase 0 — Foundation** — DONE
Scaffolded Next.js 16 + TS + Tailwind v4. Neon + Drizzle wired, schema written, first
migration applied. Empty shell deployed to prove the pipeline end to end.
*Done when:* a live Vercel URL renders a themed placeholder and migrations apply against
the production DB. **Both verified.**

- Repo: https://github.com/nikkoloco/pennywise (private, auto-deploys on push to `main`)
- Live: https://pennywise-five-khaki.vercel.app
- DB: Neon `ap-southeast-1`, all 7 tables live, same instance local and in production
- Seeding categories and quick-taps moves to Phase 2, where the first user row is created.

**Phase 1 — Design system + shell** — DONE
Palette tokens, typography scale, the card/sheet/button/tile primitives, bottom tab bar,
PWA manifest, icon set, `display: standalone`.
*Done when:* installs to the iOS Home Screen and opens fullscreen with correct icon and
status-bar treatment.

- App icon is a peso glyph: a P with two horizontal strokes, gold on a navy gradient,
  hand-drawn as SVG in `public/icon.svg` and rasterised by `npm run icons`.
- Primitives live in `components/ui`: `Amount`, `Card`, `Button`, `TapTile`, `Sheet`,
  `TabBar`, `PageHeader`.
- `lib/sample.ts` holds static stand-in data so the layout can be judged at realistic
  density. Phase 2 deletes it.

**Phase 2 — Logging (the core loop)**
Quick-tap grid, keypad sheet, create/edit/delete expense via server actions, today's list,
optimistic UI.
*Done when:* I can log a real expense in under 2 seconds and it survives a refresh.

**Phase 3 — Calendar**
Month grid with heat intensity, day detail sheet, month navigation, month totals strip.
*Done when:* a month of logged data reads correctly at a glance.

**Phase 4 — Insights**
Donut by category, bar by period, period switcher, habits strip, chart-driven filtering.
*Done when:* week/month/year all render correctly against seeded data and empty states.

**Phase 5 — Lock-screen logging**
`POST /api/v1/log` with bearer-token auth, Zod validation, and natural-language amount
parsing. In-app Shortcuts setup page that generates a ready-to-import Shortcut with your
token embedded, plus copy-paste instructions for Back Tap, Lock Screen widget, and Siri
phrases. Token issue/revoke UI.
*Done when:* "Hey Siri, log two fifty for lunch" writes a row with the phone locked.

**Phase 6 — Events**
Event CRUD, attach-expense-to-event, progress rings, countdowns, Home banner, recurring
annual rollover.
*Done when:* an event budget tracks spend against it correctly.

**Phase 7 — Offline + polish**
Serwist service worker, IndexedDB outbox so taps queue with no signal, background sync,
CSV/JSON export, empty and error states, motion pass, accessibility pass (contrast, tap
targets ≥44px, reduced-motion).
*Done when:* airplane-mode taps land after reconnecting.

**Phase 8 — Auth hardening**
PIN gate with rate limiting, session rotation, token scoping, security headers.
*Done when:* the deployed URL is not usable by a stranger who has the link.

---

## 7. Notable decisions

- **Server actions over REST for the app itself.** Only Shortcuts needs a public HTTP
  endpoint, so that's the only versioned API surface (`/api/v1/log`) — kept deliberately
  narrow and stable, since a Shortcut on your phone is hard to update.
- **Integer centavos everywhere.** Formatting happens at the edge, never in the data.
- **Timezone-aware bucketing.** A ₱200 midnight snack belongs to the day you think it does.
- **Categories and quick-taps are data.** No code change to add "Milk Tea."
- **No balance concept anywhere in the schema.** Adding it later would be a feature; leaving
  it out now is the product.

---

## 8. Resolved

1. Currency **PHP**, timezone **Asia/Manila**.
2. Week starts **Monday**.
3. Events are **planned**, not funded — an event carries a target budget, and expenses
   attached to it are compared against that target. No money is "set aside."
4. No native Swift client for now. `/api/v1/log` stays strictly client-agnostic so one
   remains possible later without touching the data model.

---

*Status: Phase 0 in progress.*
