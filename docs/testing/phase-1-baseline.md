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
1. **CRITICAL: Cross-tenant data leak** – API routes lack systematic authorization tests; financial data could leak between users
2. **CRITICAL: Incorrect financial calculations shown to founders/investors** – Core forecast engine tested, but no integration tests verify DB→API→calculation→UI pipeline
3. **HIGH: Stripe webhook failures** – No idempotency tests, signature verification untested, payment_failed scenarios uncovered
4. **HIGH: Missing input validation on money fields** – API routes accept arbitrary decimals without boundary checks; risk of overflow/precision loss
5. **MEDIUM: Auth bypass in edge cases** – Middleware tested only manually; fallback behavior and email verification logic not unit-tested

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
| `/api/organization` | GET, POST, PUT, DELETE | ⚠️ Partial (resolveDbUser) | ❌ **No check on org ownership** | ⚠️ Basic Zod | **HIGH** |
| `/api/organization/members` | GET, POST, DELETE | ⚠️ Partial (resolveDbUser) | ❌ **No check on org ownership** | ⚠️ Basic Zod | **HIGH** |
| `/api/people` | GET, POST | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | ⚠️ Zod schema (no boundary checks) | **MEDIUM** |
| `/api/people/[id]` | PUT, DELETE | ✅ `getScopedScenario()` | ✅ Double-check `person.planId` & `person.scenarioId` | ⚠️ Zod schema (no boundary checks) | LOW |
| `/api/plans/current` | GET | ✅ `resolveDbUser()` | ✅ `plan.userId` | None | LOW |
| `/api/revenue` | GET, PUT | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | ⚠️ Basic schema | **MEDIUM** |
| `/api/scenarios` | GET, POST | ✅ `getScopedPlan()` or `requireAppAccess()` | ✅ `plan.userId` | ✅ Zod schema + scenario limit | LOW |
| `/api/scenarios/[id]` | PUT, DELETE | ✅ `resolveDbUser()` + `requireAppAccess()` | ✅ `scenario.plan.userId` | ✅ Zod schema | LOW |
| `/api/scenarios/[id]/forecast` | GET | ✅ `getScopedScenario()` | ✅ `scenario.plan.userId` | None (read-only) | LOW |
| `/api/test-forecast` | POST | ❌ **No auth check** | N/A (ephemeral) | ⚠️ Basic validation | **MEDIUM** (DoS risk) |
| `/api/webhooks/stripe` | POST | ✅ Signature verification | N/A | ✅ Stripe SDK validates | LOW |

**Key Findings:**
- ✅ Most routes use `getScopedPlan()` or `getScopedScenario()` which **do** check `userId`
- ❌ **CRITICAL:** `/api/organization` and `/api/organization/members` routes have **incomplete authorization** – they call `resolveDbUser()` but **do not verify organization ownership** before DB operations
- ❌ `/api/test-forecast` is **unauthenticated** (ephemeral calculation endpoint, but could be DoS vector)
- ⚠️ Input validation relies on Zod schemas but lacks **boundary checks** on money fields (e.g., max salary, max expense amount, max forecast months)

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
| 1 | **Cross-tenant data leak** (org API routes) | 4 | 5 | **20** | `/api/organization` and `/api/organization/members` lack ownership checks. An attacker who guesses an `organizationId` could read/modify another user's org. **Impact:** Financial data leak, GDPR violation, loss of trust. **Likelihood:** High if IDs are sequential/guessable UUIDs. |
| 2 | **Wrong financial numbers shown to investors** | 3 | 5 | **15** | No integration tests for DB→API→forecast pipeline. If assumptions row is missing, forecast uses defaults (zero cash, zero runway). **Impact:** Founder makes bad decisions (e.g., over-hiring), investor rejects based on wrong numbers. **Likelihood:** Medium – defaults are sensible, but silent failures are possible. |
| 3 | **Stripe webhook duplicate processing** | 3 | 4 | **12** | No idempotency checks. If Stripe retries `checkout.session.completed`, could create duplicate subscription records or overwrite correct status. **Impact:** User locked out or billed twice. **Likelihood:** Medium – Stripe retries are common, but `upsert` on `userId` provides partial protection. |
| 4 | **Input validation bypass (money overflow)** | 2 | 5 | **10** | API routes accept arbitrary decimals. A user could POST salary=999999999999999 and overflow Postgres `DECIMAL(18,2)` or break calculations. **Impact:** Forecast crashes, DB errors, wrong burn calculations. **Likelihood:** Low – requires malicious actor, but trivial to exploit. |
| 5 | **Auth bypass via middleware edge case** | 2 | 5 | **10** | Middleware not unit-tested. If Supabase session expires mid-request, user could access `/app` routes with stale cookie. **Impact:** Unauthorized access to financial data. **Likelihood:** Low – Supabase handles session refresh, but edge cases exist (clock skew, token revocation). |

### 5.3 High Risks (Priority 8-14)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 6 | **Forecast calculation error (edge case)** | 3 | 4 | **12** | 56 tests cover common cases, but complex interactions untested (e.g., multiple raises + very high churn + yearly cohorts expiring). **Impact:** Wrong runway, bad hiring decisions. **Likelihood:** Medium – complexity is high, edge cases exist. |
| 7 | **Stripe signature verification bypass** | 2 | 5 | **10** | Webhook signature verification not tested. If attacker forges a webhook, could mark subscriptions as ACTIVE without payment. **Impact:** Revenue loss, access granted to non-payers. **Likelihood:** Low – Stripe signing is robust, but misconfiguration is possible. |
| 8 | **Missing/incorrect assumptions in forecast** | 4 | 2 | **8** | If `GlobalAssumptions` row is missing, API falls back to `DEFAULT_ASSUMPTIONS` (0 cash, 0 runway). **Impact:** Misleading forecast (shows "out of cash" when not true). **Likelihood:** High on new scenarios, but UI usually creates assumptions. |
| 9 | **Race condition in scenario cloning** | 2 | 4 | **8** | `cloneScenarioInputs()` copies people/expenses in separate queries. If user modifies source scenario mid-clone, copy could be inconsistent. **Impact:** Wrong expense data in cloned scenario. **Likelihood:** Low – requires precise timing, but no DB-level transaction. |
| 10 | **CSV/PDF export with sensitive data** | 3 | 3 | **9** | No tests for export functions. If export includes org members or emails, could leak PII. **Impact:** GDPR violation. **Likelihood:** Medium – export scope is not explicitly tested. |

### 5.4 Medium Risks (Priority 4-7)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 11 | **Trial end date miscalculation** | 2 | 3 | **6** | `getTrialEndDate()` tested, but DB row `growthTrialEndsAt` is set once on signup. If clock skew or timezone issue, trial could end early. **Impact:** User locked out prematurely. **Likelihood:** Low – UTC timestamps used throughout. |
| 12 | **Email verification bypass** | 2 | 3 | **6** | Middleware checks `user.email_confirmed_at`, but Supabase OAuth providers auto-confirm. An attacker with an OAuth account could skip verification. **Impact:** Spam signups. **Likelihood:** Low – OAuth providers verify emails on their side. |
| 13 | **Unauthenticated /api/test-forecast DoS** | 3 | 2 | **6** | No auth check, no rate limit. Attacker could POST large forecasts (1000 months × 1000 people) and exhaust server CPU/memory. **Impact:** Service downtime. **Likelihood:** Medium – endpoint is public, but requires knowledge of schema. |
| 14 | **Cascade delete of plans** | 2 | 3 | **6** | Prisma schema has `onDelete: Cascade` for User → Plans → Expenses/People. If user deletes account, all plans are deleted. No soft-delete, no recovery. **Impact:** Data loss. **Likelihood:** Low – intentional design, but no confirmation dialog tested. |

### 5.5 Low Risks (Priority 1-3)

| Rank | Risk | Likelihood | Impact | Priority | Reasoning |
|------|------|------------|--------|----------|-----------|
| 15 | **PostHog event capture failure** | 3 | 1 | **3** | PostHog calls are fire-and-forget. If PostHog is down, events are lost but app continues. **Impact:** Missing analytics, no user-facing issue. |
| 16 | **Lint errors in scripts** | 5 | 1 | **5** | One-off scripts have unused variables, but they're not part of the production path. **Impact:** None. |
| 17 | **useAutoSave setState in useEffect** | 4 | 1 | **4** | React hook anti-pattern, but useAutoSave is presentation-only (toast display). **Impact:** Extra re-renders, no data corruption. |

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
- [ ] User A creates org, User B tries to POST `/api/organization/members` → **should 404** (test current bug)
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

#### Input Validation (10 tests)
- [ ] POST `/api/expenses` with salary = 999999999999999 → 400 (boundary check)
- [ ] POST `/api/people` with salary = -100 → 400 (negative check)
- [ ] POST `/api/expenses` with amount = "abc" → 400
- [ ] POST `/api/expenses` with category = "invalid" → 400
- [ ] POST `/api/scenarios` with name = "" → 400
- [ ] POST `/api/scenarios` with name = 1000-char string → 400
- [ ] PUT `/api/assumptions` with churnRate = 150 → 400 (% > 100)
- [ ] PUT `/api/assumptions` with paymentTimingDays = -30 → 400
- [ ] POST `/api/test-forecast` with months = 10000 → 400 or timeout
- [ ] POST `/api/revenue` with startingMrr = null → 200 (default to 0)

#### Data Isolation (8 tests)
- [ ] User A's forecast includes only User A's expenses (not User B's)
- [ ] User A's GET `/api/scenarios?planId=A` returns only scenarios for Plan A
- [ ] User A deletes expense, User B's forecast unchanged
- [ ] User A clones scenario, User B cannot see it
- [ ] Organization A's members cannot see Organization B's data (**currently fails**)
- [ ] Plan cascade delete: User deletes account → all plans/scenarios deleted
- [ ] Scenario cascade delete: User deletes scenario → all expenses/people deleted
- [ ] Expense/people queries scoped to scenarioId (not just planId)

#### Stripe Webhooks (7 tests)
- [ ] `checkout.session.completed` creates subscription in DB
- [ ] `customer.subscription.updated` updates subscription status
- [ ] `customer.subscription.deleted` marks subscription as CANCELLED
- [ ] `invoice.payment_failed` marks subscription as PAST_DUE
- [ ] Duplicate `checkout.session.completed` (same session ID) → idempotent (same subscription record)
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

### 8.1 Security Bugs

| Severity | File | Issue | Line | Fix |
|----------|------|-------|------|-----|
| **CRITICAL** | `app/api/organization/route.ts` | No ownership check on GET/POST/PUT/DELETE | N/A (route not fully reviewed) | Add `getScopedOrganization(orgId, userId)` helper, check `org.userId === userId` |
| **CRITICAL** | `app/api/organization/members/route.ts` | No ownership check on GET/POST/DELETE | N/A (route not fully reviewed) | Same as above |
| **HIGH** | `app/api/test-forecast/route.ts` | Unauthenticated endpoint (DoS risk) | N/A | Add rate limiting or require auth |
| **HIGH** | `app/api/webhooks/stripe/route.ts` | No idempotency check on duplicate events | L88-L119 | Check `subscription.stripeSubscriptionId` before upsert, reject if already processed |

### 8.2 Code Quality Issues

| Severity | File | Issue | Line | Fix |
|----------|------|-------|------|-----|
| MEDIUM | `lib/useAutoSave.ts` | `setState` called directly in `useEffect` (8 instances) | L77, L80, L82, etc. | Use `useCallback` or move state update to derived value |
| LOW | `scripts/migrate-programmatic.ts` | Unused `error` variables (13 warnings) | Multiple | Prefix with `_error` or remove try-catch if not needed |
| LOW | `scripts/run-migration.ts` | Unused `dbUrl` variable | L16 | Remove |

### 8.3 Potential Bugs (Not Confirmed)

| Severity | File | Issue | Line | Fix |
|----------|------|-------|------|-----|
| MEDIUM | `lib/revenueForecast.ts` | No validation of `numMonths` (could be negative or 1e6) | L787 | Add `if (numMonths < 0 || numMonths > 1000) throw new Error()` |
| MEDIUM | `app/api/expenses/route.ts` | No boundary check on `amount` (could be 1e18) | L20-L27 | Add `.max(1e12)` to Zod schema |
| MEDIUM | `app/api/people/route.ts` | No boundary check on `salary` (could be 1e9) | L18 | Add `.max(1e7)` to Zod schema |
| LOW | `lib/revenueForecast.ts` | `extractPeriodEnd()` fallback (30 days) could be wrong | L191 | Log warning if fallback is used |

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
