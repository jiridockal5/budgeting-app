-- Enable RLS on all application tables (blocks anon/authenticated via PostgREST).
-- Prisma connects with a privileged role and bypasses RLS; no policies are required.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "global_assumptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "revenue_streams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "people" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forecast_scenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plg_revenue_assumptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_revenue_assumptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "partner_revenue_assumptions" ENABLE ROW LEVEL SECURITY;
