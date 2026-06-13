# Burnlytics — Launch handoff PRD (for next agent)

**Product:** Burnlytics — SaaS forecasting app for early-stage startups (runway, burn, revenue, expenses).  
**Repo:** `https://github.com/jiridockal5/budgeting-app.git`  
**Production:** `https://burnlytics.com` (Vercel)  
**Stack:** Next.js 16, Supabase Auth, Prisma + Postgres (Supabase), Stripe billing.

**Owner test account:** `jiri.dockal5@gmail.com` (has permanent free access via env var — see below).

---

## Goal

Finish remaining launch blockers so Burnlytics can be **offered to paying customers** safely and legally.

---

## Completed (do not re-implement)

### Security & infra
- [x] Removed committed DB credentials from repo (`README`, helper scripts deleted)
- [x] Removed public `/verify` diagnostics page
- [x] Security headers in `next.config.ts`
- [x] DB password **rotated** in Supabase (old password still in git history — rotation makes it harmless)
- [x] `POSTGRES_PRISMA_URL` updated in Vercel + local `.env`
- [x] Stale `DATABASE_URL` removed from Vercel
- [x] Prisma + Supabase pooler fix: `lib/prisma.ts` auto-appends `pgbouncer=true&connection_limit=1` for port 6543

### Auth lifecycle
- [x] `/auth/callback` route — PKCE + token-hash flows
- [x] `/reset-password` page
- [x] `/verify-email` page + resend
- [x] Email verification enforced in `middleware.ts` for email/password users
- [x] Account deletion: `DELETE /api/account` + `/app/settings/account` UI
- [x] `lib/supabaseAdmin.ts` (needs `SUPABASE_SERVICE_ROLE_KEY` in env)

### Legal & marketing
- [x] `/terms` and `/privacy` pages (templates with **placeholders** — not filled)
- [x] Footer links fixed
- [x] Marketing nav `/plan` → `/app` fixed
- [x] Pricing copy aligned (`Email support` not "Priority")

### Billing
- [x] Stripe integration (checkout, portal, webhooks, trial, gating)
- [x] `PAST_DUE` 7-day grace period (`PAST_DUE_GRACE_DAYS` in `lib/planGating.ts`)
- [x] Rate limiting on billing/webhook/account routes
- [x] `FREE_ACCESS_EMAILS` env var for owner/test bypass (`hasFreeAccessEmail` checks Supabase auth email)

### Ops
- [x] `captureRouteException` on all API routes
- [x] Tests: `lib/__tests__/revenueForecast.test.ts`, `lib/__tests__/planGating.test.ts` (44 tests)
- [x] Stripe go-live checklist in `docs/operations.md`

### Production verified
- [x] Login works on burnlytics.com
- [x] Dashboard loads for owner with `FREE_ACCESS_EMAILS` set
- [x] Prisma pooler error resolved after deploy `87e2c23`

---

## Next work (prioritized)

### P0 — Supabase Auth config (manual, ~10 min)

**Why:** Password reset and email verification links fail without redirect URLs in Supabase dashboard.

**Steps:**
1. Supabase Dashboard → project `budgeting-app` (ref: `puiswljpjrodpnflopdp`)
2. **Authentication → URL Configuration**
   - **Site URL:** `https://burnlytics.com`
   - **Redirect URLs** (add both):
     - `https://burnlytics.com/auth/callback`
     - `http://localhost:3001/auth/callback`
3. **Authentication → Providers → Email:** ensure **Confirm email** is enabled

**Acceptance criteria:**
- New signup receives confirmation email; link lands on `/app` after callback
- Forgot password email → `/reset-password` works end-to-end on production

**Code touchpoints:** `app/auth/callback/route.ts`, `middleware.ts`, `app/(auth)/*`

---

### P0 — `SUPABASE_SERVICE_ROLE_KEY` in env

**Why:** Account deletion (`DELETE /api/account`) requires admin API to delete Supabase auth user.

**Steps:**
1. Supabase → **Project Settings → API Keys** → copy **service_role** (secret, never `NEXT_PUBLIC_`)
2. Add to Vercel Environment Variables: `SUPABASE_SERVICE_ROLE_KEY`
3. Add to local `.env`
4. Redeploy Vercel

**Acceptance criteria:**
- Settings → Account → Delete account completes without 500
- User cannot sign in again with same email after deletion

**Code:** `lib/supabaseAdmin.ts`, `app/api/account/route.ts`

---

### P0 — Legal page placeholders

**Why:** Required before charging EU/real customers.

**Files:**
- `app/(legal)/terms/page.tsx`
- `app/(legal)/privacy/page.tsx`

**Replace placeholders:**
- `[COMPANY LEGAL NAME]`
- `[COMPANY ADDRESS]`
- `[JURISDICTION]`
- `[SUPPORT EMAIL]`

**Acceptance criteria:** No bracket placeholders remain; footer links render real content.

**Note:** Recommend owner get lawyer review before launch — agent fills placeholders only unless given real values.

---

### P1 — Stripe live mode

**Why:** App uses **test/sandbox** Stripe keys today. Real payments need live keys + webhook.

**Follow:** `docs/operations.md` → "Stripe production go-live checklist"

**Summary:**
1. Stripe Dashboard → **live mode**
2. Create product/prices (or `npx tsx scripts/setup-stripe.ts` with live `STRIPE_SECRET_KEY`)
3. Set all 8 price ID env vars in Vercel (`STRIPE_GROWTH_*`, `NEXT_PUBLIC_STRIPE_GROWTH_*`)
4. Webhook: `https://burnlytics.com/api/webhooks/stripe` with events listed in ops doc
5. Enable Stripe Billing Portal
6. E2E test: signup → trial → checkout → webhook → access unlock → cancel

**Acceptance criteria:** Real card payment unlocks app; webhook 2xx in Stripe dashboard.

---

### P2 — Optional / deferred

| Item | Notes |
|------|--------|
| Git history secret purge | DB password rotated; optional `git filter-repo` |
| Sentry | Deferred per `docs/operations.md` |
| PostHog analytics | Deferred per `docs/happy-path.md` |
| Actuals / Team | Hidden via `config/launch.ts` |
| VAT, invoices UI, multi-tier pricing | Not in v1 scope |

---

## Environment variables reference

### Required in Vercel (production)

| Variable | Status | Notes |
|----------|--------|-------|
| `POSTGRES_PRISMA_URL` | ✅ Set | Pooler port 6543; code adds `pgbouncer=true` if missing |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | |
| `FREE_ACCESS_EMAILS` | ✅ Set | `jiri.dockal5@gmail.com` — owner bypass |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **TODO** | Server-only |
| `STRIPE_SECRET_KEY` | ⚠️ Test keys | Switch to live for real payments |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Needs live webhook endpoint |
| `STRIPE_GROWTH_*_PRICE_ID` (×4) | ⚠️ | Sandbox IDs today |
| `NEXT_PUBLIC_STRIPE_GROWTH_*` (×4) | ⚠️ | |

### Local dev

Copy from `.env.example`. Owner uses `.env` (not `.env.local`). Never commit.

---

## Key architecture notes

- **Access gating:** `lib/planGating.ts` → trial 7 days → locked → `/app/subscribe`
- **Free bypass:** `FREE_ACCESS_EMAILS` comma-separated; checked against Supabase auth email first
- **Middleware:** Protects `/app/*` and `/api/*`; enforces email verification; exempts `/api/webhooks/stripe`
- **Happy path QA:** `docs/happy-path.md`
- **CI:** `npm run typecheck`, `npm run lint:ci`, `npm test`

---

## Suggested agent session prompt (copy-paste)

```
Read docs/launch-handoff.md and docs/operations.md.

Burnlytics launch — continue from handoff. DB is done and production works for owner account.

Do P0 in order:
1. Guide me through Supabase Auth redirect URLs (or document what I must click if manual-only)
2. Add SUPABASE_SERVICE_ROLE_KEY to Vercel — I'll paste the key when you tell me where
3. Legal placeholders — ask me for company name, address, jurisdiction, support email before editing terms/privacy

Then P1 Stripe live if time permits.

Repo: c:\Projects\v2, branch main, deployed to burnlytics.com via Vercel.
Do not re-implement completed items in launch-handoff.md.
```

---

*Last updated: after session completing DB rotation, Vercel env, FREE_ACCESS_EMAILS, Prisma pooler fix (commits through `87e2c23`).*
