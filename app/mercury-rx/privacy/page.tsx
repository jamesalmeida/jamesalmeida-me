import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'

export const metadata = {
  title: 'Privacy Policy - Mercury Rx',
  description: 'Privacy policy for the Mercury Rx iOS app.',
}

export default function MercuryRxPrivacy() {
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
                Mercury Rx — Privacy Policy
              </h1>
              <p className="text-lg text-primary-100/80 text-center">
                Last updated: February 26, 2026
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-12 text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg">
            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Overview</h2>
                <p>
                  Mercury Rx (&quot;the App&quot;) is developed by James Almeida. This Privacy Policy explains what information the App collects and how it is used. Your privacy is important — Mercury Rx is designed to respect it.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Information We Collect</h2>
                <p>
                  <strong>Mercury Rx does not collect, store, or transmit any personal data.</strong> The App runs entirely on your device.
                </p>
                <p>
                  The App may store the following locally on your device:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your birth date (if you choose to enter it, for zodiac sign display)</li>
                  <li>Notification preferences (alert timing and schedule)</li>
                  <li>Display preferences (oracle temperament setting)</li>
                  <li>In-app purchase status (widget pack unlock)</li>
                </ul>
                <p>
                  This data never leaves your device and is not accessible to us or any third party.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">In-App Purchases</h2>
                <p>
                  Mercury Rx offers an optional widget pack as an in-app purchase. Purchases are processed entirely by Apple through the App Store. We do not have access to your payment information, Apple ID, or purchase history.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Notifications</h2>
                <p>
                  If you enable retrograde alerts, the App schedules local notifications on your device. These notifications are generated entirely on-device and do not involve any external server or push notification service.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Analytics &amp; Tracking</h2>
                <p>
                  Mercury Rx does not include any analytics SDKs, advertising frameworks, or tracking tools. We do not track your usage, location, or behavior in any way.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Third-Party Services</h2>
                <p>
                  The App does not integrate with any third-party services that collect user data. The only external interaction is with Apple&apos;s StoreKit for in-app purchase verification, which is governed by <a href="https://www.apple.com/legal/privacy/" className="text-accent-500 hover:text-accent-400 underline" target="_blank" rel="noopener noreferrer">Apple&apos;s Privacy Policy</a>.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Children&apos;s Privacy</h2>
                <p>
                  Mercury Rx does not collect personal information from anyone, including children under 13. The App is safe for all ages.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Changes to This Policy</h2>
                <p>
                  This Privacy Policy may be updated from time to time. Changes will be reflected on this page with an updated date. Continued use of the App constitutes acceptance of any changes.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Contact</h2>
                <p>
                  If you have questions about this Privacy Policy, please reach out through the{' '}
                  <a href="/contact" className="text-accent-500 hover:text-accent-400 underline">contact page</a>{' '}
                  or visit the <a href="/mercury-rx/support" className="text-accent-500 hover:text-accent-400 underline">support page</a>.
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
