# Repository Guide

# Codex Instructions

- Do not read, inspect, search, summarize, or modify the `omni-agents/` folder unless I explicitly ask.
- If `docs/TREE.md` exists, treat it as the source of truth for allowed project files. Do not read, inspect, search, summarize, or modify any file or folder not listed in `docs/TREE.md` unless I explicitly ask.

Before making code changes, inspect relevant local skills in `.agent/*/SKILL.md`.

Default required skills:
- `omni-agents/.agent/no-test-files/SKILL.md`
- `omni-agents/.agent/token-saver/SKILL.md`
- `omni-agents/.agent/final-response-format/SKILL.md`
- `omni-agents/.agent/no-run-without-permission/SKILL.md`

## Read First

1. Read `docs/PROJECT_CONTEXT.md`.
2. Read `docs/TREE.md`.
3. Read only the relevant client page/component or server route and its direct
   dependencies.

Do not inspect `.git/`, `node_modules/`, `dist/`, logs, coverage output, caches,
or `omni-agents/` unless the task explicitly requires them.

## Before Editing

- Identify whether the entrypoint is React (`src/main.jsx`), Express
  (`server/index.js`), PostgreSQL (`database/schema.sql`), or the PWA service
  worker (`public/service-worker.js`).
- Trace the relevant route, Redux state, local cache key, API endpoint, database
  row, and service-worker asset when applicable.
- Keep changes scoped and avoid generated-file churn.
- Preserve the offline queue and legacy localStorage import path.

## Project Overview

This repository is a Vietnamese full-stack 30-day nutrition and discipline
tracker.

- React, React Router, Redux Toolkit, Vite, and Chart.js power the client.
- Express exposes a JWT-authenticated REST API.
- PostgreSQL stores users, plans, logs, edits, goals, subscriptions, and
  reminder delivery history.
- The PWA caches client assets and queues failed writes for later synchronization.
- SMTP and Web Push reminders are optional local configuration.

There is intentionally no CI/CD, cloud deployment, CDN, analytics, or monitoring
configuration.

## Main Entrypoints

- `index.html` and `src/main.jsx`: browser entrypoints.
- `src/App.jsx`: authenticated shell and client routing.
- `src/store.js`: Redux state and local cache.
- `src/api.js`: REST client, legacy import, and offline queue.
- `server/index.js`: API process and reminder scheduler.
- `server/app.js`: REST routes and production static serving.
- `database/schema.sql`: database schema.
- `public/service-worker.js`: offline assets and push events.

## Data Flow

1. Login or registration returns a JWT.
2. `GET /api/data` loads logs, per-day edits, and goals; `/api/plan` manages the
   full plan record.
3. The client builds the fixed plan and merges user data.
4. Writes update Redux/local cache first and then call the API.
5. Network/server failures enter `discipline30.syncQueue.v1`.
6. The queue replays after connectivity returns.
7. Legacy `discipline30.logs.v1` and `discipline30.planEdits.v1` data imports
   once without overwriting server data.

## Cleanup

- Never commit `.env`, `node_modules/`, `dist/`, logs, caches, or coverage.
- Do not change storage keys without a migration.
- Update `database/schema.sql` with database changes.
- Keep `docs/TREE.md` synchronized after structural changes.
- Stop test servers after validation.

## Validation

```powershell
npm run check
npm audit --omit=dev
```

With PostgreSQL configured:

```powershell
Copy-Item .env.example .env
psql $env:DATABASE_URL -f .\database\schema.sql
npm run dev
```

Verify authentication, navigation, day logs and edits, reload persistence,
offline replay, charts, CSV/PDF export, goals, notifications, and responsive
layouts.

## After Editing

- Summarize changed files.
- Explain user-visible behavior.
- Report validation commands and results.
