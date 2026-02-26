import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'

export const metadata = {
  title: 'Support - Mercury Rx',
  description: 'Support and FAQ for the Mercury Rx iOS app.',
}

export default function MercuryRxSupport() {
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
                Mercury Rx — Support
              </h1>
              <p className="text-lg text-primary-100/80 text-center">
                Help &amp; frequently asked questions
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-12 text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg">
            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">What is Mercury Rx?</h2>
                <p>
                  Mercury Rx tells you whether Mercury is currently in retrograde — with style. Get a clear yes/no answer, a forecast of upcoming retrograde periods, customizable notifications, and Home Screen &amp; Lock Screen widgets.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">How do notifications work?</h2>
                <p>
                  Mercury Rx uses local notifications scheduled on your device. No data is sent to any server. You can customize:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Advance notice:</strong> Get alerted 1, 3, or 7 days before a retrograde begins</li>
                  <li><strong>Day-of alerts:</strong> Know the moment retrograde starts</li>
                  <li><strong>End notifications:</strong> Get notified when the retrograde period ends</li>
                  <li><strong>Preferred time:</strong> Choose what time of day you receive alerts</li>
                </ul>
                <p>
                  Enable notifications in Settings → Cosmic Alerts.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">How do I add widgets?</h2>
                <p>
                  After purchasing the Widget Pack in-app:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Long-press your Home Screen and tap the <strong>+</strong> button</li>
                  <li>Search for &quot;Mercury Rx&quot;</li>
                  <li>Choose from Small, Medium, or Large widgets</li>
                  <li>For Lock Screen widgets, go to Settings → Wallpaper → Customize Lock Screen</li>
                </ol>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">I purchased the Widget Pack but widgets aren&apos;t showing</h2>
                <p>
                  Try these steps:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Open Mercury Rx → Settings → tap <strong>Restore Purchases</strong></li>
                  <li>Restart the app</li>
                  <li>If widgets still don&apos;t appear, restart your device</li>
                </ol>
                <p>
                  If the issue persists, please contact us below.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Is my data collected?</h2>
                <p>
                  No. Mercury Rx runs entirely on your device. No personal data is collected, stored, or transmitted. See our <a href="/mercury-rx/privacy" className="text-accent-500 hover:text-accent-400 underline">Privacy Policy</a> for details.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">How accurate is the retrograde data?</h2>
                <p>
                  Mercury Rx uses pre-calculated astronomical data for Mercury retrograde periods. The dates are accurate and cover multiple years of upcoming retrogrades.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary-900 dark:text-white">Contact &amp; Support</h2>
                <p>
                  Having an issue or have a feature request? Reach out through the{' '}
                  <a href="/contact" className="text-accent-500 hover:text-accent-400 underline">contact page</a>{' '}
                  and mention &quot;Mercury Rx&quot; in your message. We typically respond within 24-48 hours.
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
