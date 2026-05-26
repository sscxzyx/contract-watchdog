import { Navbar } from '@/components/marketing/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Controva AI',
  description: 'Privacy Policy for the Controva AI contract monitoring platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Legal</p>
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">controva.co · Last updated: May 2026</p>
        </div>

        <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">

          <p>
            Controva AI (&ldquo;Controva&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
            committed to protecting your privacy. This Privacy Policy explains how we collect, use, store,
            and protect your personal information in accordance with the Australian Privacy Act 1988 (Cth)
            and the Australian Privacy Principles (APPs).
          </p>

          <Section n="1" title="Information We Collect">
            <p className="font-medium text-foreground">1.1 Information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Full name and email address</li>
              <li>Business name, ABN, and industry</li>
              <li>Phone number (if provided for SMS alerts)</li>
              <li>Payment information (processed securely by Stripe — we do not store card details)</li>
              <li>Contracts and documents you upload to the platform</li>
              <li>Responses to onboarding questions</li>
            </ul>
            <p className="font-medium text-foreground mt-4">1.2 Information collected automatically:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Device and browser information</li>
              <li>IP address and approximate location</li>
              <li>Error logs and performance data</li>
            </ul>
          </Section>

          <Section n="2" title="How We Use Your Information">
            <p>We use your information to:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1 mt-2">
              <li>Provide and improve the Controva Service;</li>
              <li>Analyse contracts and generate AI-powered insights;</li>
              <li>Send deadline alerts and notifications;</li>
              <li>Process subscription payments;</li>
              <li>Respond to customer support requests;</li>
              <li>Send product updates and important notices;</li>
              <li>Comply with legal obligations;</li>
              <li>Detect and prevent fraud or misuse.</li>
            </ol>
            <p className="mt-3">We will not use your information for any purpose not listed above without your consent.</p>
          </Section>

          <Section n="3" title="Your Contract Data">
            <p>We treat your contract data with the highest level of confidentiality:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1 mt-2">
              <li>Your contracts are used solely to provide the Service to you;</li>
              <li>Your contract data is never sold to third parties;</li>
              <li>Your contract data is not used to train AI models;</li>
              <li>Only authorised Controva personnel can access your data and only when required for support purposes;</li>
              <li>All contracts are encrypted at rest using AES-256 encryption;</li>
              <li>All data in transit is encrypted using TLS 1.2 or higher.</li>
            </ol>
          </Section>

          <Section n="4" title="Sharing Your Information">
            <p>We do not sell your personal information. We may share information with:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-2 mt-2">
              <li><strong className="text-foreground">Stripe</strong> — for payment processing. Stripe&apos;s privacy policy applies to payment data;</li>
              <li><strong className="text-foreground">Supabase</strong> — our database and infrastructure provider, located in secure data centres;</li>
              <li><strong className="text-foreground">Resend</strong> — for sending email notifications;</li>
              <li><strong className="text-foreground">Anthropic</strong> — AI processing of contract text. Anthropic does not retain or train on your data under our API agreement;</li>
              <li>Legal or regulatory authorities where required by Australian law.</li>
            </ol>
            <p className="mt-3">All third-party providers are bound by data protection agreements and may not use your data for their own purposes.</p>
          </Section>

          <Section n="5" title="Data Storage and Retention">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Your data is stored on secure servers. We use Supabase infrastructure with data centres in Australia or the United States with appropriate data transfer safeguards.</li>
              <li>We retain your data for as long as your account is active plus 90 days after account deletion.</li>
              <li>
                You may request deletion of your data at any time by contacting{' '}
                <a href="mailto:privacy@controva.co" className="text-primary hover:underline">privacy@controva.co</a>
                {' '}or through your account settings.
              </li>
              <li>Some data may be retained longer where required by Australian law.</li>
            </ol>
          </Section>

          <Section n="6" title="Your Rights Under Australian Privacy Law">
            <p>Under the Australian Privacy Act you have the right to:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1 mt-2">
              <li>Access the personal information we hold about you;</li>
              <li>Correct inaccurate or outdated personal information;</li>
              <li>Request deletion of your personal information;</li>
              <li>Opt out of direct marketing communications;</li>
              <li>Make a complaint about how we handle your personal information.</li>
            </ol>
            <p className="mt-3">
              To exercise any of these rights contact us at{' '}
              <a href="mailto:privacy@controva.co" className="text-primary hover:underline">privacy@controva.co</a>.
              {' '}We will respond within 30 days.
            </p>
          </Section>

          <Section n="7" title="Cookies and Tracking">
            <p>
              We use essential cookies required for the platform to function. We do not use advertising
              or tracking cookies. You can disable cookies in your browser settings but this may affect
              platform functionality.
            </p>
          </Section>

          <Section n="8" title="Security">
            <p>
              We implement industry-standard security measures including encryption at rest and in transit,
              access controls, regular security reviews, and secure authentication. However no system is
              completely secure and we cannot guarantee absolute security. You use the Service at your own risk.
            </p>
          </Section>

          <Section n="9" title="Children's Privacy">
            <p>
              Controva is not intended for use by persons under 18 years of age. We do not knowingly
              collect personal information from minors.
            </p>
          </Section>

          <Section n="10" title="Marketing Communications">
            <p>
              We may send you product updates and feature announcements. You can unsubscribe at any time
              using the link in any email or by contacting us. We will not send you third-party marketing
              without your explicit consent.
            </p>
          </Section>

          <Section n="11" title="Complaints">
            <p>If you believe we have breached the Australian Privacy Principles you may lodge a complaint by:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-2 mt-2">
              <li>
                Contacting us directly at{' '}
                <a href="mailto:privacy@controva.co" className="text-primary hover:underline">privacy@controva.co</a>
                {' '}— we will investigate and respond within 30 days;
              </li>
              <li>
                If unsatisfied, contacting the Office of the Australian Information Commissioner (OAIC) at{' '}
                <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.oaic.gov.au
                </a>.
              </li>
            </ol>
          </Section>

          <Section n="12" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by email at least 14 days before they take effect. Continued use of the Service after changes
              constitutes acceptance of the updated Policy.
            </p>
          </Section>

          <Section n="13" title="Contact Us">
            <p>For any privacy questions or requests contact:</p>
            <div className="mt-3 space-y-1">
              <p className="font-medium text-foreground">Controva AI</p>
              <p>Email: <a href="mailto:privacy@controva.co" className="text-primary hover:underline">privacy@controva.co</a></p>
              <p>Website: <a href="https://controva.co" className="text-primary hover:underline">controva.co</a></p>
              <p>Brisbane, Queensland, Australia</p>
            </div>
          </Section>

          <div className="border-t border-border pt-8 mt-10">
            <p className="text-xs text-muted-foreground">
              This Privacy Policy complies with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
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
      <div className="space-y-3">{children}</div>
    </section>
  )
}
