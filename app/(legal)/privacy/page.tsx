import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Burnlytics",
  description: "Privacy Policy for the Burnlytics forecasting application.",
};

const LAST_UPDATED = "June 11, 2026";

export default function PrivacyPage() {
  return (
    <article className="space-y-4 text-[15px] leading-7 text-neutral-700 [&_a]:text-indigo-600 [&_a]:underline [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-neutral-900 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_li]:ml-5 [&_strong]:text-neutral-900 [&_ul]:list-disc [&_ul]:space-y-2">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <p>
        This Privacy Policy explains how [COMPANY LEGAL NAME], [COMPANY
        ADDRESS] (&quot;we&quot;, &quot;us&quot;) collects and processes
        personal data when you use Burnlytics (the &quot;Service&quot;). We
        are the data controller for the processing described here.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, password (stored
          hashed by our authentication provider), and optional display name.
        </li>
        <li>
          <strong>Financial planning data:</strong> the assumptions, revenue,
          expense, and headcount figures you enter. These are business
          forecasts you control; we recommend not entering personal data of
          identifiable individuals (e.g. use roles instead of employee names).
        </li>
        <li>
          <strong>Billing data:</strong> subscription status and a customer
          reference held by our payment processor, Stripe. We never store your
          full card details.
        </li>
        <li>
          <strong>Technical data:</strong> server logs (IP address, request
          metadata) retained briefly for security and debugging.
        </li>
      </ul>

      <h2>2. Purposes and legal bases</h2>
      <ul>
        <li>
          <strong>Providing the Service</strong> (contract performance): account
          management, storing your forecasts, billing.
        </li>
        <li>
          <strong>Security and abuse prevention</strong> (legitimate interest):
          authentication, logging, rate limiting.
        </li>
        <li>
          <strong>Service communications</strong> (contract performance):
          transactional emails such as email confirmation, password reset, and
          billing notices. We do not send marketing emails without your
          consent.
        </li>
      </ul>

      <h2>3. Cookies</h2>
      <p>
        The Service uses only <strong>strictly necessary cookies</strong>:
        authentication session cookies set by our auth provider (Supabase).
        We currently use no analytics, advertising, or third-party tracking
        cookies, which is why no cookie consent banner is shown. If this
        changes, we will update this policy and request consent where
        required.
      </p>

      <h2>4. Processors and data transfers</h2>
      <p>We share data only with processors needed to run the Service:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and database hosting.
        </li>
        <li>
          <strong>Stripe</strong> — payment processing.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and logs.
        </li>
      </ul>
      <p>
        Where these providers process data outside the EU/EEA, transfers are
        protected by appropriate safeguards such as the EU Standard
        Contractual Clauses or an adequacy decision (e.g. the EU–US Data
        Privacy Framework).
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep your data for as long as your account exists. When you delete
        your account (Settings → Account → Delete account), your account data
        and all forecasts are deleted immediately from our production
        database; residual copies in encrypted backups expire on the backup
        rotation schedule. Billing records are retained as required by tax and
        accounting law.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Subject to applicable law (including the GDPR if you are in the
        EU/EEA), you have the right to access, rectify, delete, and receive a
        copy of your personal data, to restrict or object to processing, and
        to lodge a complaint with a supervisory authority. You can exercise
        deletion yourself in the app; for other requests contact us at{" "}
        <a href="mailto:[SUPPORT EMAIL]">[SUPPORT EMAIL]</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (TLS) and at rest by our hosting
        providers. Access to production systems is restricted and
        authenticated. No method of transmission or storage is 100% secure,
        but we work to protect your data using industry-standard measures.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        announced by email or in-app notice before they take effect.
      </p>

      <h2>9. Contact</h2>
      <p>
        Privacy questions and requests:{" "}
        <a href="mailto:[SUPPORT EMAIL]">[SUPPORT EMAIL]</a>.
      </p>
    </article>
  );
}
