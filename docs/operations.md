# Operations checklist

Short reference for running this app in production. Adjust names (Supabase, Vercel, Railway, etc.) to match your hosting.

## Environment and secrets

- **Never commit** `.env`, API keys, or database URLs. Use the host’s secret store (Vercel Environment Variables, GitHub Actions secrets, Doppler, etc.).
- **Required for the database:** `POSTGRES_PRISMA_URL` (preferred) or `DATABASE_URL`, as used by `lib/prisma.ts` and `prisma/schema.prisma`.
- **Auth:** Supabase (or your provider) URL and anon/service keys only where each is required; restrict service role to server-only contexts.
- **Rotate** any key that was pasted into chat, email, or a ticket.
- **Document** which env vars exist: duplicate this list in your password manager or internal wiki, not in the repo.

## Database backups and migrations

- **Backups:** Enable automated backups on your Postgres provider (e.g. Supabase PITR / daily snapshots). Test a restore at least once.
- **Migrations:** Apply with `prisma migrate deploy` in production CI/CD or your release step—not `prisma migrate dev`.
- **Schema changes:** Ship migrations in the same release as the code that expects the new columns, or use expand/contract patterns for zero-downtime changes.

## Error visibility

- **Today:** API routes use `captureRouteException` in `lib/monitoring.ts` (structured JSON logs). Point your host’s log drain at your log tool, or tail logs in the dashboard.
- **Sentry (optional):** `@sentry/nextjs` may not yet list Next.js 16 as a supported peer; check [Sentry’s Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/). If the install peer warning is acceptable, use `npm install @sentry/nextjs --legacy-peer-deps`, add `instrumentation.ts` per Sentry’s wizard, then extend `captureRouteException` to call `Sentry.captureException`.
- **Client errors:** consider `NEXT_PUBLIC_SENTRY_DSN` only if you accept exposing the DSN to the browser (Sentry’s design); scope sampling and scrub PII in `beforeSend`.

## CI (automated checks)

GitHub Actions workflow `.github/workflows/ci.yml` runs on pushes and pull requests to `main`:

- TypeScript (`npm run typecheck`)
- Scoped ESLint (`npm run lint:ci`) on forecast math and the expenses/people API surface
- Vitest (`npm test`), including `lib/__tests__/revenueForecast.test.ts`

Full-repo `npm run lint` may still report pre-existing issues; fix those over time and widen `lint:ci` when ready.
