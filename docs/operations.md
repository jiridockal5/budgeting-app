# Operations checklist

Short reference for running this app in production. Adjust names (Supabase, Vercel, Railway, etc.) to match your hosting.

## Environment and secrets

- **Never commit** `.env`, API keys, or database URLs. Use the host’s secret store (Vercel Environment Variables, GitHub Actions secrets, Doppler, etc.).
- **Required for the database:** `POSTGRES_PRISMA_URL` (preferred) or `DATABASE_URL`, as used by `lib/prisma.ts` and `prisma/schema.prisma`.
- **Auth:** Supabase (or your provider) URL and anon/service keys only where each is required; restrict service role to server-only contexts.
- **Auth email delivery:** Configure **custom SMTP** in the Supabase dashboard before relying on signup/reset emails in production. Built-in Supabase mail is rate-limited and frequently filtered as spam.
- **Rotate** any key that was pasted into chat, email, or a ticket.
- **Document** which env vars exist: duplicate this list in your password manager or internal wiki, not in the repo.

## Auth confirmation emails not arriving

1. Ask the user to check spam/junk and to use **Resend confirmation email** on `/signup` or `/login`.
2. Supabase Dashboard → **Authentication → Users**: find the email; note whether `email_confirmed_at` is set.
3. Confirm redirect URLs include `https://burnlytics.com/auth/callback` (Site URL `https://burnlytics.com`).
4. Confirm custom SMTP is enabled with a verified from-domain; built-in mail is not enough for reliable delivery.
5. Retry resend after SMTP is configured; if the user is stuck unconfirmed, you can manually confirm them in the Users table as a temporary unlock, then ask them to sign in.

## Database backups and migrations

- **Backups:** Enable automated backups on your Postgres provider (e.g. Supabase PITR / daily snapshots). Test a restore at least once.
- **Migrations:** Apply with `prisma migrate deploy` in production CI/CD or your release step—not `prisma migrate dev`.
- **Schema changes:** Ship migrations in the same release as the code that expects the new columns, or use expand/contract patterns for zero-downtime changes.

## Error visibility

- **Today:** API routes use `captureRouteException` in `lib/monitoring.ts` (structured JSON logs). Point your host’s log drain at your log tool, or tail logs in the dashboard.
- **PostHog:** Product analytics and client exception capture via `instrumentation-client.ts` and `lib/posthogServer.ts`. Requires `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` (EU: `https://eu.i.posthog.com`). Without them, server capture no-ops in production; local `npm run dev` throws until they are set.
- **Sentry (optional):** `@sentry/nextjs` may not yet list Next.js 16 as a supported peer; check [Sentry’s Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/). If the install peer warning is acceptable, use `npm install @sentry/nextjs --legacy-peer-deps`, add `instrumentation.ts` per Sentry’s wizard, then extend `captureRouteException` to call `Sentry.captureException`.
- **Client errors:** consider `NEXT_PUBLIC_SENTRY_DSN` only if you accept exposing the DSN to the browser (Sentry’s design); scope sampling and scrub PII in `beforeSend`.

## Stripe production go-live checklist

Sandbox setup is automated (`npm run setup:stripe`). For production:

1. **Live keys:** In the Stripe Dashboard (live mode), copy the secret key into the host's secret store as `STRIPE_SECRET_KEY`. Never reuse test keys.
2. **Product & prices:** Run `npx tsx scripts/setup-stripe.ts` against the live key (set `STRIPE_SECRET_KEY` in the shell for that one run), or create the Burnlytics product and 4 prices (EUR/USD × monthly/annual) manually. Set all 8 price-ID env vars (`STRIPE_GROWTH_*` and `NEXT_PUBLIC_STRIPE_GROWTH_*`).
3. **Webhook endpoint:** Dashboard → Developers → Webhooks → add `https://<your-domain>/api/webhooks/stripe` with events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
4. **Billing portal:** Dashboard → Settings → Billing → Customer portal — activate it and enable cancellation, so `/api/billing/portal` works in live mode.
5. **End-to-end verification (use a real card, then refund/cancel):**
   - Sign up with a fresh email → confirm email → land on `/app` in trial state.
   - `/app/settings/billing` → subscribe → complete checkout.
   - Confirm the webhook fired (Stripe Dashboard → Webhooks → recent deliveries, all 2xx).
   - Confirm `subscriptions` row exists (`npx tsx scripts/check-billing-db.ts`) and billing page shows "Active subscription".
   - Cancel via "Manage subscription" portal and confirm `cancelAtPeriodEnd` is reflected.
6. **Dunning / failed payments:** Stripe → Settings → Subscriptions and emails — configure smart retries and customer emails. The app keeps access during a 7-day grace period after a payment fails (`PAST_DUE_GRACE_DAYS` in `lib/planGating.ts`), then locks.

## Billing gate toggle

Access enforcement is controlled by `BILLING_GATE_ENABLED` in `config/plans.ts`:

- **`false` (current):** All authenticated users have full app access. Stripe routes, webhooks, and subscribe/billing pages remain in place but users are not locked out after trial.
- **`true`:** Restores the 7-day trial + subscription lockout (`AccessGate`, `requireAppAccess`, `computeAccessState`).

To re-enable billing: set `BILLING_GATE_ENABLED = true`, redeploy, and optionally extend `growthTrialEndsAt` for existing users before flipping the flag.

## Rate limiting

`checkRateLimit` in `lib/apiUtils.ts` (in-memory, per server instance) protects: billing checkout/portal (10/min per user), Stripe webhook (120/min per IP), account deletion (3/min per user). For multi-instance deployments consider a shared store (e.g. Upstash) later.

## CI (automated checks)

GitHub Actions workflow `.github/workflows/ci.yml` runs on pushes and pull requests to `main`:

- TypeScript (`npm run typecheck`)
- Scoped ESLint (`npm run lint:ci`) on forecast math and the expenses/people API surface
- Vitest (`npm test`), including `lib/__tests__/revenueForecast.test.ts`

Full-repo `npm run lint` may still report pre-existing issues; fix those over time and widen `lint:ci` when ready.
