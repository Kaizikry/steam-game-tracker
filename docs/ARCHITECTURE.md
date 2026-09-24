# Architecture

```
frontend (React SPA) ──/api──▶ backend (Express) ──Prisma──▶ PostgreSQL
                                    │
                                    └──▶ Steam Web API / Store API (throttled 1 req/s)
```

## Frontend (`frontend/src`)

- **Server state:** TanStack Query (`hooks/useApi.ts`). Status changes are optimistic, so a
  dropped card moves instantly and rolls back if the API refuses.
- **Client state:** Zustand (`store/useAppStore.ts`), persisted to localStorage: session token,
  theme, view type and filters. Theme and default view are also saved server-side and adopted
  on load.
- **Drag and drop:** `@hello-pangea/dnd`, the maintained fork of `react-beautiful-dnd` (same
  API; the original is deprecated and doesn't support React 18+ strict mode). It also gives
  keyboard dragging (focus a card, Space, arrows, Space).
- **Big libraries:** the API returns the filtered library in one request (≤ 5000 games), and
  each board column, the grid and the list render incrementally ("Show more"), so 1,000+
  games stay responsive.
- **Notes formatting:** a small markdown subset (`**bold**`, `*italic*`, `- bullets`) rendered
  to React elements. No `dangerouslySetInnerHTML`, so notes can't inject markup.
- **Charts:** plain HTML/CSS bars (no chart library, to stay under the bundle budget), with
  direct labels, hover tooltips and a table view. Colors are per-theme CSS variables in
  `styles/index.css`.

## Backend (`backend/src`)

- `routes/` → `controllers/` (HTTP + zod validation) → `services/` (logic + Prisma).
- `services/steamService.ts`: parses profile input, resolves custom URLs, fetches owned games,
  profile, store details, review score and achievements. All Steam calls go through one
  process-wide throttle (`utils/throttle.ts`).
- `services/importService.ts`: `planLibrarySync` is a pure function that decides what to
  create and update; the result is written in one transaction. Re-imports update play time
  and titles only, never status, notes or tags.
- `services/dataService.ts`: CSV/JSON export, plus import with row-level validation and merge
  rules.
- `services/statsService.ts`: `computeStats` / `computeStreak` are pure and unit-tested.
- Security: helmet headers, CORS limited to `FRONTEND_URL`, rate limits (global, session
  creation, Steam import, Steam refresh), zod validation on every input, Prisma for queries,
  every query scoped by `userId`.

## Decisions that differ from the PRD draft

| PRD | Here | Why |
| --- | --- | --- |
| `Game.steamId @unique` | unique per user (`@@unique([userId, steamId])`) | A global unique would stop two users from owning the same game |
| `User.steamId @unique`, auth via Steam OAuth (itself out of MVP scope) | Anonymous sessions: `POST /api/auth/anonymous` issues a signed token and the Steam profile is linked on import | Without OAuth, keying accounts on a public Steam ID would let anyone who knows your ID read and edit your notes. The token is a bearer header, not a cookie, so CSRF tokens aren't needed. **Losing the token (cleared browser data) loses access, so users are told to export backups.** Steam OpenID login is the natural next step |
| Import options for DLC and hidden games | Free-to-play toggle and auto-sort only | `GetOwnedGames` doesn't return DLC or hidden-game info. The DLC flag is filled per game from the Store API on refresh |
| Release date, Steam rating, achievements on import | Fetched when a game is first opened (or via "Refresh details") | At Steam's ~1 req/s limit, fetching these for 1,000 games would make import take 30+ minutes, against the < 60 s target |
| "Custom categories" | The four columns can be renamed; tags cover extra grouping | Keeps the `GameStatus` enum and the stats meaningful |
| `customNote` field | Removed; `notesUpdatedAt` and `completedAt` added | Needed for the notes timestamp, "completed this month" and trends |
| — | `ActivityDay` table | Streak tracking |
| Local storage / SQLite (P0 row) vs Postgres (tech section) | Postgres | The PRD's tech stack, architecture and constraints sections all specify a hosted Postgres web app |
| Section 17 "cross-platform builds" | n/a | Leftover from a desktop-app version of the PRD |
