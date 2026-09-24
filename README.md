# Steam Game Tracker

Organize your Steam library by play status: import your games, drag them between
**Not Started / In Progress / Completed / Abandoned**, keep notes on where you left off, tag
them, and see your stats.

React + TypeScript + Vite + Tailwind on the frontend, Express + Prisma + PostgreSQL on the
backend. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for where the implementation differs from the PRD and why.

## Quickstart

Prerequisites: Node.js 18+ and PostgreSQL 13+ (or Docker).

```bash
cd steam-game-tracker
npm install                          # installs both workspaces, generates the Prisma client
cp backend/.env.example backend/.env # then add your STEAM_API_KEY (see below)
docker compose up -d postgres        # or point DATABASE_URL at your own Postgres
npm run prisma:migrate:deploy -w backend
npm run dev                          # API on :3001, web app on http://localhost:5173
```

**Steam API key:** get one free at <https://steamcommunity.com/dev/apikey> and put it in
`backend/.env` as `STEAM_API_KEY`. Without it everything works except Steam import. To try the
app without a key, open **Settings → Backup** and import [`docs/sample-library.json`](docs/sample-library.json).

Your Steam profile and its *Game details* must be public for import to work.

## Features

| PRD feature | Status |
| --- | --- |
| Steam library import (SteamID64, profile URL or custom URL name), re-import without duplicates, free-to-play option, auto-sort | ✅ |
| Kanban board with drag-and-drop (multi-select drag too), grid view, sortable list view, view preference remembered | ✅ |
| Search, filter by status / tags / play time (combinable), sorting | ✅ |
| Game detail: notes (bold, italic, bullets; 500 chars; timestamp), tags with suggestions, status, Steam rating, release date, achievements, "Open in Steam" | ✅ |
| Bulk select → set status / add or remove tags; right-click context menu | ✅ |
| Statistics: totals, by-status, play-time distribution, most played, added/completed per month, completion rate, avg hours to complete | ✅ |
| Monthly completion goal, "completed this month", daily streak, recent activity | ✅ |
| Custom column names, custom tags with colors | ✅ |
| Export CSV/JSON (timestamped), import CSV/JSON with merge or overwrite and per-row validation | ✅ |
| Dark mode (default), light, match system; responsive down to phones; keyboard shortcuts (press `?`) | ✅ |
| Privacy: no telemetry, clear library, delete all data (GDPR erasure), data explanation | ✅ |

## Scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Backend (nodemon + tsx) and frontend (Vite) together |
| `npm test` | Backend Jest suite + frontend Vitest suite |
| `npm run lint` / `npm run type-check` | ESLint / TypeScript in both packages |
| `npm run build` | Compile the backend to `backend/dist`, bundle the frontend to `frontend/dist` |

Backend API tests run against the database in `DATABASE_URL` (default
`postgresql://steamtracker:steamtracker@localhost:5432/steamtracker_test`) and are skipped
automatically if no database is reachable.

## Docs

- [docs/PRD.md](docs/PRD.md): the original product requirements
- [docs/SETUP.md](docs/SETUP.md): development setup, environment variables, deployment
- [docs/API.md](docs/API.md): REST endpoints
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): design decisions and where they differ from the PRD
