import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Pie Radio",
  description:
    "Learn how Pie Radio collects, uses and protects your personal data when you use our website and mobile application.",
};

const LAST_UPDATED = "28 April 2026";
const CONTACT_EMAIL = "hello@pieradio.co.uk";
const COMPANY_NAME = "Pie Radio";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border/50 bg-white sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to Pie Radio
          </Link>
          <span className="text-xs text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </span>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12 pb-24">
        {/* Title */}
        <div className="mb-12">
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">
            Legal
          </p>
          <h1 className="text-4xl sm:text-5xl font-black font-display text-deep-text tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            This Privacy Policy explains how {COMPANY_NAME} (&quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects
            your personal information when you use our website at{" "}
            <a
              href="https://www.pieradio.co.uk"
              className="text-primary hover:underline"
            >
              www.pieradio.co.uk
            </a>{" "}
            and our mobile application (&quot;the App&quot;, together &quot;the
            Services&quot;).
          </p>
        </div>

        <div className="prose prose-zinc max-w-none space-y-10">
          {/* 1. Who We Are */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              1. Who We Are
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              Pie Radio is an online radio station operating in the United
              Kingdom. We broadcast live music, cultural programming, news, and
              events. If you have any questions about this policy, please
              contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          {/* 2. What Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              2. What Data We Collect
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We only collect data that is necessary to provide and improve the
              Services.
            </p>

            <h3 className="text-lg font-bold text-deep-text mb-3">
              2.1 Data You Provide Directly
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-border/50 rounded-xl text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Data Type
                    </th>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Why We Collect It
                    </th>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Legal Basis (UK GDPR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    {
                      type: "Email address & password",
                      reason: "Account creation and authentication",
                      basis: "Contract performance",
                    },
                    {
                      type: "Full name & display name",
                      reason:
                        "Personalising your profile and the app experience",
                      basis: "Contract performance",
                    },
                    {
                      type: "Profile bio & avatar image",
                      reason: "Optional user profile enrichment",
                      basis: "Consent (you choose to provide it)",
                    },
                    {
                      type: "Artist profile information (stage name, Spotify/Apple Music IDs, featured track URL)",
                      reason: "Artist discovery and track submission features",
                      basis: "Consent (you opt-in to an artist profile)",
                    },
                    {
                      type: "Audio track uploads & cover artwork",
                      reason:
                        "Track submission to Pie Radio for potential airplay",
                      basis: "Contract performance",
                    },
                    {
                      type: "Live chat messages",
                      reason: "Real-time community chat during broadcasts",
                      basis: "Contract performance",
                    },
                    {
                      type: "Song requests (artist name, song title)",
                      reason: "Requesting songs during live shows",
                      basis: "Legitimate interests",
                    },
                    {
                      type: "Presenter contact messages (name, email, message body)",
                      reason: "Allowing listeners to contact presenters",
                      basis: "Consent (you choose to send a message)",
                    },
                    {
                      type: "Newsletter signups (name, email)",
                      reason: "Notifying you about updates and news",
                      basis: "Consent",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="bg-white hover:bg-zinc-50 transition-colors"
                    >
                      <td className="p-4 text-zinc-700 align-top font-medium">
                        {row.type}
                      </td>
                      <td className="p-4 text-zinc-600 align-top">
                        {row.reason}
                      </td>
                      <td className="p-4 text-zinc-600 align-top">
                        {row.basis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-bold text-deep-text mb-3 mt-8">
              2.2 Data Collected Automatically
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-border/50 rounded-xl text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Data Type
                    </th>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Why We Collect It
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    {
                      type: "Device push notification token",
                      reason:
                        "Sending you push notifications about shows, news, and song requests. We only store this token if you grant notification permission.",
                    },
                    {
                      type: "Device type (iOS / Android)",
                      reason:
                        "Determining push notification eligibility and excluding simulators from token registration.",
                    },
                    {
                      type: "Authentication session tokens",
                      reason:
                        "Keeping you logged in securely across sessions via encrypted local storage.",
                    },
                    {
                      type: "In-app preferences (bookmarked articles, news categories, liked shows/presenters/songs)",
                      reason:
                        "Personalising your experience. These are stored in your account and on-device.",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="bg-white hover:bg-zinc-50 transition-colors"
                    >
                      <td className="p-4 text-zinc-700 align-top font-medium">
                        {row.type}
                      </td>
                      <td className="p-4 text-zinc-600 align-top">
                        {row.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              3. Third-Party Services We Use
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We use a small number of trusted third-party services to operate
              the platform. We do <strong>not</strong> use advertising networks,
              sell your data, or use third-party analytics or tracking SDKs.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border border-border/50 rounded-xl text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Service
                    </th>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Provider
                    </th>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Purpose
                    </th>
                    <th className="text-left p-4 font-bold text-deep-text border-b border-border/50">
                      Data Shared
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    {
                      service:
                        "Supabase (Authentication, Database, Storage, Realtime)",
                      provider:
                        "Supabase Inc. (US — EU-US Data Privacy Framework)",
                      purpose:
                        "Storing user accounts, profile data, content, and powering live features",
                      data: "All data listed in Section 2",
                    },
                    {
                      service: "Expo Push Notifications",
                      provider: "Expo (US)",
                      purpose:
                        "Routing push notifications to your device via Apple APNs / Google FCM",
                      data: "Push token, notification title and body only",
                    },
                    {
                      service: "AIIR Streaming API",
                      provider: "AIIR Ltd (UK)",
                      purpose:
                        "Fetching recently played track metadata for display in the app",
                      data: "No personal data — read-only public metadata",
                    },
                    {
                      service: "Google OAuth",
                      provider: "Google LLC (US)",
                      purpose: "Optional Sign in with Google authentication",
                      data: "Name, email, and Google profile picture (only if you choose Google sign-in)",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="bg-white hover:bg-zinc-50 transition-colors"
                    >
                      <td className="p-4 text-zinc-700 align-top font-medium">
                        {row.service}
                      </td>
                      <td className="p-4 text-zinc-600 align-top">
                        {row.provider}
                      </td>
                      <td className="p-4 text-zinc-600 align-top">
                        {row.purpose}
                      </td>
                      <td className="p-4 text-zinc-600 align-top">
                        {row.data}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. How Long We Keep Your Data */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              4. How Long We Keep Your Data
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 leading-relaxed">
              <li>
                <strong>Account data</strong> — retained for as long as your
                account is active.
              </li>
              <li>
                <strong>In-app notifications</strong> — automatically deleted
                after 30 days.
              </li>
              <li>
                <strong>Chat messages</strong> — retained for up to 12 months
                and then reviewed for deletion.
              </li>
              <li>
                <strong>Push notification tokens</strong> — deleted when you
                delete your account or revoke notification permissions.
              </li>
              <li>
                <strong>Artist track uploads</strong> — retained until you
                request deletion or delete your account.
              </li>
              <li>
                <strong>After account deletion</strong> — all personal data is
                permanently deleted within 30 days, except where we are legally
                required to retain it.
              </li>
            </ul>
          </section>

          {/* 5. Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              5. Your Rights
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Under UK GDPR, you have the following rights regarding your
              personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 leading-relaxed">
              <li>
                <strong>Access</strong> — request a copy of the data we hold
                about you.
              </li>
              <li>
                <strong>Rectification</strong> — correct inaccurate data through
                your profile settings or by contacting us.
              </li>
              <li>
                <strong>Erasure (&quot;Right to be Forgotten&quot;)</strong> —
                delete your account and all associated data. You can do this
                in-app via Profile → Settings → Delete Account, or by emailing{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
              <li>
                <strong>Restriction</strong> — ask us to pause processing your
                data.
              </li>
              <li>
                <strong>Portability</strong> — receive your data in a
                machine-readable format.
              </li>
              <li>
                <strong>Objection</strong> — object to processing based on
                legitimate interests.
              </li>
            </ul>
            <p className="text-zinc-600 leading-relaxed mt-4">
              To exercise any of these rights, contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* 6. Account Deletion */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              6. Account Deletion
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              You may delete your Pie Radio account at any time. Account
              deletion permanently removes your profile, saved preferences, chat
              history, artist uploads, and all other personal data from our
              systems. You can initiate deletion directly within the Pie Radio
              app (Profile → Settings → Delete Account) or by emailing{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              . Deletion will be processed within 30 days of your request.
            </p>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              7. Cookies & Local Storage
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              Our website uses only essential cookies necessary for
              authentication sessions (provided by Supabase). We do not use
              advertising cookies, tracking pixels, or third-party analytics
              cookies. Our mobile app uses encrypted device storage
              (AsyncStorage) solely to persist your authentication session.
            </p>
          </section>

          {/* 8. Children */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              The Services are not directed at children under the age of 13. We
              do not knowingly collect personal data from children. If you
              believe a child has provided us with personal data, please contact
              us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and we will delete it promptly.
            </p>
          </section>

          {/* 9. Changes */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              We may update this policy from time to time. We will notify you of
              significant changes via in-app notification or email. The
              &quot;Last updated&quot; date at the top of this page reflects the
              most recent revision.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">
              10. Contact Us
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or your personal data, please contact us:
            </p>
            <div className="mt-4 p-6 bg-zinc-50 border border-border/50 rounded-2xl">
              <p className="font-bold text-deep-text mb-1">Pie Radio</p>
              <p className="text-zinc-600 text-sm">
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-zinc-600 text-sm mt-1">
                Website:{" "}
                <a
                  href="https://www.pieradio.co.uk"
                  className="text-primary hover:underline"
                >
                  www.pieradio.co.uk
                </a>
              </p>
            </div>
            <p className="text-zinc-500 text-sm mt-4">
              You also have the right to lodge a complaint with the UK
              Information Commissioner&apos;s Office (ICO) at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ico.org.uk
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
