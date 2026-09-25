# Setup

## Local development

1. **Install:** `npm install` from the repository root. This installs the `backend` and
   `frontend` workspaces and runs `prisma generate`.
2. **Database:** either a Supabase project (below), or `docker compose up -d postgres`,
   which starts Postgres 16 with user/password/db `steamtracker`.
3. **Environment:** `cp backend/.env.example backend/.env` and fill in:

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `DATABASE_URL` | yes | Connection the app uses (Supabase: transaction pooler, port 6543, `?pgbouncer=true`) |
   | `DIRECT_URL` | yes | Connection migrations use (Supabase: session pooler, port 5432). Locally, same as `DATABASE_URL` |
   | `JWT_SECRET` | yes | ≥ 32 chars. Signs session tokens; changing it logs everyone out |
   | `STEAM_API_KEY` | for import | <https://steamcommunity.com/dev/apikey> |
   | `FRONTEND_URL` | yes in prod | CORS origin(s), comma-separated |
   | `PORT` | no | Default 3001 |

   The frontend reads `VITE_API_URL` (see `frontend/.env.example`); leave it empty in
   development, where Vite proxies `/api` to `localhost:3001`.
4. **Migrate:** `npm run prisma:migrate:deploy -w backend` (or `prisma:migrate:dev` when you
   change `prisma/schema.prisma`, which creates a new migration).
5. **Run:** `npm run dev`, then open <http://localhost:5173>.

## Supabase

1. In the Supabase dashboard open your project and click **Connect** (top bar), then the
   **ORMs** tab and pick **Prisma**. It shows a `DATABASE_URL` (transaction pooler, port
   6543) and a `DIRECT_URL` (session pooler, port 5432). Copy both into `backend/.env` and
   replace `[YOUR-PASSWORD]` with your database password (**Project Settings → Database**
   lets you reset it if you've forgotten it). If the password has special characters like
   `@`, `#` or `/`, URL-encode them or pick a password without them.
2. Run `npm run prisma:migrate:deploy -w backend`. The tables then appear under
   **Table Editor** in Supabase.
3. The second migration turns on row level security for every table. Supabase otherwise
   exposes tables in the `public` schema through its REST API to anyone holding the
   project's public `anon` key. The backend connects as the table owner, so it isn't
   affected. Don't add RLS policies or use the Supabase client libraries against these
   tables; all access goes through the backend API.
4. Tests never touch Supabase: they use `postgresql://…@localhost:5432/steamtracker_test`
   unless you export a different `DATABASE_URL` in your shell.

Free Supabase projects pause after a week of inactivity; resume them from the dashboard.

## Tests

```bash
createdb steamtracker_test          # once; or use the docker Postgres
npm test
```

The backend's Jest global setup applies migrations to the test database. The CI workflow
(`.github/workflows/ci.yml`) runs lint, type-check, tests,
build and `npm audit` with a Postgres service.

## Deployment (PRD option A)

- **Database:** Supabase (or any managed Postgres). Set both `DATABASE_URL` and `DIRECT_URL`
  on the backend host. Run `prisma migrate deploy` on release (the Docker image does this on
  start).
- **Backend:** `docker build -f backend/Dockerfile -t steam-tracker-api .` from
  the repository root, or on Railway/Render use build `npm ci && npm run build -w backend`
  and start `npm run prisma:migrate:deploy -w backend && npm start -w backend`. Set the
  environment variables above; `NODE_ENV=production`.
- **Frontend:** static hosting (Vercel/Netlify). Build `npm run build -w frontend`, output
  `frontend/dist`, set `VITE_API_URL` to the backend origin, and add a SPA fallback rewrite
  (`/* → /index.html`).
- Serve both over HTTPS and set `FRONTEND_URL` to the frontend origin so CORS only allows it.
