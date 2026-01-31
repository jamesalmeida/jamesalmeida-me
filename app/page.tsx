import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Reveal from '@/components/Reveal'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <Hero />

        {/* Services Overview */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center mb-12">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3 dark:text-gray-400">Services</p>
              <h2 className="section-title mb-4">Focused on outcomes, not buzzwords.</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                From custom software to hands-on AI enablement, I design solutions that make teams faster and more confident.
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-3">
              <Reveal className="card-glass rounded-2xl p-6" delay={0.05}>
                <div className="w-12 h-12 rounded-xl bg-accent-500 text-primary-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M9 16h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3 dark:text-white">Custom Software Solutions</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Modern web apps, internal tools, and platforms that solve real business problems with clean, maintainable code.
                </p>
              </Reveal>

              <Reveal className="card-glass rounded-2xl p-6" delay={0.1}>
                <div className="w-12 h-12 rounded-xl bg-accent-500 text-primary-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3 dark:text-white">AI Automation & Integration</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Automate repetitive work, integrate AI into workflows, and build custom AI systems that give your team leverage.
                </p>
              </Reveal>

              <Reveal className="card-glass rounded-2xl p-6" delay={0.15}>
                <div className="w-12 h-12 rounded-xl bg-accent-500 text-primary-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3 dark:text-white">AI Training & Workshops</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Practical sessions tailored to your industry - from ChatGPT basics to advanced workflows your team will use.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Why Work With Me */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-primary-900/60">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <Reveal>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-3 dark:text-gray-400">Why James</p>
              <h2 className="section-title mb-4">A senior partner, without the agency overhead.</h2>
              <p className="section-subtitle mb-6">
                I bring the focus of a dedicated lead, the speed of a small team, and the clarity you need to make confident decisions.
              </p>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />
                  <p>Hands-on leadership from strategy to execution - no handoffs, no guesswork.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />
                  <p>Fast, iterative delivery with a focus on measurable business impact.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />
                  <p>Clear communication, honest timelines, and systems your team can maintain.</p>
                </div>
              </div>
            </Reveal>

            <Reveal className="card-glass rounded-2xl p-8" delay={0.1}>
              <h3 className="text-xl font-semibold text-primary-900 mb-4 dark:text-white">What clients can expect</h3>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary-900 dark:bg-primary-200" />
                  <p>Discovery sessions that clarify the real bottlenecks before building.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary-900 dark:bg-primary-200" />
                  <p>Modern, scalable architectures built for long-term maintainability.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary-900 dark:bg-primary-200" />
                  <p>Documentation and training so your team stays confident after launch.</p>
                </li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center card-glass rounded-3xl p-10">
            <Reveal>
              <h2 className="section-title mb-4">Ready to build something smarter?</h2>
              <p className="section-subtitle mb-8">
                Book a quick consultation and I will map the fastest path from idea to impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="btn-primary inline-flex items-center justify-center">
                  Book a Consultation
                </Link>
                <Link href="/services" className="btn-secondary inline-flex items-center justify-center">
                  Explore Services
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
