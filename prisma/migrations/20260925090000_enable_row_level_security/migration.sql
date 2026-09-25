-- Supabase publishes every table in the "public" schema through its REST/GraphQL Data API,
-- reachable with the project's public "anon" key. The app only talks to the database through
-- the backend (as the table owner, which bypasses RLS), so enabling row level security with
-- no policies blocks all Data API access while leaving the app unaffected.
-- On plain PostgreSQL this is harmless.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImportHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_GameToTag" ENABLE ROW LEVEL SECURITY;
-- Prisma's own bookkeeping table (absent in the shadow database used by `migrate dev`).
DO $$
BEGIN
  IF to_regclass('public."_prisma_migrations"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
