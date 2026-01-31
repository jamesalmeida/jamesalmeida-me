import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="hero-gradient text-white py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal>
              <p className="text-sm uppercase tracking-[0.3em] text-primary-100/80 mb-4">About</p>
              <h1 className="text-4xl md:text-6xl font-semibold mb-6">Hi, I am James Almeida.</h1>
              <p className="text-lg md:text-2xl text-primary-100/90 max-w-3xl mx-auto">
                I help teams turn ambitious ideas into practical software and AI systems that deliver real results.
              </p>
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
