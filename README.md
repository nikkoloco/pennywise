# Pennywise

A tap-first spending log. Records what leaves, never what remains.

Next.js on Vercel, Postgres on Neon, Drizzle in between. It installs from the
browser on both iOS and Android, so there is no app to ship and nothing to pay
for at this size.

## Running it

```bash
npm install
npm run seed   # first account, and default categories for existing ones
npm run dev
```

### Environment

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `SESSION_SECRET` | Signs the session cookie. Changing it signs everybody out |
| `SIGNUP_INVITE_CODE` | Required to create an account. Unset closes sign-up |
| `SEED_EMAIL` | Email for the account `npm run seed` creates |

Migrations: `npx drizzle-kit generate --name <what_changed>` then
`npx drizzle-kit migrate`.

## Accounts

Two credentials, doing two different jobs.

A **password** proves who you are, at `/signin`, and lasts a month. A **PIN** is
optional and only decides whether the app is open on this phone, so locking
keeps you signed in and asks for six digits to come back. Forgetting the PIN is
not a dead end: sign out, sign in with the password, turn it off in Settings.

New accounts need the invite code and arrive with the default categories and
tiles already set up.

## Installing on a phone

Open the URL and add it to the Home Screen: **Share → Add to Home Screen** in
Safari on iOS, **⋮ → Install app** in Chrome on Android. It then runs full
screen, keeps working with no signal, and queues taps made offline.

Lock screen logging through Apple Shortcuts and Siri is iOS only; Settings →
Lock screen logging issues the token for it.
