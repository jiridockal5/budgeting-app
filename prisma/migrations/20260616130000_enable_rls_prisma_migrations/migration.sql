-- Enable RLS on Prisma's migration history table (blocks anon/authenticated via PostgREST).
-- Prisma connects with a privileged role and bypasses RLS.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
