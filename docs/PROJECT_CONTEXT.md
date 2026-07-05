# Project Context

## Purpose

`discipline-30` is a Vietnamese 30-day nutrition and discipline tracker. Users
can create an account, follow a daily plan, record checklists and measurements,
edit individual plan days, set goals, inspect charts, export reports, and receive
email or Web Push reminders. The client remains usable offline and queues writes
for synchronization when connectivity returns.

## Architecture

- `src/`: React client built by Vite, with React Router and Redux Toolkit.
- `server/`: Express REST API, JWT authentication, PostgreSQL access, reminders,
  and production static-file serving.
- `database/schema.sql`: PostgreSQL tables, indexes, and constraints.
- `public/`: PWA manifest and service worker.
- `dist/`: generated production client; never edit or commit it.

There is no cloud, CI/CD, CDN, analytics, or monitoring configuration in this
repository.

## Runtime Data Flow

1. Vite serves the React client in development; Express serves `dist/` in
   production.
2. Registration and login return a seven-day JWT. The client sends it as a
   Bearer token.
3. React builds the fixed 30-day plan and merges API-backed per-day edits.
4. Redux holds logs, edits, goals, user data, and synchronization state.
5. Writes update Redux and the local cache immediately, then call the REST API.
6. Failed writes enter `discipline30.syncQueue.v1` and retry when the browser
   comes online.
7. The service worker caches the client shell and built assets.
8. The server checks reminder preferences every minute and sends configured
   SMTP and Web Push notifications once per channel per local calendar day.

## API

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`

User data:

- `GET /api/data`
- `GET /api/plan`
- `PUT /api/plan`
- `PUT /api/logs/:dayId`
- `DELETE /api/logs/:dayId`
- `PUT /api/plan-edits/:dayId`
- `PUT /api/goals`
- `POST /api/reset`
- `POST /api/import`

Notifications:

- `POST /api/push/subscribe`
- `POST /api/reminders/test`

The first authenticated load imports legacy `discipline30.logs.v1` and
`discipline30.planEdits.v1` values without overwriting existing server rows.
Resetting starts a new 30-day cycle from the selected local date, clears logs,
plan edits, goals, reminder delivery history, local cache, and queued writes,
while preserving the account and push subscriptions.

## Local Setup

Requirements: Node.js 20+ and PostgreSQL with `pgcrypto`.

Automated setup is available through `install.bat` on Windows and `install.sh`
on macOS/Linux. The matching `run-public-server` script stops existing
listeners on the configured API port and Vite port 4173 before starting.

```powershell
Copy-Item .env.example .env
psql $env:DATABASE_URL -f .\database\schema.sql
npm install
npm run dev
```

The client is at `http://localhost:4173/`; the API defaults to port `3000`.
Configure SMTP and VAPID variables only when testing reminders.

Production-style local run:

```powershell
npm run build
npm start
```

## Validation

```powershell
npm run check
npm audit --omit=dev
```

With PostgreSQL running, verify registration, login, day edits, reload
persistence, offline queue replay, charts, CSV/PDF export, goals, push
subscription, and reminder delivery.

## Cleanup

- Do not commit `.env`, `node_modules/`, `dist/`, logs, coverage, or caches.
- Do not change legacy storage keys without preserving the import path.
- Apply `database/schema.sql` after schema changes.
- Keep `docs/TREE.md` synchronized with structural changes.
