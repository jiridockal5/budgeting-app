import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Burnlytics",
  description: "Terms of Service for the Burnlytics forecasting application.",
};

const LAST_UPDATED = "June 11, 2026";

export default function TermsPage() {
  return (
    <article className="space-y-4 text-[15px] leading-7 text-neutral-700 [&_a]:text-turquoise-600 [&_a]:underline [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-neutral-900 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_li]:ml-5 [&_strong]:text-neutral-900 [&_ul]:list-disc [&_ul]:space-y-2">
      <h1>Terms of Service</h1>
      <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of Burnlytics (the &quot;Service&quot;), a financial forecasting
        application operated by [COMPANY LEGAL NAME], [COMPANY ADDRESS]
        (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By creating an
        account or using the Service, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Burnlytics provides financial planning and forecasting tools for
        startups, including revenue, expense, headcount, and runway modeling.
        The Service produces <strong>estimates based on the inputs and
        assumptions you provide</strong>. It does not constitute financial,
        investment, tax, or legal advice, and you should not rely on it as the
        sole basis for business decisions.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You must provide accurate registration information and keep your
        credentials confidential. You are responsible for all activity under
        your account. You must be at least 18 years old and use the Service
        only for business purposes.
      </p>

      <h2>3. Trial, fees, and payment</h2>
      <p>
        New accounts receive a free trial (currently 7 days). After the trial,
        continued use of the Service requires a paid subscription. Prices are
        shown at checkout and billed in advance on a monthly or annual basis
        via our payment processor, Stripe. Subscriptions renew automatically
        until cancelled. You can cancel at any time from the billing settings;
        cancellation takes effect at the end of the current billing period.
        Except where required by law, fees are non-refundable.
      </p>

      <h2>4. Your data</h2>
      <p>
        You retain all rights to the data you enter into the Service. You
        grant us a limited license to process that data solely to operate and
        improve the Service. You can delete your account and all associated
        data at any time from the account settings. Our handling of personal
        data is described in our Privacy Policy.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        You may not: (a) use the Service in violation of applicable law; (b)
        attempt to gain unauthorized access to the Service or its systems; (c)
        resell or sublicense the Service without our written consent; (d)
        interfere with the integrity or performance of the Service; or (e)
        reverse engineer the Service except as permitted by law.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The Service, including its software, design, and content (excluding
        your data), is owned by us or our licensors and protected by
        intellectual property laws. These Terms do not grant you any rights to
        our trademarks or branding.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        We strive to keep the Service available but do not guarantee
        uninterrupted operation. We may modify or discontinue features with
        reasonable notice where the change materially reduces the core
        functionality you pay for. We may update these Terms; material changes
        will be notified by email or in-app notice at least 14 days before
        they take effect.
      </p>

      <h2>8. Disclaimer of warranties</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as
        available&quot;. To the maximum extent permitted by law, we disclaim
        all warranties, express or implied, including merchantability, fitness
        for a particular purpose, and non-infringement. Forecasts and metrics
        produced by the Service are estimates only and we make no warranty as
        to their accuracy.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, our aggregate liability
        arising out of or relating to the Service is limited to the amounts
        you paid us in the 12 months preceding the claim. We are not liable
        for indirect, incidental, special, or consequential damages, including
        lost profits or business decisions made in reliance on forecasts
        generated by the Service. Nothing in these Terms limits liability that
        cannot be limited by law.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may terminate at any time by deleting your account. We may suspend
        or terminate your access for material breach of these Terms after
        notice and a reasonable opportunity to cure, or immediately for
        serious violations. Upon termination, your data is deleted in
        accordance with our Privacy Policy.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of [JURISDICTION], without regard
        to conflict-of-law rules. The courts of [JURISDICTION] have exclusive
        jurisdiction, subject to any mandatory consumer protection rules that
        apply to you.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:[SUPPORT EMAIL]">[SUPPORT
        EMAIL]</a>.
      </p>
    </article>
  );
}
