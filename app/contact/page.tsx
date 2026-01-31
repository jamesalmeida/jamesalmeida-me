import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
import Reveal from '@/components/Reveal'

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="hero-gradient text-white py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-100/80 mb-4">Contact</p>
              <h1 className="text-4xl md:text-6xl font-semibold mb-6">Let's talk about your next move.</h1>
              <p className="text-lg md:text-2xl text-primary-100/90 max-w-3xl mx-auto">
                Tell me what you are building, what is slowing you down, and where AI could help.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            <Reveal>
              <h2 className="text-3xl font-semibold text-primary-900 mb-6 dark:text-white">Send a message</h2>
              <p className="text-gray-600 mb-8 dark:text-gray-300">
                Share the details and I will respond within 24 hours. If you are not sure where to start, a quick consultation is the fastest path.
              </p>
              <ContactForm />
            </Reveal>

            <Reveal className="space-y-8" delay={0.1}>
              <div className="card-glass rounded-2xl p-6">
                <h2 className="text-2xl font-semibold text-primary-900 mb-4 dark:text-white">Book a Call</h2>
                <p className="text-gray-700 mb-6 dark:text-gray-300">
                  Prefer to talk live? Book a short consultation and I will map next steps with you.
                </p>
                {/* TODO: Replace with Cal.com embed */}
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-500 dark:border-primary-600 dark:bg-primary-800/60 dark:text-gray-300">
                  Cal.com embed placeholder
                </div>
              </div>

              <div className="card-glass rounded-2xl p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center text-white dark:bg-primary-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-1 dark:text-white">Email</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      <a href="mailto:james@almeida.ventures" className="hover:text-primary-900 transition-colors dark:hover:text-white">
                        james@almeida.ventures
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-500 rounded-lg flex items-center justify-center text-primary-900">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-1 dark:text-white">Location</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Los Angeles, CA — willing to travel
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center text-white dark:bg-primary-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-1 dark:text-white">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      <a href="tel:+12134425855" className="hover:text-primary-900 transition-colors dark:hover:text-white">
                        +1 (213) 442-5855
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
