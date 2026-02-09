import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'

export const metadata = {
  title: 'Terms of Service - James Almeida',
  description: 'Terms of service for jamesalmeida.me and related services.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="hero-gradient text-white py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-20 -right-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="max-w-4xl mx-auto relative z-10">
            <Reveal>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center leading-tight">
                Terms of Service
              </h1>
              <p className="text-lg text-primary-100/80 text-center">
                Last updated: February 9, 2026
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-12 text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg">
            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Agreement to Terms</h2>
                <p>
                  By accessing or using jamesalmeida.me (the &quot;Site&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Site.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Services</h2>
                <p>
                  James Almeida (&quot;I,&quot; &quot;me,&quot; or &quot;my&quot;) provides AI consulting, custom software development, and related professional services. The Site serves as an informational resource and point of contact for potential and existing clients. Specific consulting engagements are governed by separate agreements between me and the client. These Terms apply to the use of the Site itself.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Use of the Site</h2>
                <p>
                  You agree to use the Site only for lawful purposes. You may not use the Site in any way that violates applicable laws or regulations, attempt to gain unauthorized access to any part of the Site or its systems, transmit any malicious code or harmful data, use the Site to harass or harm others, or scrape or collect data from the Site by automated means without permission.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Intellectual Property</h2>
                <p>
                  All content on the Site — including text, graphics, logos, design, and code — is owned by James Almeida or its respective licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content on the Site without prior written permission.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Consulting Services</h2>
                <p>
                  Any consulting or professional services provided are subject to separate written agreements. The information on this Site does not constitute a binding offer or contract for services. Rates, availability, and scope of work are determined on a per-engagement basis and confirmed in writing before work begins.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Third-Party Links</h2>
                <p>
                  The Site may contain links to third-party websites or services. I am not responsible for the content, privacy practices, or availability of these external sites. Accessing third-party links is at your own risk.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Disclaimer of Warranties</h2>
                <p>
                  The Site is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. I do not warrant that the Site will be uninterrupted, error-free, or free of harmful components.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, James Almeida shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Site, even if advised of the possibility of such damages. My total liability for any claim arising from the use of the Site shall not exceed the amount you paid me (if any) in the twelve months preceding the claim.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless James Almeida from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from your use of the Site or violation of these Terms.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Governing Law</h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Changes to These Terms</h2>
                <p>
                  I reserve the right to update these Terms at any time. Changes will be posted on this page with an updated revision date. Continued use of the Site after changes constitutes acceptance of the revised Terms.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Contact</h2>
                <p>
                  If you have any questions about these Terms, please reach out through the{' '}
                  <a href="/contact" className="text-accent-500 hover:text-accent-400 underline">contact page</a>.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
