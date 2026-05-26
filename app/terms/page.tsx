import { Navbar } from '@/components/marketing/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions — Controva AI',
  description: 'Terms and Conditions for the Controva AI contract monitoring platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Legal</p>
          <h1 className="text-3xl font-semibold tracking-tight">Terms and Conditions</h1>
          <p className="mt-2 text-sm text-muted-foreground">controva.co · Last updated: May 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-foreground/90 leading-relaxed">

          <p>
            Please read these Terms and Conditions carefully before using the Controva AI platform
            (&ldquo;Service&rdquo;). By accessing or using our Service, you agree to be bound by these Terms.
            If you do not agree, do not use the Service.
          </p>

          <Section n="1" title="About Controva AI">
            <p>
              Controva AI (&ldquo;Controva&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an
              AI-powered contract monitoring platform operated by Controva AI (ABN pending), based in Brisbane,
              Queensland, Australia. Our Service provides automated contract analysis, deadline tracking, and
              alert notifications for small businesses.
            </p>
          </Section>

          <Section n="2" title="Important Disclaimer — Not Legal Advice">
            <div className="border border-danger/30 bg-danger/5 rounded-lg p-4 mb-4">
              <p className="font-semibold text-sm uppercase tracking-wide text-danger mb-2">Please read this section carefully.</p>
              <p>
                The Controva platform provides AI-generated analysis and summaries for informational and
                monitoring purposes only. Nothing on this platform, in any analysis, summary, alert, flag,
                or communication from Controva constitutes legal advice.
              </p>
            </div>
            <p>
              Controva is not a law firm. We do not provide legal services. Our AI analysis is not a
              substitute for qualified legal advice from a licensed Australian solicitor.
            </p>
            <p>
              You should always seek independent legal advice before making any decision based on a contract
              or on any analysis provided by Controva. You are solely responsible for verifying all contract
              dates, terms, obligations, and risk assessments independently.
            </p>
          </Section>

          <Section n="3" title="Accuracy of AI Analysis">
            <p>While we strive to provide accurate and helpful analysis, Controva makes no representations or warranties that:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>AI-generated analysis is complete, accurate, or error-free;</li>
              <li>All key dates, clauses, obligations, or risks will be identified;</li>
              <li>Risk assessments reflect the true legal risk of any contract;</li>
              <li>Alert notifications will be delivered without error or delay.</li>
            </ol>
            <p>
              AI technology has inherent limitations and may produce incorrect, incomplete, or misleading
              results. You acknowledge this and accept full responsibility for any decisions made based on
              Controva analysis.
            </p>
          </Section>

          <Section n="4" title="Limitation of Liability">
            <p>To the maximum extent permitted by Australian law:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-2">
              <li>
                Controva&apos;s total liability to you for any claim arising out of or in connection with
                these Terms or use of the Service shall not exceed the total subscription fees paid by you
                to Controva in the three (3) months preceding the claim.
              </li>
              <li>
                Controva is not liable for any indirect, incidental, special, consequential, punitive, or
                economic loss including but not limited to: loss of profits, loss of revenue, loss of
                business, loss of data, missed contract deadlines, automatic renewals, financial penalties,
                or legal costs arising from your use of or reliance on the Service.
              </li>
              <li>
                Controva is not liable for any loss or damage caused by AI analysis errors, missed deadline
                alerts, failed notifications, or inaccurate contract summaries.
              </li>
            </ol>
            <p>
              This limitation applies regardless of whether the liability arises in contract, tort,
              negligence, statute, or otherwise.
            </p>
          </Section>

          <Section n="5" title="User Responsibilities">
            <p>By using Controva you agree that:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>You will independently verify all critical contract dates, obligations, and terms;</li>
              <li>You will not rely solely on Controva analysis for any significant business or legal decision;</li>
              <li>You are responsible for maintaining accurate notification contact details;</li>
              <li>You will seek qualified legal advice for any contract matter of significant consequence;</li>
              <li>You have the legal right to upload any contracts you submit to the platform;</li>
              <li>You will not upload contracts containing third-party confidential information without appropriate authorisation.</li>
            </ol>
          </Section>

          <Section n="6" title="Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Controva AI, its directors, employees,
              contractors, and agents from and against any claims, damages, losses, liabilities, costs,
              and expenses (including legal fees) arising from:
            </p>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>Your use of the Service;</li>
              <li>Your violation of these Terms;</li>
              <li>Any decisions made based on Controva analysis;</li>
              <li>Your breach of any contract or obligation monitored through the platform.</li>
            </ol>
          </Section>

          <Section n="7" title="Subscription and Payment">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Controva is offered on a subscription basis. Fees are charged monthly or annually as selected at signup.</li>
              <li>All prices are in Australian Dollars (AUD) and include GST where applicable.</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date.</li>
              <li>
                You may cancel your subscription at any time through your account settings. Cancellation
                takes effect at the end of the current billing period. No refunds are provided for partial
                periods.
              </li>
              <li>We reserve the right to change pricing with 30 days written notice to your registered email address.</li>
              <li>Contract limits apply per plan tier. Exceeding limits requires an upgrade.</li>
            </ol>
          </Section>

          <Section n="8" title="Data and Security">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Your contracts and business data are encrypted at rest and in transit.</li>
              <li>Your data is never sold to third parties.</li>
              <li>Your contract data is not used to train AI models.</li>
              <li>
                We implement reasonable security measures but cannot guarantee absolute security. You use
                the Service at your own risk.
              </li>
              <li>Our full Privacy Policy governs how we collect, use, and store your personal information.</li>
            </ol>
          </Section>

          <Section n="9" title="Intellectual Property">
            <ol className="list-decimal pl-5 space-y-2">
              <li>The Controva platform, software, design, and content are owned by Controva AI and protected by Australian intellectual property laws.</li>
              <li>You retain ownership of all contracts and documents you upload.</li>
              <li>By uploading documents you grant Controva a limited licence to process and analyse them solely for the purpose of providing the Service to you.</li>
            </ol>
          </Section>

          <Section n="10" title="Service Availability">
            <p>
              We aim to provide reliable service but do not guarantee uninterrupted or error-free access.
              We may suspend or modify the Service for maintenance, updates, or for reasons outside our
              control. We are not liable for any loss arising from service unavailability.
            </p>
          </Section>

          <Section n="11" title="Termination">
            <ol className="list-decimal pl-5 space-y-2">
              <li>You may terminate your account at any time through your account settings.</li>
              <li>We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or if required by law.</li>
              <li>Upon termination you may export your data for 30 days after which it will be deleted.</li>
            </ol>
          </Section>

          <Section n="12" title="Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of Queensland, Australia. Any disputes will be subject
              to the exclusive jurisdiction of the courts of Queensland. We encourage resolution of disputes
              through direct communication before any legal proceedings.
            </p>
          </Section>

          <Section n="13" title="Australian Consumer Law">
            <p>
              Nothing in these Terms excludes, restricts, or modifies any right or remedy, or any guarantee,
              warranty, or other term or condition implied or imposed by the Australian Consumer Law that
              cannot lawfully be excluded or limited.
            </p>
          </Section>

          <Section n="14" title="Changes to Terms">
            <p>
              We may update these Terms at any time. We will notify you by email at least 14 days before
              material changes take effect. Continued use of the Service after changes constitutes
              acceptance of the updated Terms.
            </p>
          </Section>

          <Section n="15" title="Contact">
            <p>
              For questions about these Terms please contact us at:{' '}
              <a href="mailto:legal@controva.co" className="text-primary hover:underline">
                legal@controva.co
              </a>
            </p>
          </Section>

          <div className="border-t border-border pt-8 mt-10">
            <p className="text-sm text-muted-foreground">
              By using Controva AI you acknowledge that you have read, understood, and agree to these
              Terms and Conditions.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3 text-foreground">
        {n}. {title}
      </h2>
      <div className="space-y-3 text-sm text-foreground/80">{children}</div>
    </section>
  )
}
