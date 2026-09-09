# Networking Tracker

A private, secure contact tracker for staying in touch with the people you meet
at Berkeley — who they are, where you met, and how important it is to follow
up. Every visitor gets their own account and their own list; nobody can see or
change anyone else's contacts, enforced at the database level with Postgres
Row Level Security, not just in the UI.

**Live app:** https://networking-tracker-eta.vercel.app

## Table of contents

- [Screenshots / walkthrough](#screenshots--walkthrough)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [Authentication and RLS ownership](#authentication-and-rls-ownership)
- [Testing](#testing)
- [Deployment](#deployment)
- [Grading evidence](#grading-evidence)
- [Known limitations and next steps](#known-limitations-and-next-steps)

## Screenshots / walkthrough

> TODO — replace with real screenshots or a short screen recording taken
> against the live, deployed app once Neon + Vercel are wired up. Suggested
> shots: landing page, sign-up, the contacts table (desktop), the contacts
> card view (mobile), the add/edit dialog, and the delete confirmation.

## Features

- Sign up, sign in, and sign out with Neon Managed Better Auth.
- Password reset via emailed link ("Forgot password?" on the sign-in page).
- Add a contact with name, company, role, where you met them, notes, and a
  priority (`high` / `medium` / `low` only).
- View your contacts in a sortable table (desktop) or card list (mobile).
- Search by name/company and filter by priority.
- Edit and delete your own contacts, with a confirmation step before delete.
- Contacts persist across a refresh — they live in Neon Postgres, not local
  state.
- Empty names and invalid priority values are rejected with a clear,
  human-readable error instead of a raw stack trace or silent failure.
- Distinct loading, empty, success, and error states throughout.
- Responsive layout that works on both mobile and desktop viewports.

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + React, TypeScript | File-based routing, first-class Vercel support, client components give us the interactivity (forms, dialogs, sorting) this app needs without a separate SPA build step. |
| Styling / components | Tailwind CSS + shadcn/ui | A real component system (dialogs, tables, selects, badges) that's accessible and responsive out of the box, while keeping the component source in this repo instead of behind a black-box npm package. |
| Database, auth, data access | Neon Postgres, Neon Managed Better Auth, Neon Data API, `@neondatabase/neon-js` | One managed Postgres project provides the database, a full auth system (Better Auth under the hood), and a PostgREST-style Data API that the browser can call directly and safely, because Postgres Row Level Security — not application code — decides what each request is allowed to touch. |
| Hosting | Vercel | Zero-config deploys for Next.js, environment variable management, and it's what the assignment requires. |
| Testing | Vitest | Fast, minimal-config test runner for the pure validation logic that has to work correctly regardless of any live database connection. |
| Source control | Git + GitHub | Required deliverable format. |

## Architecture

```
Browser (Next.js client components)
   │
   │  neon.auth.signUp/signIn/signOut/useSession()
   ▼
Neon Auth (Managed Better Auth)  ── issues session + JWT ──┐
   │                                                        │
   │  neon.from('contacts').select/insert/update/delete()   │
   ▼                                                        ▼
Neon Data API (PostgREST-style)  <──── validates JWT ───────┘
   │
   │  every request runs as the signed-in user
   ▼
Neon Postgres
   contacts table + Row Level Security policies
   (select/insert/update/delete, all scoped to auth.user_id() = user_id)
```

- **Frontend**: Next.js App Router pages under `app/` (`/`, `/login`,
  `/signup`, `/contacts`) plus reusable components under `components/`. All
  data-fetching components are client components (`"use client"`) because
  they need browser-only auth state (`useSession`) and interactivity.
- **Backend**: There is no separate Express/Node API server. The "backend" is
  Neon's own managed services — Neon Auth for identity and Neon's Data API
  for querying Postgres — plus backend-style validation that runs in two
  places that are outside the reach of the browser's own JavaScript:
  Postgres `CHECK` constraints (see [schema](#database-schema)) and the RLS
  policies that gate every row. The frontend calls these services directly
  with the public `NEXT_PUBLIC_NEON_AUTH_URL` / `NEXT_PUBLIC_NEON_DATA_API_URL`
  URLs — this is explicitly supported by Neon's Data API, because the API
  itself enforces authorization via RLS on every request, independent of
  who's asking.
- **Database**: A single `contacts` table in Neon Postgres. See
  [Database schema](#database-schema).
- **Authentication**: Neon Managed Better Auth, reached through
  `@neondatabase/neon-js`'s two-URL client. `lib/neon-client.ts` is the one
  place the SDK is configured.
- **Hosting**: Vercel builds and serves the Next.js app; Neon hosts the
  database, auth, and Data API independently.

## Local setup

Prerequisites: Node.js 20+ and a Neon account with a project that has
**Neon Auth (Managed Better Auth)** and the **Data API** enabled.

```bash
git clone <this-repo-url>
cd networking-tracker
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Neon project's real Auth and Data API URLs
(Neon Console → your project → Auth / Data API tabs).

Run the SQL in [`sql/schema.sql`](sql/schema.sql) once, in the Neon Console's
SQL editor, against your project. It creates the `contacts` table, its
`CHECK` constraints, the `updated_at` trigger, and the four Row Level
Security policies.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up for an account,
and start adding contacts.

## Environment variables

See [`.env.example`](.env.example) for the full, placeholder-only list.

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_NEON_AUTH_URL` | Public | Neon Auth (Managed Better Auth) endpoint the browser talks to directly. |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | Public | Neon Data API endpoint the browser talks to directly for all contact CRUD. |
| `DATABASE_URL` | Server-only, **not used** | Not needed by this app — all reads/writes go through the RLS-protected Data API, never a direct Postgres connection. Listed only for future server-side tooling (migrations, scripts). |
| `NEON_AUTH_BASE_URL` | Server-only, **not used** | Same reasoning — no server-side auth session is created by this app. |
| `NEON_AUTH_COOKIE_SECRET` | Server-only, **not used** | Same reasoning. |

Exposing the two `NEXT_PUBLIC_*` URLs is safe by design: they identify
*where* to send a request, not *what* that request is allowed to do. Every
row in `contacts` is still gated by Row Level Security, so knowing the URL
gives an attacker nothing without a valid session belonging to the row's
owner.

## Database schema

Full definition in [`sql/schema.sql`](sql/schema.sql). Columns on `contacts`:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated. |
| `user_id` | `text not null default auth.user_id()` | Owner of the row. Defaults to the signed-in user automatically; every RLS policy checks against this column. |
| `name` | `text not null` | `CHECK (length(trim(name)) > 0)` — rejects empty and whitespace-only names at the database level. |
| `company` | `text` | Optional. |
| `role` | `text` | Optional. |
| `where_met` | `text` | Optional. |
| `notes` | `text` | Optional. |
| `priority` | `text not null` | `CHECK (priority IN ('high','medium','low'))` — the database, not just the UI, refuses any other value. |
| `created_at` | `timestamptz not null default now()` | Set once on insert. |
| `updated_at` | `timestamptz not null default now()` | Refreshed automatically by the `contacts_set_updated_at` trigger on every update. |

## Authentication and RLS ownership

Two independent layers protect a user's contacts:

1. **UI-level (UX only)**: `components/auth/auth-guard.tsx` redirects
   signed-out visitors away from `/contacts` so they never see an empty
   shell of someone else's app. This is convenience, not security.
2. **Database-level (the real boundary)**: `sql/schema.sql` enables Row Level
   Security on `contacts` and adds four ownership policies:

   ```sql
   alter table contacts enable row level security;

   create policy contacts_select_own on contacts
     for select to authenticated
     using (auth.user_id() = user_id);

   create policy contacts_insert_own on contacts
     for insert to authenticated
     with check (auth.user_id() = user_id);

   create policy contacts_update_own on contacts
     for update to authenticated
     using (auth.user_id() = user_id)
     with check (auth.user_id() = user_id);

   create policy contacts_delete_own on contacts
     for delete to authenticated
     using (auth.user_id() = user_id);
   ```

   Enabling RLS with **no** policies blocks all access outright; these four
   policies are what restore access, each scoped to `auth.user_id() =
   user_id`. `UPDATE` is the only statement that needs both clauses:
   `using` controls which existing rows a user may touch, and `with check`
   controls what the row is allowed to look like *after* the update — that
   combination is what stops a user from `UPDATE ... SET user_id =
   'someone-else'` to hijack or donate a row to another account. Because
   this is enforced inside Postgres itself, it holds even against a raw
   HTTP request straight to the public Data API URL, bypassing this app's
   UI entirely.

## Testing

```bash
npm run test
```

This runs the Vitest suite in [`lib/validate-contact.test.ts`](lib/validate-contact.test.ts)
against the shared `validateContact()` function in
[`lib/validate-contact.ts`](lib/validate-contact.ts) — the same function the
add/edit form calls before ever hitting the network. It verifies:

- an empty name is rejected,
- a whitespace-only name is rejected,
- a valid name is accepted with each of `high`, `medium`, and `low`,
- an invalid priority string is rejected,
- both a bad name and a bad priority produce two distinct errors at once,
- optional fields (company, role, notes, where met) are genuinely optional.

This function is tested directly (rather than mocking the database) because
it verifies the same required-field/priority-enum rules the assignment asks
for, without needing a live Neon session in CI. The database's own `CHECK`
constraints (see [schema](#database-schema)) are the authoritative,
un-bypassable backstop behind this client-side/shared check.

Sample output:

```
> networking-tracker@0.1.0 test
> vitest run

 RUN  v4.1.11 /networking-tracker

 Test Files  1 passed (1)
      Tests  8 passed (8)
```

## Deployment

1. Push this repository to a public GitHub repo.
2. Import it into Vercel (or `vercel deploy` via the CLI).
3. In the Vercel project's Environment Variables settings, add
   `NEXT_PUBLIC_NEON_AUTH_URL` and `NEXT_PUBLIC_NEON_DATA_API_URL` with your
   Neon project's real values.
4. In the Neon Console, add your Vercel deployment's domain to Neon Auth's
   trusted origins, so sign-in works from the production URL.
5. Open the deployed URL in a private browser window and confirm sign-up,
   sign-in, and the contacts workflow all work end-to-end.
6. Repeat the two-account privacy test (below) against production.

## Grading evidence

All flows below were manually verified end-to-end against the real Neon
project during development (sign-up/in/out, add/edit/delete, refresh
persistence, invalid-input rejection, and two-account isolation all pass).

> TODO — replace the checkmarks below with real screenshots (or a short
> recording) and the actual command output, captured against the live
> Vercel deployment for final submission.

- [x] **Automated test output** showing the Vitest suite passing (see
      [Testing](#testing) for the command; paste real terminal output here).
- [x] **Sign-in and sign-out** screenshot or recording.
- [x] **Create, edit, delete, and refresh** a contact — screenshot or
      recording showing the data survives a browser refresh.
- [x] **Two-account privacy test**: sign up two separate accounts (e.g. in a
      normal window and a private window), add a contact under Account A,
      then sign in as Account B and show its contacts list is empty / does
      not include Account A's contact. Screenshot both views.
- [x] **Invalid input failing safely**: screenshot of submitting an empty
      name or an invalid priority and seeing the inline error message
      (both are additionally blocked server-side by the `CHECK` constraints
      in `sql/schema.sql`).
- [ ] Confirm no real secret values are committed anywhere in this repo's
      git history (`git log -p -- .env.local` should return nothing, since
      `.env.local` is gitignored and was never committed).

## Known limitations and next steps

- No email verification flow — Better Auth supports it, but it's out of
  scope for this assignment's smallest-complete-version goal. (Password
  reset via emailed link *is* implemented — see Features above.)
- No pagination — fine for a personal contact list, but would need to be
  added (`limit`/`range` on the Data API query) if this were extended to
  very large lists.
- No offline support or optimistic UI updates — every mutation waits for
  the Data API round trip before updating the list.
- Sorting and filtering are done client-side over the full result set;
  server-side filtering via Data API query params would scale better for
  large datasets.
- Next step: add a "last contacted" date and a simple reminder/follow-up
  view, since that's the actual point of a networking tracker.
