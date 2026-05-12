# Happy path — product specification

This document defines the **intended first-time user journey** for the budgeting / forecast app: what “success” means at each step, how the **current product** behaves (from code), and **gaps to close** so the path is honest and easy.

Target reader: you + anyone implementing UX or onboarding.

---

## North star (one sentence)

A new signed-in user can, **without help**, reach **one believable “aha” outcome** — typically **runway and/or burn vs cash** on **Dashboard** or **Runway** — with inputs they understand and numbers that match those inputs.

---

## Canonical journey (recommended order)

| Step | User intent | Success = user can say… | Primary routes |
|------|-------------|-------------------------|----------------|
| 0 | Arrive authenticated | “I’m in the app.” | `/login` → `/app` |
| 1 | Ground truth for the model | “Cash and key drivers reflect my situation (or I consciously kept defaults).” | `/app/assumptions` |
| 2 | Revenue story | “My revenue motion (PLG / sales / partners) matches how we sell.” | `/app/revenue` |
| 3 | Cost story | “People and other costs roughly match reality.” | `/app/expenses` |
| 4 | Outcome | “I see runway / burn and it makes sense.” | `/app`, `/app/runway` |

**Note:** The in-app checklist order is **Assumptions → Revenue → Expenses** (`OnboardingChecklist`). That matches “drivers → revenue → costs” and is reasonable; step 1 can be shortened if you later offer a true “defaults OK for now” path (see gaps).

---

## Step-by-step definition (strict)

### Step 0 — Auth and entry

- **Flow:** User signs in (Supabase). Middleware protects `/app/*` and `/api/*` (401 on API if unauthenticated; redirect to `/login?redirectTo=…` for pages).
- **Success:** User lands on **`/app`** (Dashboard) with no unexplained error state.
- **Technical touchpoints:** `middleware.ts`, `app/app/layout.tsx`, `/api/plans/current` (creates default plan if none).

### Step 1 — Assumptions

- **Flow:** User opens **`/app/assumptions`**, reviews global drivers (cash on hand, churn, tax, inflation, etc.), saves.
- **Success:** Saved assumptions are persisted; forecast uses them on next load.
- **Current checklist rule:** Dashboard treats assumptions as “done” only when API returns **`isDefault: false`** (`OnboardingChecklist` + `app/app/page.tsx`). Pure defaults ⇒ checklist keeps “Set your assumptions” **incomplete** until the user saves at least once (even small edits).
- **Gap (UX):** New users may not understand they must **save** to clear the first checkbox. Mitigation: copy like “Review & save to confirm” or a primary **“Save & continue”** on first visit.

### Step 2 — Revenue

- **Flow:** User opens **`/app/revenue`**, adjusts PLG / sales / partner parameters; config **auto-saves** (`useAutoSave`).
- **Success:** User believes the top-line growth story is theirs, not a demo.
- **Current checklist rule (important):** `hasRevenue` is derived as **`forecast months with totalMrr > 0`** (`app/app/page.tsx`). The forecast API uses **`DEFAULT_REVENUE_CONFIG`** whenever there is **no** stored “Default” scenario (`app/api/forecast/route.ts`). Defaults include large trial/SQL volumes ⇒ **MRR is almost always &gt; 0 from day one**.
- **Gap (product honesty):** The checklist can show **“Configure revenue streams” as done** even if the user **never opened Revenue** — only defaults ran. For the happy path, you should redefine “has revenue” to something like: **saved custom scenario exists**, or **user visited revenue and saved**, or **explicit “I use defaults”** — not merely `totalMrr &gt; 0`.

### Step 3 — Expenses

- **Flow:** User opens **`/app/expenses`**, adds at least one headcount row and/or non-headcount cost, saves via API.
- **Success:** Costs appear in forecast, runway and charts move believably.
- **Current checklist rule:** At least one **person** or **expense** row (`peopleData` / `expensesData` length).
- **Gap:** None critical for definition; UX polish is incremental (copy, validation, empty states).

### Step 4 — “Aha” outcome

- **Primary surfaces:** **`/app`** (metrics + charts + checklist), **`/app/runway`** (runway months, cash chart, burn).
- **Success:** User can explain in one sentence what the chart implies for their next 12–24 months.
- **Dependencies:** Forecast API **`/api/forecast`** must succeed (plan + assumptions + revenue config + expenses).

---

## Sidebar map (where everything lives)

From `config/navItems.ts` — typical exploration after the path above:

- **Dashboard** `/app` — summary metrics, waterfall, expenses stack, onboarding checklist.  
- **Assumptions** `/app/assumptions` — global model drivers.  
- **Metrics** `/app/metrics` — deeper SaaS metrics (after core model exists).  
- **Revenue** `/app/revenue` — PLG / sales / partners.  
- **Expenses** `/app/expenses` — headcount + non-headcount.  
- **Runway** `/app/runway` — cash runway narrative.  
- **Scenarios / Actuals / Billing / Team** — advanced; **not** part of the minimal happy path.

---

## Concrete acceptance checklist (for you or QA)

Use this as a **manual test script** (15 minutes):

1. [ ] New session → login → lands on `/app` without errors.  
2. [ ] Without touching anything: note which onboarding steps show complete vs incomplete (compare to expectations above).  
3. [ ] Open Assumptions → change one field → save → return to Dashboard → first step completes.  
4. [ ] Open Revenue → change a driver → wait for auto-save → refresh → value persists.  
5. [ ] Open Expenses → add one cost → return to Dashboard → expenses step completes.  
6. [ ] Open Runway → runway number and chart match “I added costs / changed cash” intuition.  
7. [ ] Log out and back in → data still there for same account.

---

## Prioritized follow-ups (happy-path quality)

| Priority | Item | Why | Status |
|----------|------|-----|--------|
| P0 | Redefine **`hasRevenue`** for onboarding | Avoid false “done” when only defaults apply. | Done — dashboard now uses `/api/revenue` `isDefault` flag. |
| P1 | First-time **Assumptions** CTA: “Save to confirm defaults” or wizard step | Clears checklist step 1 without confusion. | Done — “Accept defaults” banner on `/app/assumptions` when `isDefault: true`. |
| P1 | Dashboard **partial load** handling (same pattern as Expenses page) | Avoid silent empty charts if one API fails. | Pending. |
| P2 | After checklist complete, **single CTA** “View runway” | Closes the loop to step 4. | Pending. |
| P2 | **PostHog / milestones** (when ready) | Measure drop-off per step — see `docs/operations.md` for ops; defer PostHog until you want it. | Deferred. |

---

## Related docs

- `docs/operations.md` — env, CI, backups, logging / future Sentry.  
- Sentry: add when Next.js + `@sentry/nextjs` peer story is acceptable (see operations doc).

---

*Last aligned with codebase: onboarding rules from `components/dashboard/OnboardingChecklist.tsx`, `app/app/page.tsx`, `app/api/forecast/route.ts`, revenue defaults from `lib/revenueForecast.ts`.*
