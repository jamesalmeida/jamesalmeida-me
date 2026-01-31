import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="hero-gradient text-white py-24 md:py-36 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute -top-20 -right-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
          </div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="max-w-5xl mx-auto relative z-10">
            <Reveal>
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-500/30 bg-accent-500/10 mb-8">
                  <div className="h-2 w-2 rounded-full bg-accent-400 animate-pulse" />
                  <span className="text-sm font-medium text-accent-300 tracking-wide">Available for new projects</span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-center leading-tight">
                  Engineer. Consultant.<br />
                  <span className="text-accent-400">Problem solver.</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-100/80 max-w-2xl mx-auto text-center leading-relaxed">
                  I&apos;m James Almeida — a senior software engineer and AI consultant who helps teams
                  build the right thing, the right way, and actually ship it.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <Reveal>
              <h2 className="section-title mb-4">A partner who ships.</h2>
              <p className="text-gray-700 mb-4">
                I am a senior software engineer and AI consultant with a focus on building systems that drive measurable business impact.
                Over the past decade, I have helped founders, operators, and product teams deliver faster by combining clear strategy with
                hands-on execution.
              </p>
              <p className="text-gray-700 mb-4">
                My work blends modern engineering with practical AI adoption - translating real-world needs into solutions that are easy to
                maintain and actually used by the people they are built for.
              </p>
              <p className="text-gray-700">
                When we work together, you get direct access to me. No layers, no handoffs, and no noise.
              </p>
            </Reveal>

            <Reveal className="card-glass rounded-2xl p-8" delay={0.1}>
              <h3 className="text-xl font-semibold text-primary-900 mb-4">Core expertise</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />AI strategy, automation, and product integration</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Full-stack web and mobile application development</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Cloud architecture, APIs, and scalable systems</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-accent-500" />Rapid prototyping and product delivery</li>
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/80">
          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
            <Reveal className="card-glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Pragmatic approach</h3>
              <p className="text-gray-700">I start with the business outcome, then map the simplest path to deliver it.</p>
            </Reveal>
            <Reveal className="card-glass rounded-2xl p-6" delay={0.05}>
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Human-first AI</h3>
              <p className="text-gray-700">I design AI systems that feel intuitive, safe, and actually adopted by your team.</p>
            </Reveal>
            <Reveal className="card-glass rounded-2xl p-6" delay={0.1}>
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Transparent delivery</h3>
              <p className="text-gray-700">Clear milestones, honest timelines, and a partner who keeps you in the loop.</p>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
