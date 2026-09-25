import { execSync } from 'child_process';

/**
 * Applies migrations to the test database. When no database is reachable the API tests are
 * skipped (unit tests still run) so `npm test` works without Postgres.
 */
export default function globalSetup() {
  process.env.DATABASE_URL ??=
    'postgresql://steamtracker:steamtracker@localhost:5432/steamtracker_test';
  process.env.DIRECT_URL ??= process.env.DATABASE_URL;
  try {
    execSync('npx prisma migrate deploy', { stdio: 'pipe', env: process.env, timeout: 60_000 });
  } catch {
    console.warn(
      '\n[tests] No database reachable at DATABASE_URL: skipping API integration tests.\n',
    );
    process.env.SKIP_DB_TESTS = '1';
  }
}
