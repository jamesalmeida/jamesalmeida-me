import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'
import Link from 'next/link'

export default function Services() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="hero-gradient text-white py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-100/80 mb-4">Services</p>
              <h1 className="text-4xl md:text-6xl font-semibold mb-6">Solutions built for real-world teams.</h1>
              <p className="text-lg md:text-2xl text-primary-100/90 max-w-3xl mx-auto">
                Whether you need a new product, smarter automation, or hands-on AI enablement, I help you move fast with confidence.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-10">
            <Reveal className="card-glass rounded-3xl p-8 md:p-10">
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                <div className="lg:w-2/3">
                  <h2 className="text-2xl md:text-3xl font-semibold text-primary-900 mb-4 dark:text-white">Custom Software Solutions</h2>
                  <p className="text-gray-700 mb-4 dark:text-gray-300">
                    Build applications that solve real business problems - from customer-facing platforms to internal tools that unlock speed.
                  </p>
                  <ul className="grid gap-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Web apps, mobile apps, and internal dashboards</li>
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Modern tech stack, clean code, and scalable architecture</li>
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Maintainable delivery with clear documentation</li>
                  </ul>
                </div>
                <div className="lg:w-1/3">
                  <div className="rounded-2xl bg-primary-900 text-white p-6 dark:bg-primary-800">
                    <p className="text-sm uppercase tracking-[0.2em] text-primary-100/70">Best for</p>
                    <p className="text-lg font-semibold mt-3">Teams ready to modernize or launch new digital products.</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="card-glass rounded-3xl p-8 md:p-10" delay={0.05}>
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                <div className="lg:w-2/3">
                  <h2 className="text-2xl md:text-3xl font-semibold text-primary-900 mb-4 dark:text-white">AI Automation & Integration</h2>
                  <p className="text-gray-700 mb-4 dark:text-gray-300">
                    Automate repetitive work, integrate AI tools into existing workflows, and build custom systems that give your team more bandwidth.
                  </p>
                  <ul className="grid gap-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Custom AI solutions: chatbots, document processing, data analysis</li>
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Workflow automation across CRM, support, and ops</li>
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Security and governance guidance for production-ready AI</li>
                  </ul>
                </div>
                <div className="lg:w-1/3">
                  <div className="rounded-2xl bg-accent-500 text-primary-900 p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-primary-900/70">Best for</p>
                    <p className="text-lg font-semibold mt-3">Teams that want AI leverage without the noise.</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="card-glass rounded-3xl p-8 md:p-10" delay={0.1}>
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                <div className="lg:w-2/3">
                  <h2 className="text-2xl md:text-3xl font-semibold text-primary-900 mb-4 dark:text-white">AI Training & Workshops</h2>
                  <p className="text-gray-700 mb-4 dark:text-gray-300">
                    Hands-on sessions that get your team comfortable with AI tools and workflows - tailored to your industry and use cases.
                  </p>
                  <ul className="grid gap-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />From ChatGPT fundamentals to advanced AI workflows</li>
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Live exercises, templates, and playbooks</li>
                    <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Customized to your tools, team size, and goals</li>
                  </ul>
                </div>
                <div className="lg:w-1/3">
                  <div className="rounded-2xl bg-primary-900 text-white p-6 dark:bg-primary-800">
                    <p className="text-sm uppercase tracking-[0.2em] text-primary-100/70">Best for</p>
                    <p className="text-lg font-semibold mt-3">Teams that want AI skills they can use immediately.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center card-glass rounded-3xl p-10">
            <Reveal>
              <h2 className="section-title mb-4">Not sure what you need yet?</h2>
              <p className="section-subtitle mb-8">
                You and I can start with a short consultation to clarify priorities and map the fastest path forward.
              </p>
              <Link href="/contact" className="btn-primary inline-flex items-center justify-center">
                Book a Consultation
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
