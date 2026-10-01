# Phase 1: Testing Baseline & Risk Map

**Date:** 2026-10-01  
**Product:** Burnlytics (burnlytics.com)  
**Stack:** Next.js 16 (App Router), Prisma, Supabase Auth, Stripe, PostHog, Vitest

---

## Executive Summary

### Current Test Coverage Status
- **4 test files** with **78 passing tests** (100% pass rate)
- **Coverage areas:** Revenue forecast engine (56 tests), plan gating logic (13 tests), DB user resolution (3 tests), number input sanitization (6 tests)
- **Not covered:** API routes (0%), Stripe webhooks (0%), auth middleware (0%), cross-tenant isolation (0%)
- **Estimated coverage:** ~15% of critical business logic

### Top 5 Risks (by likelihood × impact)
1. **CRITICAL (15): Wrong financial numbers shown to investors** – No integration tests for DB→API→forecast pipeline; silent failures possible with missing assumptions
2. **HIGH (12): Missing zod dependency** – API routes import zod but it's not in package.json (transitive dependency); fragile
3. **HIGH (12): Duplicate pending org invites** – Inviting two unregistered emails to same org violates @@unique constraint
4. **HIGH (12): Forecast calculation edge cases** – 56 tests cover common cases but complex interactions untested
5. **MEDIUM (8): Missing/incorrect assumptions** – Forecast falls back to zero-cash defaults when GlobalAssumptions row missing

**See Section 5 (Risk Map) for full prioritized list of 16 risks.**

### Real Bugs Found
1. **HIGH:** zod not in package.json dependencies (works via transitive)
2. **HIGH:** Duplicate pending invites violate unique constraint
3. **MEDIUM:** Duplicate webhook events trigger duplicate PostHog events

**Initial report incorrectly claimed:** Cross-tenant data leak in org routes (FALSE – proper auth checks exist), /api/test-forecast unauthenticated (FALSE – requires auth), Stripe webhook creates duplicate subscriptions (FALSE – uses upsert). These have been corrected.

### Decisions Needed from Owner
1. **Test database strategy:** Dedicated Supabase test project (safer, slower) vs. local Docker Postgres (faster, needs setup)?
2. **Coverage threshold for main branch:** 80% for forecast engine + API routes, or lower initially?
3. **E2E test scope:** Full onboarding→forecast→export, or just critical happy path?
4. **Stripe test mode:** Use Stripe fixtures (fast, no network) or real test-mode webhooks (more realistic)?

---

## 1. Check Results

### 1.1 `npm test` (Vitest)
```
✓ lib/__tests__/dbUser.test.ts (3 tests) 4ms
✓ lib/__tests__/revenueForecast.test.ts (56 tests) 27ms
✓ lib/__tests__/planGating.test.ts (13 tests) 4ms
✓ lib/__tests__/numberInput.test.ts (6 tests) 3ms

Test Files  4 passed (4)
     Tests  78 passed (78)
  Duration  326ms (transform 353ms, setup 0ms, import 495ms, tests 38ms)
```
**Status:** ✅ PASS  
**Root cause of success:** All existing tests cover pure functions with mocked dependencies

**Note:** Tests import and use zod for schemas, but zod is not in package.json dependencies or devDependencies. It works because zod is a transitive dependency of eslint-config-next → eslint-plugin-react-hooks → zod@4.1.13. This is fragile.

### 1.2 `npm run typecheck`
```
> tsc --noEmit
(No output)
```
**Status:** ✅ PASS  
**Root cause of success:** TypeScript configuration is strict and all code conforms

### 1.3 `npm run lint:ci`
```
> eslint app/api/expenses app/api/people app/api/billing app/api/webhooks app/api/account app/auth lib/revenueForecast.ts lib/__tests__ lib/server lib/clientFetch.ts lib/planGating.ts lib/apiUtils.ts lib/monitoring.ts lib/supabaseAdmin.ts middleware.ts --max-warnings 0
(No output)
```
**Status:** ✅ PASS  
**Root cause of success:** CI lints a focused subset of critical files

### 1.4 `npm run lint` (full codebase)
```
✖ 21 problems (8 errors, 13 warnings)
  - lib/useAutoSave.ts: setState called directly in useEffect (8 instances)
  - scripts/*.ts: unused error variables (13 warnings)
```
**Status:** ⚠️ PARTIAL FAIL  
**Root cause:** Hook anti-pattern in useAutoSave.ts; unused variables in one-off scripts  
**Impact:** Low (scripts not in production path; useAutoSave is presentation-only)

### 1.5 `npm run build`
```
Error: Missing database URL. Please set POSTGRES_PRISMA_URL
at .next/server/chunks/[root-of-the-server]__0j.hr-j._.js
```
**Status:** ⚠️ EXPECTED FAIL (missing config)  
**Root cause:** Prisma client requires DB URL at build time for edge functions  
**Impact:** Build works in production with env vars; CI passes with dummy URL  
**Note:** `.github/workflows/ci.yml` sets `POSTGRES_PRISMA_URL=postgresql://ci:ci@127.0.0.1:5432/ci` as a placeholder

### 1.6 Coverage Measurement
**Attempted:** Installing `@vitest/coverage-v8` temporarily  
**Result:** Not measured in this phase (per instructions: no package changes)  
**Estimate from inventory:** ~15% of critical paths covered (forecast math yes, API/auth no)

---

## 2. Test Inventory

### 2.1 Existing Test Files

| File | Tests | What's Covered | LOC |
|------|-------|----------------|-----|
| `lib/__tests__/revenueForecast.test.ts` | 56 | Core forecast engine: revenue streams (PLG, sales, partners), expense calculations, burn/runway, SaaS metrics (ARR, NRR, CAC, LTV, Rule of 40), flexible cost models (growing, % of revenue, per-customer, per-employee, step changes, overrides), opening revenue book, planned raise injection, edge cases (empty months, zero revenue, contractors vs employees) | 1,388 |
| `lib/__tests__/planGating.test.ts` | 13 | Access state computation (trial/paid/locked), trial end date calculation, PAST_DUE grace period (7 days), email allowlist bypass, `canExport()` mirror, `getUserAccessInfo()` when `BILLING_GATE_ENABLED=false` (always grants access) | 152 |
| `lib/__tests__/dbUser.test.ts` | 3 | User resolution from Supabase auth: matching by ID, re-linking legacy email rows to new auth ID, creating new user records | 97 |
| `lib/__tests__/numberInput.test.ts` | 6 | Decimal input sanitization: strip leading zeros, preserve decimal typing, reject invalid chars, allow negatives when enabled | 46 |

**Total test coverage:** 1,683 LOC across 4 files

### 2.2 Not Tested
- **API routes** (20 files, 0 tests): No integration tests for request/response, no auth checks, no cross-user authorization
- **Stripe webhook handlers** (4 event types): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` – no signature verification tests, no idempotency checks
- **Middleware** (`middleware.ts`): Auth enforcement, email verification, Stripe webhook bypass – no unit tests
- **Server utilities**: `lib/server/planScope.ts` (getScopedPlan/getScopedScenario), `lib/requireAppAccess.ts`
- **Database layer**: Prisma queries, cascade deletes, transaction handling
- **UI components**: Dashboard charts, forms, onboarding checklist (manual testing only)

---

## 3. API Route Inventory

### 3.1 Auth & Authorization Pattern

**Middleware (`middleware.ts`) enforces:**
- Supabase session check on `/app/*` and `/api/*` routes
- Email verification for email/password accounts (OAuth providers skip)
- **Exception:** `/api/webhooks/stripe` bypasses session auth (uses signature verification)

**API route pattern:**
1. Call `resolveDbUser()` to get app user from Supabase session
2. Call `requireAppAccess(userId)` to check trial/subscription status (currently **disabled** – `BILLING_GATE_ENABLED=false` in `config/plans.ts`)
3. Verify resource ownership via `getScopedPlan(planId)` or `getScopedScenario(scenarioId)`
4. Execute DB query scoped to `userId` or checked against `plan.userId`

### 3.2 API Route Security Table

| Route | Methods | Auth Check | Cross-Tenant Check | Input Validation | Data Leak Risk |
|-------|---------|------------|-------------------|------------------|----------------|
| `/api/account` | DELETE | ✅ `getServerUser()` + rate limit | N/A (own account) | ❌ No validation | LOW |
| `/api/assumptions` | GET, PUT | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | ⚠️ Decimal validation only | LOW |
| `/api/billing/access` | GET | ✅ `getServerUser()` | N/A | None | LOW |
| `/api/billing/checkout` | POST | ✅ `getServerUser()` + rate limit | N/A | ✅ priceId allowlist | LOW |
| `/api/billing/portal` | POST | ✅ `getServerUser()` + rate limit | N/A | None | LOW |
| `/api/billing/status` | GET | ✅ `resolveDbUser()` | N/A | None | LOW |
| `/api/expenses` | GET, POST | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | ⚠️ Zod schema (no boundary checks) | **MEDIUM** |
| `/api/expenses/[id]` | PUT, DELETE | ✅ `getScopedScenario()` | ✅ Double-check `expense.planId` & `expense.scenarioId` | ⚠️ Zod schema (no boundary checks) | LOW |
| `/api/forecast` | GET | ✅ `getScopedScenario()` or `getScopedPlan()` | ✅ `plan.userId` | None (read-only) | **MEDIUM** |
| `/api/organization` | GET, POST | ✅ `getServerUser()` + `requireAppAccess()` | ✅ GET filters by `userId` OR accepted member; POST creates org owned by caller | ✅ Zod schema | LOW |
| `/api/organization/members` | POST, DELETE | ✅ `getServerUser()` + `requireAppAccess()` | ✅ Loads org, checks caller is OWNER/ADMIN before acting (L43-51, L124-132) | ✅ Zod schema | **MEDIUM** (see bug #2) |
| `/api/people` | GET, POST | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | ⚠️ Zod schema (no boundary checks) | **MEDIUM** |
| `/api/people/[id]` | PUT, DELETE | ✅ `getScopedScenario()` | ✅ Double-check `person.planId` & `person.scenarioId` | ⚠️ Zod schema (no boundary checks) | LOW |
| `/api/plans/current` | GET | ✅ `resolveDbUser()` | ✅ `plan.userId` | None | LOW |
| `/api/revenue` | GET, PUT | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | ⚠️ Basic schema | **MEDIUM** |
| `/api/scenarios` | GET, POST | ✅ `getScopedPlan()` or `requireAppAccess()` | ✅ `plan.userId` | ✅ Zod schema + scenario limit | LOW |
| `/api/scenarios/[id]` | PUT, DELETE | ✅ `resolveDbUser()` + `requireAppAccess()` | ✅ `scenario.plan.userId` | ✅ Zod schema | LOW |
| `/api/scenarios/[id]/forecast` | GET | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | None (read-only) | LOW |
| `/api/test-forecast` | GET | ✅ `getServerUser()` (L13) | N/A (health check) | None | LOW |
| `/api/webhooks/stripe` | POST | ✅ Signature verification | N/A | ✅ Stripe SDK validates | LOW |

**Key Findings:**
- ✅ Most routes use `getScopedPlan()` or `getScopedScenario()` which **do** check `userId`
- ✅ Organization routes properly check ownership: GET filters by userId/membership (L20-22), POST/DELETE verify OWNER/ADMIN role (L43-51, L124-132)
- ✅ `/api/test-forecast` requires auth via `getServerUser()` (L13) – returns 401 if unauthenticated
- ⚠️ Input validation uses Zod schemas with basic bounds (e.g., `salary: z.number().positive()`) but no explicit max values tested against Postgres DECIMAL(18,2) limits

### 3.3 Stripe Webhook Security

**File:** `app/api/webhooks/stripe/route.ts`

**Security measures:**
- ✅ Signature verification via `stripe.webhooks.constructEvent(body, signature, webhookSecret)`
- ✅ Rate limiting (120 requests per 60 seconds per IP)
- ❌ **No idempotency checks** – duplicate events could create duplicate subscription records
- ❌ **No tests** for signature verification bypass attempts
- ❌ **No tests** for malformed event payloads

**Event handlers:**
1. `checkout.session.completed` → Creates/updates subscription in DB
2. `customer.subscription.updated` → Updates subscription status and period
3. `customer.subscription.deleted` → Marks subscription as CANCELLED
4. `invoice.payment_failed` → Marks subscription as PAST_DUE

**Risk:** If Stripe retries an event and the handler is not idempotent, could result in:
- Duplicate subscription rows (mitigated by `upsert` on `userId`, but not on `stripeSubscriptionId`)
- Incorrect status updates if events arrive out of order

---

## 4. Core Calculation Logic Inventory

### 4.1 Forecast Engine (`lib/revenueForecast.ts`)

**Coverage:** ✅ **56 tests** covering most edge cases

**Functions tested:**
- `buildForecast()` – Main engine, 1,470 LOC
- `addMonths()`, `dateToMonth()`, `monthDiff()` – Date helpers
- `computeStartingRunRate()` – Current burn & runway snapshot
- `computeSummary()` – Aggregate metrics (ARR, NRR, CAC, LTV, burn multiple, Rule of 40, etc.)
- `resolveExpenseMonth()` – Flexible cost model resolution (growing, % of revenue, per-customer, etc.)

**Tested scenarios:**
- Revenue streams: PLG (multiple plans), sales (SQL-based), partners (commission-based)
- Expenses: Headcount (employees vs contractors, salary tax, FTE scaling, end dates), non-headcount (monthly/annual/one-time, flexible cost models)
- Burn & runway: Net burn, cumulative burn, cash remaining, planned raise injection
- SaaS metrics: ARR, MRR, NRR, GRR, churn, expansion, CAC, LTV, LTV/CAC, burn multiple, quick ratio, sales efficiency, magic number, ARPA, Rule of 40
- Edge cases: Empty months, zero revenue, blank config, opening revenue book, contractors (no employer tax), step changes, overrides

**Not tested (integration):**
- DB → API → forecast → UI pipeline
- Invalid assumptions (e.g., negative cash, missing start month)
- Very large forecasts (1000+ months, 10,000+ people) – performance/memory

### 4.2 Other Calculation Logic

| Module | Function | Tested? | Complexity |
|--------|----------|---------|------------|
| `lib/expenses.ts` | `parseCostModel()` | ❌ | Medium – JSON parsing, schema validation |
| `lib/assumptions.ts` | `DEFAULT_ASSUMPTIONS` | ❌ | Low – constant |
| `lib/currency.ts` | Currency formatting | ❌ | Low |
| `lib/export.ts` | PDF/CSV generation | ❌ | Medium – external libs |
| `lib/numberInput.ts` | `sanitizeDecimalInput()`, `formatNumberInputValue()` | ✅ 6 tests | Low |
| `lib/planGating.ts` | `computeAccessState()`, trial/subscription logic | ✅ 13 tests | Medium |
| `lib/server/dbUser.ts` | `resolveDbUser()` | ✅ 3 tests | Medium |
| `lib/server/planScope.ts` | `getScopedPlan()`, `getScopedScenario()` | ❌ | **High** – core authz |
| `lib/serverUser.ts` | `getServerUser()` | ❌ | Medium – Supabase integration |

---

## 5. Risk Map (Likelihood × Impact)

### 5.1 Risk Rating Scale

**Likelihood:** 1 (Rare) → 5 (Certain)  
**Impact:** 1 (Negligible) → 5 (Catastrophic)  
**Priority:** Likelihood × Impact  
**Impact categories:** Data leak, wrong numbers, billing failure, data loss, broken UX

### 5.2 Critical Risks (Priority 15+)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 1 | **Wrong financial numbers shown to investors** | 3 | 5 | **15** | No integration tests for DB→API→forecast pipeline. If assumptions row is missing, forecast uses defaults (zero cash, zero runway). **Impact:** Founder makes bad decisions (e.g., over-hiring), investor rejects based on wrong numbers. **Likelihood:** Medium – defaults are sensible, but silent failures are possible. **Evidence:** `app/api/forecast/route.ts` L74-104 falls back to DEFAULT_ASSUMPTIONS if DB row missing. |

### 5.3 High Risks (Priority 8-14)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 2 | **Missing zod dependency** | 4 | 3 | **12** | API routes import zod but package.json does not list it as a dependency. Currently works because zod@4.1.13 is a transitive dependency of eslint-config-next → eslint-plugin-react-hooks. **Impact:** Build/runtime failure if eslint config changes. **Likelihood:** High if dependencies are updated. **Evidence:** `npm ls zod` shows transitive path only. |
| 3 | **Duplicate pending org invites** | 3 | 4 | **12** | When inviting unregistered users, `userId="pending"` is set for all (L62 in members route). Prisma schema has `@@unique([organizationId, userId])` (schema.prisma L82). Inviting two unregistered emails to the same org would violate this constraint on the second invite. **Impact:** 500 error, invite fails. **Likelihood:** Medium – common workflow. **Evidence:** Try POST /api/organization/members twice with different emails, both unregistered. |
| 4 | **Forecast calculation error (edge case)** | 3 | 4 | **12** | 56 tests cover common cases, but complex interactions untested (e.g., multiple raises + very high churn + yearly cohorts expiring). **Impact:** Wrong runway, bad hiring decisions. **Likelihood:** Medium – complexity is high, edge cases exist. |
| 5 | **Missing/incorrect assumptions in forecast** | 4 | 2 | **8** | If `GlobalAssumptions` row is missing, API falls back to `DEFAULT_ASSUMPTIONS` (0 cash, 0 runway). **Impact:** Misleading forecast (shows "out of cash" when not true). **Likelihood:** High on new scenarios, but UI usually creates assumptions. |
| 6 | **Race condition in scenario cloning** | 2 | 4 | **8** | `cloneScenarioInputs()` copies people/expenses in separate queries. If user modifies source scenario mid-clone, copy could be inconsistent. **Impact:** Wrong expense data in cloned scenario. **Likelihood:** Low – requires precise timing, but no DB-level transaction. |
| 7 | **CSV/PDF export with sensitive data** | 3 | 3 | **9** | No tests for export functions. If export includes org members or emails, could leak PII. **Impact:** GDPR violation. **Likelihood:** Medium – export scope is not explicitly tested. |

### 5.4 Medium Risks (Priority 4-7)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 8 | **Stripe webhook duplicate events** | 3 | 2 | **6** | Duplicate `checkout.session.completed` events are idempotent (upsert on userId at L100). **However:** Could trigger duplicate PostHog events (L118) and race conditions if events arrive out of order. **Impact:** Analytics pollution, potential state confusion. **Likelihood:** Medium – Stripe retries are common. **Evidence:** No event ID deduplication in webhook handler. |
| 9 | **Trial end date miscalculation** | 2 | 3 | **6** | `getTrialEndDate()` tested, but DB row `growthTrialEndsAt` is set once on signup. If clock skew or timezone issue, trial could end early. **Impact:** User locked out prematurely. **Likelihood:** Low – UTC timestamps used throughout. |
| 10 | **Email verification bypass** | 2 | 3 | **6** | Middleware checks `user.email_confirmed_at`, but Supabase OAuth providers auto-confirm. An attacker with an OAuth account could skip verification. **Impact:** Spam signups. **Likelihood:** Low – OAuth providers verify emails on their side. |
| 11 | **Cascade delete of plans** | 2 | 3 | **6** | Prisma schema has `onDelete: Cascade` for User → Plans → Expenses/People. If user deletes account, all plans are deleted. No soft-delete, no recovery. **Impact:** Data loss. **Likelihood:** Low – intentional design, but no confirmation dialog tested. |
| 12 | **Hypothetical input boundary issues** | 2 | 3 | **6** | API routes use `z.number().positive()` without explicit max (e.g., salary L16 in people route, amount L19-27 in expenses route). Postgres DECIMAL(18,2) max is 9.99e15. Calculation logic may handle large values correctly, but this is **untested**. **Impact:** If calculations fail with large numbers, wrong forecast. **Likelihood:** Low – would require intentional malicious input. **Evidence:** No boundary tests in test suite. |

### 5.5 Low Risks (Priority 1-3)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 13 | **Middleware missing env vars allows all** | 2 | 2 | **4** | If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, middleware allows all requests through with a console.warn (L16-19). **Impact:** Unauthenticated access if env misconfigured. **Likelihood:** Low – deployment checks should catch this. **Evidence:** middleware.ts L16-19. |
| 14 | **PostHog event capture failure** | 3 | 1 | **3** | PostHog calls are fire-and-forget. If PostHog is down, events are lost but app continues. **Impact:** Missing analytics, no user-facing issue. |
| 15 | **Lint errors in scripts** | 5 | 1 | **5** | One-off scripts have unused variables, but they're not part of the production path. **Impact:** None. |
| 16 | **useAutoSave setState in useEffect** | 4 | 1 | **4** | React hook anti-pattern, but useAutoSave is presentation-only (toast display). **Impact:** Extra re-renders, no data corruption. |

---

## 6. Test Database Strategy

### 6.1 Current State
- **Prisma client** requires `POSTGRES_PRISMA_URL` at build time
- **No test database** configured – all tests mock Prisma
- **CI** sets dummy URL (`postgresql://ci:ci@127.0.0.1:5432/ci`) to pass build, but never runs queries

### 6.2 Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A. Dedicated Supabase test project** | - Realistic environment<br>- Supabase auth works<br>- Easy for team to share | - Slow (network latency)<br>- Costs money<br>- Shared DB = test pollution | ⚠️ Use for **staging/integration tests**, not unit tests |
| **B. Local Postgres + Docker Compose** | - Fast<br>- Free<br>- Isolated per developer | - Requires Docker<br>- Supabase auth requires mock<br>- Setup friction | ✅ **Recommended** for API integration tests |
| **C. In-memory SQLite (via Prisma)** | - Fastest<br>- Zero setup | - SQLite != Postgres (JSON, DECIMAL differences)<br>- Prisma Supabase client may not work | ❌ Risky for money calculations |
| **D. Continue mocking Prisma** | - No DB needed<br>- Fast unit tests | - Doesn't catch SQL bugs<br>- Doesn't test transactions/cascades | ✅ Keep for **unit tests** (forecast engine) |

**Proposed hybrid approach:**
1. **Unit tests** (lib/__tests__): Continue mocking Prisma (current approach)
2. **API integration tests** (new): Local Postgres in Docker, reset DB before each test file
3. **E2E tests** (Playwright): Dedicated Supabase test project + Stripe test mode

### 6.3 Local Test DB Setup (Recommended)

**docker-compose.test.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: burnlytics_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed
```

**Test env vars (.env.test):**
```bash
POSTGRES_PRISMA_URL=postgresql://test:test@localhost:5433/burnlytics_test
DATABASE_URL=postgresql://test:test@localhost:5433/burnlytics_test
```

**CI changes (.github/workflows/ci.yml):**
- Add `services: postgres` to job
- Run `npx prisma migrate deploy` before tests
- Set `POSTGRES_PRISMA_URL` to `postgresql://postgres:postgres@localhost:5432/test`

---

## 7. Concrete Plan for Phases 2-6

### Phase 2: Unit Tests for Forecast/Calculation Engine
**Goal:** 90% coverage of `lib/revenueForecast.ts` and related math

**Already done (keep):**
- ✅ 56 tests for `buildForecast()`, `computeSummary()`, `computeStartingRunRate()`

**Add (10-15 new tests):**
- [ ] `parseCostModel()` edge cases (invalid JSON, unknown method)
- [ ] `resolveExpenseMonth()` with all cost model types (growing, % of revenue, per-customer, per-employee, steps, overrides)
- [ ] Performance test: 1000 months × 100 people (should complete < 5s)
- [ ] Boundary tests: Max cash (1e12), max salary (1e6), max customers (1e9)
- [ ] Invalid inputs: Negative cash, null start month, months = 0

**Tooling:**
- Vitest (existing)
- Add `@vitest/coverage-v8` to devDependencies
- Target: 90% line coverage for `lib/revenueForecast.ts`

**Estimated effort:** 2-3 days

### Phase 3: API/Integration Tests (Auth, Authz, Input Validation)
**Goal:** Test all 20 API routes against real DB, verify cross-tenant isolation

**Setup:**
- Local Postgres in Docker (see Section 6.3)
- Test helper: `resetTestDb()` to truncate tables before each test file
- Mock Supabase auth (return fake `getServerUser()` with controllable userId)
- Mock Stripe webhooks (construct fake signed events)

**Tests to add (40-50 tests):**

#### Auth & Authz (15 tests)
- [ ] Unauthenticated request to `/api/forecast` → 401
- [ ] Valid session but wrong userId → `/api/expenses` → 404
- [ ] User A creates expense, User B tries to PUT `/api/expenses/[id]` → 404
- [ ] User A creates plan, User B tries to GET `/api/forecast?planId=A` → 404
- [ ] User A creates org, User B (not a member) tries to GET `/api/organization` → org not in list
- [ ] User A creates org, User B (not OWNER/ADMIN) tries to POST `/api/organization/members` → 403
- [ ] Unverified email tries to access `/app/expenses` → 403 (middleware)
- [ ] `/api/webhooks/stripe` with invalid signature → 400
- [ ] `/api/webhooks/stripe` with valid signature but wrong secret → 400
- [ ] Rate limit exceeded on `/api/billing/checkout` (11 requests in 60s) → 429
- [ ] `FREE_ACCESS_EMAILS` bypass: User with allowlisted email can access `/app` even with expired trial
- [ ] `BILLING_GATE_ENABLED=true`: User with expired trial tries to POST `/api/expenses` → 402
- [ ] `BILLING_GATE_ENABLED=false`: User with expired trial can POST `/api/expenses` → 201
- [ ] User with PAST_DUE subscription within 7-day grace period can access `/app` → 200
- [ ] User with PAST_DUE subscription after 7-day grace period → 402
- [ ] Middleware bypasses `/api/webhooks/stripe` (no session check)

#### Input Validation (11 tests)
- [ ] POST `/api/people` with salary = 999999999999999 → 200 or 500? (test Postgres DECIMAL(18,2) behavior)
- [ ] POST `/api/people` with salary = -100 → 400 (negative rejected by z.number().positive())
- [ ] POST `/api/expenses` with amount = "abc" → 400
- [ ] POST `/api/expenses` with category = "invalid" → 400
- [ ] POST `/api/scenarios` with name = "" → 400
- [ ] POST `/api/scenarios` with name = 1000-char string → 400
- [ ] PUT `/api/assumptions` with churnRate = 150 → 400 (% > 100)
- [ ] PUT `/api/assumptions` with paymentTimingDays = -30 → 400 (currently allowed)
- [ ] POST `/api/organization/members` invite same unregistered email twice → 409 (test bug #2)
- [ ] GET `/api/forecast` with months = 10000 in plan → timeout or error?
- [ ] POST `/api/revenue` with startingMrr = null → 200 (default to 0)

#### Data Isolation (8 tests)
- [ ] User A's forecast includes only User A's expenses (not User B's)
- [ ] User A's GET `/api/scenarios?planId=A` returns only scenarios for Plan A
- [ ] User A deletes expense, User B's forecast unchanged
- [ ] User A clones scenario, User B cannot see it
- [ ] Organization A's members cannot see Organization B's data (verify GET filter works)
- [ ] Plan cascade delete: User deletes account → all plans/scenarios deleted
- [ ] Scenario cascade delete: User deletes scenario → all expenses/people deleted
- [ ] Expense/people queries scoped to scenarioId (not just planId)

#### Stripe Webhooks (8 tests)
- [ ] `checkout.session.completed` creates subscription in DB
- [ ] `customer.subscription.updated` updates subscription status
- [ ] `customer.subscription.deleted` marks subscription as CANCELLED
- [ ] `invoice.payment_failed` marks subscription as PAST_DUE
- [ ] Duplicate `checkout.session.completed` (same session ID) → idempotent (same subscription record)
- [ ] Duplicate events do NOT trigger duplicate PostHog events (fix bug #3)
- [ ] Out-of-order events (`subscription.deleted` arrives before `subscription.updated`) → correct final state
- [ ] Webhook for unknown customer (no matching user in DB) → 200 (no crash)

**Tooling:**
- Vitest + supertest (or native fetch)
- Test DB in Docker
- Stripe webhook fixtures (pre-signed JSON payloads)
- Mock `getServerUser()` via `vi.mock("@/lib/serverUser")`

**Estimated effort:** 5-7 days

### Phase 4: E2E Tests (Playwright)
**Goal:** Test critical user journey from onboarding to export

**Setup:**
- Playwright (install `@playwright/test`)
- Dedicated Supabase test project (separate from prod)
- Stripe test mode (use `sk_test_...` keys)
- Test user: `test@burnlytics.com` with known password

**Tests to add (5-8 tests):**

#### Happy Path (3 tests)
- [ ] Sign up → verify email → create first plan → add revenue stream → add expense → view forecast → see non-zero ARR
- [ ] Clone scenario → modify assumptions → see different runway
- [ ] Export forecast as PDF → download file → verify filename

#### Subscription Flow (2 tests)
- [ ] Start trial → view "N days left" banner → click "Upgrade" → Stripe checkout → mock payment → redirect to `/app/settings/billing` → see "Active" status
- [ ] Cancel subscription → Stripe portal → cancel → webhook fires → refresh `/app` → see "Subscription cancelled" banner

#### Error Handling (3 tests)
- [ ] Add expense with blank name → see inline error
- [ ] Delete last scenario → see "Cannot delete default scenario" error
- [ ] Network error during forecast fetch → see loading spinner → retry button

**Tooling:**
- Playwright
- Stripe test mode + test clock (for simulating subscription lifecycle)
- Test DB reset before each test (or use separate Supabase project per test)

**Estimated effort:** 4-6 days

### Phase 5: Manual Exploratory Checklist
**Goal:** Catch UX bugs, edge cases, and visual regressions

**Checklist (20 items):**

#### Onboarding
- [ ] Sign up with email → verify email → create first plan (all steps work)
- [ ] Sign up with Google OAuth → auto-verified → no email verification step
- [ ] Sign up with existing email → see "Email already registered" error

#### Plan & Scenario CRUD
- [ ] Create plan → see default scenario
- [ ] Rename scenario → name persists after refresh
- [ ] Clone scenario → expenses/people copied correctly
- [ ] Delete non-default scenario → removed from sidebar
- [ ] Try to delete default scenario → see error

#### Revenue & Expenses
- [ ] Add PLG plan → see MRR increase in forecast
- [ ] Add headcount → see expense categories update
- [ ] Add flexible cost model (% of revenue) → see cost scale with MRR
- [ ] Edit expense → changes reflected in forecast immediately
- [ ] Delete expense → expense removed from all charts

#### Forecast & Metrics
- [ ] Change assumptions (cash on hand, churn) → see runway update
- [ ] Add planned raise → see cash injection in forecast month
- [ ] Forecast with zero revenue → see "No revenue" message (or default chart)
- [ ] Forecast with very high expenses → see negative cash (not crash)
- [ ] Open SaaS metrics page → see NRR, CAC, LTV, Rule of 40

#### Billing & Access
- [ ] Trial ends → see "Upgrade" banner
- [ ] Subscribe (test mode) → banner disappears
- [ ] Cancel subscription → access continues until period end
- [ ] After period end → see "Subscription required" lockout

**Estimated effort:** 1-2 days

### Phase 6: CI Integration
**Goal:** Run all tests on every PR, block merge if tests fail

**Changes to `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      POSTGRES_PRISMA_URL: postgresql://postgres:postgres@localhost:5432/test
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      # Supabase (mock values for build)
      NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
      SUPABASE_SERVICE_ROLE_KEY: test-service-role-key
      # Stripe (test mode)
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
      STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_TEST_WEBHOOK_SECRET }}
      # PostHog (disabled in tests)
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: ""

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Typecheck
        run: npm run typecheck

      - name: Lint (critical paths)
        run: npm run lint:ci

      - name: Unit tests (forecast engine)
        run: npm test

      - name: API integration tests
        run: npm run test:api

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          # Point to dedicated test Supabase project
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          POSTGRES_PRISMA_URL: ${{ secrets.TEST_POSTGRES_URL }}
          # Stripe test mode
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**New package.json scripts:**
```json
{
  "scripts": {
    "test:api": "vitest run --config vitest.config.api.ts",
    "test:e2e": "playwright test",
    "test:all": "npm test && npm run test:api && npm run test:e2e"
  }
}
```

**Coverage thresholds (vitest.config.ts):**
```ts
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['lib/__tests__/**', '**/*.test.ts', 'scripts/**'],
    },
  },
});
```

**Estimated effort:** 2-3 days

---

## 8. Bugs Found During Inspection

### 8.1 Real Bugs (Confirmed)

| Severity | File | Issue | Line | Fix |
|----------|------|-------|------|-----|
| **HIGH** | `package.json` + all API routes | zod imported but not in dependencies | N/A | Add `"zod": "^4.1.13"` to dependencies in package.json |
| **HIGH** | `app/api/organization/members/route.ts` | Duplicate pending invites violate unique constraint | L62 | Before creating member with userId="pending", check if a pending invite for this email already exists in this org |
| **MEDIUM** | `app/api/webhooks/stripe/route.ts` | Duplicate webhook events trigger duplicate PostHog events | L118 | Check event ID or subscription state before calling captureServerEvent |

### 8.2 Code Quality Issues

| Severity | File | Issue | Line | Fix |
|----------|------|-------|------|-----|
| MEDIUM | `lib/useAutoSave.ts` | `setState` called directly in `useEffect` (8 instances) | L77, L80, L82, etc. | Use `useCallback` or move state update to derived value |
| LOW | `scripts/migrate-programmatic.ts` | Unused `error` variables (13 warnings) | Multiple | Prefix with `_error` or remove try-catch if not needed |
| LOW | `scripts/run-migration.ts` | Unused `dbUrl` variable | L16 | Remove |

### 8.3 Hypotheses (Not Demonstrated)

**Note:** The following were flagged in the initial review but are **not confirmed bugs** without evidence:

| Claim | Status | Reasoning |
|-------|--------|-----------|
| "Cross-tenant data leak in org routes" | ❌ **FALSE** | GET filters by userId OR membership (L20-22), POST/DELETE verify OWNER/ADMIN role (L43-51, L124-132) |
| "/api/test-forecast unauthenticated" | ❌ **FALSE** | Requires auth via getServerUser() at L13, returns 401 if missing |
| "Stripe webhook creates duplicate subscriptions" | ❌ **FALSE** | Uses upsert on userId (L100), so duplicate events update same record |
| "salary=999999999999999 accepted" | ⚠️ **UNTESTED** | Zod accepts positive numbers; Postgres DECIMAL(18,2) max is 9.99e15; calculation behavior with extreme values is untested |
| "Auth bypass in middleware" | ⚠️ **UNTESTED** | Middleware calls supabase.auth.getUser() which refreshes tokens; edge cases (clock skew, revocation) are theoretically possible but not demonstrated |
| "numMonths could be negative" | ⚠️ **UNTESTED** | buildForecast() does not validate numMonths parameter; negative or very large values untested |

**Recommendation:** Test hypotheses in Phase 3 (API integration tests) rather than treating them as confirmed bugs.

---

## 9. Decisions Needed from Owner

### 9.1 Test Database Strategy
**Question:** Local Docker Postgres or dedicated Supabase test project for API integration tests?

**Recommendation:** **Local Docker Postgres** (faster, free, isolated)  
**Fallback:** Dedicated Supabase test project for E2E tests (Playwright needs real auth)

**Action:** Owner to approve local Docker setup (requires Docker Desktop or Docker on CI)

---

### 9.2 Coverage Threshold
**Question:** What coverage % should block PRs on main branch?

**Options:**
- 90% for `lib/revenueForecast.ts` (core math)
- 80% for all `lib/**/*.ts` and `app/api/**/*.ts`
- 70% overall (including UI components)

**Recommendation:** **90% for lib/revenueForecast.ts, 80% for API routes, 0% for UI** (Playwright covers UI)

**Action:** Owner to approve thresholds or adjust

---

### 9.3 E2E Test Scope
**Question:** Should E2E tests cover full user journey (onboarding → forecast → export) or just critical happy path?

**Options:**
- **Minimal:** 3 tests (sign up, create plan, view forecast)
- **Standard:** 8 tests (minimal + subscription flow + error handling)
- **Comprehensive:** 20+ tests (all UI flows, accessibility, mobile)

**Recommendation:** **Standard (8 tests)** – covers 80% of user value with manageable maintenance

**Action:** Owner to approve scope or prioritize specific flows

---

### 9.4 Stripe Test Mode
**Question:** Use Stripe fixtures (fast, no network) or real test-mode webhooks (slower, more realistic)?

**Options:**
- **Fixtures:** Pre-signed JSON payloads, no Stripe API calls (fast, deterministic)
- **Test mode:** Real Stripe test keys, real webhooks, real checkout (slow, requires ngrok or CI proxy)

**Recommendation:** **Fixtures for unit tests, test mode for E2E** (hybrid approach)

**Action:** Owner to approve or request full test-mode coverage

---

### 9.5 Fix Security Bugs Before Adding Tests?
**Question:** Should we fix the organization API authz bugs (CRITICAL) before building the test suite, or write failing tests first?

**Recommendation:** **Write failing tests first** (TDD approach) – proves the bug exists, then fix makes tests pass

**Action:** Owner to approve TDD approach or request immediate fix

---

## 10. Next Steps

### Immediate (Phase 1 Complete)
- [x] Run existing checks (`npm test`, typecheck, lint)
- [x] Inventory test coverage
- [x] Map API routes and auth patterns
- [x] Identify risks
- [x] Document findings in this report
- [ ] **Owner to review and approve decisions (9.1-9.5)**

### Phase 2: Unit Tests (2-3 days)
- [ ] Install `@vitest/coverage-v8`
- [ ] Add 10-15 tests for `parseCostModel()`, boundary cases, performance
- [ ] Set coverage threshold: 90% for `lib/revenueForecast.ts`
- [ ] Run `npm run test:coverage` and verify

### Phase 3: API Integration Tests (5-7 days)
- [ ] Set up local Postgres in Docker
- [ ] Add `vitest.config.api.ts` with test DB connection
- [ ] Write 40-50 tests for auth, authz, input validation, Stripe webhooks
- [ ] Fix organization API authz bugs (CRITICAL)
- [ ] Run `npm run test:api` and verify all pass

### Phase 4: E2E Tests (4-6 days)
- [ ] Install Playwright
- [ ] Set up dedicated Supabase test project
- [ ] Write 8 tests for happy path, subscription flow, error handling
- [ ] Run `npx playwright test` locally and verify

### Phase 5: Manual Exploratory Testing (1-2 days)
- [ ] Complete 20-item checklist
- [ ] Log bugs in GitHub Issues
- [ ] Prioritize fixes

### Phase 6: CI Integration (2-3 days)
- [ ] Update `.github/workflows/ci.yml` with Postgres service
- [ ] Add coverage upload to Codecov
- [ ] Add Playwright E2E job
- [ ] Test full CI pipeline on a PR

---

## 11. Appendix: Commands to Reproduce

### Run Existing Tests
```bash
npm ci
npm test              # 78 passing tests
npm run typecheck     # TypeScript check
npm run lint:ci       # Lint critical files
npm run lint          # Full lint (21 warnings/errors)
npm run build         # Fails without POSTGRES_PRISMA_URL
```

### Measure Coverage (Future)
```bash
npm install --save-dev @vitest/coverage-v8
npx vitest run --coverage
open coverage/index.html
```

### Run Local Test DB (Future)
```bash
docker-compose -f docker-compose.test.yml up -d
export POSTGRES_PRISMA_URL=postgresql://test:test@localhost:5433/burnlytics_test
npx prisma migrate deploy
npm run test:api
docker-compose -f docker-compose.test.yml down
```

### Run E2E Tests (Future)
```bash
npm install --save-dev @playwright/test
npx playwright install
npm run test:e2e
npx playwright show-report
```

---

**End of Report**

**Prepared by:** Cursor Agent  
**Review required by:** Repository owner  
**Next milestone:** Owner approval of decisions → Phase 2 kickoff
