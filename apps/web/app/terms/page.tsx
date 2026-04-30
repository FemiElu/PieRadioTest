import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Pie Radio",
  description:
    "Review the terms and conditions for using the Pie Radio website and mobile application.",
};

const LAST_UPDATED = "30 April 2026";
const CONTACT_EMAIL = "hello@pieradio.co.uk";
const COMPANY_NAME = "Pie Radio";
const WEBSITE_URL = "www.pieradio.co.uk";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border/50 bg-white sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
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
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Please read these Terms of Service carefully before using the {COMPANY_NAME} 
            website and mobile application. By accessing or using our services, you 
            agree to be bound by these terms.
          </p>
        </div>

        <div className="prose prose-zinc max-w-none space-y-10">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-600 leading-relaxed">
              By accessing the website at <a href={`https://${WEBSITE_URL}`} className="text-primary hover:underline">{WEBSITE_URL}</a> 
              or using the {COMPANY_NAME} mobile application (collectively, the &quot;Services&quot;), 
              you agree to comply with and be bound by these Terms of Service and all applicable 
              laws and regulations. If you do not agree with any of these terms, you are 
              prohibited from using or accessing the Services.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">2. Eligibility</h2>
            <p className="text-zinc-600 leading-relaxed">
              You must be at least 13 years of age to create an account and use the Services. 
              By using the Services, you represent and warrant that you meet this age 
              requirement. If you are under 18, you represent that you have the consent 
              of a parent or guardian to use the Services.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">3. User Accounts</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              When you create an account with us, you must provide accurate and complete 
              information. You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 leading-relaxed">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Notifying us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          {/* 4. Intellectual Property Rights */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">4. Intellectual Property Rights</h2>
            <p className="text-zinc-600 leading-relaxed">
              The Services and their original content (excluding User Content), features, 
              and functionality are and will remain the exclusive property of {COMPANY_NAME} 
              and its licensors. Our trademarks and trade dress may not be used in connection 
              with any product or service without our prior written consent.
            </p>
          </section>

          {/* 5. User Content & Submissions */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">5. User Content & Submissions</h2>
            
            <h3 className="text-lg font-bold text-deep-text mb-3">5.1 General Content</h3>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Our Services may allow you to post messages in live chats, create profiles, 
              and submit other content (&quot;User Content&quot;). You retain your ownership 
              rights in your User Content, but by posting it, you grant us a worldwide, 
              non-exclusive, royalty-free license to use, reproduce, and display such content 
              in connection with the Services.
            </p>

            <h3 className="text-lg font-bold text-deep-text mb-3">5.2 Artist Track Uploads</h3>
            <p className="text-zinc-600 leading-relaxed">
              If you upload music tracks to our platform:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-600 leading-relaxed">
              <li>
                You represent and warrant that you own or control all rights, including 
                copyrights and performance rights, in and to the tracks.
              </li>
              <li>
                <strong>License Grant:</strong> You hereby grant {COMPANY_NAME} a 
                non-exclusive, royalty-free, worldwide license to broadcast, stream, 
                and perform your music tracks via our radio station and digital platforms.
              </li>
              <li>
                You agree that such broadcasts do not entitle you to any royalties 
                unless otherwise agreed in writing.
              </li>
            </ul>
          </section>

          {/* 6. Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">6. Prohibited Conduct</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600 leading-relaxed">
              <li>Use the Services for any illegal purpose or in violation of any local, state, or international law.</li>
              <li>Post content that is defamatory, obscene, harassing, or promotes hate speech.</li>
              <li>Attempt to interfere with the proper working of the Services or bypass any security measures.</li>
              <li>Reverse engineer or attempt to extract the source code of the mobile application.</li>
              <li>Impersonate any person or entity, including {COMPANY_NAME} staff or presenters.</li>
            </ul>
          </section>

          {/* 7. Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-zinc-600 leading-relaxed">
              The Services are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. 
              {COMPANY_NAME} makes no warranties, expressed or implied, regarding the 
              uninterrupted availability of the radio stream, the accuracy of news content, 
              or that the Services will be error-free or free of viruses.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">8. Limitation of Liability</h2>
            <p className="text-zinc-600 leading-relaxed">
              In no event shall {COMPANY_NAME}, its directors, or employees be liable 
              for any indirect, incidental, special, or consequential damages resulting 
              from your use of or inability to use the Services, even if advised of 
              the possibility of such damages.
            </p>
          </section>

          {/* 9. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">9. Governing Law</h2>
            <p className="text-zinc-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws 
              of England and Wales, without regard to its conflict of law provisions. 
              Any disputes arising under these terms shall be subject to the exclusive 
              jurisdiction of the courts of England and Wales.
            </p>
          </section>

          {/* 10. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-deep-text mb-4">10. Contact Us</h2>
            <p className="text-zinc-600 leading-relaxed mb-6">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-6 bg-zinc-50 border border-border/50 rounded-2xl">
              <p className="font-bold text-deep-text mb-1">Pie Radio Legal Department</p>
              <p className="text-zinc-600 text-sm">
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-zinc-600 text-sm mt-1">
                Website:{" "}
                <a href={`https://${WEBSITE_URL}`} className="text-primary hover:underline">
                  {WEBSITE_URL}
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
