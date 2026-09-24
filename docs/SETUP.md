# Setup

## Local development

1. **Install:** `npm install` from the repository root. This installs the `backend` and
   `frontend` workspaces and runs `prisma generate`.
2. **Database:** `docker compose up -d postgres` starts Postgres 16 with user/password/db
   `steamtracker`. For an existing server, create a database and set `DATABASE_URL`.
3. **Environment:** `cp backend/.env.example backend/.env` and fill in:

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `DATABASE_URL` | yes | Postgres connection string |
   | `JWT_SECRET` | yes | ≥ 32 chars. Signs session tokens; changing it logs everyone out |
   | `STEAM_API_KEY` | for import | <https://steamcommunity.com/dev/apikey> |
   | `FRONTEND_URL` | yes in prod | CORS origin(s), comma-separated |
   | `PORT` | no | Default 3001 |

   The frontend reads `VITE_API_URL` (see `frontend/.env.example`); leave it empty in
   development, where Vite proxies `/api` to `localhost:3001`.
4. **Migrate:** `npm run prisma:migrate:deploy -w backend` (or `prisma:migrate:dev` when you
   change `prisma/schema.prisma`, which creates a new migration).
5. **Run:** `npm run dev`, then open <http://localhost:5173>.

## Tests

```bash
createdb steamtracker_test          # once; or use the docker Postgres
npm test
```

The backend's Jest global setup applies migrations to the test database. The CI workflow
(`.github/workflows/ci.yml`) runs lint, type-check, tests,
build and `npm audit` with a Postgres service.

## Deployment (PRD option A)

- **Database:** any managed Postgres. Run `prisma migrate deploy` on release (the Docker image
  does this on start).
- **Backend:** `docker build -f backend/Dockerfile -t steam-tracker-api .` from
  the repository root, or on Railway/Render use build `npm ci && npm run build -w backend`
  and start `npm run prisma:migrate:deploy -w backend && npm start -w backend`. Set the
  environment variables above; `NODE_ENV=production`.
- **Frontend:** static hosting (Vercel/Netlify). Build `npm run build -w frontend`, output
  `frontend/dist`, set `VITE_API_URL` to the backend origin, and add a SPA fallback rewrite
  (`/* → /index.html`).
- Serve both over HTTPS and set `FRONTEND_URL` to the frontend origin so CORS only allows it.
